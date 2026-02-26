-- TrámiteSAT — Esquema de Base de Datos
-- Aplicar en Supabase SQL Editor o con: npx supabase db push
-- Creado: 2026-02-26

-- ══════════════════════════════════════
-- EXTENSIONES REQUERIDAS
-- ══════════════════════════════════════
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ══════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════
create type tipo_contribuyente as enum (
  'asalariado',
  'freelancer',
  'negocio_propio',
  'nuevo_contribuyente'
);

create type plan_usuario as enum (
  'gratuito',
  'pago_por_tramite',
  'anual'
);

create type estado_pago as enum (
  'pendiente',
  'aprobado',
  'rechazado',
  'cancelado',
  'en_proceso'
);

create type tipo_pago as enum (
  'por_tramite',
  'suscripcion_anual'
);

create type tipo_recordatorio as enum (
  'declaracion_anual_abril',
  'iva_mensual',
  'isr_mensual',
  'declaracion_bimestral_resico',
  'renovacion_suscripcion'
);


-- ══════════════════════════════════════
-- FUNCIÓN: actualizar updated_at
-- ══════════════════════════════════════
create or replace function actualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ══════════════════════════════════════
-- TABLA: perfiles
-- ══════════════════════════════════════
create table perfiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  nombre              text,
  tipo_contribuyente  tipo_contribuyente,
  plan                plan_usuario not null default 'gratuito',
  plan_vence_en       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create trigger perfiles_updated_at
  before update on perfiles
  for each row execute function actualizar_updated_at();

create or replace function crear_perfil_nuevo_usuario()
returns trigger as $$
begin
  insert into perfiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();


