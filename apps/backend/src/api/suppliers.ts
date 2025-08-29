import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "../middleware/auth"

const prisma = new PrismaClient()
const router = Router()

// GET /suppliers/search?category=&location=&q=
router.get("/search", requireAuth, async (req: any, res) => {
  const { category, location, q } = req.query as Record<string, string | undefined>
  const where: any = {}
  if (category) where.category = { contains: String(category), mode: "insensitive" }
  if (location) where.location = { contains: String(location), mode: "insensitive" }
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } }
    ]
  }
  const rows = await prisma.supplier.findMany({
    where,
    orderBy: [{ rating: "desc" }, { companyName: "asc" }]
  })
  res.json(rows)
})

// GET /suppliers/suggest/:projectId?category=  -> top rated 3–5
router.get("/suggest/:projectId", requireAuth, async (req: any, res) => {
  const { category } = req.query as Record<string, string | undefined>
  const where: any = {}
  if (category) where.category = { contains: String(category), mode: "insensitive" }
  const rows = await prisma.supplier.findMany({
    where, take: 5, orderBy: [{ rating: "desc" }, { leadTimeDays: "asc" }]
  })
  res.json(rows)
})

export default router
