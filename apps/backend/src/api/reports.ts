import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import { PrismaClient } from "@prisma/client"
import { generateWeeklyReport } from "../services/reports/generateWeekly"

const prisma = new PrismaClient()
const router = Router()

router.post("/generate", requireAuth, async (req: any, res) => {
  const projectId = req.body?.projectId
  if (!projectId) return res.status(400).json({ error: "projectId required" })
  // owner guard
  const p = await prisma.project.findFirst({ where: { id: projectId, ownerId: req.user!.id } })
  if (!p) return res.status(404).json({ error: "Project not found or not owned by you" })
  const report = await generateWeeklyReport(projectId)
  res.status(201).json(report)
})

router.get("/by-project/:projectId", requireAuth, async (req: any, res) => {
  const projectId = req.params.projectId
  const rows = await prisma.report.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } as any })
  res.json(rows)
})

export default router
