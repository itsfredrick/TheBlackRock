import { Router } from "express"
import multer from "multer"
import { scanBuffer } from "../services/files/scan"
import { clamScanBuffer } from "../services/files/clam"
import { storageMode, presignPut, putBufferToS3, saveLocal, fetchS3ObjectToBuffer, deleteS3Object } from "../services/files/storage"
import { requireAuth } from "../middleware/auth"
import mime from "mime-types"

const router = Router()
const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: (Number(process.env.UPLOAD_MAX_MB || 15)) * 1024 * 1024 } })

router.get("/mode", requireAuth, (_req, res) => {
  res.json(storageMode())
})

// Client → server → S3/local (keeps backwards compatibility)
router.post("/upload", requireAuth, mem.single("file"), async (req: any, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: "file required" })

  // Heuristic scan + optional ClamAV
  const heur = await scanBuffer(file.buffer, file.originalname, file.mimetype)
  if (!heur.ok) return res.status(400).json({ error: `failed scan: ${heur.reason}` })
  const clam = await clamScanBuffer(file.buffer)
  if (!clam.ok) return res.status(400).json({ error: `clamav: ${clam.reason}` })

  const mode = storageMode()
  if (mode.mode === "s3") {
    const { url } = await putBufferToS3(file.buffer, file.originalname, file.mimetype)
    return res.json({ url, sha256: heur.sha256 })
  } else {
    const { url } = saveLocal(file.buffer, file.originalname)
    return res.json({ url, sha256: heur.sha256 })
  }
})

// S3 presign (browser will PUT directly to S3)
router.post("/presign", requireAuth, async (req, res) => {
  const { filename, contentType } = req.body || {}
  try {
    const out = await presignPut(String(filename || "upload.bin"), contentType)
    res.json(out)
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "presign failed" })
  }
})

// S3 commit (server scans the object; deletes if infected)
router.post("/commit", requireAuth, async (req, res) => {
  const { key, filename, contentType } = req.body || {}
  if (!key) return res.status(400).json({ error: "key required" })
  try {
    const buf = await fetchS3ObjectToBuffer(String(key))
    const heur = await scanBuffer(buf, String(filename || key), String(contentType || "application/octet-stream"))
    if (!heur.ok) { await deleteS3Object(String(key)); return res.status(400).json({ error: `failed scan: ${heur.reason}` }) }
    const clam = await clamScanBuffer(buf)
    if (!clam.ok) { await deleteS3Object(String(key)); return res.status(400).json({ error: `clamav: ${clam.reason}` }) }
    // If ok, return public URL
    const base = storageMode().publicBase
    const url = `${base}/${key}`
    res.json({ url, sha256: heur.sha256 })
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "commit failed" })
  }
})

export default router
