import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = Router()
const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5055"

// Generate and persist plan/budget/roadmap + successScore
router.post("/plan-budget-roadmap", async (req, res) => {
  const { projectId } = req.body || {}
  if (!projectId) return res.status(400).json({ error: "projectId required" })
  const p = await prisma.project.findUnique({ where: { id: projectId } })
  if (!p) return res.status(404).json({ error: "project not found" })

  const r = await fetch(`${AI_URL}/v1/generate`, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ title: p.title, summary: p.summary || "" })
  })
  if (!r.ok) return res.status(500).json({ error: `ai-service error: ${await r.text()}` })
  const out = await r.json()

  const updated = await prisma.project.update({
    where: { id: p.id },
    data: {
      aiPlanJson: out.plan,
      aiBudgetJson: out.budget,
      aiRoadmapJson: out.roadmap,
      successScore: out.successScore
    },
    select: { id:true, title:true, successScore:true, aiPlanJson:true, aiBudgetJson:true, aiRoadmapJson:true }
  })
  res.json(updated)
})

// Explainability on demand (does not persist)
router.get("/explain/:projectId", async (req, res) => {
  const projectId = String(req.params.projectId || "")
  if (!projectId) return res.status(400).json({ error: "projectId required" })
  const p = await prisma.project.findUnique({ where: { id: projectId } })
  if (!p) return res.status(404).json({ error: "project not found" })

  const r = await fetch(`${AI_URL}/v1/generate`, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ title: p.title, summary: p.summary || "" })
  })
  if (!r.ok) return res.status(500).json({ error: `ai-service error: ${await r.text()}` })
  const out = await r.json()
  res.json({ successScore: out.successScore, explain: out.explain })
})

export default router
