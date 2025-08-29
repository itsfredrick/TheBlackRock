import { useEffect, useState } from "react"
import { api } from "../../utils/api"

type State = { role?: "founder"|"expert"|"investor"|"admin"; complete: boolean }

export default function RoleBadge() {
  const [s, setS] = useState<State | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => { try { const st = await api.onboardingState(); if (mounted) setS({ role: st.role, complete: st.complete }) } catch { /* ignore */ } })()
    return () => { mounted = false }
  }, [])

  const label = s?.role
    ? s.role === "founder"  ? "Founder"
    : s.role === "expert"   ? "Expert"
    : s.role === "investor" ? "Investor"
    : "Admin"
    : "—"

  const dot =
    s?.role === "founder"  ? "bg-blue-400"
  : s?.role === "expert"   ? "bg-emerald-400"
  : s?.role === "investor" ? "bg-amber-400"
  : s?.role === "admin"    ? "bg-fuchsia-400"
  : "bg-neutral-400"

  return (
    <div className="glass rounded-full px-3 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md text-xs animate-fade-up">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="font-medium">{label}</span>
      {s && <span className={`ml-1 px-1.5 py-[2px] rounded-md ${s.complete ? "bg-white/15" : "bg-amber-500/20"} opacity-80`}>
        {s.complete ? "Onboarding ✓" : "Onboarding •"}
      </span>}
    </div>
  )
}
