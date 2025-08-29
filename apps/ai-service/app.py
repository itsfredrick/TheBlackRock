from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TheBlackRock AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

class PlanReq(BaseModel):
    title: str | None = None
    summary: str | None = None

@app.get("/health")
def health():
    return {"ok": True, "service": "ai"}

@app.post("/plan")
def plan(req: PlanReq):
    title = req.title or "Untitled"
    plan = {
        "workstreams": [
            {"name": "Industrial Design", "milestones": ["Concept", "CMF", "DFM"]},
            {"name": "Engineering", "milestones": ["Architecture", "Prototype", "Validation"]}
        ],
        "tasks": [
            {"title": f"Concept Sketches • {title}", "owner_role": "ID", "estimate_hours": 24}
        ]
    }
    budget = {
        "labor": [{"role": "Industrial Designer", "hours": 120, "rate": 90, "subtotal": 10800}],
        "non_labor": [{"category": "Prototype", "amount": 5000}],
        "contingency_percent": 15, "total": 18170
    }
    roadmap = {
        "milestones": [{"title": "Concept Freeze", "start": "2025-09-01", "end": "2025-09-15", "owner_user_id": ""}],
        "critical_path": ["Concept Freeze", "Prototype Build", "User Test"]
    }
    success = {"score": 70}
    return {"plan": plan, "budget": budget, "roadmap": roadmap, "success": success}
