import { randomUUID } from "crypto"
import path from "path"
import fs from "fs"
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const USE_S3 = (process.env.USE_S3 || "false").toLowerCase() === "true"
const S3_BUCKET = process.env.S3_BUCKET || ""
const S3_REGION = process.env.S3_REGION || "us-east-1"
const S3_PREFIX = (process.env.S3_PREFIX || "").replace(/^\/|\/$/g,"") // trim slashes
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL || (S3_BUCKET ? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com` : "")
const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 15)

let s3: S3Client | null = null
if (USE_S3) {
  s3 = new S3Client({ region: S3_REGION, credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  } : undefined })
}

export function storageMode() {
  return { mode: USE_S3 ? "s3" : "local", maxSizeMB: MAX_MB, publicBase: USE_S3 ? PUBLIC_BASE : "/uploads" }
}

function keyFor(filename: string) {
  const ext = path.extname(filename) || ""
  const base = `${randomUUID()}${ext}`
  return S3_PREFIX ? `${S3_PREFIX}/${base}` : base
}

export async function presignPut(filename: string, contentType?: string) {
  if (!USE_S3 || !s3) throw new Error("S3 not enabled")
  const Key = keyFor(filename)
  const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key, ContentType: contentType || "application/octet-stream" })
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 900 }) // 15 min
  const publicUrl = `${PUBLIC_BASE}/${Key}`
  return { uploadUrl, method: "PUT", headers: { "Content-Type": contentType || "application/octet-stream" }, key: Key, publicUrl }
}

export async function putBufferToS3(buf: Buffer, filename: string, contentType?: string) {
  if (!s3) throw new Error("S3 client not ready")
  const Key = keyFor(filename)
  await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key, Body: buf, ContentType: contentType || "application/octet-stream" }))
  const publicUrl = `${PUBLIC_BASE}/${Key}`
  return { key: Key, url: publicUrl }
}

export async function fetchS3ObjectToBuffer(key: string): Promise<Buffer> {
  if (!s3) throw new Error("S3 client not ready")
  const out = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }))
  const stream = out.Body as any
  const chunks: Buffer[] = []
  await new Promise<void>((resolve,reject)=>{
    stream.on("data", (c: Buffer)=>chunks.push(c))
    stream.on("end", ()=>resolve())
    stream.on("error", reject)
  })
  return Buffer.concat(chunks)
}

export async function deleteS3Object(key: string) {
  if (!s3) return
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))
}

// LOCAL helpers
export function saveLocal(buf: Buffer, filename: string): { path: string; url: string } {
  const ext = path.extname(filename) || ""
  const name = `${randomUUID()}${ext}`
  const outDir = path.resolve("uploads")
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  const fp = path.join(outDir, name)
  fs.writeFileSync(fp, buf)
  return { path: fp, url: `/uploads/${name}` }
}
