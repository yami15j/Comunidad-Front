import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { createServer } from "vite";

test("the Tailwind redesign preserves login, role navigation, course filtering, profile saving and dialog keyboard controls", async (t) => {
  const window = new Window({ url: "http://localhost:5173/" });
  const saved = new Map();
  for (const [key, value] of Object.entries({
    window,
    document: window.document,
    localStorage: window.localStorage,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLSelectElement: window.HTMLSelectElement,
    Node: window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const server = await createServer({
    cacheDir: "node_modules/.vite-tests/design-interactions",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: "custom",
  });
  const container = window.document.createElement("div");
  window.document.body.append(container);
  const root = createRoot(container);
  const mount = (Component, props) =>
    React.act(async () => root.render(React.createElement(Component, props)));
  const button = (text) =>
    [...window.document.body.querySelectorAll("button")].find((node) =>
      node.textContent.includes(text),
    );
  const click = (node) =>
    React.act(async () => {
      assert.ok(node, "expected control exists");
      node.click();
    });
  async function input(node, value) {
    await React.act(async () => {
      const prototype =
        node.tagName === "SELECT"
          ? window.HTMLSelectElement.prototype
          : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
      node.dispatchEvent(
        new window.Event(node.tagName === "SELECT" ? "change" : "input", {
          bubbles: true,
        }),
      );
    });
  }
  try {
    await t.test('support can create reusable labels and custom states', async () => {
      const { TicketOptionsDialog } = await server.ssrLoadModule('/src/components/TicketOptionsDialog.jsx');
      const created = [];
      await mount(TicketOptionsDialog, { open: true, onClose() {}, options: [], onCreate: async option => created.push(option) });
      assert.equal(document.querySelector('[role="dialog"]'), null, 'configuration renders as a page instead of an overlay');
      assert.ok(button('Volver a tickets'));
      await input(document.querySelector('[aria-label="Nueva etiqueta"]'), 'Inscripciones');
      await React.act(async () => document.querySelector('[aria-label="Nueva etiqueta"]').closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      await click(button('Mis estados'));
      await input(document.querySelector('[aria-label="Estado personalizado"]'), 'Esperando respuesta');
      await React.act(async () => document.querySelector('[aria-label="Estado personalizado"]').closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.deepEqual(created, [{ kind: 'label', name: 'Inscripciones' }, { kind: 'status', name: 'Esperando respuesta' }]);
      assert.equal(document.querySelector('[aria-label="Estado personalizado"]').value, '');
      await mount(() => null, {});
    });
    await t.test('mentor progress tables filter actual enrollments and distinguish empty courses from completed learning', async () => {
      const { MentorProgressTables } = await server.ssrLoadModule('/src/components/MentorProgressTables.jsx');
      await mount(MentorProgressTables, { courses: [
        { id: 'one', title: 'Auditoría', totalLessonsCount: 2, totalModulesCount: 1, activeStudents: 1, averageProgress: 50 },
        { id: 'empty', title: 'Curso nuevo', totalLessonsCount: 0 },
      ], students: [
        { id: 'ana', fullName: 'Ana López', courseId: 'one', courseTitle: 'Auditoría', completedLessons: 2, totalLessons: 2, progressPercent: 100 },
        { id: 'ana', fullName: 'Ana López', courseId: 'empty', courseTitle: 'Curso nuevo', completedLessons: 0, totalLessons: 0, progressPercent: 0 },
        { id: 'bea', fullName: 'Beatriz', courseId: 'one', courseTitle: 'Auditoría', completedLessons: 0, totalLessons: 2, progressPercent: 0 },
      ] });
      const table = () => container.querySelector('table[aria-label="Progreso de estudiantes"]');
      assert.equal(table().querySelectorAll('tbody tr').length, 3);
      assert.match(table().textContent, /Completado/);
      assert.match(table().textContent, /Sin lecciones/);
      await input(container.querySelector('[aria-label="Buscar estudiante"]'), 'ana');
      assert.equal(table().querySelectorAll('tbody tr').length, 2);
      await input(container.querySelector('[aria-label="Filtrar estudiantes por curso"]'), 'one');
      assert.equal(table().querySelectorAll('tbody tr').length, 1);
      assert.match(table().textContent, /100%/);
      await input(container.querySelector('[aria-label="Buscar estudiante"]'), 'sin coincidencias');
      assert.match(table().textContent, /No hay estudiantes que coincidan/);
      await React.act(async () => root.render(null));
    });
    await t.test('recovery requires matching passwords before changing the verified account password', async () => {
      const { PasswordRecoveryView, readPasswordRecovery } = await server.ssrLoadModule('/src/views/PasswordRecoveryView.jsx');
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const recovery = readPasswordRecovery({ pathname: '/recuperar-contrasena', search: '?challenge=' + 'a'.repeat(64), hash: '#type=recovery&access_token=test-token' });
      let updated;
      api.resetPassword = async (token, password, challenge) => { updated = { token, password, challenge }; };
      await mount(PasswordRecoveryView, { recovery, onDone: () => {} });
      let fields = container.querySelectorAll('input');
      await input(fields[0], 'new-password'); await input(fields[1], 'different-password');
      await React.act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(updated, undefined);
      assert.match(container.textContent, /no coinciden/);
      await input(fields[1], 'new-password');
      await React.act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.deepEqual(updated, { token: 'test-token', password: 'new-password', challenge: 'a'.repeat(64) });
      assert.match(container.textContent, /Contraseña actualizada/);
      await React.act(async () => root.render(null));
    });
    await t.test('forgot password sends the entered email and shows the recovery confirmation', async () => {
      const { LoginView } = await server.ssrLoadModule('/src/views/LoginView.jsx');
      let requested;
      await mount(LoginView, { onLogin: async () => {}, onRecover: async email => { requested = email; return { message: 'Si el correo está registrado, recibirás un enlace.' }; } });
      await click(button('¿Olvidaste tu contraseña?'));
      const dialog = document.querySelector('[role="dialog"]');
      await input(dialog.querySelector('input[type="email"]'), 'user@example.com');
      await React.act(async () => dialog.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(requested, 'user@example.com');
      assert.match(dialog.textContent, /recibirás un enlace/);
      await React.act(async () => root.render(null));
    });
    await t.test('administrator supervises all tickets and conversations without editing controls', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { TicketsView } = await server.ssrLoadModule('/src/views/TicketsView.jsx');
      api.tickets.list = async () => [{ id: 'supervised', subject: 'Student request', student_id: 'student', student_name: 'Ana Student', agent_name: 'Agent Maria', assigned_to: 'other-agent', status: 'in_progress', created_at: '2026-11-05T12:00:00Z' }];
      api.tickets.messages = async () => [{ id: 'message', sender_id: 'student', sender_name: 'Ana Student', body: 'Conversation to supervise', created_at: '2026-11-05T12:00:00Z' }];
      await mount(TicketsView, { user: { id: 'admin', role: 'admin' } });
      assert.ok(container.querySelector('input[aria-label="Buscar tickets"]'));
      await click(button('Student request'));
      assert.match(container.textContent, /Responsable: Soporte/);
      assert.match(container.textContent, /Conversation to supervise/);
      assert.equal(container.querySelector('.ticket-reply'), null);
      assert.equal(container.querySelector('.ticket-create'), null);
      assert.equal(container.querySelector('.ticket-delete'), null);
      assert.equal(button('Marcar como resuelto'), undefined);
      assert.equal(button('Tomar ticket'), undefined);
      await React.act(async () => root.render(null));
    });
    await t.test('support receives notifications and refreshes when the tab becomes visible', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { useNotifications } = await server.ssrLoadModule('/src/hooks/useNotifications.js');
      let calls = 0;
      api.notifications.list = async () => { calls++; return [{ id: 'support:ticket:message', title: 'Student replied', read: false }]; };
      function Inbox() {
        const { notifications } = useNotifications('agent', 'soporte', true);
        return React.createElement('p', null, notifications.map(item => item.title).join(','));
      }
      await mount(Inbox, {});
      assert.match(container.textContent, /Student replied/);
      const before = calls;
      await React.act(async () => document.dispatchEvent(new window.Event('visibilitychange')));
      assert.ok(calls > before);
      await React.act(async () => root.render(null));
    });
    await t.test('notification bubble shows new arrivals once and opens the notification center', async () => {
      const { NotificationBell } = await server.ssrLoadModule('/src/components/NotificationBell.jsx');
      let opened = 0;
      const first = { id: 'first', title: 'New support reply', read: false };
      const props = { userId: 'student', notifications: [first], unreadCount: 1, onOpen: () => { opened++; } };
      await mount(NotificationBell, props);
      assert.match(container.querySelector('[role="status"]').textContent, /New support reply/);
      await click(container.querySelector('button[aria-label="Cerrar aviso de notificación"]'));
      await mount(NotificationBell, { ...props, notifications: [{ ...first }] });
      assert.equal(container.querySelector('[role="status"]'), null);
      await mount(NotificationBell, { ...props, notifications: [{ id: 'second', title: 'Case resolved', read: false }, first], unreadCount: 2 });
      assert.match(container.querySelector('[role="status"]').textContent, /Case resolved/);
      await click(button('Pulsa para ver tus avisos'));
      assert.equal(opened, 1);
      assert.equal(container.querySelector('[role="status"]'), null);
      await mount(NotificationBell, { ...props, userId: 'other', notifications: [] });
      assert.equal(container.querySelector('[role="status"]'), null);
      await React.act(async () => root.render(null));
    });
    await t.test('a student notification opens its own saved ticket conversation', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { TicketsView } = await server.ssrLoadModule('/src/views/TicketsView.jsx');
      api.tickets.list = async () => [{ id: 'target', subject: 'My support case', student_id: 'student', status: 'in_progress', created_at: '2026-11-05T12:00:00Z' }];
      api.tickets.messages = async id => { assert.equal(id, 'target'); return [{ id: 'reply', sender_id: 'agent', body: 'Support reply', created_at: '2026-11-05T12:00:00Z' }]; };
      await mount(TicketsView, { user: { id: 'student', role: 'student' }, initialTicketId: 'target' });
      assert.match(container.querySelector('.ticket-conversation').textContent, /Support reply/);
      await React.act(async () => root.render(null));
    });
    await t.test('support filters tickets, persists labels, and resolves while retaining a read-only conversation', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { TicketsView } = await server.ssrLoadModule('/src/views/TicketsView.jsx');
      let rows = [
        { id: 'pending', subject: 'Access problem', status: 'in_progress', assigned_to: 'agent', student_id: 'student', labels: [], created_at: '2026-11-05T12:00:00Z' },
        { id: 'done', subject: 'Previous case', status: 'resolved', assigned_to: 'agent', student_id: 'student', labels: ['Courses'], created_at: '2026-11-04T12:00:00Z' },
      ];
      api.tickets.list = async () => rows;
      api.tickets.messages = async () => [{ id: 'message', sender_id: 'student', sender_name: 'Student', body: 'Saved conversation', created_at: '2026-11-05T12:00:00Z' }];
      const labelWrites = [];
      api.tickets.labels = async (id, labels) => { labelWrites.push({ id, labels }); rows = rows.map(row => row.id === id ? { ...row, labels } : row); return rows.find(row => row.id === id); };
      api.tickets.resolve = async id => { rows = rows.map(row => row.id === id ? { ...row, status: 'resolved' } : row); return rows.find(row => row.id === id); };
      await mount(TicketsView, { user: { id: 'agent', role: 'soporte' } });
      assert.ok(button('Access problem'));
      assert.equal(button('Previous case'), undefined);
      await click(button('Access problem'));
      assert.equal(container.querySelector('.support-table-card'), null);
      assert.equal(container.querySelector('input[aria-label="Buscar tickets"]'), null);
      assert.ok(button('Volver a tickets'));
      assert.match(container.textContent, /Saved conversation/);
      await click(button('Etiquetar'));
      await input(document.querySelector('[role="dialog"] input'), 'Access, Urgent');
      await React.act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.deepEqual(JSON.parse(JSON.stringify(labelWrites)), [{ id: 'pending', labels: ['Access', 'Urgent'] }]);
      await click(button('Marcar como resuelto'));
      assert.equal(document.querySelector('.ticket-reply'), null);
      assert.match(container.textContent, /Saved conversation/);
      await click(button('Volver a tickets'));
      assert.ok(container.querySelector('.support-table-card'));
      await click(button('Resueltos'));
      assert.ok(button('Previous case'));
      assert.ok(button('Access problem'));
      await React.act(async () => root.render(null));
    });
    await t.test('support resolves from the table without opening the chat', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { TicketsView } = await server.ssrLoadModule('/src/views/TicketsView.jsx');
      let ticket = { id: 'quick', subject: 'Quick case', status: 'open', assigned_to: null, student_id: 'student', created_at: '2026-11-05T12:00:00Z' };
      const calls = [];
      api.tickets.list = async () => [ticket];
      api.tickets.setStatus = async (id, status) => { calls.push([id, status]); ticket = { ...ticket, assigned_to: 'agent', status }; return ticket; };
      await mount(TicketsView, { user: { id: 'agent', role: 'soporte' } });
      const select = container.querySelector('select[aria-label="Cambiar estado: Quick case"]');
      await React.act(async () => { select.value = 'resolved'; select.dispatchEvent(new window.Event('change', { bubbles: true })); });
      assert.deepEqual(calls, [['quick', 'resolved']]);
      assert.ok(container.querySelector('.support-table-card'));
      assert.equal(button('Volver a tickets'), undefined);
      await click(button('Resueltos'));
      assert.ok(button('Quick case'));
      const reopen = container.querySelector('select[aria-label="Cambiar estado: Quick case"]');
      await React.act(async () => { reopen.value = 'open'; reopen.dispatchEvent(new window.Event('change', { bubbles: true })); });
      assert.deepEqual(calls, [['quick', 'resolved'], ['quick', 'open']]);
      await click(button('Pendientes'));
      assert.ok(button('Quick case'));
      await React.act(async () => root.render(null));
    });
    await t.test('admin stages role and mentor edits until Save and can cancel drafts', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      api.administration.access = async () => ({ items: [], total: 0 });
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const writes = [];
      await mount(AdminView, { currentView: 'admin-users', currentUserId: 'admin', courses: [], liveClasses: [], mentors: [],
        users: [{ id: 'student', fullName: 'Student', email: 'student@example.com', role: 'estudiante' }, { id: 'mentor', fullName: 'Mentor', email: 'mentor@example.com', role: 'mentor' }],
        onAssignMentor: async (...args) => writes.push(['mentor', ...args]), onUpdateUserRole: async (...args) => writes.push(['role', ...args]) });
      const choose = async (selector, value) => React.act(async () => { const field = container.querySelector(selector); field.value = value; field.dispatchEvent(new window.Event('change', { bubbles: true })); });
      await choose('select[aria-label="Mentor de Student"]', 'mentor');
      assert.deepEqual(writes, []);
      await click(button('Guardar'));
      assert.deepEqual(writes, [['mentor', 'student', 'mentor']]);
      const role = container.querySelector('tbody tr select');
      await React.act(async () => { role.value = 'soporte'; role.dispatchEvent(new window.Event('change', { bubbles: true })); });
      assert.equal(writes.length, 1);
      await click(button('Cancelar'));
      assert.equal(container.querySelector('tbody tr select').value, 'estudiante');
      await React.act(async () => { const field = container.querySelector('tbody tr select'); field.value = 'soporte'; field.dispatchEvent(new window.Event('change', { bubbles: true })); });
      await click(button('Guardar'));
      assert.deepEqual(writes[1], ['role', 'student', 'soporte']);
      await React.act(async () => root.render(null));
    });
    await t.test('saved lesson details expose persisted text, video link and resource URLs', async () => {
      await React.act(async () => root.render(null));
      const { SavedLessonDetails } = await server.ssrLoadModule('/src/components/SavedLessonDetails.jsx');
      const props = { lesson: { id: 'saved', title: 'Leccion', summary: 'Resumen guardado', content_text: 'Texto completo guardado', video_id: 'video', resources: [{ id: 'resource', title: 'Documento guardado', external_url: 'https://example.com/material.pdf', is_published: true }] }, video: { id: 'video', title: 'Grabacion guardada', external_url: 'https://vimeo.com/12345' } };
      await mount(SavedLessonDetails, props);
      assert.match(container.textContent, /Resumen guardado/);
      assert.match(container.textContent, /Texto completo guardado/);
      assert.equal(container.querySelector('a[href="https://vimeo.com/12345"]').textContent, 'https://vimeo.com/12345');
      assert.ok(container.querySelector('a[href="https://example.com/material.pdf"]'));
      await React.act(async () => root.render(null));
      await mount(SavedLessonDetails, props);
      assert.match(container.textContent, /Documento guardado/);
      await React.act(async () => root.render(null));
    });
    await t.test('lesson video selector loads published recordings and saves the selected video ID', async () => {
      await React.act(async () => root.render(null));
      const { AdminCurriculumView } = await server.ssrLoadModule('/src/views/AdminCurriculumView.jsx');
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      api.administration.curriculum = async () => ({ course: { id: 'course', title: 'Programa', description: '' }, modules: [{ id: 'module', title: 'Tema', position: 0, lessons: [] }], videos: [] });
      api.videos.list = async () => [{ id: 'recording', title: 'Clase grabada real', courseId: 'course', status: 'ready' }, { id: 'other', title: 'Otro curso', courseId: 'other', status: 'ready' }, { id: 'pending', title: 'Sin publicar', courseId: 'course', status: 'pending' }];
      const saved = [];
      api.administration.saveLesson = async (...args) => saved.push(args);
      await mount(AdminCurriculumView, { courses: [{ id: 'course', title: 'Programa' }], initialCourseId: 'course', embedded: true });
      await click(button('+ Agregar lección'));
      const select = container.querySelector('select[aria-label="Clase grabada para esta lección"]');
      assert.ok(select);
      assert.match(select.textContent, /Clase grabada real/);
      assert.doesNotMatch(select.textContent, /Otro curso|Sin publicar/);
      await React.act(async () => { select.value = 'recording'; select.dispatchEvent(new window.Event('change', { bubbles: true })); });
      await input(container.querySelector('form input[required]'), 'Leccion grabada');
      await React.act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(saved[0][1].videoId, 'recording');
      await React.act(async () => root.render(null));
    });
    await t.test('live class access opens a separate dialog without expanding agenda entries', async () => {
      await React.act(async () => root.render(null));
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      await mount(AdminView, { currentView: 'admin-live', courses: [], users: [], mentors: [], liveClasses: [{ id: 'live', title: 'Clase de prueba', scheduledAt: '2026-11-13T15:00:00Z', date: '13 nov 2026', time: '10:00', status: 'scheduled', badge: 'Programada', joinUrl: 'https://zoom.us/j/123456789', meetingId: '123456789', meetingPasscode: 'abc123' }] });
      const access = container.querySelector('button[aria-label="Ver acceso a Zoom: Clase de prueba"]');
      const entry = access.parentElement.parentElement;
      const before = entry.textContent;
      await click(access);
      assert.equal(entry.textContent, before);
      const dialog = document.querySelector('[role="dialog"]');
      assert.match(dialog.textContent, /123456789/);
      assert.match(dialog.textContent, /abc123/);
      assert.equal(dialog.querySelector('a').getAttribute('href'), 'https://zoom.us/j/123456789');
      await click(dialog.querySelector('button[aria-label="Cerrar"]'));
      assert.equal(document.querySelector('[role="dialog"]'), null);
      await React.act(async () => root.render(null));
    });
    await t.test('student course cards explain assigned permissions', async () => {
      await React.act(async () => root.render(null));
      const { CourseCard } = await server.ssrLoadModule('/src/components/ui.jsx');
      const opened = [];
      await mount(CourseCard, { course: { id: 'live', title: 'Solo sesiones', accessType: 'live', totalLessonsCount: 0, mentorName: 'Mentor' }, onSelect: course => opened.push(course.id) });
      assert.match(container.textContent, /Solo clases en vivo/);
      assert.match(container.textContent, /No incluye lecciones, materiales ni grabaciones/);
      await click(button('Ver clases'));
      assert.deepEqual(opened, ['live']);
      await mount(CourseCard, { course: { id: 'content', title: 'Curso grabado', accessType: 'content', totalLessonsCount: 1, mentorName: 'Mentor' }, onSelect: () => {} });
      assert.match(container.textContent, /Contenido y grabaciones/);
      assert.match(container.textContent, /No incluye sesiones en vivo/);
      assert.ok(button('Comenzar programa'));
      await React.act(async () => root.render(null));
    });
    await t.test('admin recording library lists published videos and plays the chosen recording', async () => {
      await React.act(async () => root.render(null));
      const { AdminRecordings } = await server.ssrLoadModule('/src/components/AdminRecordings.jsx');
      const played = []; let refreshed = 0;
      await mount(AdminRecordings, { recordings: [{ id: 'ready', title: 'Clase publicada', courseId: 'one', courseTitle: 'Programa uno', status: 'ready' }, { id: 'pending', title: 'Pendiente', status: 'uploading' }], courses: [{ id: 'one', title: 'Programa uno' }], onPlay: async video => { played.push(video.id); return { url: 'https://example.com/recording.mp4' }; }, onRefresh: async () => { refreshed++; } });
      assert.match(container.textContent, /Clase publicada/);
      assert.doesNotMatch(container.textContent, /Pendiente/);
      await click(container.querySelector('button[aria-label="Reproducir Clase publicada"]'));
      assert.deepEqual(played, ['ready']);
      assert.equal(document.querySelector('[role="dialog"] video').getAttribute('src'), 'https://example.com/recording.mp4');
      await click(document.querySelector('[role="dialog"] button[aria-label="Cerrar"]'));
      await input(container.querySelector('input[type="search"]'), 'sin resultados');
      assert.match(container.textContent, /No hay videos para estos filtros/);
      await click(button('Actualizar'));
      assert.equal(refreshed, 1);
      await React.act(async () => root.render(null));
    });
    await t.test('course creation opens a dedicated page and reports success only after saving', async () => {
      await React.act(async () => root.render(null));
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const created = [];
      await mount(AdminView, { currentView: 'admin-courses', courses: [], liveClasses: [], mentors: [], users: [], onAddCourse: async input => created.push(input) });
      await click(button('Crear nuevo curso'));
      const screen = container.querySelector('section[aria-label="Crear nuevo curso"]');
      assert.ok(screen);
      assert.equal(container.querySelector('.modal-backdrop'), null);
      assert.ok(screen.querySelector('input[aria-label="Imagen del nuevo curso"]'));
      const title = screen.querySelector('input[required]');
      await input(title, 'Curso propio');
      assert.equal(created.length, 0);
      await React.act(async () => screen.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(created[0].title, 'Curso propio');
      assert.equal(container.querySelector('section[aria-label="Crear nuevo curso"]'), null);
      assert.match(container.textContent, /Curso creado correctamente/);
      await React.act(async () => root.render(null));
    });
    await t.test('Edit opens the selected course curriculum without changing its data', async () => {
      await React.act(async () => root.render(null));
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const opened = [], edits = [];
      await mount(AdminView, { currentView: 'admin-courses', courses: [{ id: 'existing', title: 'Curso original' }], liveClasses: [], mentors: [], users: [], onEditCurriculum: course => opened.push(course.id), onEditCourse: (...args) => edits.push(args) });
      await click(button('Editar'));
      assert.deepEqual(opened, ['existing']);
      assert.deepEqual(edits, []);
      assert.equal(container.querySelector('section[aria-label="Editar curso"]'), null);
      await React.act(async () => root.render(null));
    });
    await t.test('course deletion requires confirmation and preserves failures for retry', async () => {
      await React.act(async () => root.render(null));
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const removed = []; let fail = true;
      await mount(AdminView, { currentView: 'admin-courses', courses: [{ id: 'course', title: 'Curso de prueba' }], liveClasses: [], mentors: [], users: [],
        onDeleteCourse: async id => { if (fail) throw new Error('No se pudo borrar'); removed.push(id); } });
      await click(container.querySelector('button[aria-label="Eliminar curso: Curso de prueba"]'));
      assert.deepEqual(removed, []);
      await click(button('Cancelar'));
      assert.equal(document.querySelector('[role="dialog"]'), null);
      await click(container.querySelector('button[aria-label="Eliminar curso: Curso de prueba"]'));
      await click(button('Eliminar curso'));
      assert.match(document.querySelector('[role="dialog"]').textContent, /No se pudo borrar/);
      assert.deepEqual(removed, []);
      fail = false;
      await click(button('Eliminar curso'));
      assert.deepEqual(removed, ['course']);
      assert.equal(document.querySelector('[role="dialog"]'), null);
      assert.match(document.body.textContent, /Curso eliminado correctamente/);
      await React.act(async () => root.render(null));
    });
    await t.test('user deletion requires confirmation, allows cancellation and protects own account', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      api.administration.access = async () => ({ items: [], total: 0 });
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const removed = [];
      let fail = true;
      await mount(AdminView, { currentView: 'admin-users', currentUserId: 'admin', courses: [], liveClasses: [], mentors: [],
        users: [{ id: 'admin', fullName: 'Administradora', role: 'admin' }, { id: 'target', fullName: 'Cuenta de prueba', role: 'mentor' }],
        onDeleteUser: async id => { if (fail) throw new Error('No se pudo eliminar'); removed.push(id); } });
      const control = name => window.document.body.querySelector(`button[aria-label="Eliminar usuario: ${name}"]`);
      assert.equal(control('Administradora').disabled, true);
      await click(control('Cuenta de prueba'));
      assert.deepEqual(removed, []);
      await click(button('Cancelar'));
      assert.deepEqual(removed, []);
      assert.equal(window.document.body.querySelector('[role="dialog"]'), null);
      await click(control('Cuenta de prueba'));
      await click(button('Eliminar definitivamente'));
      assert.match(window.document.body.querySelector('[role="dialog"]').textContent, /No se pudo eliminar/);
      assert.deepEqual(removed, []);
      fail = false;
      await click(button('Eliminar definitivamente'));
      assert.deepEqual(removed, ['target']);
      assert.equal(window.document.body.querySelector('[role="dialog"]'), null);
      await React.act(async () => root.render(null));
    });
    await t.test('admin enrolls a student in multiple courses and retries only failed enrollments', async () => {
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      api.administration.access = async () => ({ items: [], total: 0 });
      const requests = [];
      let failSecond = true;
      await mount(AdminView, {
        currentView: 'admin-users', currentUserId: 'admin',
        courses: [{ id: 'one', title: 'Curso Uno' }, { id: 'two', title: 'Curso Dos' }],
        users: [{ id: 'student', fullName: 'Estudiante Prueba', role: 'estudiante', mentorId: 'mentor' },
          { id: 'mentor', fullName: 'Mentor Único', role: 'mentor' }],
        liveClasses: [], mentors: [],
        onAssignUserToCourse: async (id, role, courseId) => {
          requests.push([id, role, courseId]);
          if (courseId === 'two' && failSecond) throw new Error('Error de conexión');
        },
      });
      await click(button('Gestionar cursos'));
      const fieldset = window.document.body.querySelector('fieldset');
      assert.ok(fieldset);
      const boxes = fieldset.querySelectorAll('input[type="checkbox"]');
      await click(boxes[0]);
      await click(boxes[1]);
      assert.equal(requests.length, 0);
      assert.equal(window.document.body.querySelector('[role="dialog"]'), null);
      await click(button('Guardar cambios'));
      assert.deepEqual(requests, [['student', 'estudiante', 'one'], ['student', 'estudiante', 'two']]);

      const currentBoxes = window.document.body.querySelectorAll('fieldset input[type="checkbox"]');
      assert.equal(currentBoxes[0].checked, true);
      assert.equal(currentBoxes[0].disabled, false);
      assert.equal(currentBoxes[1].checked, true);
      assert.match(window.document.body.textContent, /Matriculado/);

      failSecond = false;
      await click(button('Guardar cambios'));
      assert.deepEqual(requests.at(-1), ['student', 'estudiante', 'two']);
      assert.equal(requests.filter(request => request[2] === 'one').length, 1);
      assert.match(window.document.body.textContent, /2matriculados/);
      assert.equal(button('Guardar cambios').disabled, true);
    });
    await t.test('mentor assignment screen paginates courses and saves selections across pages', async () => {
      await React.act(async () => root.render(null));
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      api.administration.access = async () => ({ items: [], total: 0 });
      const writes = [];
      await mount(AdminView, { currentView: 'admin-users', courses: Array.from({ length: 25 }, (_, index) => ({ id: String(index), title: 'Programa ' + index })),
        users: [{ id: 'mentor', fullName: 'Mentor Catalogo', role: 'mentor' }], liveClasses: [], mentors: [],
        onAssignUserToCourse: async (...args) => writes.push(args) });
      await click(button('Gestionar cursos'));
      assert.equal(container.querySelectorAll('fieldset input').length, 12);
      await click(container.querySelector('fieldset input'));
      await click(container.querySelector('button[aria-label="Página siguiente de cursos"]'));
      await click(container.querySelector('fieldset input'));
      assert.equal(writes.length, 0);
      await click(button('Guardar cambios'));
      assert.deepEqual(writes, [['mentor', 'mentor', '0'], ['mentor', 'mentor', '12']]);
      await input(container.querySelector('input[aria-label="Buscar cursos para Mentor Catalogo"]'), 'Programa 24');
      assert.equal(container.querySelectorAll('fieldset input').length, 1);
      await click(button('Volver a usuarios'));
      assert.ok(container.querySelector('.admin-users-table'));
      await React.act(async () => root.render(null));
    });
    await t.test('admin can reactivate a suspended enrollment while preserving permissions and suspension count', async () => {
      await React.act(async () => root.render(null));
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      const row = { id: 'enrollment', student_id: 'student', course_id: 'course', status: 'suspended', access_type: 'live', expires_at: null, suspension_count: 3 };
      api.administration.access = async () => ({ items: [row], total: 1 });
      const writes = [];
      api.administration.updateAccess = async (id, input) => { writes.push([id, input]); return { ...row, status: 'active' }; };
      await mount(AdminView, { currentView: 'admin-users', courses: [{ id: 'course', title: 'Suspendido editable' }], users: [{ id: 'student', role: 'estudiante', fullName: 'Estudiante' }], mentors: [], liveClasses: [] });
      await click(button('Gestionar cursos'));
      const checkbox = container.querySelector('fieldset input');
      assert.equal(checkbox.disabled, false);
      assert.match(container.textContent, /3 suspensiones/);
      await click(checkbox);
      assert.equal(writes.length, 0);
      assert.match(container.textContent, /Por reactivar/);
      await click(button('Guardar cambios'));
      assert.deepEqual(writes, [['enrollment', { status: 'active', accessType: 'live', expiresAt: null }]]);
      assert.match(container.textContent, /3 suspensiones/);
      assert.equal(container.querySelector('fieldset input').checked, true);
      await React.act(async () => root.render(null));
    });
    await t.test('admin course picker restores paginated real enrollments and distinguishes suspended and expired access', async () => {
      await React.act(async () => root.render(null));
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const pages = [];
      const rows = [
        { id: 'enrollment-one', student_id: 'student', course_id: 'one', status: 'active', access_type: 'content' },
        { student_id: 'student', course_id: 'two', status: 'suspended' },
        { student_id: 'student', course_id: 'three', status: 'active', expires_at: '2000-01-01T00:00:00Z' },
      ];
      api.administration.access = async ({ page }) => {
        pages.push(page);
        return { items: page === 0 ? rows.slice(0, 1) : rows.slice(1), total: 3 };
      };
      const { AdminView } = await server.ssrLoadModule('/src/views/AdminView.jsx');
      await mount(AdminView, { currentView: 'admin-users', courses: [
        { id: 'one', title: 'Activo' }, { id: 'two', title: 'Suspendido' },
        { id: 'three', title: 'Vencido' }, { id: 'four', title: 'Disponible' },
      ], users: [{ id: 'student', role: 'estudiante', fullName: 'Alumna' }], mentors: [], liveClasses: [] });
      assert.deepEqual(pages, [0, 1]);
      await click(button('Gestionar cursos'));
      const boxes = window.document.body.querySelectorAll('fieldset input');
      assert.equal(boxes[0].checked, true);
      assert.equal(boxes[0].disabled, false);
      assert.equal(boxes[1].checked, false);
      assert.equal(boxes[1].disabled, false);
      assert.equal(boxes[2].disabled, true);
      assert.equal(boxes[3].disabled, false);
      assert.match(window.document.body.textContent, /Contenido y grabaciones/);
      assert.match(window.document.body.textContent, /Matriculado/);
      const removed = [];
      api.administration.updateAccess = async (...args) => removed.push(args);
      await click(boxes[0]);
      assert.deepEqual(removed, []);
      assert.match(window.document.body.textContent, /Por quitar/);
      const save = button('Guardar cambios');
      await click(save);
      assert.deepEqual(removed, [['enrollment-one', { status: 'suspended', accessType: 'content', expiresAt: null }]]);
      assert.match(window.document.body.textContent, /0matriculados/);

      await input(window.document.body.querySelector('input[aria-label="Buscar cursos para Alumna"]'), 'Disponible');
      assert.equal(window.document.body.querySelectorAll('fieldset input').length, 1);
      await click(button('Volver a usuarios'));
    });
    await t.test(
      "login submits the same authenticated credentials and password visibility works",
      async () => {
        const { LoginView } = await server.ssrLoadModule(
          "/src/views/LoginView.jsx",
        );
        let credentials;
        await mount(LoginView, {
          onLogin: async (value) => {
            credentials = value;
          },
        });
        await input(
          window.document.body.querySelector('input[type="email"]'),
          "student@example.com",
        );
        await input(
          window.document.body.querySelector('input[type="password"]'),
          "password-for-test",
        );
        await click(
          window.document.body.querySelector('button[aria-label="Mostrar contraseña"]'),
        );
        assert.equal(
          window.document.body.querySelector('input[autocomplete="current-password"]')
            .type,
          "text",
        );
        await React.act(async () =>
          container
            .querySelector("form")
            .dispatchEvent(
              new window.Event("submit", { bubbles: true, cancelable: true }),
            ),
        );
        assert.deepEqual(credentials, {
          email: "student@example.com",
          password: "password-for-test",
          rememberMe: true,
        });
      },
    );
    await t.test(
      "the sidebar preserves role boundaries and the admin access destination",
      async () => {
        const { Sidebar } = await server.ssrLoadModule(
          "/src/components/Sidebar.jsx",
        );
        let destination;
        const props = {
          currentView: "admin-overview",
          currentRole: "admin",
          user: { name: "Administrator" },
          isOpen: true,
          onNavigate: (id) => {
            destination = id;
          },
        };
        await mount(Sidebar, props);
        await click(button("Accesos por programa"));
        assert.equal(destination, "admin-access");
        await mount(Sidebar, {
          ...props,
          currentRole: "soporte",
          currentView: "tickets",
        });
        assert.ok(button("Mesa de soporte"));
        assert.equal(button("Accesos por programa"), undefined);
        assert.equal(
          window.document.body.querySelector('[aria-current="page"]').textContent,
          "Mesa de soporte",
        );
      },
    );
    await t.test(
      "course search filters actual programs and selecting one preserves its ID",
      async () => {
        const { CoursesListView } = await server.ssrLoadModule(
          "/src/views/CoursesListView.jsx",
        );
        let selected;
        const courses = ["Finance", "Leadership"].map((title, i) => ({
          id: "course-" + i,
          title,
          tagline: title,
          totalModulesCount: 1,
          totalLessonsCount: 2,
          completedLessonsCount: 0,
          progressPercent: 0,
          mentorName: "Mentor",
          category: "Programs",
        }));
        await mount(CoursesListView, {
          courses,
          onSelectCourse: (course) => {
            selected = course.id;
          },
        });
        await input(window.document.body.querySelector('input[type="search"]'), "Finance");
        assert.equal(window.document.body.querySelectorAll("article").length, 1);
        await click(button("Comenzar programa"));
        assert.equal(selected, "course-0");
      },
    );
    await t.test(
      "editing a profile still sends the updated data to its save callback",
      async () => {
        const { ProfileView } = await server.ssrLoadModule(
          "/src/views/ProfileView.jsx",
        );
        let submitted;
        const user = {
          name: "Student",
          email: "student@example.com",
          role: "student",
          stats: {},
        };
        await mount(ProfileView, {
          user,
          onUpdateUser: async (value, file) => {
            assert.equal(file, null);
            submitted = value;
            return { ...user, name: value.name };
          },
        });
        await click(button("Editar perfil"));
        const name = [...window.document.body.querySelectorAll("label")]
          .find((label) => label.textContent.startsWith("Nombre completo"))
          .querySelector("input");
        await input(name, "Updated Student");
        await React.act(async () =>
          container
            .querySelector("form")
            .dispatchEvent(
              new window.Event("submit", { bubbles: true, cancelable: true }),
            ),
        );
        assert.equal(submitted.name, "Updated Student");
        assert.match(
          window.document.body.querySelector('[role="status"]').textContent,
          /correctamente/,
        );
        assert.ok(button("Editar perfil"));
      },
    );
    await t.test(
      "mobile search opens and selects a real course without changing its destination",
      async () => {
        const { Header } = await server.ssrLoadModule(
          "/src/components/Header.jsx",
        );
        const selections = [];
        const selectCourse = (course) => selections.push(course.id);
        function SearchHarness() {
          const [term, setTerm] = React.useState("");
          return React.createElement(Header, {
            user: { name: "Student", email: "student@example.com" },
            currentRole: "student",
            currentView: "dashboard",
            searchTerm: term,
            onSearchChange: setTerm,
            courses: [{ id: "actual-course", title: "Programa de liderazgo" }],
            onSelectCourse: selectCourse,
          });
        }
        await mount(SearchHarness, {});
        await click(window.document.body.querySelector('[aria-label="Abrir búsqueda"]'));
        await input(
          window.document.body.querySelector('input[type="search"]'),
          "liderazgo",
        );
        await click(button("Programa de liderazgo"));
        assert.deepEqual(selections, ["actual-course"]);
      },
    );
    await t.test(
      "every role can toggle dark mode from the profile menu and retain it after navigation and reload",
      async () => {
        const { Header } = await server.ssrLoadModule(
          "/src/components/Header.jsx",
        );
        const { useTheme } = await server.ssrLoadModule(
          "/src/hooks/useTheme.js",
        );
        const navigations = [];
        function ThemeHarness({ role }) {
          const { theme, toggleTheme } = useTheme();
          return React.createElement(Header, {
            user: { name: "Test User", email: "user@example.com" },
            currentRole: role,
            theme,
            onToggleTheme: toggleTheme,
            onNavigate: (view) => navigations.push(view),
          });
        }
        const openMenu = () =>
          click(window.document.body.querySelector('[aria-label="Abrir menú de perfil"]'));
        const themeSwitch = () =>
          window.document.body.querySelector('[role="switch"][aria-label="Modo oscuro"]');
        for (const role of ["student", "mentor", "admin", "soporte"]) {
          // Un valor antiguo/inválido conserva el aspecto claro predeterminado.
          localStorage.setItem("traction_theme", "invalid");
          await mount(ThemeHarness, { key: role, role });
          assert.equal(document.documentElement.dataset.theme, "light");
          await openMenu();
          assert.equal(button("Mi membresía"), undefined);
          assert.equal(themeSwitch().getAttribute("aria-checked"), "false");
          await click(themeSwitch());
          assert.equal(document.documentElement.dataset.theme, "dark");
          assert.equal(localStorage.getItem("traction_theme"), "dark");
          assert.equal(themeSwitch().getAttribute("aria-checked"), "true");
          await click(button("Mi perfil y datos"));
          assert.equal(navigations.at(-1), "profile");
          assert.equal(document.documentElement.dataset.theme, "dark");
          await mount(ThemeHarness, { key: role + "-reload", role });
          assert.equal(document.documentElement.dataset.theme, "dark");
          await openMenu();
          assert.equal(themeSwitch().getAttribute("aria-checked"), "true");
          await click(themeSwitch());
          assert.equal(document.documentElement.dataset.theme, "light");
          assert.equal(localStorage.getItem("traction_theme"), "light");
          await React.act(async () => {
            localStorage.setItem("traction_theme", "dark");
            window.dispatchEvent(
              new window.StorageEvent("storage", {
                key: "traction_theme",
                newValue: "dark",
              }),
            );
          });
          assert.equal(document.documentElement.dataset.theme, "dark");
          await click(themeSwitch());
        }
      },
    );
    await t.test(
      "the restyled lesson player still completes and advances to the next lesson",
      async () => {
        const { CoursePlayerView } = await server.ssrLoadModule(
          "/src/views/CoursePlayerView.jsx",
        );
        const lessons = ["First lesson", "Second lesson"].map((title, i) => ({
          id: "lesson-" + i,
          title,
          content: "Reading content",
          resources: [],
          questions: [],
          completed: false,
        }));
        let completed;
        await mount(CoursePlayerView, {
          course: {
            id: "course-real",
            title: "Course",
            progressPercent: 0,
            totalLessonsCount: 2,
            completedLessonsCount: 0,
            modules: [{ id: "module-real", title: "Module", lessons }],
          },
          onToggleLessonCompletion: async (courseId, lessonId) => {
            completed = { courseId, lessonId };
            return true;
          },
        });
        await click(button("Marcar como Completada"));
        assert.deepEqual(completed, {
          courseId: "course-real",
          lessonId: "lesson-0",
        });
        assert.equal(
          window.document.body.querySelector("h2").textContent,
          "Second lesson",
        );
      },
    );
    await t.test(
      "dialogs handle Escape and restore document scrolling",
      async () => {
        const { Dialog } = await server.ssrLoadModule("/src/components/ui.jsx");
        let closed = 0;
        await mount(Dialog, {
          open: true,
          title: "Keyboard test",
          onClose: () => {
            closed++;
          },
          children: React.createElement("button", {}, "Action"),
        });
        assert.equal(window.document.body.style.overflow, "hidden");
        await React.act(async () =>
          window.document.dispatchEvent(
            new window.KeyboardEvent("keydown", {
              key: "Escape",
              bubbles: true,
            }),
          ),
        );
        assert.equal(closed, 1);
        const dialog = window.document.body.querySelector('[role="dialog"]');
        assert.ok(dialog);
        assert.equal(dialog.parentElement.parentElement, window.document.body);
        assert.equal(container.contains(dialog), false);
        await mount(Dialog, {
          open: false,
          title: "Keyboard test",
          onClose: () => {},
        });
        assert.equal(window.document.body.style.overflow, "");
        assert.equal(window.document.body.querySelector('[role="dialog"]'), null);
      },
    );
  } finally {
    await React.act(async () => root.unmount());
    await server.close();
    await window.happyDOM.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
