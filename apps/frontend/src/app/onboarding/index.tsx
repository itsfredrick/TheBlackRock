import { useEffect, useMemo, useState } from "react"
import GlassyCard from "../components/ui/GlassyCard"
import { api } from "../utils/api"

function parseList(s: string): string[] {
  return s.split(",").map(x=>x.trim()).filter(Boolean)
}

export default function OnboardingPage() {
  const [state, setState] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  // founder
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [floc, setFloc] = useState("")

  // expert
  const [ecats, setEcats] = useState("")
  const [eskills, setEskills] = useState("")
  const [eloc, setEloc] = useState("")
  const [eports, setEports] = useState("")

  // investor
  const [ifocus, setIfocus] = useState("")
  const [istage, setIstage] = useState("")
  const [ireg, setIreg] = useState("")

  async function load() {
    const s = await api.onboardingState()
    setState(s)
    if (s.role === "founder") setName(s.user?.name || "")
  }
  useEffect(()=>{ load() }, [])

  useEffect(() => {
    if (!state) return
    if (state.complete) {
      const r = state.role
      if (r === "founder") window.location.href = "/dashboard/entrepreneur"
      else if (r === "expert") window.location.href = "/dashboard/engineer"
      else if (r === "investor") window.location.href = "/dashboard/investor"
      else window.location.href = "/"
    }
  }, [state])

  const role = useMemo(() => state?.role as ("founder"|"expert"|"investor"|"admin"|undefined), [state])

  async function submit() {
    if (!role) return
    setBusy(true)
    try {
      if (role === "founder") {
        await api.completeOnboarding({ founder: { name, companyName: company || undefined, location: floc || undefined } })
      } else if (role === "expert") {
        await api.completeOnboarding({
          expert: {
            categories: parseList(ecats),
            skills: parseList(eskills),
            location: eloc || undefined,
            portfolioLinks: parseList(eports)
          }
        })
      } else if (role === "investor") {
        await api.completeOnboarding({
          investor: {
            focusAreas: parseList(ifocus),
            stageFocus: parseList(istage),
            geographicFocus: parseList(ireg)
          }
        })
      }
      const s = await api.onboardingState()
      setState(s)
    } finally { setBusy(false) }
  }

  if (!state) return <div className="p-6 text-sm opacity-70">Loading…</div>
  if (role === "admin") return <div className="p-6">Admin does not require onboarding.</div>

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-up">
      <GlassyCard title="Welcome to TheBlackRock.AI" subtitle="Let’s personalize your workspace">
        <div className="opacity-80 text-sm mb-4">Signed in as {state.user?.email}</div>

        {role === "founder" && (
          <div className="grid gap-3">
            <div>
              <label className="text-xs opacity-70">Full name</label>
              <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70">Company (optional)</label>
              <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" value={company} onChange={e=>setCompany(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70">Location (optional)</label>
              <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" value={floc} onChange={e=>setFloc(e.target.value)} />
            </div>
          </div>
        )}

        {role === "expert" && (
          <div className="grid gap-3">
            <div>
              <label className="text-xs opacity-70">Primary categories (comma-separated)</label>
              <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" placeholder="industrial, electronics, firmware" value={ecats} onChange={e=>setEcats(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70">Key skills (comma-separated)</label>
              <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" placeholder="ID, DFM, CAD, Altium" value={eskills} onChange={e=>setEskills(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70">Location (optional)</label>
                <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" value={eloc} onChange={e=>setEloc(e.target.value)} />
              </div>
              <div>
                <label className="text-xs opacity-70">Portfolio links (comma-separated)</label>
                <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" placeholder="https://…" value={eports} onChange={e=>setEports(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {role === "investor" && (
          <div className="grid gap-3">
            <div>
              <label className="text-xs opacity-70">Focus areas (comma-separated)</label>
              <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" placeholder="hardware, robotics, medtech" value={ifocus} onChange={e=>setIfocus(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70">Stage focus (comma-separated)</label>
                <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" placeholder="pre-seed, seed, A" value={istage} onChange={e=>setIstage(e.target.value)} />
              </div>
              <div>
                <label className="text-xs opacity-70">Geographic focus (comma-separated)</label>
                <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" placeholder="global, US, EU, Africa" value={ireg} onChange={e=>setIreg(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={submit} disabled={busy}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            {busy ? "Saving…" : "Continue"}
          </button>
          <span className="text-xs opacity-70">Your role: <strong>{role}</strong>. (Change role later from admin if needed.)</span>
        </div>
      </GlassyCard>
    </div>
  )
}
