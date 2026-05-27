/**
 * Minimal git packfile parser. Inflates each object inline, resolves OFS_DELTA
 * and REF_DELTA references, and returns {oid, type, content} for every object.
 *
 * Written to give us full control over the receive-pack path. isomorphic-git's
 * `indexPack` was returning a confusing "null.slice()" on real-world Windows
 * packs; this implementation avoids that by parsing the pack ourselves.
 */

import crypto from "node:crypto";
import zlib from "node:zlib";
import * as pako from "pako";

const TYPE_NAMES = ["", "commit", "tree", "blob", "tag"] as const;
export type GitType = "commit" | "tree" | "blob" | "tag";

export type ParsedObject = {
  oid: string;
  type: GitType;
  content: Buffer;
};

type Entry =
  | { kind: "raw"; offset: number; type: number; content: Buffer }
  | { kind: "ofs"; offset: number; baseOffset: number; delta: Buffer }
  | { kind: "ref"; offset: number; baseOid: string; delta: Buffer };

const ZERO_OID = "0000000000000000000000000000000000000000";

/**
 * Inflate one zlib stream starting at `offset` of `buf`.
 * Returns the inflated content and the number of compressed bytes consumed.
 */
function inflateAt(buf: Uint8Array, offset: number): { inflated: Buffer; consumed: number } {
  // pako 2.x exposes `ended` and `strm.total_in` at runtime; the bundled
  // types don't declare them, hence the structural assertion.
  const inflater = new pako.Inflate() as unknown as pako.Inflate & {
    ended: boolean;
    err: number;
    msg: string;
    result: Uint8Array;
    strm: { total_in: number };
  };
  inflater.push(buf.subarray(offset), false);
  if (inflater.err) {
    throw new Error(
      `inflate failed at offset ${offset}: ${inflater.msg ?? "unknown zlib error"}`
    );
  }
  if (!inflater.ended) {
    throw new Error(
      `zlib stream at offset ${offset} did not end within the remaining ${
        buf.length - offset
      } bytes`
    );
  }
  return {
    inflated: Buffer.from(inflater.result),
    consumed: inflater.strm.total_in,
  };
}

/**
 * Parse a packfile.
 *
 * @param pack    The full packfile bytes including the 20-byte SHA-1 trailer.
 * @param lookupExisting Optional callback to resolve REF_DELTA bases that
 *                       aren't present in the pack itself. Should return the
 *                       raw zlib-deflated loose object (the same format we
 *                       store in Supabase) or null if absent.
 */
export async function parsePack(
  pack: Buffer,
  lookupExisting?: (oid: string) => Promise<Buffer | null>
): Promise<ParsedObject[]> {
  if (pack.length < 32 || pack.subarray(0, 4).toString("ascii") !== "PACK") {
    throw new Error("not a packfile (missing PACK signature)");
  }
  const version = pack.readUInt32BE(4);
  if (version !== 2 && version !== 3) {
    throw new Error(`unsupported pack version: ${version}`);
  }
  const count = pack.readUInt32BE(8);

  const entries: Entry[] = [];
  let off = 12;

  for (let i = 0; i < count; i++) {
    const startOff = off;

    // Variable-length type + size header
    let byte = pack[off++];
    const type = (byte >> 4) & 7;
    // size: low nibble of first byte, then 7-bit groups (low-endian)
    let size = byte & 0x0f;
    let shift = 4;
    while (byte & 0x80) {
      byte = pack[off++];
      size += (byte & 0x7f) << shift;
      shift += 7;
    }

    if (type === 6) {
      // OFS_DELTA: variable-length negative offset to base
      let b = pack[off++];
      let negOff = b & 0x7f;
      while (b & 0x80) {
        b = pack[off++];
        negOff = ((negOff + 1) << 7) | (b & 0x7f);
      }
      const { inflated, consumed } = inflateAt(pack, off);
      off += consumed;
      entries.push({
        kind: "ofs",
        offset: startOff,
        baseOffset: startOff - negOff,
        delta: inflated,
      });
    } else if (type === 7) {
      // REF_DELTA: 20-byte base SHA
      const baseOid = pack.subarray(off, off + 20).toString("hex");
      off += 20;
      const { inflated, consumed } = inflateAt(pack, off);
      off += consumed;
      entries.push({
        kind: "ref",
        offset: startOff,
        baseOid,
        delta: inflated,
      });
    } else if (type >= 1 && type <= 4) {
      const { inflated, consumed } = inflateAt(pack, off);
      if (inflated.length !== size) {
        throw new Error(
          `object ${i}: inflated size ${inflated.length} ≠ declared ${size}`
        );
      }
      off += consumed;
      entries.push({
        kind: "raw",
        offset: startOff,
        type,
        content: inflated,
      });
    } else {
      throw new Error(`unknown object type ${type} at offset ${startOff}`);
    }
  }

  // Resolve all entries to ParsedObject. Bases (raw entries) are trivial;
  // deltas iterate until every entry has been materialized.
  const byOffset = new Map<number, ParsedObject>();
  const byOid = new Map<string, ParsedObject>();

  for (const e of entries) {
    if (e.kind === "raw") {
      const typeName = TYPE_NAMES[e.type];
      if (!typeName) throw new Error(`unsupported raw type ${e.type}`);
      const oid = computeOid(typeName as GitType, e.content);
      const obj: ParsedObject = {
        oid,
        type: typeName as GitType,
        content: e.content,
      };
      byOffset.set(e.offset, obj);
      byOid.set(oid, obj);
    }
  }

  type DeltaEntry = Extract<Entry, { kind: "ofs" | "ref" }>;
  let outstanding: DeltaEntry[] = entries.filter(
    (e): e is DeltaEntry => e.kind !== "raw"
  );
  let lastSize = -1;
  while (outstanding.length > 0 && outstanding.length !== lastSize) {
    lastSize = outstanding.length;
    const next: DeltaEntry[] = [];
    for (const e of outstanding) {
      const base = await resolveBase(e, byOffset, byOid, lookupExisting);
      if (!base) {
        next.push(e);
        continue;
      }
      const reconstructed = applyDelta(
        base.content,
        e.kind === "ofs" ? e.delta : e.delta
      );
      const oid = computeOid(base.type, reconstructed);
      const obj: ParsedObject = {
        oid,
        type: base.type,
        content: reconstructed,
      };
      byOffset.set(e.offset, obj);
      byOid.set(oid, obj);
    }
    outstanding = next;
  }

  if (outstanding.length > 0) {
    throw new Error(
      `could not resolve ${outstanding.length} delta(s) — missing base objects`
    );
  }

  return Array.from(byOid.values());
}

