import { Router } from "express"
import { PrismaClient, QuoteStatus } from "@prisma/client"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"

const prisma = new PrismaClient()
const router = Router()

// POST /projects/:projectId/rfq  { rfq, supplierIds[] }
const rfqSchema = z.object({
  rfq: z.object({
    quantity: z.number().int().positive(),
    materials: z.string().min(1),
    targetCost: z.number().nonnegative().optional(),
    dueDate: z.string().optional(),
    notes: z.string().optional()
  }),
  supplierIds: z.array(z.string().uuid()).min(1)
})
router.post("/projects/:projectId/rfq", requireAuth, async (req: any, res) => {
  const projectId = req.params.projectId
  const parse = rfqSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())

  // verify ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: req.user!.id } })
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" })

  const created = await prisma.$transaction(
    parse.data.supplierIds.map(supplierId =>
      prisma.supplierQuote.create({
        data: {
          projectId, supplierId,
          rfqJson: parse.data.rfq,
          status: "requested",
          attachmentUrls: []
        }
      })
    )
  )
  res.status(201).json(created)
})

// GET /quotes/by-project/:projectId -> include supplier info
router.get("/by-project/:projectId", requireAuth, async (req: any, res) => {
  const projectId = req.params.projectId
  const rows = await prisma.supplierQuote.findMany({
    where: { projectId },
    include: { supplier: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" } as any]
  })
  res.json(rows)
})

// POST /quotes/:id/submit { quoteJson } -> mark as received
const submitSchema = z.object({
  quoteJson: z.object({
    price: z.number().nonnegative(),
    currency: z.string().default("USD"),
    leadTimeDays: z.number().int().positive(),
    notes: z.string().optional()
  })
})
router.post("/:id/submit", requireAuth, async (req: any, res) => {
  const id = req.params.id
  const parse = submitSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const ex = await prisma.supplierQuote.findUnique({ where: { id } })
  if (!ex) return res.status(404).json({ error: "Quote not found" })
  const updated = await prisma.supplierQuote.update({
    where: { id },
    data: { quoteJson: parse.data.quoteJson, status: "received" }
  })
  res.json(updated)
})

// PATCH /quotes/:id { status }
const statusSchema = z.object({ status: z.enum(["shortlisted","rejected"]) })
router.patch("/:id", requireAuth, async (req: any, res) => {
  const id = req.params.id
  const parse = statusSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const updated = await prisma.supplierQuote.update({ where: { id }, data: { status: parse.data.status as QuoteStatus } })
  res.json(updated)
})

export default router
