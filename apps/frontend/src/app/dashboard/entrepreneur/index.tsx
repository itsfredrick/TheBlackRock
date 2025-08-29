import { useEffect, useMemo, useState } from "react"
import HealthScoreCard from "../../components/ui/HealthScoreCard"
import RoadmapTimeline from "../../components/charts/RoadmapTimeline"
import GlassyCard from "../../components/ui/GlassyCard"
import NewProjectForm from "./components/NewProjectForm"
import ProjectList from "./components/ProjectList"
import ExpertPicker from "./components/ExpertPicker"
import RfqForm from "./components/RfqForm"
import QuotesTable from "./components/QuotesTable"
import ChatPanel from "./components/ChatPanel"
import HistoryPanel from "./components/HistoryPanel"
import ScoreExplainCard from "../../components/ui/ScoreExplainCard"
import { api } from "../../utils/api"

type Project = { id: string; title: string; summary?: string; aiRoadmapJson?: any; successScore?: number | null }

export default function EntrepreneurHome() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyAI, setBusyAI] = useState(false)
  const [reports, setReports] = useState<any[]>([])

  async function refresh() {
    const rows = await api.listProjects()
    setProjects(rows)
    const id = selectedId || rows[0]?.id || null
    setSelectedId(id)
    if (id) setReports(await api.listReports(id))
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => { (async()=>{ if (selectedId) setReports(await api.listReports(selectedId)) })() }, [selectedId])

  const selected = useMemo(() => projects.find(p => p.id === selectedId) || null, [projects, selectedId])
  const timelineItems = useMemo(() => {
    const ms = selected?.aiRoadmapJson?.milestones
    if (!ms || !Array.isArray(ms)) return []
    return ms.map((m: any) => ({ title: m.title, start: m.start || "2025-09-01", end: m.end || "2025-09-15", status: "active" as const }))
  }, [selected])

  async function generateAI() {
    if (!selected) return
    setBusyAI(true); try { await api.generateAI(selected.id); await refresh() } finally { setBusyAI(false) }
  }
  async function generateReport() {
    if (!selected) return
    const r = await api.generateWeekly(selected.id)
    setReports(prev => [r, ...prev])
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fade-up">
      <div className="lg:col-span-2 grid gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthScoreCard score={Math.round(selected?.successScore ?? 0)} />
          <GlassyCard title="Actions" subtitle="AI + workflow">
            <div className="flex items-center gap-3">
              <button onClick={generateAI} disabled={!selected || busyAI}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
                {busyAI ? "Generating…" : "AI: Plan • Budget • Roadmap"}
              </button>
              <span className="text-sm opacity-70">{selected ? selected.title : "Select a project"}</span>
            </div>
          </GlassyCard>
        </div>

        {selected && <ScoreExplainCard projectId={selected.id} />}

        <RoadmapTimeline items={timelineItems} />

        {selected && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <RfqForm projectId={selected.id} onSent={refresh} />
              <QuotesTable projectId={selected.id} />
            </div>
            <ChatPanel projectId={selected.id} />
            <HistoryPanel projectId={selected.id} />
          </>
        )}
      </div>

      <div className="grid gap-6">
        <NewProjectForm onCreated={refresh} />
        <ProjectList projects={projects} selectedId={selectedId} onSelect={setSelectedId} />
        {selected && <ExpertPicker projectId={selected.id} />}
        <GlassyCard title="Reports" subtitle="Auto-generated weekly PDFs">
          <button onClick={generateReport} disabled={!selected}
                  className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            Generate weekly PDF
          </button>
          <ul className="mt-3 grid gap-2 text-sm">
            {reports.map((r:any)=>(
              <li key={r.id} className="flex items-center justify-between glass rounded-xl px-3 py-2">
                <span className="opacity-80">{new Date(r.createdAt).toLocaleString()}</span>
                <a href={`http://localhost:4000${r.pdfUrl}`} target="_blank" className="underline">Open PDF</a>
              </li>
            ))}
            {reports.length===0 && <li className="opacity-70">No reports yet.</li>}
          </ul>
        </GlassyCard>
      </div>
    </div>
  )
}
