import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = Router()

function requireUser(req: any, res: any, next: any) {
  const userId = req.header("x-user-id")
  if (!userId) return res.status(401).json({ error: "x-user-id header required (dev mode)" })
  req.userId = userId
  next()
}

// GET /milestones/by-project/:projectId  -> milestones + tasks (read-only)
router.get("/by-project/:projectId", requireUser, async (req: any, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.projectId } })
  if (!project) return res.status(404).json({ error: "Project not found" })
  const milestones = await prisma.milestone.findMany({
    where: { projectId: project.id },
    include: { tasks: true },
    orderBy: { startDate: "asc" } as any
  })
  res.json(milestones)
})

export default router
