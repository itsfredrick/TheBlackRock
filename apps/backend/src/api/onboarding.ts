import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"

const prisma = new PrismaClient()
const router = Router()

// Compute "complete" without needing a new DB field:
async function computeState(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const role = (user as any)?.role as "founder"|"expert"|"investor"|"admin" | undefined
  let complete = false
  const details: any = {}
  if (role === "founder") {
    complete = !!(user?.name && user.name.trim().length > 0)
    details.founder = { name: user?.name || "" }
  } else if (role === "expert") {
    const ex = await prisma.expert.findUnique({ where: { userId } })
    complete = !!(ex && (ex.categories?.length || 0) > 0)
    details.expert = ex || null
  } else if (role === "investor") {
    const inv = await prisma.investor.findUnique({ where: { userId } })
    complete = !!(inv && (inv.focusAreas?.length || 0) > 0)
    details.investor = inv || null
  } else if (role === "admin") {
    complete = true
  }
  return {
    role,
    user: { id: user?.id, email: user?.email, name: user?.name || "" },
    complete,
    details
  }
}

// GET /onboarding/state
router.get("/state", requireAuth, async (req: any, res) => {
  const out = await computeState(req.user!.id)
  res.json(out)
})

// POST /onboarding/complete
const payloadSchema = z.object({
  role: z.enum(["founder","expert","investor"]).optional(),
  founder: z.object({
    name: z.string().min(1, "Name is required"),
    companyName: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional()
  }).optional(),
  expert: z.object({
    categories: z.array(z.string()).min(1, "At least one category"),
    skills: z.array(z.string()).optional(),
    location: z.string().optional(),
    portfolioLinks: z.array(z.string()).optional(),
    availability: z.string().optional()
  }).optional(),
  investor: z.object({
    focusAreas: z.array(z.string()).min(1, "At least one focus area"),
    stageFocus: z.array(z.string()).optional(),
    geographicFocus: z.array(z.string()).optional()
  }).optional()
})

router.post("/complete", requireAuth, async (req: any, res) => {
  const parse = payloadSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())

  const userId = req.user!.id
  const body = parse.data

  // Founder: stash key info on User (no new tables required)
  if (body.founder) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: body.founder.name }
    })
  }

  // Expert: upsert
  if (body.expert) {
    const { categories, skills, location, portfolioLinks, availability } = body.expert
    await prisma.expert.upsert({
      where: { userId },
      update: { categories, skills: skills ?? [], location: location ?? null, portfolioLinks: portfolioLinks ?? [], availability: availability ?? "open" },
      create: { userId, categories, skills: skills ?? [], location: location ?? null, portfolioLinks: portfolioLinks ?? [], availability: availability ?? "open", performanceScore: 50 }
    })
  }

  // Investor: upsert
  if (body.investor) {
    const { focusAreas, stageFocus, geographicFocus } = body.investor
    await prisma.investor.upsert({
      where: { userId },
      update: { focusAreas, stageFocus: stageFocus ?? [], geographicFocus: geographicFocus ?? [] },
      create: { userId, focusAreas, stageFocus: stageFocus ?? [], geographicFocus: geographicFocus ?? [] }
    })
  }

  const out = await computeState(userId)
  res.json(out)
})

export default router
