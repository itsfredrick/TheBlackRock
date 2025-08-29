import { useEffect, useMemo, useState } from "react"
import GlassyCard from "../../components/ui/GlassyCard"
import { api } from "../../utils/api"

type Task = { id: string; title: string; status: "todo"|"doing"|"done"|"blocked"; projectId: string }

export default function EngineerHome() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  async function refresh() {
    const rows = await api.myTasks()
    setTasks(rows)
  }

  useEffect(() => { refresh() }, [])

  const blocked = tasks.filter(t => t.status === "blocked").length
  const doing = tasks.filter(t => t.status === "doing").length

  async function setDone(id: string) {
    setBusy(id)
    try { await api.updateTask(id, { status: "done" }); await refresh() } finally { setBusy(null) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fade-up">
      <GlassyCard title="Your Tasks" subtitle="Assigned to you">
        <div className="grid gap-2">
          {tasks.length === 0 && <div className="opacity-70 text-sm">No tasks assigned.</div>}
          {tasks.map(t => (
            <div key={t.id} className="glass rounded-2xl p-3 flex items-center justify-between card-hover">
              <div>
                <div className="font-medium text-sm">{t.title}</div>
                <div className="opacity-60 text-xs">Status: {t.status}</div>
              </div>
              <button
                onClick={() => setDone(t.id)}
                disabled={busy === t.id || t.status === "done"}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40">
                {busy === t.id ? "…" : t.status === "done" ? "Done" : "Mark done"}
              </button>
            </div>
          ))}
        </div>
      </GlassyCard>

      <GlassyCard title="QA" subtitle="Open defects">
        <div className="text-3xl font-bold">{blocked}</div>
        <div className="opacity-70 text-sm">Tasks marked as blocked</div>
      </GlassyCard>

      <GlassyCard title="Pipeline" subtitle="In progress">
        <div className="text-3xl font-bold">{doing}</div>
        <div className="opacity-70 text-sm">Tasks currently being worked on</div>
      </GlassyCard>
    </div>
  )
}
