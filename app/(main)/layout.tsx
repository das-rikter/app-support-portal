import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarUserInfo } from "@/components/layout/SidebarUserInfo";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userPanel={<SidebarUserInfo />} />
      <main className="flex-1 overflow-y-auto px-6 pb-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
