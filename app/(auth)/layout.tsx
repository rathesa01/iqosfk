export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="from-background via-background to-muted/40 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      {children}
    </main>
  );
}
