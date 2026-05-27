/**
 * pkt-line encoding for git smart-HTTP.
 *
 * Each pkt-line is `<4-char-hex-length><payload>`. Length includes the 4 length
 * bytes themselves. Special: "0000" is flush, "0001" is delimiter.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const FLUSH = enc.encode("0000");
export const DELIM = enc.encode("0001");

export function pkt(payload: string | Uint8Array): Uint8Array {
  const data = typeof payload === "string" ? enc.encode(payload) : payload;
  if (data.length > 65520) throw new Error("pkt-line too large");
  const hex = (data.length + 4).toString(16).padStart(4, "0");
  const out = new Uint8Array(4 + data.length);
  out.set(enc.encode(hex), 0);
  out.set(data, 4);
  return out;
}

export function concat(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export type PktLine =
  | { kind: "data"; data: Uint8Array; text: string }
  | { kind: "flush" }
  | { kind: "delim" };

/** Read pkt-lines until the first flush. Returns parsed lines + offset after flush. */
export function readPktLines(buf: Uint8Array, start = 0): { lines: PktLine[]; next: number } {
  const lines: PktLine[] = [];
  let off = start;
  while (off + 4 <= buf.length) {
    const hex = dec.decode(buf.subarray(off, off + 4));
    if (hex === "0000") {
      off += 4;
      lines.push({ kind: "flush" });
      return { lines, next: off };
    }
    if (hex === "0001") {
      off += 4;
      lines.push({ kind: "delim" });
      continue;
    }
    const len = parseInt(hex, 16);
    if (!Number.isFinite(len) || len < 4) {
      throw new Error(`bad pkt-line length: ${hex}`);
    }
    const payload = buf.subarray(off + 4, off + len);
    lines.push({
      kind: "data",
      data: payload,
      // Trailing \n is common; expose both forms.
      text: dec.decode(payload).replace(/\n$/, ""),
    });
    off += len;
  }
  return { lines, next: off };
}

/** Build the initial service advertisement preamble. */
export function serviceAdvertisement(service: string): Uint8Array {
  return concat([
    pkt(`# service=${service}\n`),
    FLUSH,
  ]);
}
