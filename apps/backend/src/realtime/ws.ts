import { createServer } from "http"
import { Server } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { Redis } from "ioredis"
import jwt from "jsonwebtoken"
import { setIO } from "./hub"

const ORIGIN = process.env.WS_ORIGIN || "http://localhost:5173"
const WS_PORT = Number(process.env.WS_PORT || 4001)
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379"
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"

export async function startRealtime() {
  // HTTP server solely for WS
  const httpServer = createServer()
  const io = new Server(httpServer, {
    transports: ["websocket"],
    cors: { origin: ORIGIN, credentials: true }
  })

  // Redis adapter for multi-instance broadcast
  const pub = new Redis(REDIS_URL, { lazyConnect: true })
  const sub = new Redis(REDIS_URL, { lazyConnect: true })
  await pub.connect(); await sub.connect()
  io.adapter(createAdapter(pub, sub))

  // JWT auth on handshake
  io.use((socket, next) => {
    const token = (socket.handshake.auth as any)?.token || (socket.handshake.query as any)?.token
    if (!token) return next(new Error("missing token"))
    try {
      const user = jwt.verify(String(token), JWT_SECRET) as any
      ;(socket.data as any).user = { id: user.id, role: user.role, email: user.email }
      next()
    } catch (e) {
      next(new Error("invalid token"))
    }
  })

  io.on("connection", socket => {
    socket.on("project:join", (projectId: string) => {
      if (typeof projectId === "string" && projectId.length) {
        socket.join(`project:${projectId}`)
      }
    })
    socket.on("project:leave", (projectId: string) => {
      if (typeof projectId === "string" && projectId.length) {
        socket.leave(`project:${projectId}`)
      }
    })
  })

  httpServer.listen(WS_PORT, () => {
    console.log(`[ws] Socket.IO listening on ${WS_PORT}, origin=${ORIGIN}, redis=${REDIS_URL}`)
  })

  // expose singleton
  setIO(io)
}
