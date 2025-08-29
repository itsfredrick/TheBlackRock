// apps/frontend/src/app/dashboard/entrepreneur/components/ExpertPicker.tsx
import { useEffect, useState } from "react"
import GlassyCard from "../../../components/ui/GlassyCard"
import { api } from "../../../utils/api"

type Expert = {
  id: string
  performanceScore?: number | null
  categories: string[]
  skills: string[]
  hourlyRate?: number | null
  location?: string | null
  user: { id: string; name?: string | null; email: string }
}

export default function ExpertPicker({ projectId }: { projectId: string }) {
  const [q, setQ] = useState("")
  const [experts, setExperts] = useState<Expert[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string>("")

  async function search() {
    const rows = await api.searchExperts({ query: q })
    setExperts(rows)
  }

  async function invite(expertId: string) {
    try {
      setBusy(expertId)
      await api.inviteExpert(projectId, expertId, note)
      alert("Invite sent")
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    search()
  }, [])

  return (
    <GlassyCard title="Find Experts" subtitle="Search & invite to shortlist">
      <div className="flex gap-2 mb-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by skill, category, name…"
          className="glass flex-1 rounded-xl px-3 py-2 bg-transparent outline-none"
        />
        <button
          onClick={search}
          className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30"
        >
          Search
        </button>
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note for invite…"
        className="glass w-full rounded-xl px-3 py-2 bg-transparent outline-none text-sm mb-4"
      />

      <div className="grid gap-3">
        {experts.map(ex => (
          <div
            key={ex.id}
            className="glass rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{ex.user.name || ex.user.email}</div>
              <div className="text-xs opacity-70">
                {ex.categories.join(", ")} • {ex.skills.join(", ")}
              </div>
              {ex.location && (
                <div className="text-xs opacity-60">{ex.location}</div>
              )}
            </div>
            <button
              disabled={!!busy}
              onClick={() => invite(ex.id)}
              className="px-3 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 disabled:opacity-50"
            >
              {busy === ex.id ? "…" : "Invite"}
            </button>
          </div>
        ))}
        {experts.length === 0 && (
          <div className="text-sm opacity-60">No experts found</div>
        )}
      </div>
    </GlassyCard>
  )
}
