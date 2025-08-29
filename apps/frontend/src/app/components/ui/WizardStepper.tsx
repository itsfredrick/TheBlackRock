// apps/frontend/src/app/components/ui/WizardStepper.tsx
import { cn } from "../../utils/helpers"

type Step = { label: string; done?: boolean; active?: boolean }

export default function WizardStepper({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-full grid place-items-center glass text-sm",
              s.done
                ? "ring-2 ring-emerald-300/60"
                : s.active
                ? "ring-2 ring-white/30"
                : ""
            )}
          >
            {i + 1}
          </div>
          <span
            className={cn(
              "text-sm",
              s.active ? "font-semibold" : s.done ? "opacity-80" : "opacity-60"
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className="w-10 h-[2px] bg-white/15 rounded-full" />
          )}
        </div>
      ))}
    </div>
  )
}
