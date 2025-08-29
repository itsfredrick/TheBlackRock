from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import math, re

app = FastAPI(title="TheBlackRock AI Service", version="1.1")

class GenerateIn(BaseModel):
    title: str
    summary: str | None = None

class GenerateOut(BaseModel):
    plan: Dict[str, Any]
    budget: Dict[str, Any]
    roadmap: Dict[str, Any]
    successScore: float = Field(ge=0, le=100)
    explain: Dict[str, Any]

DOMAINS = {
    "hardware": ["hardware","iot","device","pcb","firmware","sensor","bluetooth","battery","rf","microcontroller"],
    "software": ["app","saas","platform","api","cloud","mobile","web","frontend","backend","ai","ml"],
    "manufacturing": ["manufactur","factory","supply","supplier","mold","injection","cnc","bom"],
    "medical": ["med","health","clinic","hipaa","fda","iso 13485","iec 60601"],
    "fintech": ["fintech","payment","wallet","pci","bank","kyc","aml"],
    "robotics": ["robot","motor","actuator","servo","lidar","ros"]
}

def detect_domains(text: str) -> List[str]:
    t = text.lower()
    scores = {k:0 for k in DOMAINS}
    for k, kws in DOMAINS.items():
        for w in kws:
            if re.search(r"\b"+re.escape(w)+r"\b", t):
                scores[k]+=1
    return [k for k,v in sorted(scores.items(), key=lambda x:-x[1]) if v>0][:3] or ["software"]

def complexity_factor(text: str) -> float:
    t = text.lower()
    c = 1.0
    for k in ["medical","robotics","manufacturing","hardware"]:
        if k in detect_domains(t): c += 0.4
    if any(x in t for x in ["hipaa","pci","gdpr","fda","iso","iec"]): c += 0.6
    if len(t.split()) > 120: c += 0.2
    return min(c, 3.0)

def risk_penalty(text: str) -> float:
    t = text.lower()
    r = 0.0
    if "novel" in t or "patent" in t: r += 0.1
    if "uncertain" in t or "moonshot" in t: r += 0.2
    if any(x in t for x in ["hardware","manufacturing"]): r += 0.15
    return min(r, 0.5)

def estimate_budget(domains: List[str], complexity: float) -> Dict[str, Any]:
    base = {
        "discovery": 8000,
        "design": 25000,
        "engineering": 45000,
        "prototype": 30000,
        "testing": 12000,
        "launch": 10000
    }
    if "hardware" in domains or "manufacturing" in domains:
        base["prototype"] = 45000
        base["testing"] = 18000
    if "medical" in domains:
        base["compliance"] = 25000
    if "robotics" in domains:
        base["engineering"] += 20000
        base["prototype"] += 15000

    total = sum(base.values()) * complexity
    lines = [{"item": k, "amount": round(v*complexity)} for k,v in base.items()]
    return {"currency":"USD","total": round(total), "lines": lines}

def build_roadmap(domains: List[str], complexity: float) -> Dict[str, Any]:
    months = math.ceil(4*complexity)
    steps = [
        ("Discovery & Requirements","2025-09-01","2025-09-15",["PRD","Risk register"]),
        ("Design & Architecture","2025-09-16","2025-10-05",["Wireframes","System arch"]),
        ("Engineering Sprint 1","2025-10-06","2025-10-31",["Core features"]),
        ("Prototype & Test","2025-11-01","2025-11-30",["Alpha build","Bench tests"]),
        ("Pilot & Feedback","2025-12-01","2025-12-20",["Beta pilot","Report"]),
        ("Launch Prep","2026-01-05","2026-01-20",["GTM checklist"])
    ]
    if "manufacturing" in domains or "hardware" in domains:
        steps.insert(3, ("DFM + Supplier RFQs","2025-10-15","2025-11-05",["BOM","RFQs sent","Shortlist"]))
    if "medical" in domains:
        steps.append(("Compliance File","2026-01-21","2026-02-20",["QMS setup","Pre-sub"]))

    return {"durationMonths": months, "milestones":[
        {"title":t,"start":s,"end":e,"deliverables":d} for (t,s,e,d) in steps
    ]}

def score_success(domains: List[str], complexity: float, text: str) -> tuple[float, Dict[str, Any]]:
    base = 72.0
    components = [{"label":"Base", "delta": +base}]

    def add(label, delta): components.append({"label":label, "delta": delta})

    if "medical" in domains: add("Domain: medical", -8.0); base -= 8.0
    if "robotics" in domains: add("Domain: robotics", -4.0); base -= 4.0
    if "fintech" in domains:  add("Domain: fintech",  -3.0); base -= 3.0

    comp_pen = (complexity - 1.0) * 10.0
    if comp_pen != 0: add(f"Complexity x{complexity:.2f}", -comp_pen); base -= comp_pen

    rpen = risk_penalty(text) * 20.0
    if rpen != 0: add("Declared risk", -rpen); base -= rpen

    unclamped = base
    score = max(30.0, min(92.0, unclamped))
    if score != unclamped:
      add("Clamp to bounds [30..92]", score - unclamped)

    return round(score,1), {
        "inputs": {
            "domains": domains,
            "complexity": round(complexity,2),
            "riskPenalty": round(risk_penalty(text),2)
        },
        "components": components,
        "final": round(score,1)
    }

@app.post("/v1/generate", response_model=GenerateOut)
def generate(inp: GenerateIn):
    text = f"{inp.title}. {inp.summary or ''}"
    domains = detect_domains(text)
    c = complexity_factor(text)
    budget = estimate_budget(domains, c)
    roadmap = build_roadmap(domains, c)
    plan = {
        "domains": domains,
        "assumptions": ["Lean iteration", "Milestone gates", "Vendor shortlists"],
        "team": ["Product","Design","Engineering","Ops"]
    }
    score, explain = score_success(domains, c, text)
    return GenerateOut(plan=plan, budget=budget, roadmap=roadmap, successScore=score, explain=explain)
