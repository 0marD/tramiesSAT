# CLAUDE.database.md — Base de Datos

> Lee `CLAUDE.md` primero. Este documento define el esquema completo de Supabase, las Row Level Security policies y los tipos TypeScript correspondientes.

---

## Principios de Base de Datos

- **RLS activado en todas las tablas.** Sin excepción. Si una tabla no tiene RLS, Supabase bloquea todo el acceso por defecto.
- **Nunca usar el service role key en el cliente.** Solo en Server Components y API Routes.
- **Columnas con `_at` son timestamps con zona horaria** (`timestamptz`).
- **Soft delete con `deleted_at`.** Nunca borrar registros de usuarios o pagos. Marcar como eliminados.
- **IDs son UUIDs generados por Supabase.** Nunca exponer IDs secuenciales al cliente.

---

## Esquema Completo SQL

```sql
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
-- TABLA: perfiles
-- Extiende auth.users de Supabase
-- ══════════════════════════════════════
create table perfiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  nombre              text,
  tipo_contribuyente  tipo_contribuyente,
  plan                plan_usuario not null default 'gratuito',
  plan_vence_en       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz  -- soft delete
);

-- Trigger: actualizar updated_at automáticamente
create or replace function actualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger perfiles_updated_at
  before update on perfiles
  for each row execute function actualizar_updated_at();

-- Trigger: crear perfil automáticamente al registrar usuario
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
-- Metadatos de los trámites disponibles.
-- El CONTENIDO (pasos, documentos) vive en /src/content/ como archivos.
-- En DB solo guardamos metadatos y estado de disponibilidad.
-- ══════════════════════════════════════
create table tramites (
  id                  uuid        primary key default uuid_generate_v4(),
  slug                text        not null unique,
  nombre              text        not null,
  descripcion         text        not null,
  descripcion_seo     text        not null,
  categoria           text        not null, -- 'identidad' | 'declaracion' | 'facturacion'
  duracion_minutos    integer     not null default 15,
  requiere_pago       boolean     not null default false,
  activo              boolean     not null default true,
  version_contenido   text        not null, -- '2024.3' para saber cuándo actualizar
  ultima_actualizacion date       not null,
  orden_display       integer     not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger tramites_updated_at
  before update on tramites
  for each row execute function actualizar_updated_at();

-- Datos iniciales
insert into tramites (slug, nombre, descripcion, descripcion_seo, categoria, duracion_minutos, requiere_pago, version_contenido, ultima_actualizacion, orden_display) values
  ('rfc-persona-fisica', 'RFC', 'Obtén tu Registro Federal de Contribuyentes', 'Cómo sacar el RFC paso a paso en 2024. Guía actualizada con capturas del SAT.', 'identidad', 10, false, '2024.3', '2024-10-15', 1),
  ('contrasena-sat', 'Contraseña SAT', 'Crea o recupera tu contraseña del SAT', 'Cómo crear o recuperar la contraseña del SAT. Guía paso a paso actualizada.', 'identidad', 8, false, '2024.2', '2024-09-20', 2),
  ('efirma', 'e.firma', 'Tramita tu firma electrónica avanzada', 'Cómo sacar la e.firma del SAT. Requisitos, cita y proceso completo.', 'identidad', 60, true, '2024.1', '2024-08-10', 3),
  ('declaracion-anual', 'Declaración Anual', 'Presenta tu declaración anual como persona física asalariada', 'Cómo hacer la declaración anual del SAT 2024. Guía para asalariados paso a paso.', 'declaracion', 20, true, '2024.4', '2024-10-30', 4),
  ('cfdi-40', 'Factura (CFDI 4.0)', 'Emite tu primera factura electrónica', 'Cómo emitir una factura CFDI 4.0 en el SAT. Guía para freelancers.', 'facturacion', 15, true, '2024.2', '2024-09-15', 5);


-- ══════════════════════════════════════
-- TABLA: user_progreso
-- Guarda en qué paso quedó el usuario en cada trámite
-- ══════════════════════════════════════
create table user_progreso (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references perfiles(id) on delete cascade,
  tramite_id          uuid        not null references tramites(id),
  tramite_slug        text        not null, -- desnormalizado para queries rápidas
  paso_actual         integer     not null default 1,
  total_pasos         integer     not null,
  completado          boolean     not null default false,
  completado_en       timestamptz,
  respuestas_diagnostico jsonb    default '{}', -- qué respondió en el diagnóstico
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- Un usuario solo puede tener un progreso activo por trámite
  unique (user_id, tramite_id)
);

create trigger user_progreso_updated_at
  before update on user_progreso
  for each row execute function actualizar_updated_at();

create index idx_user_progreso_user_id on user_progreso(user_id);
create index idx_user_progreso_completado on user_progreso(user_id, completado);


-- ══════════════════════════════════════
-- TABLA: pagos
-- Historial de pagos. Nunca borrar registros.
-- ══════════════════════════════════════
create table pagos (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references perfiles(id),
  tramite_id          uuid        references tramites(id), -- null si es suscripción anual
  tramite_slug        text,
  tipo                tipo_pago   not null,
  monto_centavos      integer     not null, -- en centavos para evitar decimales
  estado              estado_pago not null default 'pendiente',
  mp_preference_id    text,       -- ID de preferencia de MercadoPago
  mp_payment_id       text,       -- ID de pago confirmado de MercadoPago
  mp_external_ref     text,       -- referencia externa que enviamos a MP
  metadata            jsonb       default '{}', -- datos extra del pago
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
-- Qué trámites puede ver el usuario sin suscripción anual
-- ══════════════════════════════════════
create table tramites_desbloqueados (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references perfiles(id) on delete cascade,
  tramite_id          uuid        not null references tramites(id),
  pago_id             uuid        not null references pagos(id),
  created_at          timestamptz not null default now(),
  unique (user_id, tramite_id)
);

create index idx_tramites_desbloqueados_user on tramites_desbloqueados(user_id);


-- ══════════════════════════════════════
-- TABLA: recordatorios
-- Fechas de vencimiento por usuario
-- ══════════════════════════════════════
create table recordatorios (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references perfiles(id) on delete cascade,
  tipo                tipo_recordatorio not null,
  fecha_vencimiento   date        not null,
  notificado_30       boolean     not null default false,
  notificado_7        boolean     not null default false,
  notificado_1        boolean     not null default false,
  activo              boolean     not null default true,
  created_at          timestamptz not null default now(),
  unique (user_id, tipo, fecha_vencimiento)
);

create index idx_recordatorios_user on recordatorios(user_id, activo);
create index idx_recordatorios_fecha on recordatorios(fecha_vencimiento, activo);


-- ══════════════════════════════════════
-- TABLA: push_subscriptions
-- Suscripciones Web Push por usuario/dispositivo
-- ══════════════════════════════════════
create table push_subscriptions (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references perfiles(id) on delete cascade,
  endpoint            text        not null unique,
  p256dh              text        not null, -- clave pública
  auth                text        not null, -- secreto de autenticación
  user_agent          text,
  activa              boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_push_subscriptions_user on push_subscriptions(user_id, activa);
```

