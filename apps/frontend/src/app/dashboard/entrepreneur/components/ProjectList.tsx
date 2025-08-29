import GlassyCard from "../../../components/ui/GlassyCard"

type Project = { id: string; title: string; successScore?: number | null }

export default function ProjectList({
  projects, selectedId, onSelect
}: { projects: Project[]; selectedId?: string | null; onSelect: (id: string) => void }) {
  return (
    <GlassyCard title="Projects" subtitle="Your portfolio">
      <div className="grid gap-2">
        {projects.length === 0 && <div className="opacity-70 text-sm">No projects yet.</div>}
        {projects.map(p => (
          <button key={p.id}
                  onClick={()=>onSelect(p.id)}
                  className={`glass rounded-2xl px-3 py-2 text-left card-hover ${selectedId===p.id ? "ring-2 ring-white/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs opacity-70">{p.successScore != null ? `Score ${Math.round(p.successScore)}` : "No score"}</div>
            </div>
          </button>
        ))}
      </div>
    </GlassyCard>
  )
}
