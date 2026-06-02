import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopNav />
        <main style={{ flex: 1, overflowY: "auto", background: "#FAFAFA" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
