-- Permite el alta mínima de participantes de posada.
drop index if exists public.padrinos_email_unique;
create unique index if not exists padrinos_email_unique
  on public.padrinos (lower(email)) where email <> '';

alter table public.padrinos
  drop constraint if exists padrinos_codigo_postal_check;
alter table public.padrinos
  add constraint padrinos_codigo_postal_check
  check (codigo_postal = '' or codigo_postal ~ '^\d{5}$');

alter table public.padrinos
  drop constraint if exists identidad_requerida;
alter table public.padrinos
  add constraint identidad_requerida check (
    (tipo = 'persona' and length(trim(nombres)) > 0 and (tipo_aportacion = 'especie_navidad' or length(trim(apellido_paterno)) > 0))
    or (tipo = 'empresa' and length(trim(razon_social)) > 0)
  );

alter table public.padrinos
  drop constraint if exists contacto_requerido;
alter table public.padrinos
  add constraint contacto_requerido
  check (length(trim(email)) > 0 or length(trim(telefono)) > 0);
