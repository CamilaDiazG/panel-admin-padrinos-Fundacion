import { AppShell } from "@/components/app-shell";
import { DonationsProvider } from "@/components/donativos-provider";
import { PadrinosProvider } from "@/components/padrinos-provider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PadrinosProvider>
      <DonationsProvider>
        <AppShell>{children}</AppShell>
      </DonationsProvider>
    </PadrinosProvider>
  );
}
