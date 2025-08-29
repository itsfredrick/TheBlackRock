import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import "./styles.css"

import NavRail from "./components/common/NavRail"
import DevAuthBadge from "./components/common/DevAuthBadge"
import OnboardingGate from "./components/common/OnboardingGate"
import RoleAwareHome from "./components/common/RoleAwareHome"

import EntrepreneurHome from "./dashboard/entrepreneur"
import EngineerHome from "./dashboard/engineer"
import InvestorHome from "./dashboard/investor"
import AdminPage from "./dashboard/admin"

import OnboardingPage from "./onboarding"

function AppShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)] text-white">
      <DevAuthBadge />
      <OnboardingGate />
      <div className="flex">
        <NavRail />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard/entrepreneur" element={<EntrepreneurHome />} />
            <Route path="/dashboard/engineer" element={<EngineerHome />} />
            <Route path="/dashboard/investor" element={<InvestorHome />} />
            <Route path="/dashboard/admin" element={<AdminPage />} />
            {/* Role-aware default: */}
            <Route path="/" element={<RoleAwareHome />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
)
