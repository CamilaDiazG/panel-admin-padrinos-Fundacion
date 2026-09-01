"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (!isDemoMode) {
        const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
        if (authError) throw new Error("El correo o la contraseña no son correctos");
      }
      const requestedNext = searchParams.get("siguiente") || "/";
      const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
      router.push(next);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h2>Bienvenido</h2>
        <p>Ingresa con la cuenta administrativa proporcionada por la Fundación.</p>
        {error && <div className="alert" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="email" required={!isDemoMode} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@fundacion.org" /></div>
          <div className="field"><label htmlFor="password">Contraseña</label><input id="password" type="password" autoComplete="current-password" required={!isDemoMode} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></div>
          {!isDemoMode && <Link className="auth-link" href="/recuperar">¿Olvidaste tu contraseña?</Link>}
          <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" /> : <ArrowRight />}{isDemoMode ? "Entrar a la demostración" : "Iniciar sesión"}</button>
        </form>
        {isDemoMode && <div className="demo-callout"><strong>Modo demostración.</strong> No necesitas credenciales. Los cambios se guardarán únicamente en este navegador.</div>}
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
