import { useEffect, useMemo, useState } from "react"
import GlassyCard from "../../components/ui/GlassyCard"
import { api } from "../../utils/api"

type Item = { id: string; title: string; summary?: string|null; successScore?: number|null; visibility: string }
type Req = { id: string; status: "requested"|"approved"|"rejected"|"revoked"; project: Item; grantedAt?: string|null }

export default function InvestorHome() {
  const [items, setItems] = useState<Item[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<any | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [requests, setRequests] = useState<Req[]>([])

  async function refreshDiscovery() {
    const rows = await api.discovery()
    setItems(rows)
    if (!selectedId && rows[0]) setSelectedId(rows[0].id)
  }
  async function refreshRequests() {
    const rows = await api.listMyAccessRequests()
    setRequests(rows as any)
  }

  useEffect(() => { refreshDiscovery(); refreshRequests() }, [])

  useEffect(() => {
    (async () => {
      if (!selectedId) return setDetails(null)
      try { const d = await api.getInvestorProject(selectedId); setDetails(d) }
      catch { setDetails(null) }
    })()
  }, [selectedId, requests])

  async function requestAccess(id: string) {
    setBusy(id)
    try { await api.requestAccess(id); await refreshRequests() } finally { setBusy(null) }
  }

  const selected = useMemo(() => items.find(i => i.id === selectedId) || null, [items, selectedId])

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fade-up">
      <GlassyCard title="Discovery" subtitle="Curated projects">
        <div className="grid gap-2">
          {items.map(p => (
            <button key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`glass rounded-2xl px-3 py-2 text-left card-hover ${selectedId===p.id ? "ring-2 ring-white/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs opacity-70">Score {Math.round(p.successScore || 0)}</div>
              </div>
              {p.summary && <div className="opacity-70 text-sm mt-1 line-clamp-2">{p.summary}</div>}
            </button>
          ))}
        </div>
      </GlassyCard>

      <GlassyCard title="Dealroom" subtitle={selected ? selected.title : "Select a project"}>
        {details ? (
          <div className="grid gap-3">
            <div className="opacity-80 text-sm">{details.summary || "No summary provided."}</div>
            <div className="text-sm opacity-80">Score: {Math.round(details.successScore || 0)}</div>
            <div className="glass rounded-2xl p-3">
              <div className="font-medium">Plan</div>
              <pre className="opacity-80 text-xs overflow-auto">{JSON.stringify(details.plan, null, 2)}</pre>
            </div>
            <div className="glass rounded-2xl p-3">
              <div className="font-medium">Budget</div>
              <pre className="opacity-80 text-xs overflow-auto">{JSON.stringify(details.budget, null, 2)}</pre>
            </div>
            <div className="glass rounded-2xl p-3">
              <div className="font-medium">Roadmap</div>
              <pre className="opacity-80 text-xs overflow-auto">{JSON.stringify(details.roadmap, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="opacity-70 text-sm">
            Preview unavailable. If you’ve already requested access, it will unlock once approved.
          </div>
        )}
      </GlassyCard>

      <GlassyCard title="My Access" subtitle="Request status">
        <div className="grid gap-2">
          {requests.length===0 && <div className="opacity-70 text-sm">No requests yet.</div>}
          {requests.map(r => (
            <div key={r.id} className="glass rounded-2xl p-3 flex items-center justify-between card-hover">
              <div>
                <div className="font-medium text-sm">{r.project.title}</div>
                <div className="opacity-70 text-xs">{r.status}{r.grantedAt ? ` • ${new Date(r.grantedAt).toLocaleString()}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                {r.status === "requested" ? <span className="text-xs opacity-80">Waiting approval…</span> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <button
            disabled={!selected || busy === selected?.id}
            onClick={() => selected && requestAccess(selected.id)}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            {busy === selected?.id ? "Requesting…" : "Request access to selected"}
          </button>
        </div>
      </GlassyCard>
    </div>
  )
}
