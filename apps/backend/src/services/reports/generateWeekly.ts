import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function generateWeeklyReport(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { milestones: { include: { tasks: true } } } })
  if (!project) throw new Error("Project not found")

  const reportsDir = path.resolve("reports")
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir)
  const filename = `report_${project.id}_${Date.now()}.pdf`
  const filepath = path.join(reportsDir, filename)

  const doc = new PDFDocument({ size: "A4", margin: 48 })
  const stream = fs.createWriteStream(filepath)
  doc.pipe(stream)

  doc.fontSize(20).text("TheBlackRock • Weekly Status Report", { underline: true })
  doc.moveDown()
  doc.fontSize(12).text(`Project: ${project.title}`)
  doc.text(`Score: ${Math.round(project.successScore ?? 0)}`)
  doc.text(`Stage: ${project.stage}`)
  doc.moveDown()

  doc.fontSize(14).text("Milestones")
  project.milestones.forEach(m => {
    doc.fontSize(12).text(`• ${m.title} (${m.status})`)
    m.tasks.slice(0, 5).forEach(t => doc.text(`   - ${t.title} [${t.status}]`))
  })

  doc.end()
  await new Promise(r => stream.on("finish", r))

  const url = `/files/${filename}`
  const row = await prisma.report.create({
    data: { projectId: project.id, summary: "Auto-generated weekly", pdfUrl: url }
  })
  return row
}
