import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
// Dev mode: if on localhost without valid Clerk key, bypass auth
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const clerkAppearance = {
  variables: {
    colorPrimary: "#c0282a",
    colorBackground: "#161619",
    colorInputBackground: "#1e1e23",
    colorInputText: "#f0eee9",
    colorText: "#f0eee9",
    colorTextSecondary: "#64646a",
    colorNeutral: "#2e2e36",
    borderRadius: "10px",
    fontFamily: "system-ui,sans-serif",
  },
  elements: {
    card: { boxShadow: "none", border: "1px solid #2e2e36" },
    headerTitle: { color: "#f0eee9" },
    headerSubtitle: { color: "#64646a" },
    socialButtonsBlockButton: { borderColor: "#2e2e36", color: "#f0eee9", background: "#1e1e23" },
    dividerLine: { background: "#2e2e36" },
    dividerText: { color: "#64646a" },
    formFieldLabel: { color: "#64646a" },
    footerAction: { color: "#64646a" },
    footerActionLink: { color: "#c0282a" },
    identityPreviewText: { color: "#f0eee9" },
    identityPreviewEditButton: { color: "#c0282a" },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLocalDev ? (
      <App />
    ) : (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={clerkAppearance}
      >
        <App />
      </ClerkProvider>
    )}
  </React.StrictMode>
)
