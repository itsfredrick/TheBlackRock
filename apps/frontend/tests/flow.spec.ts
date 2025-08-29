import { test, expect, request as pwrequest } from '@playwright/test'

const BACK = 'http://localhost:4000' // backend API
const FRONT = 'http://localhost:5173' // vite dev

async function apiLogin(request: pwrequest.APIRequestContext, email: string, password: string) {
  const r = await request.post(`${BACK}/auth/login`, { data: { email, password } })
  expect(r.ok()).toBeTruthy()
  const { token, user } = await r.json()
  return { token, user }
}

async function setLocalStorageAuth(page, token: string, userId: string) {
  await page.addInitScript(([t, uid]) => {
    localStorage.setItem('token', t as string)
    localStorage.setItem('userId', uid as string)
  }, [token, userId])
}

test('end-to-end: founder→expert→supplier→admin→investor', async ({ page, request }) => {
  // 1) Founder login (via API) and ensure a project exists
  const founder = await apiLogin(request, 'founder@example.com', 'password123')
  const pList = await request.get(`${BACK}/projects`, { headers: { authorization: `Bearer ${founder.token}` } })
  let projects = await pList.json()
  let projectId = projects[0]?.id
  if (!projectId) {
    const created = await request.post(`${BACK}/projects`, {
      headers: { authorization: `Bearer ${founder.token}`, 'content-type': 'application/json' },
      data: { title: "E2E Test Project", summary: "robotics iot hardware prototype" }
    })
    const pj = await created.json(); projectId = pj.id
  }

  // 2) Founder runs AI to create plan + score
  await request.post(`${BACK}/ai/plan-budget-roadmap`, {
    headers: { authorization: `Bearer ${founder.token}`, 'content-type':'application/json' },
    data: { projectId }
  })

  // 3) Founder invites an expert (pick first search result)
  const experts = await request.get(`${BACK}/experts/search`, { headers: { authorization: `Bearer ${founder.token}` } })
  const exRows = await experts.json()
  const expertId = exRows[0]?.id
  expect(expertId).toBeTruthy()
  const invite = await request.post(`${BACK}/shortlist/projects/${projectId}/invite`, {
    headers: { authorization: `Bearer ${founder.token}`, 'content-type':'application/json' },
    data: { expertId }
  })
  const inv = await invite.json()
  const shortlistId = inv?.id || inv?.shortlistId

  // 4) Expert accepts invite
  const expert = await apiLogin(request, 'expert@example.com', 'password123')
  await request.patch(`${BACK}/shortlist/shortlists/${shortlistId}`, {
    headers: { authorization: `Bearer ${expert.token}`, 'content-type':'application/json' },
    data: { status: "accepted" }
  })

  // 5) Founder sends an RFQ to suggested suppliers
  const sugg = await request.get(`${BACK}/suppliers/suggest/${projectId}`, { headers: { authorization: `Bearer ${founder.token}` } })
  const suggested = await sugg.json()
  const supplierIds = (suggested?.slice(0,2)?.map((s:any)=>s.id)) || []
  expect(supplierIds.length).toBeGreaterThan(0)
  const rfq = await request.post(`${BACK}/quotes/projects/${projectId}/rfq`, {
    headers: { authorization: `Bearer ${founder.token}`, 'content-type':'application/json' },
    data: {
      rfq: { quantity: 1000, materials: "ABS, FR4", targetCost: 12.5, dueDate: "2025-10-15", notes: "e2e" },
      supplierIds
    }
  })
  expect(rfq.ok()).toBeTruthy()

  // 6) Simulate supplier submitting a quote (API allows mock submit)
  const quotes = await request.get(`${BACK}/quotes/by-project/${projectId}`, { headers: { authorization: `Bearer ${founder.token}` } })
  const qrows = await quotes.json()
  expect(qrows.length).toBeGreaterThan(0)
  const qid = qrows[0].id
  await request.post(`${BACK}/quotes/${qid}/submit`, {
    headers: { authorization: `Bearer ${founder.token}`, 'content-type':'application/json' },
    data: { quoteJson: { price: 9.8, currency: "USD", leadTimeDays: 21, notes: "mock" } }
  })

  // 7) Founder shortlists the quote
  await request.patch(`${BACK}/quotes/${qid}`, {
    headers: { authorization: `Bearer ${founder.token}`, 'content-type':'application/json' },
    data: { status: "shortlisted" }
  })

  // 8) Investor requests access; Admin approves; Investor sees project
  const investor = await apiLogin(request, 'investor@example.com', 'password123')
  await request.post(`${BACK}/investor/access-requests`, {
    headers: { authorization: `Bearer ${investor.token}`, 'content-type':'application/json' },
    data: { projectId }
  })
  const admin = await apiLogin(request, 'admin@example.com', 'password123')
  const ar = await request.get(`${BACK}/admin/access-requests`, { headers: { authorization: `Bearer ${admin.token}` } })
  const arList = await ar.json()
  const reqId = arList.find((r:any)=>r.project?.id===projectId)?.id
  expect(reqId).toBeTruthy()
  await request.patch(`${BACK}/admin/access-requests/${reqId}`, {
    headers: { authorization: `Bearer ${admin.token}`, 'content-type':'application/json' },
    data: { status: "approved" }
  })

  // 9) UI checks: founder dashboard shows Explain card; quotes table visible
  await setLocalStorageAuth(page, founder.token, founder.user.id)
  await page.goto(`${FRONT}/dashboard/entrepreneur`)
  await expect(page.getByText(/AI Scoring — Why this number\?/i)).toBeVisible()
  await expect(page.getByText(/Quotes/i)).toBeVisible()

  // 10) UI check: investor dashboard loads
  await page.context().clearCookies()
  const p2 = await page.context().newPage()
  await setLocalStorageAuth(p2, investor.token, investor.user.id)
  await p2.goto(`${FRONT}/dashboard/investor`)
  await expect(p2.getByText(/Discovery|Dealroom|Access/i)).toBeVisible()
})
