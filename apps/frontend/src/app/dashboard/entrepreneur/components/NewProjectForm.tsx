import { useState } from "react"
import GlassyCard from "../../../components/ui/GlassyCard"
import { api } from "../../../utils/api"

export default function NewProjectForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      await api.createProject({ title, summary })
      setTitle("")
      setSummary("")
      onCreated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassyCard title="Create project" subtitle="Start your build">
      <form onSubmit={submit} className="grid gap-3">
        <input className="glass rounded-xl px-3 py-2 bg-transparent outline-none" placeholder="Title"
               value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="glass rounded-xl px-3 py-2 bg-transparent outline-none" placeholder="Summary"
               value={summary} onChange={e=>setSummary(e.target.value)} />
        <div className="flex gap-2">
          <button disabled={busy || !title.trim()}
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </GlassyCard>
  )
}
