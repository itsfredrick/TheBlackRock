import { promises as fs } from "fs"
import os from "os"
import path from "path"
import ClamScanFactory from "clamscan"

const CLAM_ENABLED = (process.env.CLAMAV_ENABLED || "false").toLowerCase() === "true"
const CLAM_HOST = process.env.CLAMAV_HOST || "127.0.0.1"
const CLAM_PORT = Number(process.env.CLAMAV_PORT || 3310)

let clamdReady = false
let clamd: any = null

async function getScanner() {
  if (!CLAM_ENABLED) return null
  if (clamdReady && clamd) return clamd
  try {
    const ClamScan: any = await (ClamScanFactory as any)({
      clamdscan: {
        host: CLAM_HOST,
        port: CLAM_PORT,
        timeout: 60000,
        socket: false
      },
      debug_mode: false,
      preference: 'clamdscan'
    })
    clamd = ClamScan
    clamdReady = true
    return clamd
  } catch {
    clamdReady = false
    return null
  }
}

// Scans a buffer using clamd (if enabled), via a temp file
export async function clamScanBuffer(buf: Buffer): Promise<{ ok: boolean; reason?: string }> {
  const scanner = await getScanner()
  if (!scanner) return { ok: true } // if disabled or not reachable, allow and rely on heuristics
  const tmp = path.join(os.tmpdir(), `tb_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`)
  await fs.writeFile(tmp, buf)
  try {
    const { is_infected, viruses } = await scanner.scan_file(tmp)
    if (is_infected) return { ok: false, reason: viruses?.join(", ") || "infected" }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, reason: e?.message || "scan error" }
  } finally {
    try { await fs.unlink(tmp) } catch {}
  }
}
