# Verificación de autenticación y roles

Verificado el 11 de noviembre de 2026.

## Registro e inicio de sesión

El administrador registra cuentas desde **Usuarios y permisos → Registrar usuario** y asigna el rol inicial. No existe registro público ni selección de rol al iniciar sesión. Las cuentas se guardan en Supabase Auth y sus perfiles en `iam.profiles`.

El login comprueba correo y contraseña; al restaurar la sesión se vuelve a consultar el perfil autenticado. El rol autorizado procede de la base de datos, no del almacenamiento del navegador ni del rol declarado dentro del token.

## Permisos

| Rol | Acceso |
| --- | --- |
| Estudiante | Sus cursos con matrícula vigente, progreso, comunidad, mentor asignado y sus tickets |
| Mentor | Cursos asignados, contenido y estudiantes autorizados, comunidad y mensajes con sus estudiantes |
| Administrador | Registro de usuarios, roles, cursos y accesos; supervisión de soporte de solo lectura |
| Soporte | Perfil, tickets disponibles o propios y notificaciones de soporte; sin administración de usuarios ni acceso académico |

## Comprobaciones realizadas

- Registro administrativo e inicio de sesión real con los cuatro roles usando cuentas temporales en Supabase.
- Consulta del perfil con un token real por cada rol.
- Solicitudes sin token, token malformado o contraseña incorrecta: HTTP 401.
- Intentos de administrar usuarios desde estudiante, mentor y soporte: HTTP 403.
- Intentos de elevar el propio rol mediante edición de perfil: rol sin cambios.
- Acceso a cursos desde soporte y a tickets desde mentor: HTTP 403.
- Acceso de estudiante y mentor a URL administrativa en el frontend: redirección a su panel autorizado.
- Tokens firmados: validación de firma, emisor, audiencia y vencimiento; el rol del token no reemplaza el perfil.
- Pruebas existentes de autorización por curso, matrícula, ticket y conversación.

Resultado: 238 pruebas de backend y 46 de frontend aprobadas. Ambas aplicaciones compilan. La prueba real eliminó únicamente sus cuentas temporales al terminar.

## Repetir la verificación

Frontend: `npm.cmd test` y `npm.cmd run build`.

Desde la raíz del backend:

```powershell
npm.cmd test --workspace apps/api
npm.cmd run build --workspace apps/api
node scripts/verify-auth-roles.mjs
```

El último comando requiere la configuración privada del backend y conectividad a Supabase. Crea cuentas temporales identificadas como prueba, usa una API en un puerto libre y las elimina al finalizar. No modifica cuentas existentes ni muestra contraseñas o tokens.
