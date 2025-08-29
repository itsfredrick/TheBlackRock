import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { api } from "../../utils/api"

export default function RoleAwareHome() {
  const [dest, setDest] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const s = await api.onboardingState()
        if (!s.complete && s.role !== "admin") {
          setDest("/onboarding")
        } else {
          switch (s.role) {
            case "founder":  setDest("/dashboard/entrepreneur"); break
            case "expert":   setDest("/dashboard/engineer");     break
            case "investor": setDest("/dashboard/investor");     break
            case "admin":    setDest("/dashboard/admin");        break
            default:         setDest("/dashboard/entrepreneur")
          }
        }
      } catch {
        setDest("/dashboard/entrepreneur")
      }
    })()
  }, [])

  if (!dest) return <div className="p-6 text-sm opacity-70">Loading…</div>
  return <Navigate to={dest} replace />
}
