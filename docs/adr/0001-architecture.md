# ADR 0001: High-level Architecture
- Frontend: React/Vite (glassy UI)
- Backend: Express + Prisma (Postgres)
- Realtime: Socket.IO + Redis (SSE fallback)
- Files: S3 presigned (local fallback), AV scan (ClamAV + heuristics)
- AI: FastAPI microservice (heuristic generator) invoked by backend
