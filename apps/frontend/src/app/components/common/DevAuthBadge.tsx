import { useState } from "react"
import { setAuth, api } from "../../utils/api"

export default function DevAuthBadge() {
  const [email, setEmail] = useState("founder@example.com")
  const [pwd, setPwd] = useState("password123")
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(Boolean(localStorage.getItem("token")))

  async function connect() {
    setBusy(true)
    try {
      try {
        const r = await api.register(email, pwd, email.startsWith("expert") ? "expert" : email.startsWith("investor") ? "investor" : "founder")
        setAuth(r.token, r.user.id); setConnected(true)
      } catch {
        const r = await api.login(email, pwd)
        setAuth(r.token, r.user.id); setConnected(true)
      }
    } finally { setBusy(false) }
  }
  function disconnect() { setAuth(null, null); setConnected(false) }

  return (
    <div className="flex items-center gap-2">
      {!connected ? (
        <div className="glass rounded-2xl p-2 flex items-center gap-2">
          <input value={email} onChange={e=>setEmail(e.target.value)} className="bg-transparent outline-none text-sm w-56" placeholder="email" />
          <input value={pwd} onChange={e=>setPwd(e.target.value)} type="password" className="bg-transparent outline-none text-sm w-32" placeholder="password" />
          <button onClick={connect} disabled={busy} className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50">
            {busy ? "…" : "Connect"}
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl px-3 py-1 text-sm flex items-center gap-3">
          <span className="opacity-80">JWT ready</span>
          <button onClick={disconnect} className="underline opacity-80 hover:opacity-100">disconnect</button>
        </div>
      )}
    </div>
  )
}
