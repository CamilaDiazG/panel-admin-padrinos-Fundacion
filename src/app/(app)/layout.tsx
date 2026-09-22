import { AppShell } from "@/components/app-shell";
import { CartasProvider } from "@/components/cartas-provider";
import { DonationsProvider } from "@/components/donativos-provider";
import { PadrinosProvider } from "@/components/padrinos-provider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PadrinosProvider>
      <DonationsProvider>
        <CartasProvider>
          <AppShell>{children}</AppShell>
        </CartasProvider>
      </DonationsProvider>
    </PadrinosProvider>
  );
}
