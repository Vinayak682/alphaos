import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TickerBar from "@/components/layout/TickerBar";
import PageTransition from "@/components/layout/PageTransition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <TickerBar />
        <main className="flex-1 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
