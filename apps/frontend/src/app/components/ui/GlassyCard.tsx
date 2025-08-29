// apps/frontend/src/app/components/ui/GlassyCard.tsx
import { ReactNode } from "react"

export default function GlassyCard({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div className="glass rounded-2xl p-4 shadow-lg">
      {title && (
        <div className="mb-2">
          <h3 className="font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm opacity-70 leading-tight">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
