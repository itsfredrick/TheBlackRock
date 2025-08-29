import request from "supertest"
import { createServer } from "../src/server"

const app = createServer()
let founderToken = ""
let projectId = ""

async function login(email:string, password:string){ 
  const r = await request(app).post("/auth/login").send({ email, password })
  return r.body
}

beforeAll(async () => {
  const f = await login("founder@example.com","password123")
  founderToken = f.token
  const list = await request(app).get("/projects").set("authorization",`Bearer ${founderToken}`)
  projectId = list.body[0]?.id
})

describe("messages basic", () => {
  it("sends and lists", async () => {
    const s = await request(app).post("/messages").set("authorization",`Bearer ${founderToken}`).send({ projectId, body: "hello test" })
    expect(s.status).toBe(201)
    const l = await request(app).get(`/messages/by-project/${projectId}`).set("authorization",`Bearer ${founderToken}`)
    expect(l.status).toBe(200)
    expect(Array.isArray(l.body)).toBe(true)
  })
})
