import { useEffect, useState } from "react"
import GlassyCard from "../../../components/ui/GlassyCard"
import { api } from "../../../utils/api"

type Message = { id: string; body: string; attachments: string[]; createdAt: string; sender?: { email: string; name?: string|null; role: string } }

export default function HistoryPanel({ projectId }: { projectId: string }) {
  const [q, setQ] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [hasAtt, setHasAtt] = useState(false)
  const [rows, setRows] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)

  async function search() {
    setBusy(true)
    try {
      const data = await api.searchMessages(projectId, {
        q: q.trim() || undefined,
        hasAttachments: hasAtt || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: 100
      })
      setRows(data)
    } finally { setBusy(false) }
  }

  useEffect(()=>{ search() }, [projectId])

  return (
    <GlassyCard title="History" subtitle="Find messages & files">
      <div className="grid gap-2 mb-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search text…"
          className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
        <div className="grid grid-cols-2 gap-2 items-center">
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
            className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
          <input type="date" value={to} onChange={e=>setTo(e.target.value)}
            className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm opacity-80">
          <input type="checkbox" checked={hasAtt} onChange={e=>setHasAtt(e.target.checked)} />
          Attachments only
        </label>
        <div>
          <button onClick={search} disabled={busy}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            {busy ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      <div className="grid gap-2 max-h-80 overflow-auto">
        {rows.length===0 && <div className="opacity-70 text-sm">No results.</div>}
        {rows.map((m) => (
          <div key={m.id} className="glass rounded-2xl p-3 card-hover">
            <div className="text-xs opacity-70">{m.sender?.name || m.sender?.email} • {new Date(m.createdAt).toLocaleString()}</div>
            {m.body && <div className="text-sm mt-1">{m.body}</div>}
            {m.attachments?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {m.attachments.map((u, i) => (
                  <a key={i} href={`http://localhost:4000${u}`} target="_blank" className="underline text-xs break-all">
                    {u.split("/").pop()}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </GlassyCard>
  )
}
