-- Panel administrativo de padrinos - esquema inicial
create extension if not exists pgcrypto;

create table if not exists public.padrinos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('persona', 'empresa')),
  nombres text not null default '',
  apellido_paterno text not null default '',
  apellido_materno text not null default '',
  razon_social text not null default '',
  rfc text not null default '',
  contacto_responsable text not null default '',
  email text not null,
  telefono text not null,
  telefono_alterno text not null default '',
  canal_preferido text not null check (canal_preferido in ('whatsapp', 'llamada', 'correo')),
  pais text not null default 'México',
  estado text not null,
  municipio text not null,
  codigo_postal text not null check (codigo_postal ~ '^\d{5}$'),
  colonia text not null default '',
  calle text not null default '',
  numero_exterior text not null default '',
  numero_interior text not null default '',
  fecha_alta date not null default current_date,
  aportacion numeric(12, 2) not null default 0 check (aportacion >= 0),
  periodicidad text not null check (periodicidad in ('unica', 'mensual', 'trimestral', 'semestral', 'anual')),
  metodo_pago text not null check (metodo_pago in ('transferencia', 'tarjeta', 'efectivo', 'deposito', 'otro')),
  origen text not null check (origen in ('recomendacion', 'redes', 'evento', 'empresa', 'sitio_web', 'otro')),
  proximo_seguimiento date,
  observaciones text not null default '',
  estatus text not null default 'pendiente' check (estatus in ('activo', 'pendiente', 'inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  constraint identidad_requerida check (
    (tipo = 'persona' and length(trim(nombres)) > 0 and length(trim(apellido_paterno)) > 0)
    or (tipo = 'empresa' and length(trim(razon_social)) > 0)
  )
);

create unique index if not exists padrinos_email_unique on public.padrinos (lower(email));
create unique index if not exists padrinos_rfc_unique on public.padrinos (upper(rfc)) where rfc <> '';
create index if not exists padrinos_estatus_idx on public.padrinos (estatus);
create index if not exists padrinos_fecha_alta_idx on public.padrinos (fecha_alta desc);
create index if not exists padrinos_estado_idx on public.padrinos (estado);

create table if not exists public.importaciones (
  id uuid primary key default gen_random_uuid(),
  archivo text not null,
  filas_totales integer not null check (filas_totales between 0 and 5000),
  filas_insertadas integer not null default 0,
  filas_rechazadas integer not null default 0,
  incidencias jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);

create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  tabla text not null,
  registro_id uuid not null,
  accion text not null check (accion in ('INSERT', 'UPDATE')),
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);

create or replace function public.actualizar_auditoria_padrinos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at = now();
    new.updated_by = auth.uid();
    insert into public.auditoria(tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    values ('padrinos', new.id, 'UPDATE', to_jsonb(old), to_jsonb(new));
  else
    insert into public.auditoria(tabla, registro_id, accion, datos_nuevos)
    values ('padrinos', new.id, 'INSERT', to_jsonb(new));
  end if;
  return new;
end;
$$;

drop trigger if exists padrinos_auditoria_trigger on public.padrinos;
create trigger padrinos_auditoria_trigger
before insert or update on public.padrinos
for each row execute function public.actualizar_auditoria_padrinos();

alter table public.padrinos enable row level security;
alter table public.importaciones enable row level security;
alter table public.auditoria enable row level security;

create policy "Administradores consultan padrinos" on public.padrinos for select to authenticated using (true);
create policy "Administradores crean padrinos" on public.padrinos for insert to authenticated with check (true);
create policy "Administradores actualizan padrinos" on public.padrinos for update to authenticated using (true) with check (true);
create policy "Administradores consultan importaciones" on public.importaciones for select to authenticated using (true);
create policy "Administradores crean importaciones" on public.importaciones for insert to authenticated with check (true);
create policy "Administradores consultan auditoria" on public.auditoria for select to authenticated using (true);

revoke delete on public.padrinos from authenticated;
revoke delete on public.importaciones from authenticated;
revoke insert, update, delete on public.auditoria from authenticated;
