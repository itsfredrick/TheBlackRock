import { Router } from "express"
import { PrismaClient, TaskStatus } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()

function requireUser(req: any, res: any, next: any) {
  const userId = req.header("x-user-id")
  if (!userId) return res.status(401).json({ error: "x-user-id header required (dev mode)" })
  req.userId = userId
  next()
}

// GET /tasks/my  -> tasks assigned to me
router.get("/my", requireUser, async (req: any, res) => {
  const tasks = await prisma.task.findMany({
    where: { assigneeId: req.userId },
    orderBy: { createdAt: "desc" } as any
  })
  res.json(tasks)
})

const patchSchema = z.object({
  status: z.enum(["todo","doing","done","blocked"]).optional(),
  actualHours: z.number().min(0).optional()
})

// PATCH /tasks/:id  -> update status or hours
router.patch("/:id", requireUser, async (req: any, res) => {
  const parse = patchSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const task = await prisma.task.findUnique({ where: { id: req.params.id } })
  if (!task) return res.status(404).json({ error: "Task not found" })
  // simple guard: only assignee can update in dev mode
  if (task.assigneeId && task.assigneeId !== req.userId) {
    return res.status(403).json({ error: "Not your task" })
  }
  const updated = await prisma.task.update({ where: { id: task.id }, data: parse.data })
  res.json(updated)
})

export default router
