import { Router } from "express"
import { PrismaClient, Visibility } from "@prisma/client"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"

const prisma = new PrismaClient()
const router = Router()

router.get("/", requireAuth, async (req: any, res) => {
  const rows = await prisma.project.findMany({ where: { ownerId: req.user!.id }, orderBy: { createdAt: "desc" } })
  res.json(rows)
})

const createSchema = z.object({
  title: z.string().min(3),
  summary: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  targetMarket: z.string().optional()
})

router.post("/", requireAuth, async (req: any, res) => {
  const parse = createSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const data = parse.data
  const project = await prisma.project.create({ data: { ownerId: req.user!.id, title: data.title, summary: data.summary, problem: data.problem, solution: data.solution, targetMarket: data.targetMarket } })
  res.status(201).json(project)
})

router.get("/:id", requireAuth, async (req: any, res) => {
  const p = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } })
  if (!p) return res.status(404).json({ error: "Project not found" })
  res.json(p)
})

router.patch("/:id/lock-baseline", requireAuth, async (req: any, res) => {
  const p = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } })
  if (!p) return res.status(404).json({ error: "Project not found" })
  const updated = await prisma.project.update({ where: { id: p.id }, data: { visibility: Visibility.private } })
  res.json(updated)
})

export default router
