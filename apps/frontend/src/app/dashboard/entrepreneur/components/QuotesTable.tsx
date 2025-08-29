import { useEffect, useState } from "react"
import GlassyCard from "../../../components/ui/GlassyCard"
import { api } from "../../../utils/api"

type Supplier = { id: string; companyName: string; category: string }
type Row = { id: string; status: "requested"|"received"|"shortlisted"|"rejected"; supplier: Supplier; quoteJson?: any }

export default function QuotesTable({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [mockPrice, setMockPrice] = useState<number | "">("")
  const [mockLead, setMockLead] = useState<number | "">("")

  async function refresh() {
    const data = await api.listQuotes(projectId)
    setRows(data)
  }
  useEffect(()=>{ refresh() }, [projectId])

  async function shortlist(id: string) {
    setBusy(id); try { await api.updateQuoteStatus(id, "shortlisted"); await refresh() } finally { setBusy(null) }
  }
  async function reject(id: string) {
    setBusy(id); try { await api.updateQuoteStatus(id, "rejected"); await refresh() } finally { setBusy(null) }
  }
  async function mockSubmit(id: string) {
    if (mockPrice === "" || mockLead === "") return
    setBusy(id); try { await api.submitQuote(id, { price: Number(mockPrice), leadTimeDays: Number(mockLead), currency: "USD" }); await refresh() } finally { setBusy(null) }
  }

  return (
    <GlassyCard title="Quotes" subtitle="Supplier responses">
      <div className="mb-3 text-xs opacity-70">Use the mock submit to simulate a supplier response for demo purposes.</div>
      <div className="grid gap-2">
        {rows.length===0 && <div className="opacity-70 text-sm">No quotes yet. Send RFQs first.</div>}
        {rows.map(r => (
          <div key={r.id} className="glass rounded-2xl p-3 grid gap-2 card-hover">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{r.supplier.companyName}</div>
              <span className="text-xs opacity-70">{r.status}</span>
            </div>
            {r.status === "received" && r.quoteJson && (
              <div className="text-sm opacity-85">
                ${r.quoteJson.price} {r.quoteJson.currency || "USD"} • Lead {r.quoteJson.leadTimeDays}d
              </div>
            )}
            {r.status === "requested" && (
              <div className="flex items-center gap-2 text-xs">
                <input type="number" min={0} placeholder="mock price" value={mockPrice}
                  onChange={e=>setMockPrice(e.target.value===""?"":Number(e.target.value))}
                  className="glass rounded-lg px-2 py-1 bg-transparent outline-none w-28" />
                <input type="number" min={1} placeholder="lead days" value={mockLead}
                  onChange={e=>setMockLead(e.target.value===""?"":Number(e.target.value))}
                  className="glass rounded-lg px-2 py-1 bg-transparent outline-none w-24" />
                <button onClick={()=>mockSubmit(r.id)} disabled={busy===r.id}
                  className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">Mock submit</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={()=>shortlist(r.id)} disabled={busy===r.id || r.status==="shortlisted"}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">Shortlist</button>
              <button onClick={()=>reject(r.id)} disabled={busy===r.id || r.status==="rejected"}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </GlassyCard>
  )
}
