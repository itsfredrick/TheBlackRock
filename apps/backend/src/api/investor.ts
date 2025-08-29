import { Router } from "express"
import { PrismaClient, Visibility } from "@prisma/client"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"

const prisma = new PrismaClient()
const router = Router()

function requireUser(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  next()
}

async function getThreshold() {
  const row = await prisma.systemSetting.findUnique({ where: { key: "INVESTOR_SCORE_THRESHOLD" } })
  return (row?.json as any)?.value ?? 70
}

async function getInvestorByUser(userId: string) {
  return prisma.investor.findUnique({ where: { userId } })
}

// Visible-by-default: investor_preview OR score >= threshold
router.get("/discovery", requireAuth, requireUser, async (req: any, res) => {
  const threshold = await getThreshold()
  const rows = await prisma.project.findMany({
    where: {
      OR: [
        { visibility: Visibility.investor_preview },
        { successScore: { gte: threshold } }
      ]
    },
    orderBy: { updatedAt: "desc" } as any,
    select: { id: true, title: true, summary: true, successScore: true, visibility: true }
  })
  res.json(rows)
})

// Request access
const accessSchema = z.object({ projectId: z.string().uuid() })
router.post("/access-requests", requireAuth, requireUser, async (req: any, res) => {
  const parse = accessSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  let investor = await getInvestorByUser(req.user!.id)
  if (!investor) {
    investor = await prisma.investor.create({ data: { userId: req.user!.id, focusAreas: [], stageFocus: [], geographicFocus: [] } })
  }
  const existing = await prisma.investorAccessRequest.findFirst({
    where: { projectId: parse.data.projectId, investorId: investor.id }
  })
  if (existing) return res.json(existing)
  const row = await prisma.investorAccessRequest.create({
    data: { projectId: parse.data.projectId, investorId: investor.id }
  })
  res.status(201).json(row)
})

// My requests
router.get("/access-requests", requireAuth, requireUser, async (req: any, res) => {
  const investor = await getInvestorByUser(req.user!.id)
  if (!investor) return res.json([])
  const rows = await prisma.investorAccessRequest.findMany({
    where: { investorId: investor.id },
    include: { project: true },
    orderBy: { grantedAt: "desc" } as any
  })
  res.json(rows)
})

// Dealroom gate: visible-by-default OR approved for this investor
router.get("/projects/:id", requireAuth, requireUser, async (req: any, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: "Project not found" })
  const threshold = await getThreshold()

  // Always open if visible-by-default
  const openByDefault = project.visibility === Visibility.investor_preview || (project.successScore ?? 0) >= threshold
  if (!openByDefault) {
    // Check explicit approval
    const investor = await getInvestorByUser(req.user!.id)
    if (!investor) return res.status(403).json({ error: "Not approved" })
    const approved = await prisma.investorAccessRequest.findFirst({
      where: { projectId: project.id, investorId: investor.id, status: "approved" }
    })
    if (!approved) return res.status(403).json({ error: "Not approved" })
  }

  res.json({
    id: project.id,
    title: project.title,
    summary: project.summary,
    successScore: project.successScore,
    plan: project.aiPlanJson,
    budget: project.aiBudgetJson,
    roadmap: project.aiRoadmapJson
  })
})

export default router
