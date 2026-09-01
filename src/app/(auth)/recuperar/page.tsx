"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const redirectTo = `${window.location.origin}/auth/callback?next=/restablecer`;
    const { error: recoveryError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (recoveryError) setError("No fue posible enviar el correo. Intenta nuevamente.");
    else setSent(true);
  }

  return (
    <AuthShell><div className="auth-card"><h2>Recuperar acceso</h2><p>Te enviaremos un enlace seguro para definir una contraseña nueva.</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {sent ? <div className="alert alert-success" role="status">Revisa tu correo y abre el enlace de recuperación.</div> : <form onSubmit={submit}><div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><button className="button button-primary" type="submit">Enviar enlace</button></form>}
      <p style={{ marginTop: 22 }}><Link className="auth-link" href="/login">Volver al inicio de sesión</Link></p>
    </div></AuthShell>
  );
}
