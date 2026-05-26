/**
 * Minimal git object parser.
 *
 * Loose git objects are zlib-deflated bytes of the form:
 *   "{type} {length}\0{content}"
 *
 * - blob:   raw file bytes
 * - tree:   sequence of entries: "{mode} {name}\0{20-byte oid}"
 * - commit: text headers (tree, parent, author, committer) + "\n\n" + message
 */

import { inflate } from "node:zlib";
import { promisify } from "node:util";

const inflateAsync = promisify(inflate);

export type ObjectType = "blob" | "tree" | "commit" | "tag";

export type RawObject = {
  type: ObjectType;
  content: Buffer;
  /** Total size declared in the object header. */
  size: number;
};

export type TreeEntry = {
  mode: string;
  name: string;
  oid: string;
  /** "tree" if mode starts with 04 (40000), else "blob" (incl. 100644/100755/120000). */
  type: "tree" | "blob";
};

export type CommitInfo = {
  tree: string;
  parents: string[];
  author?: { name: string; email: string; when: number; tz: string };
  committer?: { name: string; email: string; when: number; tz: string };
  message: string;
};

export async function decodeObject(zlibCompressed: Buffer): Promise<RawObject> {
  const inflated = (await inflateAsync(zlibCompressed)) as Buffer;
  const nullIdx = inflated.indexOf(0);
  if (nullIdx < 0) throw new Error("invalid git object: no header terminator");
  const header = inflated.subarray(0, nullIdx).toString("utf8");
  const spaceIdx = header.indexOf(" ");
  if (spaceIdx < 0) throw new Error("invalid git object header: " + header);
  const type = header.slice(0, spaceIdx) as ObjectType;
  const size = parseInt(header.slice(spaceIdx + 1), 10);
  if (!["blob", "tree", "commit", "tag"].includes(type)) {
    throw new Error(`unknown git object type: ${type}`);
  }
  const content = inflated.subarray(nullIdx + 1);
  if (content.length !== size) {
    // Some servers/tools include trailing data; we trust the declared size.
  }
  return { type, content: content.subarray(0, size), size };
}

export function parseTree(content: Buffer): TreeEntry[] {
  const entries: TreeEntry[] = [];
  let i = 0;
  while (i < content.length) {
    const spaceIdx = content.indexOf(0x20, i);
    if (spaceIdx < 0) break;
    const mode = content.subarray(i, spaceIdx).toString("utf8");
    const nullIdx = content.indexOf(0, spaceIdx + 1);
    if (nullIdx < 0) break;
    const name = content.subarray(spaceIdx + 1, nullIdx).toString("utf8");
    const oidBytes = content.subarray(nullIdx + 1, nullIdx + 21);
    const oid = oidBytes.toString("hex");
    i = nullIdx + 21;
    entries.push({
      mode,
      name,
      oid,
      type: mode.startsWith("4") || mode === "40000" ? "tree" : "blob",
    });
  }
  // Git stores entries in sorted order already; sort by type then name for display.
  return entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function parseCommit(content: Buffer): CommitInfo {
  const text = content.toString("utf8");
  const headerEnd = text.indexOf("\n\n");
  const headerBlock = headerEnd >= 0 ? text.slice(0, headerEnd) : text;
  const message = headerEnd >= 0 ? text.slice(headerEnd + 2) : "";
  const out: CommitInfo = { tree: "", parents: [], message };
  for (const line of headerBlock.split("\n")) {
    if (line.startsWith("tree ")) out.tree = line.slice(5).trim();
    else if (line.startsWith("parent ")) out.parents.push(line.slice(7).trim());
    else if (line.startsWith("author ")) out.author = parsePerson(line.slice(7));
    else if (line.startsWith("committer ")) out.committer = parsePerson(line.slice(10));
  }
  return out;
}

function parsePerson(s: string): { name: string; email: string; when: number; tz: string } {
  const ltIdx = s.indexOf("<");
  const gtIdx = s.indexOf(">");
  const name = s.slice(0, ltIdx).trim();
  const email = s.slice(ltIdx + 1, gtIdx);
  const rest = s.slice(gtIdx + 1).trim().split(/\s+/);
  const when = parseInt(rest[0] ?? "0", 10);
  const tz = rest[1] ?? "+0000";
  return { name, email, when, tz };
}

/**
 * Walk a tree path from a starting tree OID, returning the OID + type
 * at the end. Path uses forward slashes. Empty path returns the starting tree.
 */
export async function walkPath(
  startTreeOid: string,
  path: string,
  loadObject: (oid: string) => Promise<RawObject | null>
): Promise<{ oid: string; type: "tree" | "blob" } | null> {
  const parts = path.split("/").filter(Boolean);
  let currentOid = startTreeOid;
  let currentType: "tree" | "blob" = "tree";
  for (const part of parts) {
    if (currentType !== "tree") return null;
    const obj = await loadObject(currentOid);
    if (!obj || obj.type !== "tree") return null;
    const entries = parseTree(obj.content);
    const entry = entries.find((e) => e.name === part);
    if (!entry) return null;
    currentOid = entry.oid;
    currentType = entry.type;
  }
  return { oid: currentOid, type: currentType };
}

/** Best-effort detection of binary content. */
export function isBinary(buf: Buffer): boolean {
  const limit = Math.min(buf.length, 8000);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

export function inferLanguage(filename: string): string {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1).toLowerCase() : "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    kt: "kotlin", swift: "swift", c: "c", h: "c", cpp: "cpp", cc: "cpp",
    cs: "csharp", php: "php", html: "html", css: "css", scss: "scss",
    json: "json", yml: "yaml", yaml: "yaml", toml: "toml", md: "markdown",
    sh: "bash", bash: "bash", sql: "sql", xml: "xml", svg: "xml",
  };
  return map[ext] ?? "";
}
