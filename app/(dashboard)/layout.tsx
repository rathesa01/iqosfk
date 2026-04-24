import { requireUser, getCurrentProfile } from '@/lib/utils/auth';
import { SidebarNav, MobileBottomNav } from '@/components/layouts/sidebar-nav';
import { Topbar } from '@/components/layouts/topbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-4 font-semibold">IQOS CRM</div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="text-muted-foreground border-t px-4 py-3 text-xs">
          v0.1 · Asia/Bangkok
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={profile?.email ?? user.email ?? ''}
          fullName={profile?.fullName}
          role={profile?.role}
        />
        <main className="flex-1 px-3 pb-20 pt-4 md:px-6 md:pb-6">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
