import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"

import authRouter from "./api/auth"
import projectsRouter from "./api/projects"
import aiRouter from "./api/ai"
import tasksRouter from "./api/tasks"
import milestonesRouter from "./api/milestones"
import investorRouter from "./api/investor"
import expertsRouter from "./api/experts"
import suppliersRouter from "./api/suppliers"
import adminRouter from "./api/admin"
import shortlistRouter from "./api/shortlist"
import reportsRouter from "./api/reports"
import quotesRouter from "./api/quotes"
import filesRouter from "./api/files"
import messagesRouter from "./api/messages"
import onboardingRouter from "./api/onboarding"
import { startCron } from "./services/cron/scheduler"
import { startRealtime } from "./realtime/ws"

export function createServer() {
  dotenv.config()
  const app = express()
  app.use(cors({ origin: "http://localhost:5173", credentials: true }))
  app.use(helmet())
  app.use(express.json({ limit: "15mb" }))
  app.use(morgan("dev"))

  app.use("/files", express.static("reports"))
  app.use("/uploads", express.static("uploads"))

  app.get("/health", (_, res) => res.json({ ok: true, service: "backend" }))

  app.use("/auth", authRouter)
  app.use("/projects", projectsRouter)
  app.use("/ai", aiRouter)
  app.use("/tasks", tasksRouter)
  app.use("/milestones", milestonesRouter)
  app.use("/investor", investorRouter)
  app.use("/experts", expertsRouter)
  app.use("/suppliers", suppliersRouter)
  app.use("/admin", adminRouter)
  app.use("/shortlist", shortlistRouter)
  app.use("/reports", reportsRouter)
  app.use("/quotes", quotesRouter)
  app.use("/files", filesRouter)
  app.use("/messages", messagesRouter)
  app.use("/onboarding", onboardingRouter)

  app.use((_, res) => res.status(404).json({ error: "Not found" }))

  startCron()
  startRealtime()
  return app
}