-- ══════════════════════════════════════
-- TABLA: tramites
-- ══════════════════════════════════════
create table tramites (
  id                  uuid        primary key default uuid_generate_v4(),
  slug                text        not null unique,
  nombre              text        not null,
  descripcion         text        not null,
  descripcion_seo     text        not null,
  categoria           text        not null,
  duracion_minutos    integer     not null default 15,
  requiere_pago       boolean     not null default false,
  activo              boolean     not null default true,
  version_contenido   text        not null,
  ultima_actualizacion date       not null,
  orden_display       integer     not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger tramites_updated_at
  before update on tramites
  for each row execute function actualizar_updated_at();

insert into tramites (slug, nombre, descripcion, descripcion_seo, categoria, duracion_minutos, requiere_pago, version_contenido, ultima_actualizacion, orden_display) values
  ('rfc-persona-fisica', 'RFC', 'Obtén tu Registro Federal de Contribuyentes', 'Cómo sacar el RFC paso a paso. Guía actualizada con capturas del SAT.', 'identidad', 10, false, '2024.3', '2024-10-15', 1),
  ('contrasena-sat', 'Contraseña SAT', 'Crea o recupera tu contraseña del SAT', 'Cómo crear o recuperar la contraseña del SAT. Guía paso a paso.', 'identidad', 8, false, '2024.2', '2024-09-20', 2),
  ('efirma', 'e.firma', 'Tramita tu firma electrónica avanzada', 'Cómo sacar la e.firma del SAT. Requisitos, cita y proceso completo.', 'identidad', 60, true, '2024.1', '2024-08-10', 3),
  ('declaracion-anual', 'Declaración Anual', 'Presenta tu declaración anual como persona física asalariada', 'Cómo hacer la declaración anual del SAT. Guía para asalariados.', 'declaracion', 20, true, '2024.4', '2024-10-30', 4),
  ('cfdi-40', 'Factura (CFDI 4.0)', 'Emite tu primera factura electrónica', 'Cómo emitir una factura CFDI 4.0 en el SAT. Guía para freelancers.', 'facturacion', 15, true, '2024.2', '2024-09-15', 5);


-- ══════════════════════════════════════
-- TABLA: user_progreso
-- ══════════════════════════════════════
create table user_progreso (
  id                         uuid        primary key default uuid_generate_v4(),
  user_id                    uuid        not null references perfiles(id) on delete cascade,
  tramite_id                 uuid        not null references tramites(id),
  tramite_slug               text        not null,
  paso_actual                integer     not null default 1,
  total_pasos                integer     not null,
  completado                 boolean     not null default false,
  completado_en              timestamptz,
  respuestas_diagnostico     jsonb       default '{}',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (user_id, tramite_id)
);

create trigger user_progreso_updated_at
  before update on user_progreso
  for each row execute function actualizar_updated_at();

create index idx_user_progreso_user_id on user_progreso(user_id);
create index idx_user_progreso_completado on user_progreso(user_id, completado);


-- ══════════════════════════════════════
-- TABLA: pagos
-- ══════════════════════════════════════
create table pagos (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references perfiles(id),
  tramite_id          uuid        references tramites(id),
  tramite_slug        text,
  tipo                tipo_pago   not null,
  monto_centavos      integer     not null,
  estado              estado_pago not null default 'pendiente',
  mp_preference_id    text,
  mp_payment_id       text,
  mp_external_ref     text,
  metadata            jsonb       default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger pagos_updated_at
  before update on pagos
  for each row execute function actualizar_updated_at();

create index idx_pagos_user_id on pagos(user_id);
create index idx_pagos_mp_payment_id on pagos(mp_payment_id);
create index idx_pagos_estado on pagos(estado);


-- ══════════════════════════════════════
-- TABLA: tramites_desbloqueados
-- ══════════════════════════════════════
create table tramites_desbloqueados (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references perfiles(id) on delete cascade,
  tramite_id  uuid        not null references tramites(id),
  pago_id     uuid        not null references pagos(id),
  created_at  timestamptz not null default now(),
  unique (user_id, tramite_id)
);

create index idx_tramites_desbloqueados_user on tramites_desbloqueados(user_id);


-- ══════════════════════════════════════
-- TABLA: recordatorios
-- ══════════════════════════════════════
create table recordatorios (
  id                  uuid               primary key default uuid_generate_v4(),
  user_id             uuid               not null references perfiles(id) on delete cascade,
  tipo                tipo_recordatorio  not null,
  fecha_vencimiento   date               not null,
  notificado_30       boolean            not null default false,
  notificado_7        boolean            not null default false,
  notificado_1        boolean            not null default false,
  activo              boolean            not null default true,
  created_at          timestamptz        not null default now(),
  unique (user_id, tipo, fecha_vencimiento)
);

create index idx_recordatorios_user on recordatorios(user_id, activo);
create index idx_recordatorios_fecha on recordatorios(fecha_vencimiento, activo);


-- ══════════════════════════════════════
-- TABLA: push_subscriptions
-- ══════════════════════════════════════
create table push_subscriptions (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references perfiles(id) on delete cascade,
  endpoint    text        not null unique,
  p256dh      text        not null,
  auth        text        not null,
  user_agent  text,
  activa      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_push_subscriptions_user on push_subscriptions(user_id, activa);


-- ══════════════════════════════════════
-- TABLA: rate_limit_log
-- ══════════════════════════════════════
create table rate_limit_log (
  id              uuid        primary key default uuid_generate_v4(),
  identificador   text        not null,
  accion          text        not null,
  created_at      timestamptz not null default now()
);

create index idx_rate_limit_log on rate_limit_log(identificador, accion, created_at);


-- ══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════
alter table perfiles               enable row level security;
alter table tramites               enable row level security;
alter table user_progreso          enable row level security;
alter table pagos                  enable row level security;
alter table tramites_desbloqueados enable row level security;
alter table recordatorios          enable row level security;
alter table push_subscriptions     enable row level security;

-- perfiles
create policy "perfil_select_propio" on perfiles for select using (auth.uid() = id);
create policy "perfil_update_propio" on perfiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- tramites: lectura pública
create policy "tramites_select_publico" on tramites for select using (activo = true);

-- user_progreso
create policy "progreso_select_propio" on user_progreso for select using (auth.uid() = user_id);
create policy "progreso_insert_propio" on user_progreso for insert with check (auth.uid() = user_id);
create policy "progreso_update_propio" on user_progreso for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pagos
create policy "pagos_select_propio" on pagos for select using (auth.uid() = user_id);

-- tramites_desbloqueados
create policy "desbloqueados_select_propio" on tramites_desbloqueados for select using (auth.uid() = user_id);

-- recordatorios
create policy "recordatorios_select_propio" on recordatorios for select using (auth.uid() = user_id);
create policy "recordatorios_insert_propio" on recordatorios for insert with check (auth.uid() = user_id);
create policy "recordatorios_update_propio" on recordatorios for update using (auth.uid() = user_id);

-- push_subscriptions
create policy "push_select_propio" on push_subscriptions for select using (auth.uid() = user_id);
create policy "push_insert_propio" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_update_propio" on push_subscriptions for update using (auth.uid() = user_id);
