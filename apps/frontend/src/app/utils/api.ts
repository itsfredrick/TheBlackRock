type Project = { id: string; title: string; summary?: string | null; aiRoadmapJson?: any; successScore?: number | null; visibility?: string }
type Task = { id: string; title: string; status: "todo"|"doing"|"done"|"blocked"; projectId: string; milestoneId?: string|null }
type Milestone = { id: string; title: string; startDate?: string|null; dueDate?: string|null; status: string; tasks: Task[] }
type DiscoveryItem = { id: string; title: string; summary?: string|null; successScore?: number|null; visibility: string }
type InvestorRequest = { id: string; status: "requested"|"approved"|"rejected"|"revoked"; project: Project; grantedAt?: string|null }
type Supplier = { id: string; companyName: string; category: string; location?: string|null; leadTimeDays?: number|null; minOrder?: number|null; rating?: number|null; verified: boolean }
type SupplierQuote = { id: string; projectId: string; supplierId: string; rfqJson: any; quoteJson?: any; status: "requested"|"received"|"shortlisted"|"rejected"; attachmentUrls: string[]; supplier: Supplier }
type Message = { id: string; projectId: string; senderId: string; body: string; attachments: string[]; createdAt: string; sender?: { id: string; email: string; name?: string|null; role: string } }

type OnboardingState = { role?: "founder"|"expert"|"investor"|"admin"; user: { id?: string; email?: string; name?: string }; complete: boolean; details: any }

const BASE = "http://localhost:4000"
let token: string | null = localStorage.getItem("token")
let userId: string | null = localStorage.getItem("userId")
export function setAuth(nextToken: string | null, nextUserId?: string | null) {
  token = nextToken
  if (nextToken) localStorage.setItem("token", nextToken); else localStorage.removeItem("token")
  if (typeof nextUserId !== "undefined") {
    userId = nextUserId
    if (nextUserId) localStorage.setItem("userId", nextUserId); else localStorage.removeItem("userId")
  }
}
async function req(path: string, init: RequestInit = {}) {
  const headers: Record<string,string> = { "content-type": "application/json", ...(init.headers || {}) }
  if (token) headers["authorization"] = `Bearer ${token}`
  const r = await fetch(`${BASE}${path}`, { ...init, headers })
  return r
}

