import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import "./styles.css";

// use ./app/... paths ✅
import NavRail from "./app/components/common/NavRail";
import DevAuthBadge from "./app/components/common/DevAuthBadge";
import OnboardingGate from "./app/components/common/OnboardingGate";
import RoleAwareHome from "./app/components/common/RoleAwareHome";
import RoleBadge from "./app/components/common/RoleBadge";

import EntrepreneurHome from "./app/dashboard/entrepreneur";
import EngineerHome from "./app/dashboard/engineer";
import InvestorHome from "./app/dashboard/investor";
import AdminPage from "./app/dashboard/admin";
import OnboardingPage from "./app/onboarding";

function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)] text-white">
      <DevAuthBadge />
      <OnboardingGate />

      <div className="fixed top-3 right-3 z-50">
        <RoleBadge />
      </div>

      <NavRail activePath={location.pathname} />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard/entrepreneur" element={<EntrepreneurHome />} />
          <Route path="/dashboard/engineer" element={<EngineerHome />} />
          <Route path="/dashboard/investor" element={<InvestorHome />} />
          <Route path="/dashboard/admin" element={<AdminPage />} />
          <Route path="/" element={<RoleAwareHome />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
