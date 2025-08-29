import crypto from "crypto"

const BLOCK_EXT = new Set([".exe",".js",".sh",".bat",".cmd",".scr",".ps1",".vbs",".jar"])
const MAX_MB = 15

export type ScanResult = { ok: boolean; reason?: string; sha256?: string; mime?: string; ext?: string }

export async function scanBuffer(buf: Buffer, filename?: string, mimeHint?: string): Promise<ScanResult> {
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex")
  const sizeMB = buf.length / (1024*1024)
  if (sizeMB > MAX_MB) return { ok:false, reason:`file too large (${sizeMB.toFixed(1)} MB)`, sha256 }

  const ext = (filename?.toLowerCase().match(/\.[a-z0-9]+$/)?.[0]) || ""
  if (BLOCK_EXT.has(ext)) return { ok:false, reason:`blocked extension ${ext}`, sha256, ext }

  // naive content heuristics
  const head = buf.subarray(0, 8).toString("binary")
  if (head.startsWith("MZ")) return { ok:false, reason:"windows executable header", sha256 }
  if (buf.toString("utf8").toLowerCase().includes("<script")) return { ok:false, reason:"script tag detected", sha256 }

  return { ok:true, sha256, mime: mimeHint, ext }
}
