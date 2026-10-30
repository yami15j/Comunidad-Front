import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createServer } from 'vite';

test('delivery: login, dashboard, course, lesson, history, library, live and admin', async () => {
  const window = new Window({ url: 'http://localhost:5173/login' });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window, document: window.document,
    localStorage: window.localStorage, navigator: window.navigator, HTMLElement: window.HTMLElement,
    Node: window.Node, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const server = await createServer({ cacheDir: 'node_modules/.vite-tests/delivery',
    optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const course = id => ({ id, title: `Programa ${id}`, modules: [{ id: `m-${id}`, title: 'Inicio',
    lessons: [{ id: `l-${id}`, title: `Lección ${id}`, content: `Contenido verificable ${id}`, resources: [] }] }] });
  let role = 'estudiante';
  const profile = () => ({ id: 'test-user', role, email: 'test@example.test', fullName: 'Usuario de prueba' });
  const courses = [course('uno'), course('dos'), { id: 'vacio', title: 'Programa vacío', modules: [] }];
  const click = async text => {
    const control = [...window.document.body.querySelectorAll('button')].find(node => node.textContent.includes(text));
    assert.ok(control, `control: ${text}`);
    await React.act(async () => control.click());
  };
  const navigate = async path => React.act(async () => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new window.PopStateEvent('popstate'));
  });
  try {
    const { api } = await server.ssrLoadModule('/src/services/api.js');
    api.login = async () => ({ accessToken: 'test-token', user: profile() });
    api.me = async () => profile();
    api.dashboard.student = async () => ({ courses: courses.map(course => ({ ...course, mentorName: 'Docente distinto del programa' })), stats: { totalMinutesLearned: 0 },
      mentors: [{ id: 'personal-mentor', fullName: 'Mentor único del estudiante', avatarUrl: '' }] });
    api.dashboard.admin = async () => ({ courses, stats: {}, mentors: [], recentActivity: [] });
    api.dashboard.resume = async () => null;
    api.dashboard.saveResume = async () => ({});
    api.liveSessions.list = async () => [];
    api.videos.list = async () => [];
    api.users.list = async () => [];
    api.courses.list = async () => courses;
    api.notifications.list = async () => [];
    const { App } = await server.ssrLoadModule('/src/App.jsx');
    await React.act(async () => root.render(React.createElement(App)));
    assert.ok(window.document.body.querySelector('input[type="email"]'));
    await React.act(async () => window.document.body.querySelector('form').dispatchEvent(
      new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(window.location.pathname, '/panel');
    await click('Mis programas');
    assert.match(host.textContent, /Mentor único del estudiante/);
    assert.doesNotMatch(host.textContent, /Docente distinto del programa|Mentor por asignar/);
    await click('Comenzar programa');
    assert.equal(window.location.pathname, '/programas/uno');
    assert.match(host.textContent, /Contenido verificable uno/);
    await navigate('/programas/dos');
    assert.match(host.textContent, /Contenido verificable dos/);
    assert.doesNotMatch(host.textContent, /Contenido verificable uno/);
    await navigate('/programas/uno');
    assert.match(host.textContent, /Contenido verificable uno/);
    await navigate('/programas/vacio');
    assert.match(host.textContent, /Contenido por publicar/);
    await navigate('/programas/inexistente');
    assert.match(host.textContent, /Curso no disponible/);
    await click('Ver mis programas');
    await click('Biblioteca');
    assert.equal(window.location.pathname, '/biblioteca');
    await click('Clases en vivo');
    assert.equal(window.location.pathname, '/clases-en-vivo');
    // Restore an administrator session and exercise its actual routed dashboard.
    await React.act(async () => root.render(null));
    role = 'admin';
    await React.act(async () => root.render(React.createElement(App)));
    assert.equal(window.location.pathname, '/administrador');
    await click('Cursos y programas');
    assert.equal(window.location.pathname, '/administrador/cursos');
    assert.match(host.textContent, /Programa uno/);
    await React.act(async () => root.render(null));
    role = 'mentor';
    api.courses.enrollmentCandidates = async () => ({ items: [{ id: 'student', fullName: 'Alumna registrada', email: 'alumna@example.test' }], total: 1 });
    api.dashboard.mentor = async () => ({ courses, stats: {}, students: [], questions: [] });
    api.liveSessions.list = async () => [{ id: 'session', courseId: 'uno', title: 'Clase editable',
      scheduledAt: '2099-11-01T15:00:00Z', durationMinutes: 60, status: 'scheduled' }];
    let edited;
    api.liveSessions.update = async (id, input) => { edited = { id, ...input, status: 'scheduled' }; return edited; };
    await React.act(async () => root.render(React.createElement(App)));
    await click('Cursos y estudiantes');
    assert.match(host.textContent, /Matricular en este curso/);
    const candidateSelect = window.document.body.querySelector('select[aria-label="Seleccionar estudiante registrado"]');
    assert.ok(candidateSelect);
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(candidateSelect, 'alumna@example.test');
      candidateSelect.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    assert.equal(window.document.body.querySelector('input[type="email"]').value, 'alumna@example.test');
    assert.doesNotMatch(host.textContent, /Publicar grabaci|Programar una clase|Guardar enlace/);
    const outline = { course: { id: 'uno', title: 'Programa uno' }, modules: [], videos: [] };
    let savedModule;
    api.administration.curriculum = async () => outline;
    api.administration.saveModule = async (courseId, input) => {
      savedModule = { courseId, ...input };
      outline.modules = [{ id: 'new-module', ...input, lessons: [] }];
    };
    await click('Editar contenido');
    const editor = window.document.body.querySelector('[role="dialog"]');
    assert.ok(editor);
    assert.doesNotMatch(editor.textContent, /Datos del curso y profesor asignado/);
    assert.match(editor.textContent, /Crear modulo/);
    assert.match(editor.textContent, /Crear leccion/);
    assert.match(editor.textContent, /Materiales descargables y complementarios/);
    const moduleForm = editor.querySelector('form');
    await React.act(async () => {
      const input = moduleForm.querySelector('input');
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'Contenido del mentor');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    await React.act(async () => moduleForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.deepEqual(savedModule, { courseId: 'uno', title: 'Contenido del mentor', position: 0 });
    assert.match(editor.textContent, /Modulo guardado/);
    await React.act(async () => editor.querySelector('button[aria-label="Cerrar"]').click());
    await click('Clases en vivo');
    assert.match(host.textContent, /Gestionar mis clases en vivo/);
    assert.doesNotMatch(host.textContent, /Publicar grabaci/);
    await click('Editar clase');
    assert.equal(window.document.body.querySelector('input[type="number"]').value, '60');
    await click('Guardar cambios');
    assert.equal(edited.id, 'session');
    assert.equal(edited.courseId, 'uno');
    assert.equal(edited.title, 'Clase editable');
    assert.equal(edited.durationMinutes, 60);
    assert.match(host.textContent, /Clase actualizada/);
    await click('Programar clase');
    assert.ok(window.document.body.querySelector('input[type="datetime-local"]'));
    await click('Cancelar');
    await click('Mis grabaciones');
    assert.match(host.textContent, /Publicar grabaci/);
    assert.doesNotMatch(host.textContent, /Gestionar mis clases|Enlace de Zoom de una clase|Matricular en este curso/);
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
