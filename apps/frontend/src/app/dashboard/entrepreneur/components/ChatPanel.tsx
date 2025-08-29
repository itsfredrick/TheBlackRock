import { useEffect, useRef, useState } from "react"
import GlassyCard from "../../../components/ui/GlassyCard"
import { api } from "../../../utils/api"
import { io, Socket } from "socket.io-client"

type Message = { id: string; body: string; attachments: string[]; createdAt: string; sender?: { email: string; name?: string|null; role: string } }

export default function ChatPanel({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [busy, setBusy] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  async function refresh() {
    const data = await api.listMessages(projectId)
    setRows(data)
    setTimeout(()=>listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 10)
  }

  useEffect(()=>{ refresh() }, [projectId])

  // Prefer WebSocket; if not connected, SSE will run as fallback
  useEffect(() => {
    const token = localStorage.getItem("token") || ""
    let s: Socket | null = null
    try {
      const WS_URL = (import.meta as any).env?.VITE_WS_URL || "http://localhost:4001"
      s = io(WS_URL, { transports: ["websocket"], auth: { token } })
      s.on("connect", () => { setWsConnected(true); s!.emit("project:join", projectId) })
      s.on("disconnect", () => setWsConnected(false))
      s.on("message.created", (payload: any) => {
        if (payload?.message) {
          setRows(prev => [...prev, payload.message])
          setTimeout(()=>listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 10)
        }
      })
    } catch {}
    return () => { try { s?.emit("project:leave", projectId) } catch {}; s?.disconnect() }
  }, [projectId])

  // SSE fallback if WS is not connected
  useEffect(() => {
    if (wsConnected) return
    const url = api.sseUrl(projectId)
    const es = new EventSource(url)
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg?.type === "message.created") {
          setRows(prev => [...prev, msg.message])
          setTimeout(()=>listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 10)
        }
      } catch {}
    }
    return () => es.close()
  }, [projectId, wsConnected])

  async function send() {
    if (!text.trim() && (!files || files.length===0)) return
    setBusy(true)
    try {
      let urls: string[] = []
      if (files && files.length > 0) {
        for (const f of Array.from(files)) {
          const { url } = await api.uploadFile(f)
          urls.push(url)
        }
      }
      await api.sendMessage({ projectId, body: text.trim() || undefined, attachments: urls.length ? urls : undefined })
      setText(""); setFiles(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassyCard title="Project Chat" subtitle={`Share updates & files ${wsConnected ? "• live (WS)" : "• live (SSE fallback)"}`}>
      <div ref={listRef} className="glass rounded-2xl p-3 max-h-80 overflow-auto grid gap-2">
        {rows.map((m) => (
          <div key={m.id} className="glass rounded-xl p-2">
            <div className="text-xs opacity-70">{m.sender?.name || m.sender?.email} • {new Date(m.createdAt).toLocaleString()}</div>
            {m.body && <div className="text-sm mt-1">{m.body}</div>}
            {m.attachments?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {m.attachments.map((u, i) => (
                  <a key={i} href={`http://localhost:4000${u}`} target="_blank" className="underline text-xs break-all">{u.split("/").pop()}</a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {rows.length===0 && <div className="opacity-70 text-sm">No messages yet.</div>}
      </div>

      <div className="mt-3 grid gap-2">
        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="Type an update…"
          className="glass rounded-xl px-3 py-2 bg-transparent outline-none"
        />
        <div className="flex items-center justify-between">
          <input type="file" multiple onChange={e=>setFiles(e.target.files)} className="text-xs opacity-80" />
          <button onClick={send} disabled={busy}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40">
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </GlassyCard>
  )
}
