"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres");
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) return setError("El enlace venció o no fue posible cambiar la contraseña");
    router.push("/");
  }

  return <AuthShell><div className="auth-card"><h2>Nueva contraseña</h2><p>Elige una contraseña de al menos ocho caracteres.</p>{error && <div className="alert" role="alert">{error}</div>}<form onSubmit={submit}><div className="field"><label htmlFor="password">Nueva contraseña</label><input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="field"><label htmlFor="confirm">Confirmar contraseña</label><input id="confirm" type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div><button className="button button-primary" type="submit">Guardar contraseña</button></form></div></AuthShell>;
}
