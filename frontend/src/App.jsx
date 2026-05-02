import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Ingestion from "./pages/Ingestion";
import Resolution from "./pages/Resolution";
import Registry from "./pages/Registry";
import Reviewer from "./pages/Reviewer";
import Activity from "./pages/Activity";
import Query from "./pages/Query";
import Audit from "./pages/Audit";
import Impact from "./pages/Impact";

const pages = {
  dashboard: Dashboard,
  ingestion: Ingestion,
  resolution: Resolution,
  registry: Registry,
  reviewer: Reviewer,
  activity: Activity,
  query: Query,
  audit: Audit,
  impact: Impact
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("trustid-theme") || "light";
  });

  const Page = pages[activePage];

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("trustid-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-panel">
        <div className="demo-strip">
          <span>Sandbox Dataset: Bengaluru Industrial Zones</span>
          <span>Systems Connected: 7</span>
          <span>Privacy Mode: Blind Hashing Enabled</span>
          <span>Ledger: Verified</span>
          <span>Role: Admin Officer</span>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
        </div>

        <Page />
      </main>
    </div>
  );
}