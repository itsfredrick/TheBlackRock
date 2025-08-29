// apps/frontend/src/app/components/charts/StatsCard.tsx
import GlassyCard from "../ui/GlassyCard"

export default function StatsCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <GlassyCard title={title} subtitle={subtitle}>
      <div className="text-3xl font-bold">{value}</div>
    </GlassyCard>
  )
}
