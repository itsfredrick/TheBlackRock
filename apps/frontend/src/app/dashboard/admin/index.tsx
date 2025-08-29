import { useEffect, useState } from "react"
import GlassyCard from "../../components/ui/GlassyCard"
import { api } from "../../utils/api"

type ReqRow = { id: string; status: "requested"|"approved"|"rejected"|"revoked"; grantedAt?: string|null; project: { id: string; title: string; successScore?: number|null; visibility?: string }, investor: { user: { email: string; name?: string|null } } }

export default function AdminPage() {
  const [val, setVal] = useState<number>(70)
  const [ok, setOk] = useState<string>("")
  const [pending, setPending] = useState<ReqRow[]>([])
  const [filter, setFilter] = useState<"requested"|"approved"|"rejected"|"revoked">("requested")
  const [busy, setBusy] = useState<string | null>(null)

  async function loadThreshold() {
    const r = await fetch("http://localhost:4000/admin/thresholds", { headers: { "authorization": `Bearer ${localStorage.getItem("token")}` } })
    if (r.ok) { const j = await r.json(); setVal(j.investorScoreThreshold ?? 70) }
  }
  async function saveThreshold() {
    const r = await fetch("http://localhost:4000/admin/thresholds", {
      method: "PATCH",
      headers: { "content-type": "application/json", "authorization": `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ investorScoreThreshold: val })
    })
    setOk(r.ok ? "Saved" : "Error"); setTimeout(()=>setOk(""), 1500)
  }
  async function loadRequests() {
    const rows = await api.adminListAccessRequests(filter)
    setPending(rows as any)
  }
  async function setStatus(id: string, status: "approved"|"rejected"|"revoked") {
    setBusy(id); try { await api.adminUpdateAccessRequest(id, status); await loadRequests() } finally { setBusy(null) }
  }

  useEffect(()=>{ loadThreshold(); loadRequests() }, [])
  useEffect(()=>{ loadRequests() }, [filter])

  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-fade-up">
      <GlassyCard title="Investor Gate Threshold" subtitle="Minimum score to auto-enter investor preview">
        <div className="flex items-center gap-4">
          <input type="range" min={40} max={90} value={val} onChange={e=>setVal(Number(e.target.value))} />
          <div className="text-xl font-semibold">{val}</div>
          <button onClick={saveThreshold} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30">Save</button>
          <span className="text-sm opacity-70">{ok}</span>
        </div>
      </GlassyCard>

      <GlassyCard title="Investor Access Requests" subtitle="Approve or reject">
        <div className="flex items-center gap-3 mb-3 text-sm">
          <span className="opacity-70">Filter</span>
          {(["requested","approved","rejected","revoked"] as const).map(s => (
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-3 py-1 rounded-xl ${filter===s ? "bg-white/25" : "bg-white/15 hover:bg-white/25"}`}>{s}</button>
          ))}
        </div>
        <div className="grid gap-2">
          {pending.length===0 && <div className="opacity-70 text-sm">No items.</div>}
          {pending.map((r: ReqRow) => (
            <div key={r.id} className="glass rounded-2xl p-3 flex items-center justify-between card-hover">
              <div>
                <div className="font-medium text-sm">{r.project.title}</div>
                <div className="text-xs opacity-70">
                  {r.investor.user.name || r.investor.user.email} • Score {Math.round(r.project.successScore || 0)} • {r.project.visibility}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.status === "requested" ? (
                  <>
                    <button disabled={busy===r.id} onClick={()=>setStatus(r.id,"approved")}
                      className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">Approve</button>
                    <button disabled={busy===r.id} onClick={()=>setStatus(r.id,"rejected")}
                      className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">Reject</button>
                  </>
                ) : (
                  <>
                    <span className="text-xs opacity-80">{r.status}{r.grantedAt ? ` • ${new Date(r.grantedAt).toLocaleString()}` : ""}</span>
                    {r.status === "approved" && (
                      <button disabled={busy===r.id} onClick={()=>setStatus(r.id,"revoked")}
                        className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">Revoke</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassyCard>
    </div>
  )
}
