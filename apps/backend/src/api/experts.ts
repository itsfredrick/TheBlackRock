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

// GET /experts/me/shortlists -> shortlist invites for the expert tied to my user
router.get("/me/shortlists", requireUser, async (req: any, res) => {
  const expert = await prisma.expert.findUnique({ where: { userId: req.userId } })
  if (!expert) return res.json([])
  const rows = await prisma.projectExpertShortlist.findMany({
    where: { expertId: expert.id },
    include: { project: true },
    orderBy: { createdAt: "desc" } as any
  })
  res.json(rows)
})

export default router
