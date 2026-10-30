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
