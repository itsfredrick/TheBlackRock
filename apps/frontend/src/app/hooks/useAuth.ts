import { useEffect, useState } from "react"

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"))
  const [role, setRole] = useState<string | null>(localStorage.getItem("role") || "founder")

  useEffect(() => { userId ? localStorage.setItem("userId", userId) : localStorage.removeItem("userId") }, [userId])
  useEffect(() => { role ? localStorage.setItem("role", role) : localStorage.removeItem("role") }, [role])

  return { userId, setUserId, role, setRole }
}