---

## Row Level Security (RLS) Policies

```sql
-- ══════════════════════════════════════
-- ACTIVAR RLS EN TODAS LAS TABLAS
-- ══════════════════════════════════════
alter table perfiles              enable row level security;
alter table tramites              enable row level security;
alter table user_progreso         enable row level security;
alter table pagos                 enable row level security;
alter table tramites_desbloqueados enable row level security;
alter table recordatorios         enable row level security;
alter table push_subscriptions    enable row level security;


-- ══════════════════════════════════════
-- POLICIES: perfiles
-- ══════════════════════════════════════
-- El usuario solo puede ver y editar su propio perfil
create policy "perfil_select_propio"
  on perfiles for select
  using (auth.uid() = id);

create policy "perfil_update_propio"
  on perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- El perfil se crea automáticamente por el trigger (con service role)
-- No se permite insert manual desde el cliente


-- ══════════════════════════════════════
-- POLICIES: tramites
-- ══════════════════════════════════════
-- Los trámites son públicos (lectura para todos, autenticados o no)
create policy "tramites_select_publico"
  on tramites for select
  using (activo = true);

-- Solo service role puede insertar/actualizar (desde migraciones)


-- ══════════════════════════════════════
-- POLICIES: user_progreso
-- ══════════════════════════════════════
create policy "progreso_select_propio"
  on user_progreso for select
  using (auth.uid() = user_id);

create policy "progreso_insert_propio"
  on user_progreso for insert
  with check (auth.uid() = user_id);

create policy "progreso_update_propio"
  on user_progreso for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ══════════════════════════════════════
-- POLICIES: pagos
-- ══════════════════════════════════════
-- El usuario solo ve sus propios pagos
create policy "pagos_select_propio"
  on pagos for select
  using (auth.uid() = user_id);

-- Los pagos se crean desde el servidor (API Route con service role)
-- El cliente NO puede crear ni modificar pagos directamente


-- ══════════════════════════════════════
-- POLICIES: tramites_desbloqueados
-- ══════════════════════════════════════
create policy "desbloqueados_select_propio"
  on tramites_desbloqueados for select
  using (auth.uid() = user_id);

-- Solo el servidor puede insertar (después de confirmar pago)


-- ══════════════════════════════════════
-- POLICIES: recordatorios
-- ══════════════════════════════════════
create policy "recordatorios_select_propio"
  on recordatorios for select
  using (auth.uid() = user_id);

create policy "recordatorios_insert_propio"
  on recordatorios for insert
  with check (auth.uid() = user_id);

create policy "recordatorios_update_propio"
  on recordatorios for update
  using (auth.uid() = user_id);


-- ══════════════════════════════════════
-- POLICIES: push_subscriptions
-- ══════════════════════════════════════
create policy "push_select_propio"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_insert_propio"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_update_propio"
  on push_subscriptions for update
  using (auth.uid() = user_id);
```

