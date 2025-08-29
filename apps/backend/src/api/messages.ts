import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "../middleware/auth"
import jwt from "jsonwebtoken"
import { emitMessageCreated } from "../realtime/hub"

const prisma = new PrismaClient()
const router = Router()

// in-memory SSE pubsub
const clientsByProject = new Map<string, Set<any>>()
function publishSSE(projectId: string, payload: any) {
  const set = clientsByProject.get(projectId)
  if (!set) return
  const data = `data: ${JSON.stringify(payload)}\n\n`
  for (const res of set) { try { res.write(data) } catch {} }
}

// List messages
router.get("/by-project/:projectId", requireAuth, async (req: any, res) => {
  const rows = await prisma.message.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, email: true, name: true, role: true } } }
  })
  res.json(rows)
})

// Search messages (q, hasAttachments, from, to, limit, offset)
router.get("/search", requireAuth, async (req: any, res) => {
  const projectId = String(req.query.projectId || "")
  if (!projectId) return res.status(400).json({ error: "projectId required" })
  const q = (req.query.q as string | undefined)?.trim()
  const hasAttachments = String(req.query.hasAttachments || "false") === "true"
  const from = req.query.from ? new Date(String(req.query.from)) : undefined
  const to = req.query.to ? new Date(String(req.query.to)) : undefined
  const limit = Math.max(1, Math.min(200, Number(req.query.limit ?? 50)))
  const offset = Math.max(0, Number(req.query.offset ?? 0))

  const where: any = { projectId }
  if (q) where.body = { contains: q, mode: "insensitive" }
  if (hasAttachments) where.attachments = { isEmpty: false }
  if (from || to) where.createdAt = {}
  if (from) (where.createdAt as any).gte = from
  if (to) (where.createdAt as any).lte = to

  const rows = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    include: { sender: { select: { id: true, email: true, name: true, role: true } } }
  })
  res.json(rows)
})

// Create message
router.post("/", requireAuth, async (req: any, res) => {
  const { projectId, body, attachments } = req.body || {}
  if (!projectId || (!body && !Array.isArray(attachments))) {
    return res.status(400).json({ error: "projectId and (body or attachments) required" })
  }
  const row = await prisma.message.create({
    data: {
      projectId,
      senderId: req.user!.id,
      body: body || "",
      attachments: Array.isArray(attachments) ? attachments : []
    },
    include: { sender: { select: { id: true, email: true, name: true, role: true } } }
  })

  // Realtime fanout: WebSocket (multi-instance) + SSE fallback
  emitMessageCreated(projectId, row)
  publishSSE(projectId, { type: "message.created", message: row })

  res.status(201).json(row)
})

// SSE stream (token-based)
router.get("/stream/:projectId", (req, res) => {
  const token = (req.query.token as string | undefined) || ""
  const secret = process.env.JWT_SECRET || "dev_secret"
  try { jwt.verify(token, secret) } catch { return res.status(401).end() }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders?.()
  res.write("event: ping\ndata: ok\n\n")

  const pid = req.params.projectId
  if (!clientsByProject.has(pid)) clientsByProject.set(pid, new Set())
  const set = clientsByProject.get(pid)!
  set.add(res)
  req.on("close", () => { set.delete(res); if (set.size===0) clientsByProject.delete(pid) })
})

export default router
