import request from "supertest"
import { createServer } from "../src/server"

const app = createServer()
let adminToken = ""
let investorToken = ""

async function login(email:string, password:string){ 
  const r = await request(app).post("/auth/login").send({ email, password })
  return r.body.token
}

beforeAll(async () => {
  adminToken = await login("admin@example.com","password123")
  investorToken = await login("investor@example.com","password123")
})

describe("admin thresholds + access approvals", () => {
  it("reads and writes threshold", async () => {
    const g = await request(app).get("/admin/thresholds").set("authorization",`Bearer ${adminToken}`)
    expect(g.status).toBe(200)
    const v = (g.body?.investorScoreThreshold ?? 70)
    const p = await request(app).patch("/admin/thresholds").set("authorization",`Bearer ${adminToken}`).send({ investorScoreThreshold: v })
    expect(p.status).toBe(200)
  })

  it("investor discovery works", async () => {
    const r = await request(app).get("/investor/discovery").set("authorization",`Bearer ${investorToken}`)
    expect(r.status).toBe(200)
    expect(Array.isArray(r.body)).toBe(true)
  })
})
