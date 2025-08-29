import { Router } from "express"
import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()
const SECRET = process.env.JWT_SECRET || "dev_secret"

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["founder","expert","investor","admin"]).default("founder"),
  name: z.string().optional()
})

function sign(user: { id: string; email: string; role: Role }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "2d" })
}

router.post("/register", async (req, res) => {
  const parse = signupSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const { email, password, role, name } = parse.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: "Email already in use" })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash, role, name } })
  // create role rows on demand
  if (role === "expert") await prisma.expert.create({ data: { userId: user.id, categories: [], skills: [], portfolioLinks: [] } })
  if (role === "investor") await prisma.investor.create({ data: { userId: user.id, focusAreas: [], stageFocus: [], geographicFocus: [] } })
  return res.status(201).json({ token: sign(user), user: { id: user.id, email: user.email, role: user.role } })
})

const loginSchema = z.object({ email: z.string().email(), password: z.string() })
router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json(parse.error.flatten())
  const { email, password } = parse.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: "Invalid credentials" })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: "Invalid credentials" })
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  return res.json({ token: sign(user), user: { id: user.id, email: user.email, role: user.role } })
})

export default router
