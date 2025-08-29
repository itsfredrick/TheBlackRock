import type { Server } from "socket.io"

let io: Server | null = null
export function setIO(s: Server) { io = s }
export function getIO(): Server | null { return io }

export function emitToProject(projectId: string, event: string, payload: any) {
  if (!io) return
  io.to(`project:${projectId}`).emit(event, payload)
}

export function emitMessageCreated(projectId: string, message: any) {
  emitToProject(projectId, "message.created", { message })
}
