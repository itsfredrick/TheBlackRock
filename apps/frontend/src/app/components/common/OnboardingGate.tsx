import { useEffect, useState } from "react"
import { api } from "../../utils/api"

// Usage: place <OnboardingGate /> high in your app layout after login is established.
// It will redirect to /onboarding if the profile isn't complete yet.

export default function OnboardingGate() {
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    (async () => {
      try {
        const s = await api.onboardingState()
        if (!s.complete && s.role !== "admin") {
          if (!location.pathname.startsWith("/onboarding")) {
            window.location.href = "/onboarding"
          }
        }
      } finally {
        setChecked(true)
      }
    })()
  }, [])
  return checked ? null : null
}
