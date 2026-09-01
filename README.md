# Panel administrativo de padrinos

Aplicación privada para administrar el padrón de la Fundación Juntos por los Demás A.C. Incluye alta y edición, búsqueda, estados reversibles, importación desde Excel/CSV, tres reportes y exportación a Excel.

## Inicio rápido

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Sin credenciales de Supabase la aplicación usa automáticamente el **modo demostración**. Abre `http://localhost:3000/login`, entra sin contraseña y prueba todas las funciones. Los cambios se conservan en `localStorage` y pueden restaurarse desde el menú lateral.

## Configuración con Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/migrations/202609010001_initial_schema.sql` en el SQL Editor o mediante Supabase CLI.
3. Opcionalmente ejecuta `supabase/seed.sql`; todos sus datos son ficticios.
4. En Authentication crea o invita las cuentas administrativas. La aplicación no ofrece registro público.
5. Copia `.env.example` como `.env.local` y configura:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
NEXT_PUBLIC_DEMO_MODE=false
```

6. Agrega `http://localhost:3000/auth/callback` y la URL equivalente de producción a las Redirect URLs de Authentication.

RLS permite consultar, crear y actualizar únicamente a usuarios autenticados. No existe política de eliminación: las bajas se realizan cambiando el estado a `inactivo`. Las inserciones y modificaciones quedan registradas en `auditoria`.

## Importación

La pantalla `/importar` ofrece una plantilla `.xlsx`. Se aceptan `.xlsx` y `.csv` de hasta 10 MB y 5,000 filas. Los encabezados pueden usar los nombres amigables de la plantilla o las claves del modelo. Las fechas admiten `AAAA-MM-DD` o `DD/MM/AAAA`. Las filas inválidas y los duplicados por correo/RFC se omiten y generan un archivo de incidencias.

## Reportes

La aplicación contiene exactamente tres reportes:

1. Padrón y estatus.
2. Aportaciones comprometidas.
3. Altas y captación.

Los filtros por fecha de alta, estado, tipo y entidad se aplican tanto a la vista como al Excel. Cada exportación contiene las hojas `Resumen` y `Detalle`.

## Comandos de calidad

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright necesita sus navegadores la primera vez: `npx playwright install chromium`.

## Despliegue en Vercel

Importa el repositorio en Vercel, registra las tres variables de entorno anteriores y despliega. Después agrega `https://TU-DOMINIO/auth/callback` a las Redirect URLs de Supabase. Nunca expongas una `service_role` key en Vercel ni en el repositorio.
