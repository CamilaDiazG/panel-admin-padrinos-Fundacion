import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel de Padrinos | Juntos por los Demás",
  description: "Administración y reportes de padrinos de la Fundación Juntos por los Demás A.C.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