export const api = {
  // auth
  async register(email: string, password: string, role: "founder"|"expert"|"investor"="founder") { const r = await req("/auth/register", { method:"POST", body: JSON.stringify({ email, password, role }) }); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async login(email: string, password: string) { const r = await req("/auth/login", { method:"POST", body: JSON.stringify({ email, password }) }); if(!r.ok) throw new Error(await r.text()); return r.json() },

  // onboarding
  async onboardingState(): Promise<OnboardingState> { const r = await req("/onboarding/state"); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async completeOnboarding(payload: any): Promise<OnboardingState> { const r = await req("/onboarding/complete", { method:"POST", body: JSON.stringify(payload) }); if(!r.ok) throw new Error(await r.text()); return r.json() },

  // projects
  async listProjects(): Promise<Project[]> { const r = await req("/projects"); if (!r.ok) throw new Error(await r.text()); return r.json() },
  async createProject(input: { title: string; summary?: string }) { const r = await req("/projects", { method:"POST", body: JSON.stringify(input) }); if(!r.ok) throw new Error(await r.text()); return r.json() },

  // AI
  async generateAI(projectId: string) { const r = await req("/ai/plan-budget-roadmap", { method: "POST", body: JSON.stringify({ projectId }) }); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async aiExplain(projectId: string): Promise<{ successScore: number, explain: { inputs: any, components: {label:string,delta:number}[], final: number } }> {
    const r = await req(`/ai/explain/${projectId}`); if(!r.ok) throw new Error(await r.text()); return r.json()
  },

  // tasks / milestones
  async myTasks(){ const r = await req("/tasks/my"); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async updateTask(id: string, data: any){ const r = await req(`/tasks/${id}`, { method:"PATCH", body: JSON.stringify(data) }); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async milestonesByProject(projectId: string){ const r = await req(`/milestones/by-project/${projectId}`); if(!r.ok) throw new Error(await r.text()); return r.json() },

  // investor
  async discovery(){ const r = await req("/investor/discovery"); if(!r.ok) throw new Error(await r.text()); return r.json() as Promise<DiscoveryItem[]> },
  async requestAccess(projectId: string){ const r = await req("/investor/access-requests", { method:"POST", body: JSON.stringify({ projectId }) }); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async listMyAccessRequests(){ const r = await req("/investor/access-requests"); if(!r.ok) throw new Error(await r.text()); return r.json() as Promise<InvestorRequest[]> },
  async getInvestorProject(projectId: string){ const r = await req(`/investor/projects/${projectId}`); if(!r.ok) throw new Error(await r.text()); return r.json() },

  // experts + shortlist
  async searchExperts(q?: { query?: string; category?: string; skill?: string }) {
    const u = new URL(`${BASE}/experts/search`)
    if (q?.query) u.searchParams.set("query", q.query)
    if (q?.category) u.searchParams.set("category", q.category)
    if (q?.skill) u.searchParams.set("skill", q.skill)
    const r = await fetch(u.toString(), { headers: token ? { authorization: `Bearer ${token}` } : {} })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },
  async myShortlistInvites(){ const r = await req("/experts/me/shortlists"); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async respondInvite(id: string, status: "accepted"|"declined"|"hired"){ const r = await req(`/shortlist/shortlists/${id}`, { method:"PATCH", body: JSON.stringify({ status }) }); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async inviteExpert(projectId: string, expertId: string, reason?: string){ const r = await req(`/shortlist/projects/${projectId}/invite`, { method:"POST", body: JSON.stringify({ expertId, reason }) }); if(!r.ok) throw new Error(await r.text()); return r.json() },

  // suppliers + quotes
  async searchSuppliers(q?: { category?: string; location?: string; query?: string }) {
    const u = new URL(`${BASE}/suppliers/search`)
    if (q?.category) u.searchParams.set("category", q.category)
    if (q?.location) u.searchParams.set("location", q.location)
    if (q?.query) u.searchParams.set("q", q.query)
    const r = await fetch(u.toString(), { headers: token ? { authorization: `Bearer ${token}` } : {} })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },
  async suggestSuppliers(projectId: string, category?: string) {
    const u = new URL(`${BASE}/suppliers/suggest/${projectId}`)
    if (category) u.searchParams.set("category", category)
    const r = await fetch(u.toString(), { headers: token ? { authorization: `Bearer ${token}` } : {} })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },
  async sendRFQ(projectId: string, rfq: { quantity: number; materials: string; targetCost?: number; dueDate?: string; notes?: string }, supplierIds: string[]) {
    const r = await req(`/quotes/projects/${projectId}/rfq`, { method: "POST", body: JSON.stringify({ rfq, supplierIds }) })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },
  async listQuotes(projectId: string) { const r = await req(`/quotes/by-project/${projectId}`); if (!r.ok) throw new Error(await r.text()); return r.json() },
  async submitQuote(quoteId: string, quoteJson: { price: number; currency?: string; leadTimeDays: number; notes?: string }) { const r = await req(`/quotes/${quoteId}/submit`, { method: "POST", body: JSON.stringify({ quoteJson }) }); if (!r.ok) throw new Error(await r.text()); return r.json() },
  async updateQuoteStatus(quoteId: string, status: "shortlisted"|"rejected") { const r = await req(`/quotes/${quoteId}`, { method: "PATCH", body: JSON.stringify({ status }) }); if (!r.ok) throw new Error(await r.text()); return r.json() },

  // admin
  async adminListAccessRequests(status?: "requested"|"approved"|"rejected"|"revoked") {
    const u = new URL(`${BASE}/admin/access-requests`)
    if (status) u.searchParams.set("status", status)
    const r = await fetch(u.toString(), { headers: token ? { authorization: `Bearer ${token}` } : {} })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },
  async adminUpdateAccessRequest(id: string, status: "approved"|"rejected"|"revoked") {
    const r = await req(`/admin/access-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },

  // files (handled in previous phases)
  async uploadFile(file: File): Promise<{ url: string; sha256?: string }> {
    const headers: any = {}; if (token) headers["authorization"] = `Bearer ${token}`
    const m = await fetch(`${BASE}/files/mode`, { headers }); const mode = await m.json()
    if (mode.mode === "s3") {
      const p = await fetch(`${BASE}/files/presign`, { method:"POST", headers:{...headers, "content-type":"application/json"}, body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }) })
      if (!p.ok) throw new Error(await p.text())
      const { uploadUrl, headers: upHeaders, key } = await p.json()
      const put = await fetch(uploadUrl, { method: "PUT", headers: upHeaders || { "Content-Type": file.type || "application/octet-stream" }, body: file })
      if (!put.ok) throw new Error(`S3 upload failed: ${put.status}`)
      const c = await fetch(`${BASE}/files/commit`, { method:"POST", headers:{...headers, "content-type":"application/json"}, body: JSON.stringify({ key, filename: file.name, contentType: file.type }) })
      if (!c.ok) throw new Error(await c.text()); return c.json()
    } else {
      const fd = new FormData(); fd.append("file", file)
      const r = await fetch(`${BASE}/files/upload`, { method: "POST", body: fd, headers })
      if (!r.ok) throw new Error(await r.text()); return r.json()
    }
  },

  // messages
  async listMessages(projectId: string): Promise<Message[]> { const r = await req(`/messages/by-project/${projectId}`); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async sendMessage(input: { projectId: string; body?: string; attachments?: string[] }): Promise<Message> { const r = await req(`/messages`, { method:"POST", body: JSON.stringify(input) }); if(!r.ok) throw new Error(await r.text()); return r.json() },
  async searchMessages(projectId: string, opts?: { q?: string; hasAttachments?: boolean; from?: string; to?: string; limit?: number; offset?: number }) {
    const u = new URL(`${BASE}/messages/search`)
    u.searchParams.set("projectId", projectId)
    if (opts?.q) u.searchParams.set("q", opts.q)
    if (opts?.hasAttachments) u.searchParams.set("hasAttachments","true")
    if (opts?.from) u.searchParams.set("from", opts.from)
    if (opts?.to) u.searchParams.set("to", opts.to)
    if (opts?.limit) u.searchParams.set("limit", String(opts.limit))
    if (opts?.offset) u.searchParams.set("offset", String(opts.offset))
    const h: any = token ? { authorization: `Bearer ${token}` } : {}
    const r = await fetch(u.toString(), { headers: h })
    if (!r.ok) throw new Error(await r.text()); return r.json()
  },
  sseUrl(projectId: string) { const t = localStorage.getItem("token") || ""; const u = new URL(`${BASE}/messages/stream/${projectId}`); if (t) u.searchParams.set("token", t); return u.toString() }
}
