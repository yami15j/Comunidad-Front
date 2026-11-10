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
    await t.test('administrator supervises all tickets and conversations without editing controls', async () => {
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const { TicketsView } = await server.ssrLoadModule('/src/views/TicketsView.jsx');
      api.tickets.list = async () => [{ id: 'supervised', subject: 'Student request', student_id: 'student', student_name: 'Ana Student', agent_name: 'Agent Maria', assigned_to: 'other-agent', status: 'in_progress', created_at: '2026-11-05T12:00:00Z' }];
      api.tickets.messages = async () => [{ id: 'message', sender_id: 'student', sender_name: 'Ana Student', body: 'Conversation to supervise', created_at: '2026-11-05T12:00:00Z' }];
      await mount(TicketsView, { user: { id: 'admin', role: 'admin' } });
      assert.match(container.textContent, /Supervisión de soporte/);
      await click(button('Student request'));
      assert.match(container.textContent, /Agent Maria/);
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
      assert.match(container.textContent, /Saved conversation/);
      await click(button('Etiquetar'));
      await input(document.querySelector('[role="dialog"] input'), 'Access, Urgent');
      await React.act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      assert.deepEqual(JSON.parse(JSON.stringify(labelWrites)), [{ id: 'pending', labels: ['Access', 'Urgent'] }]);
      await click(button('Marcar como resuelto'));
      assert.equal(document.querySelector('.ticket-reply'), null);
      assert.match(container.textContent, /Saved conversation/);
      await click(button('Resueltos'));
      assert.ok(button('Previous case'));
      assert.ok(button('Access problem'));
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
      await click(button('Cursos del estudiante'));
      const fieldset = window.document.body.querySelector('fieldset');
      assert.ok(fieldset);
      const boxes = fieldset.querySelectorAll('input[type="checkbox"]');
      await click(boxes[0]);
      await click(boxes[1]);
      assert.match(window.document.body.textContent, /2 seleccionados/);
      await click(button('Listo'));
      await click(button('Matricular en 2 cursos'));
      assert.deepEqual(requests, [['student', 'estudiante', 'one'], ['student', 'estudiante', 'two']]);
      assert.match(window.document.body.textContent, /matriculado en 1 curso/);
      assert.match(window.document.body.textContent, /Curso Dos: Error de conexión/);
      await click(button('Cursos del estudiante'));
      const currentBoxes = window.document.body.querySelectorAll('fieldset input[type="checkbox"]');
      assert.equal(currentBoxes[0].checked, true);
      assert.equal(currentBoxes[0].disabled, true);
      assert.equal(currentBoxes[1].checked, true);
      assert.match(window.document.body.textContent, /Matriculado/);
      await click(button('Listo'));
      assert.equal(window.document.body.querySelector('select[aria-label="Mentor de Estudiante Prueba"]').value, 'mentor');
      failSecond = false;
      await click(button('Matricular en 1 curso'));
      assert.deepEqual(requests.at(-1), ['student', 'estudiante', 'two']);
      assert.equal(requests.filter(request => request[2] === 'one').length, 1);
      assert.match(window.document.body.textContent, /2 cursos matriculados/);
      assert.equal(button('Matricular en 0 cursos').disabled, true);
    });
    await t.test('admin course picker restores paginated real enrollments and distinguishes suspended and expired access', async () => {
      await React.act(async () => root.render(null));
      const { api } = await server.ssrLoadModule('/src/services/api.js');
      const pages = [];
      const rows = [
        { student_id: 'student', course_id: 'one', status: 'active', access_type: 'content' },
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
      assert.match(window.document.body.textContent, /1 curso matriculado/);
      await click(button('Cursos del estudiante'));
      const boxes = window.document.body.querySelectorAll('fieldset input');
      assert.equal(boxes[0].checked, true);
      assert.equal(boxes[0].disabled, true);
      assert.equal(boxes[1].checked, false);
      assert.equal(boxes[1].disabled, true);
      assert.equal(boxes[2].disabled, true);
      assert.equal(boxes[3].disabled, false);
      assert.match(window.document.body.textContent, /Contenido y grabaciones/);
      assert.match(window.document.body.textContent, /Matriculado/);
      await input(window.document.body.querySelector('input[aria-label="Buscar cursos para Alumna"]'), 'Disponible');
      assert.equal(window.document.body.querySelectorAll('fieldset input').length, 1);
      await click(button('Listo'));
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
