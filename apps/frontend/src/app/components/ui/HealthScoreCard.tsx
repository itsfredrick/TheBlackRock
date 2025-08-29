// apps/frontend/src/app/components/ui/HealthScoreCard.tsx
import { ReactNode } from "react"

export default function HealthScoreCard({
  score,
  label = "Health Score",
  children,
}: {
  score: number
  label?: string
  children?: ReactNode
}) {
  // Pick a color by score range
  const color =
    score >= 75 ? "bg-emerald-500/30" :
    score >= 50 ? "bg-amber-500/30" :
    "bg-rose-500/30"

  return (
    <div className={`glass rounded-2xl p-4 shadow-lg flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-70">{label}</span>
        <span className={`px-2 py-1 rounded-md text-sm font-semibold ${color}`}>
          {score}/100
        </span>
      </div>
      {children}
    </div>
  )
}
