# Reuniones Zoom dentro de la plataforma

La entrada se realiza desde Clases en vivo > Unirse a la clase > Entrar a la clase.
La portada no es una transmisión automática: cada participante entra a la reunión con su identidad y permisos de Zoom.

## Configuración pendiente

1. Crear/configurar una aplicación Zoom Meeting SDK en la cuenta que organiza las reuniones.
2. Guardar `ZOOM_MEETING_CLIENT_ID` y `ZOOM_MEETING_CLIENT_SECRET` en el entorno privado del API (la raíz del backend carga `.env`). Nunca usar prefijo VITE_ para estos valores ni guardarlos en Git.
3. Configurar la aplicación y sus dominios según Zoom. Para reuniones fuera de la cuenta de la aplicación pueden ser necesarios permisos/autorización adicionales de Zoom.
4. Reiniciar el API.
5. En cada clase, guardar ID de reunión y código de invitados; el parámetro cifrado `pwd` del enlace no sustituye al código de invitados en el SDK.
6. Comprobar con una reunión real de esa cuenta: ingresar como estudiante matriculado, ver al mentor, probar compartir pantalla y salir/volver. Comprobar que un estudiante sin acceso no recibe token.

La integración entra como participante (role 0). El anfitrión inicia desde Zoom. No se implementa inicio como anfitrión ni OAuth/ZAK para cuentas externas.
Se mantiene Abrir en Zoom para configuración pendiente, reuniones con autenticación/registro adicional o incompatibilidades.

## Implementación

- API autenticada POST `/live-sessions/:id/zoom-join`: comprueba el permiso existente can_join_live, rechaza clases finalizadas y firma un JWT HS256 en el servidor.
- Aislamiento del cliente Zoom en `/zoom-meeting.html`: SDK oficial CDN 6.10.0 y sus dependencias, sin alterar React 19 de la plataforma.
- El intercambio de mensajes comprueba origen, ventana y nonce. No se guardan firmas en almacenamiento local ni en URLs.
- Navegar fuera elimina el iframe. Cámara y micrófono requieren los permisos del navegador y de Zoom.

Documentación:
- https://developers.zoom.us/docs/meeting-sdk/web/get-started/
- https://developers.zoom.us/docs/meeting-sdk/auth/
- https://developers.zoom.us/docs/meeting-sdk/web/client-view/meetings-webinars/

No se ha validado una reunión real: faltan las credenciales de la cuenta Zoom.
