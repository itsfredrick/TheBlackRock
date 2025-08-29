import { useEffect, useMemo, useState } from "react"
import GlassyCard from "./GlassyCard"
import { api } from "../../utils/api"

type ExplainRow = { label: string; delta: number }

export default function ScoreExplainCard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<{ successScore:number, explain: { inputs:any, components:ExplainRow[], final:number } }|null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setBusy(true)
    try { setData(await api.aiExplain(projectId)) }
    finally { setBusy(false) }
  }
  useEffect(()=>{ load() }, [projectId])

  // keep original lists for the text columns
  const pos = useMemo(()=> data?.explain?.components?.filter(c=>c.delta>0) || [], [data])
  const neg = useMemo(()=> data?.explain?.components?.filter(c=>c.delta<0) || [], [data])

  // --- BAR METER (pure SVG) ---
  // We visualize deltas centered at 0. Hide the big "Base" component and "Clamp…" so focus is on adjustments.
  const visualRows: ExplainRow[] = useMemo(() => {
    const rows = (data?.explain?.components || []).filter(r => {
      const l = r.label.toLowerCase()
      return !l.startsWith("base") && !l.startsWith("clamp")
    })
    // sort by absolute impact, descending
    rows.sort((a,b)=>Math.abs(b.delta) - Math.abs(a.delta))
    return rows.slice(0, 10) // cap to 10 rows for compact card
  }, [data])

  const maxAbs = useMemo(() => {
    const m = Math.max(0.0001, ...visualRows.map(r => Math.abs(r.delta)))
    return m
  }, [visualRows])

  // SVG geometry
  const W = 640
  const PADX = 24
  const centerX = W / 2
  const rowH = 24
  const gap = 8
  const topPad = 12
  const H = topPad + visualRows.length * (rowH + gap)

  function barFor(delta: number) {
    // scale each side to occupy half width at most
    const half = (W - PADX*2) / 2
    const w = Math.min(half, Math.abs(delta) / maxAbs * half)
    const x = delta >= 0 ? centerX : centerX - w
    return { x, w }
  }

  return (
    <GlassyCard title="AI Scoring — Why this number?" subtitle={busy ? "Loading…" : `Final score: ${data?.successScore ?? "—"}/100`}>
      {data && (
        <div className="grid gap-4">
          {/* inputs pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="glass px-2 py-1 rounded-full">Domains: {data.explain.inputs?.domains?.join(", ")}</span>
            <span className="glass px-2 py-1 rounded-full">Complexity: {data.explain.inputs?.complexity}</span>
            <span className="glass px-2 py-1 rounded-full">Risk: {data.explain.inputs?.riskPenalty}</span>
          </div>

          {/* BAR METER */}
          <div className="glass rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs opacity-70">Factor contributions (left = lowers score, right = raises)</div>
              <div className="flex items-center gap-2 text-[11px] opacity-80">
                <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-1 rounded bg-emerald-300/80" /> positive</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-1 rounded bg-rose-300/80" /> negative</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <svg width="100%" viewBox={`0 0 ${W} ${Math.max(H, 56)}`} className="rounded-xl">
                {/* defs for subtle glassy gradients */}
                <defs>
                  <linearGradient id="posGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.25)"/>
                    <stop offset="100%" stopColor="rgba(16,185,129,0.55)"/>
                  </linearGradient>
                  <linearGradient id="negGrad" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="rgba(244,63,94,0.55)"/>
                    <stop offset="100%" stopColor="rgba(244,63,94,0.25)"/>
                  </linearGradient>
                </defs>

                {/* zero line */}
                <line x1={centerX} y1={0} x2={centerX} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {visualRows.map((r, idx) => {
                  const y = topPad + idx * (rowH + gap)
                  const { x, w } = barFor(r.delta)
                  const isPos = r.delta >= 0
                  return (
                    <g key={idx}>
                      {/* label */}
                      <text x={8} y={y + rowH*0.7} fontSize="11" fill="rgba(255,255,255,0.82)">{r.label}</text>

                      {/* bar background hint */}
                      <rect x={PADX} y={y + 6} width={W - PADX*2} height={rowH - 12} fill="rgba(255,255,255,0.04)" rx="6" />

                      {/* bar actual */}
                      <rect
                        x={x}
                        y={y + 6}
                        width={w}
                        height={rowH - 12}
                        fill={isPos ? "url(#posGrad)" : "url(#negGrad)"}
                        rx="6"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="0.5"
                      />
                      {/* delta value */}
                      <text
                        x={isPos ? x + w + 6 : x - 6}
                        y={y + rowH*0.7}
                        fontSize="11"
                        textAnchor={isPos ? "start" : "end"}
                        fill="rgba(255,255,255,0.75)"
                      >
                        {r.delta > 0 ? `+${r.delta.toFixed(1)}` : r.delta.toFixed(1)}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* text lists keep the glassy theme */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="glass rounded-xl p-3">
              <div className="text-xs opacity-70 mb-1">Positive contributions</div>
              <ul className="grid gap-1 text-sm">
                {pos.length === 0 && <li className="opacity-60">None</li>}
                {pos.map((c,i)=>(<li key={i} className="flex items-center justify-between">
                  <span>{c.label}</span><span className="font-mono">+{c.delta.toFixed(1)}</span>
                </li>))}
              </ul>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="text-xs opacity-70 mb-1">Negative contributions</div>
              <ul className="grid gap-1 text-sm">
                {neg.length === 0 && <li className="opacity-60">None</li>}
                {neg.map((c,i)=>(<li key={i} className="flex items-center justify-between">
                  <span>{c.label}</span><span className="font-mono">{c.delta.toFixed(1)}</span>
                </li>))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm opacity-80">Recompute with latest plan</div>
            <button onClick={load} className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30">Refresh</button>
          </div>
        </div>
      )}
      {!data && !busy && <div className="text-sm opacity-70">No data yet — run “AI: Plan • Budget • Roadmap”.</div>}
    </GlassyCard>
  )
}
