import { Router } from "express"
import { PrismaClient, InviteStatus } from "@prisma/client"
import { requireAuth } from "../middleware/auth"
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()

// Founder invites an expert to a project
router.post("/projects/:projectId/invite", requireAuth, async (req: any, res) => {
  const projectId = req.params.projectId
  const schema = z.object({ expertId: z.string().uuid(), reason: z.string().optional() })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  // verify ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: req.user!.id } })
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" })
  const { expertId, reason } = parse.data
  const row = await prisma.projectExpertShortlist.create({
    data: { projectId, expertId, reason, status: "invited" }
  })
  res.status(201).json(row)
})

// Expert responds
router.patch("/shortlists/:id", requireAuth, async (req: any, res) => {
  const id = req.params.id
  const schema = z.object({ status: z.enum(["accepted","declined","hired"]) })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const row = await prisma.projectExpertShortlist.findUnique({ where: { id } })
  if (!row) return res.status(404).json({ error: "Not found" })
  // ensure current user is the expert user
  const expert = await prisma.expert.findUnique({ where: { id: row.expertId } })
  if (!expert || expert.userId !== req.user!.id) return res.status(403).json({ error: "Not your invite" })
  const updated = await prisma.projectExpertShortlist.update({ where: { id }, data: { status: parse.data.status as InviteStatus } })
  res.json(updated)
})

export default router
