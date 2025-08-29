import { createServer } from "./server"

const PORT = Number(process.env.PORT || 4000)
const app = createServer()
app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`)
})