async function resolveBase(
  e: Entry,
  byOffset: Map<number, ParsedObject>,
  byOid: Map<string, ParsedObject>,
  lookupExisting?: (oid: string) => Promise<Buffer | null>
): Promise<ParsedObject | null> {
  if (e.kind === "ofs") {
    return byOffset.get(e.baseOffset) ?? null;
  }
  if (e.kind === "ref") {
    if (e.baseOid === ZERO_OID) return null;
    const inPack = byOid.get(e.baseOid);
    if (inPack) return inPack;
    if (!lookupExisting) return null;
    const raw = await lookupExisting(e.baseOid);
    if (!raw) return null;
    // raw is the zlib-deflated loose-object format: header + content
    const inflated = Buffer.from(zlib.inflateSync(raw));
    const nulIdx = inflated.indexOf(0);
    if (nulIdx < 0) return null;
    const header = inflated.subarray(0, nulIdx).toString("ascii");
    const [typeName] = header.split(" ");
    if (!["commit", "tree", "blob", "tag"].includes(typeName)) return null;
    const content = inflated.subarray(nulIdx + 1);
    const obj: ParsedObject = {
      oid: e.baseOid,
      type: typeName as GitType,
      content,
    };
    byOid.set(e.baseOid, obj);
    return obj;
  }
  return null;
}

/**
 * Apply a git delta (from a delta object) on top of `base` to reproduce the
 * target object.
 *
 * Delta format:
 *   <var-len base-size>
 *   <var-len result-size>
 *   <instructions>
 *
 * Each instruction is either:
 *   - 0xxxxxxx: insert N bytes from the delta stream (N = low 7 bits)
 *   - 1xxxxxxx: copy from base — bits select which offset/size bytes follow
 */
function applyDelta(base: Buffer, delta: Buffer): Buffer {
  let off = 0;
  const baseSize = readVarLen();
  const resultSize = readVarLen();

  if (baseSize !== base.length) {
    throw new Error(`delta base-size mismatch (${baseSize} vs ${base.length})`);
  }

  const out = Buffer.alloc(resultSize);
  let outOff = 0;

  while (off < delta.length) {
    const op = delta[off++];
    if (op === 0) {
      throw new Error("invalid 0x00 delta opcode");
    }
    if (op & 0x80) {
      // copy from base
      let baseOff = 0;
      if (op & 0x01) baseOff |= delta[off++];
      if (op & 0x02) baseOff |= delta[off++] << 8;
      if (op & 0x04) baseOff |= delta[off++] << 16;
      if (op & 0x08) baseOff |= delta[off++] << 24;
      let copyLen = 0;
      if (op & 0x10) copyLen |= delta[off++];
      if (op & 0x20) copyLen |= delta[off++] << 8;
      if (op & 0x40) copyLen |= delta[off++] << 16;
      if (copyLen === 0) copyLen = 0x10000;
      base.copy(out, outOff, baseOff, baseOff + copyLen);
      outOff += copyLen;
    } else {
      // insert literal bytes
      const insertLen = op;
      delta.copy(out, outOff, off, off + insertLen);
      outOff += insertLen;
      off += insertLen;
    }
  }

  if (outOff !== resultSize) {
    throw new Error(
      `delta result-size mismatch (wrote ${outOff}, expected ${resultSize})`
    );
  }
  return out;

  function readVarLen(): number {
    let result = 0;
    let shift = 0;
    while (true) {
      const b = delta[off++];
      result |= (b & 0x7f) << shift;
      if (!(b & 0x80)) break;
      shift += 7;
    }
    return result;
  }
}

function computeOid(type: GitType, content: Buffer): string {
  const header = `${type} ${content.length}\0`;
  return crypto
    .createHash("sha1")
    .update(Buffer.from(header))
    .update(content)
    .digest("hex");
}

/** Build the canonical zlib-deflated loose-object bytes for storage. */
export function serializeLooseObject(type: GitType, content: Buffer): Buffer {
  const header = Buffer.from(`${type} ${content.length}\0`);
  return zlib.deflateSync(Buffer.concat([header, content]));
}
