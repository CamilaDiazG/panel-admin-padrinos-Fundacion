-- Se conserva como migración portable si finalmente se utiliza Supabase.
-- En Oracle, estas mismas reglas deben reflejarse en la tabla de padrinos.
alter table public.padrinos
  add column if not exists tipo_aportacion text not null default 'monetaria';

alter table public.padrinos
  drop constraint if exists padrinos_tipo_aportacion_check;

alter table public.padrinos
  add constraint padrinos_tipo_aportacion_check
  check (tipo_aportacion in ('monetaria', 'especie_navidad'));

alter table public.padrinos
  drop constraint if exists padrinos_origen_check;

alter table public.padrinos
  add constraint padrinos_origen_check
  check (origen in ('recomendacion', 'redes', 'evento', 'empresa', 'empleado_fundacion', 'sitio_web', 'otro'));

create index if not exists padrinos_tipo_aportacion_idx
  on public.padrinos (tipo_aportacion);
