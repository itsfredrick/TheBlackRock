import { useEffect, useState } from "react"
import GlassyCard from "../../../components/ui/GlassyCard"
import { api } from "../../../utils/api"

type Supplier = { id: string; companyName: string; category: string; location?: string|null; leadTimeDays?: number|null; rating?: number|null; verified: boolean }

export default function RfqForm({ projectId, onSent }: { projectId: string; onSent: () => void }) {
  const [quantity, setQuantity] = useState(10)
  const [materials, setMaterials] = useState("ABS, Aluminum 6061")
  const [targetCost, setTargetCost] = useState<number | "">("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [category, setCategory] = useState("cnc")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)

  async function search() {
    const rows = await api.searchSuppliers({ category })
    setSuppliers(rows); setChecked({})
  }

  useEffect(() => { search() }, [category])

  async function send() {
    const supplierIds = Object.entries(checked).filter(([_,v])=>v).map(([k])=>k)
    if (supplierIds.length === 0) return
    setBusy(true)
    try {
      await api.sendRFQ(projectId, {
        quantity,
        materials,
        targetCost: targetCost === "" ? undefined : Number(targetCost),
        dueDate: dueDate || undefined,
        notes: notes || undefined
      }, supplierIds)
      onSent()
      setNotes("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassyCard title="Prototype RFQ" subtitle="Send to suggested suppliers">
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs opacity-70">Quantity</label>
            <input type="number" min={1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}
              className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
          </div>
          <div>
            <label className="text-xs opacity-70">Target cost (optional)</label>
            <input type="number" min={0} value={targetCost} onChange={e=>setTargetCost(e.target.value === "" ? "" : Number(e.target.value))}
              className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
          </div>
        </div>

        <div>
          <label className="text-xs opacity-70">Materials</label>
          <input value={materials} onChange={e=>setMaterials(e.target.value)}
            className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs opacity-70">Due date (optional)</label>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
              className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
          </div>
          <div>
            <label className="text-xs opacity-70">Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full">
              <option value="cnc">CNC</option>
              <option value="pcb assembly">PCB Assembly</option>
              <option value="injection molding">Injection Molding</option>
              <option value="3d print">3D Print</option>
              <option value="sheet metal">Sheet Metal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs opacity-70">Notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            className="glass rounded-xl px-3 py-2 bg-transparent outline-none w-full" />
        </div>

        <div className="mt-1">
          <div className="opacity-70 text-xs mb-1">Suggested suppliers</div>
          <div className="grid gap-2">
            {suppliers.map(s => (
              <label key={s.id} className="glass rounded-2xl p-3 flex items-center justify-between card-hover">
                <div>
                  <div className="font-medium text-sm">{s.companyName}</div>
                  <div className="opacity-70 text-xs">{s.category} • {s.location || "N/A"} • Lead {s.leadTimeDays ?? "?"}d • Rating {s.rating ?? "—"}</div>
                </div>
                <input type="checkbox" checked={!!checked[s.id]} onChange={e=>setChecked(prev=>({ ...prev, [s.id]: e.target.checked }))} />
              </label>
            ))}
            {suppliers.length===0 && <div className="opacity-70 text-sm">No suppliers found.</div>}
          </div>
        </div>

        <div>
          <button onClick={send} disabled={busy}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            {busy ? "Sending…" : "Send RFQ"}
          </button>
        </div>
      </div>
    </GlassyCard>
  )
}
