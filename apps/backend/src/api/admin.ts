import { Router } from "express"
import { PrismaClient, InvestorAccessStatus } from "@prisma/client"
import { requireAuth, requireRole } from "../middleware/auth"

const prisma = new PrismaClient()
const router = Router()

// --- Thresholds (kept) ---
router.get("/thresholds", requireAuth, requireRole("admin"), async (_req, res) => {
  const row = await prisma.systemSetting.findUnique({ where: { key: "INVESTOR_SCORE_THRESHOLD" } })
  res.json({ investorScoreThreshold: (row?.json as any)?.value ?? 70 })
})

router.patch("/thresholds", requireAuth, requireRole("admin"), async (req, res) => {
  const value = Number(req.body?.investorScoreThreshold ?? 70)
  const json = { value }
  await prisma.systemSetting.upsert({
    where: { key: "INVESTOR_SCORE_THRESHOLD" },
    update: { json },
    create: { key: "INVESTOR_SCORE_THRESHOLD", json }
  })
  res.json({ ok: true, investorScoreThreshold: value })
})

// --- Investor access approvals ---
router.get("/access-requests", requireAuth, requireRole("admin"), async (req, res) => {
  const status = (req.query.status as string | undefined) ?? "requested"
  const rows = await prisma.investorAccessRequest.findMany({
    where: status ? { status: status as InvestorAccessStatus } : {},
    include: {
      project: { select: { id: true, title: true, successScore: true, visibility: true } },
      investor: { include: { user: { select: { id: true, email: true, name: true } } } }
    },
    orderBy: { grantedAt: "desc" }
  })
  res.json(rows)
})

router.patch("/access-requests/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = req.params.id
  const next = (req.body?.status as InvestorAccessStatus) || "approved"
  if (!["approved","rejected","revoked"].includes(next)) {
    return res.status(400).json({ error: "status must be approved|rejected|revoked" })
  }
  const data: any = { status: next }
  if (next === "approved") data.grantedAt = new Date()
  const updated = await prisma.investorAccessRequest.update({ where: { id }, data })
  res.json(updated)
})

export default router
