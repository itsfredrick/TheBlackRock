import cron from "node-cron"
import { PrismaClient } from "@prisma/client"
import { generateWeeklyReport } from "../reports/generateWeekly"

const prisma = new PrismaClient()
const ENABLED = (process.env.CRON_ENABLED || "true").toLowerCase() === "true"
const SPEC = process.env.CRON_SCHEDULE || "0 9 * * MON" // 9:00 every Monday
const TZ = process.env.CRON_TZ || "Africa/Lagos"

export function startCron() {
  if (!ENABLED) return
  cron.schedule(SPEC, async () => {
    try {
      const projects = await prisma.project.findMany({ select: { id: true } })
      for (const p of projects) {
        await generateWeeklyReport(p.id)
      }
      // eslint-disable-next-line no-console
      console.log(`[cron] Weekly reports generated for ${projects.length} project(s)`)
    } catch (e) {
      console.error("[cron] error", e)
    }
  }, { timezone: TZ })
  console.log(`[cron] scheduled '${SPEC}' (${TZ})`)
}
