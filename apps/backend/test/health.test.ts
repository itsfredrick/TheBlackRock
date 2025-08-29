import request from "supertest"
import { createServer } from "../src/server"

const app = createServer()

describe("health", () => {
  it("returns ok", async () => {
    const r = await request(app).get("/health")
    expect(r.status).toBe(200)
    expect(r.body.ok).toBe(true)
  })
})
