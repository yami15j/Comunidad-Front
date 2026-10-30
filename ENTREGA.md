# Verificación de entrega — 30 de octubre de 2026

Aplicación: http://localhost:5173. Backend: http://localhost:3000.
La interfaz de esta entrega está en `traction-frontend`; `traction/apps/web` es otra interfaz y no contiene estas mismas seis pantallas.

| Pantalla | Estado comprobado | Condición para uso real |
| --- | --- | --- |
| Dashboard | Inicio del estudiante y sus cursos; probado en integración DOM y con API real | Cuenta con matrícula activa |
| Curso | Listado, apertura y navegación entre programas; corregido historial del navegador | Curso asignado; los cursos vacíos muestran aviso |
| Lección | Lectura, notas, avance y reanudación comprobados con API real | Lecciones publicadas; video requiere archivo cargado |
| Clases en vivo | Calendario, detalle y agenda DEMO disponibles | Ingreso real requiere enlace válido de Zoom; la clase DEMO no tiene reunión |
| Biblioteca | Cursos y recursos publicados; guía privada descargada correctamente desde Supabase | Grabaciones requieren carga y publicación |
| Panel admin | Inicio, lectura de usuarios y currículo comprobados; creación real del curso, módulo, lecciones, recurso, acceso y clase vía API | Cuenta admin; las operaciones afectan la base conectada |

## Recorrido para presentar

1. Abrir `C:/Users/jumbo/Downloads/traction/.env.demo.local` en el editor. Es JSON privado, excluido de Git. `accounts` contiene correo y contraseña de las cuentas `estudiante` y `admin`.
2. Entrar en http://localhost:5173 con la cuenta `estudiante`.
3. Abrir **Mis programas** → **DEMO / PRUEBA — Primeros pasos en Traction** → **Comenzar programa**.
4. Leer la primera lección, descargar **DEMO — Guía de recorrido**, guardar una nota y marcar la lección completada. Continuar a la segunda lección.
5. Abrir **Biblioteca** y **Clases en vivo** desde el menú. La clase DEMO es solo una entrada de agenda, sin reunión real.
6. Cerrar sesión y entrar con la cuenta `admin`. Revisar **Cursos y programas**, **Módulos y lecciones**, **Accesos por programa** y **Clases y grabaciones**.

El curso DEMO tiene 1 módulo, 3 lecciones de texto publicadas, 1 guía descargable y 1 clase programada. Solo se matriculó a la cuenta de estudiante DEMO. Los dos cursos anteriores no se modificaron y siguen sin contenido.

## Evidencia y límites

- Frontend: 23 pruebas aprobadas y compilación de producción correcta.
- Backend: 148 pruebas aprobadas y compilación correcta; el frontend alternativo también compila.
- `tests/deliveryFlow.test.mjs` prueba la aplicación completa con respuestas de API controladas: login → dashboard → curso → lección, historial, cursos vacíos/inexistentes, biblioteca, clases y panel admin.
- `scripts/verify-delivery-demo.mjs`, desde `traction`, comprueba contra la API y Supabase reales: login de ambos roles, matrícula, 3 lecciones, persistencia de nota, progreso, reanudación, descarga de recurso, agenda y lecturas administrativas. Deja la primera lección sin completar para la presentación y conserva una nota de prueba.
- `scripts/seed-delivery-demo.mjs` prepara la demostración y conserva sus identificadores para reutilizarla. Requiere las variables del backend y acceso de red a Supabase. No ejecutar con la intención de crear contenido académico oficial.
- No hay videos ni grabaciones cargados; no se comprobó reproducción de un archivo real. No hay reunión Zoom ni sincronización automática de grabaciones.
- Esta revisión automatizada no constituye aprobación de los prototipos por el responsable de la entrega ni una prueba de usabilidad con una persona sin ayuda. Falta esa validación humana y la revisión visual en navegador/móvil.
- Lint del frontend informa una advertencia preexistente sobre actualización de estado dentro de un efecto; no impide la compilación.

La clave secreta compartida en el chat debe revocarse y sustituirse en el `.env` del backend. Las credenciales de demostración son para pruebas; no publicar `.env.demo.local` ni capturas que muestren contraseñas.
