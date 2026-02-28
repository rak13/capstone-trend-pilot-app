import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme before first render to avoid flash
const saved = localStorage.getItem("trendpilot-theme");
try {
  const parsed = JSON.parse(saved ?? "{}");
  if (parsed?.state?.theme === "light") {
    document.documentElement.classList.add("light");
  }
} catch {
  // ignore — default dark
}

createRoot(document.getElementById("root")!).render(<App />);
