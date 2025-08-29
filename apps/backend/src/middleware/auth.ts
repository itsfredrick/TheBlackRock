import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export type JwtUser = { id: string; role: "founder"|"expert"|"investor"|"admin"; email: string }
declare global { namespace Express { interface Request { user?: JwtUser } } }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: "Missing Bearer token" })
  try {
    const secret = process.env.JWT_SECRET || "dev_secret"
    const payload = jwt.verify(token, secret) as JwtUser
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: "Invalid token" })
  }
}

export function requireRole(...roles: JwtUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" })
    next()
  }
}
