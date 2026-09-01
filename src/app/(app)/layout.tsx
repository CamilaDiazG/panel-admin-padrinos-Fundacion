import { AppShell } from "@/components/app-shell";
import { PadrinosProvider } from "@/components/padrinos-provider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PadrinosProvider>
      <AppShell>{children}</AppShell>
    </PadrinosProvider>
  );
}