---

## Tipos TypeScript (generados y manuales)

```typescript
// src/types/database.ts
// Este archivo se genera con: npm run db:generate-types
// NO modificar manualmente — se sobreescribe

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          nombre: string | null
          tipo_contribuyente: 'asalariado' | 'freelancer' | 'negocio_propio' | 'nuevo_contribuyente' | null
          plan: 'gratuito' | 'pago_por_tramite' | 'anual'
          plan_vence_en: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['perfiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['perfiles']['Insert']>
      }
      tramites: { ... }
      user_progreso: { ... }
      pagos: { ... }
      tramites_desbloqueados: { ... }
      recordatorios: { ... }
      push_subscriptions: { ... }
    }
  }
}
```

```typescript
// src/types/tramite.ts
// Tipos de dominio (SÍ modificar manualmente según necesidad)

export interface Tramite {
  id: string
  slug: string
  nombre: string
  descripcion: string
  descripcionSeo: string
  categoria: CategoriaTramite
  duracionMinutos: number
  requierePago: boolean
  activo: boolean
  versionContenido: string
  ultimaActualizacion: string
}

export type CategoriaTramite = 'identidad' | 'declaracion' | 'facturacion'

export interface Paso {
  numero: number
  titulo: string
  instruccion: string           // Máximo 1 oración, lenguaje simple
  imagenUrl: string             // Captura del SAT anotada
  imagenAlt: string             // Texto alternativo accesible
  ayuda?: string                // Explicación adicional si el usuario se atora
  advertencia?: string          // Algo que puede salir mal en este paso
}

export interface Documento {
  id: string
  nombre: string                // "CURP impresa o en celular"
  descripcion?: string          // "La puedes descargar en renapo.gob.mx"
  obligatorio: boolean
  urlRecurso?: string           // Si se puede obtener en línea
}

export interface PreguntaDiagnostico {
  id: string
  texto: string
  tipo: 'radio' | 'checkbox'
  opciones: OpcionDiagnostico[]
}

export interface OpcionDiagnostico {
  id: string
  texto: string
  // Qué pasos omitir si el usuario elige esta opción
  omitirPasos?: number[]
}

export interface ContenidoTramite {
  meta: Tramite
  diagnostico: PreguntaDiagnostico[]
  documentos: Documento[]
  pasos: Paso[]
}
```

```typescript
// src/types/usuario.ts

export interface PerfilUsuario {
  id: string
  nombre: string | null
  tipoContribuyente: TipoContribuyente | null
  plan: PlanUsuario
  planVenceEn: Date | null
}

export type TipoContribuyente =
  | 'asalariado'
  | 'freelancer'
  | 'negocio_propio'
  | 'nuevo_contribuyente'

export type PlanUsuario = 'gratuito' | 'pago_por_tramite' | 'anual'

export interface ProgresoTramite {
  tramiteSlug: string
  tramiteNombre: string
  pasoActual: number
  totalPasos: number
  completado: boolean
  completadoEn: Date | null
  updatedAt: Date
}
```

---

## Comandos Útiles de Base de Datos

```bash
# Generar tipos TypeScript desde el esquema de Supabase
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

# Crear nueva migración
npx supabase migration new nombre_de_la_migracion

# Aplicar migraciones en desarrollo local
npx supabase db push

# Resetear DB local (borra todo y aplica desde cero)
npx supabase db reset

# Ver diferencias entre local y producción
npx supabase db diff
```

---

## Reglas de Migración

1. **Nunca modificar una migración ya aplicada.** Crear siempre una nueva migración.
2. **Las migraciones son irreversibles en producción.** Pensar bien antes de borrar columnas.
3. **Soft delete para datos de usuarios.** Agregar `deleted_at` en lugar de `DROP`.
4. **Nombrar migraciones con fecha y descripción:** `20241015_agregar_tabla_recordatorios.sql`
5. **Probar siempre en local antes de aplicar en producción.**
