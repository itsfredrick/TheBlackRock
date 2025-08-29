# TheBlackRock AI Service (Phase K)
Runs a small FastAPI microservice to generate plan/budget/roadmap and a heuristic success score.
- Endpoint: `POST /v1/generate { title, summary }`
- Returns: `{ plan, budget, roadmap, successScore }`
