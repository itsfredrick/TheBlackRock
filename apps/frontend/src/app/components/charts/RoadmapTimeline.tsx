// apps/frontend/src/app/components/charts/RoadmapTimeline.tsx
import GlassyCard from "../ui/GlassyCard"

type Item = { title: string; start: string; end: string; status: "planned" | "active" | "done" }

export default function RoadmapTimeline({ items }: { items: Item[] }) {
  const day = 24 * 60 * 60 * 1000
  const min = Math.min(...items.map(i => +new Date(i.start)))
  const max = Math.max(...items.map(i => +new Date(i.end)))
  const span = Math.max(day, max - min)

  return (
    <GlassyCard title="Roadmap" subtitle="Milestones timeline">
      <div className="flex flex-col gap-3">
        {items.map((i, idx) => {
          const left = ((+new Date(i.start) - min) / span) * 100
          const width = ((+new Date(i.end) - +new Date(i.start)) / span) * 100
          const color =
            i.status === "done"
              ? "bg-emerald-400/70"
              : i.status === "active"
              ? "bg-sky-400/70"
              : "bg-white/25"
          return (
            <div key={idx} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="opacity-90">{i.title}</span>
                <span className="opacity-60">
                  {i.start} → {i.end}
                </span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`absolute h-full rounded-full ${color}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </GlassyCard>
  )
}
