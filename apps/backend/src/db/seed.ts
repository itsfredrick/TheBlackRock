import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
const prisma = new PrismaClient()

async function ensureUser(email: string, password: string, role: Role, name: string) {
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 10), role, name }
    })
  }
  return user
}

async function main() {
  const founder = await ensureUser("founder@example.com","password123",Role.founder,"Demo Founder")
  const admin   = await ensureUser("admin@example.com","password123",Role.admin,"Admin")
  const expertU = await ensureUser("expert@example.com","password123",Role.expert,"Senior ID")
  const investorU = await ensureUser("investor@example.com","password123",Role.investor,"Angel")

  await prisma.expert.upsert({
    where: { userId: expertU.id },
    update: {},
    create: {
      userId: expertU.id,
      categories: ["industrial"],
      skills: ["ID","DFM"],
      portfolioLinks: [],
      performanceScore: 78,
      location: "US",
      availability: "open",
      hourlyRate: 120
    }
  })

  await prisma.investor.upsert({
    where: { userId: investorU.id },
    update: {},
    create: { userId: investorU.id, focusAreas: ["hardware"], stageFocus: ["seed"], geographicFocus: ["global"] }
  })

  const existing = await prisma.project.count({ where: { ownerId: founder.id } })
  if (existing === 0) {
    const p = await prisma.project.create({
      data: { ownerId: founder.id, title: "Concept Alpha", summary: "Demo project seeded", successScore: 72 }
    })
    await prisma.task.create({ data: { projectId: p.id, title: "DFM review", status: "doing", assigneeId: expertU.id } })
  }

  await prisma.systemSetting.upsert({
    where: { key: "INVESTOR_SCORE_THRESHOLD" },
    update: { json: { value: 70 } },
    create: { key: "INVESTOR_SCORE_THRESHOLD", json: { value: 70 } }
  })

  console.log("✅ Seed complete")
}

main().catch(e => { console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
