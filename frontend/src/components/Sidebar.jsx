import {
  Activity,
  Database,
  Fingerprint,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Map,
  Search,
  ShieldCheck
} from "lucide-react";

const navItems = [
  {
    id: "dashboard",
    label: "Command Center",
    icon: LayoutDashboard
  },
  {
    id: "ingestion",
    label: "Department Feeds",
    icon: Database
  },
  {
    id: "resolution",
    label: "Identity Resolution",
    icon: GitBranch
  },
  {
    id: "registry",
    label: "Business Registry",
    icon: Fingerprint
  },
  {
    id: "reviewer",
    label: "Admin Review",
    icon: ShieldCheck
  },
  {
    id: "activity",
    label: "Activity Intelligence",
    icon: Activity
  },
  {
    id: "query",
    label: "Risk & Inspection Query",
    icon: Search
  },
  {
    id: "audit",
    label: "Trust Ledger",
    icon: Gauge
  },
  {
    id: "impact",
    label: "Impact View",
    icon: Map
  }
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">T</div>
        <div>
          <h1>TrustID</h1>
          <p>Karnataka UBID Intelligence</p>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="secure-dot" />
        Admin control active
      </div>
    </aside>
  );
}