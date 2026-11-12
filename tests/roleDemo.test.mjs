import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { createServer } from "vite";

test("trusted role badges and authenticated forum/chat interactions", async (t) => {
  const window = new Window({ url: "http://localhost:5173/?demo=comunidad" });
  const saved = new Map();
  for (const [key, value] of Object.entries({
    window,
    document: window.document,
    localStorage: window.localStorage,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  }
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const server = await createServer({
    cacheDir: "node_modules/.vite-tests/role-demo",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: "custom",
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const mount = (Component, props = {}) =>
    React.act(async () => root.render(React.createElement(Component, props)));
  const click = async (text) => {
    const node = [...document.body.querySelectorAll("button")].find((n) =>
      n.textContent.includes(text),
    );
    assert.ok(node, text);
    await React.act(async () => node.click());
  };
  const enter = async (label, value) => {
    const node = document.body.querySelector(`[aria-label="${label}"]`);
    assert.ok(node, label);
    await React.act(async () => {
      const proto =
        node.tagName === "SELECT"
          ? window.HTMLSelectElement.prototype
          : node.tagName === "TEXTAREA"
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(node, value);
      node.dispatchEvent(
        new window.Event(node.tagName === "SELECT" ? "change" : "input", {
          bubbles: true,
        }),
      );
    });
  };
  try {
    const { RoleBadge } = await server.ssrLoadModule(
      "/src/components/RoleBadge.jsx",
    );
    await t.test(
      "shows explicit staff identity and hides student, unknown and professional titles",
      async () => {
        for (const [role, label] of [
          ["soporte", "soporte"],
          ["mentor", "mentor"],
          ["admin", "administrador"],
          ["docente", "mentor"],
        ]) {
          await mount(RoleBadge, { role });
          assert.equal(container.textContent, label);
          assert.ok(container.querySelector(`[aria-label="Rol: ${label}"]`));
          assert.equal(
            container.querySelector("svg").getAttribute("aria-hidden"),
            "true",
          );
        }
        for (const role of [
          "student",
          "estudiante",
          "unknown",
          "Fundador mentor",
          "Executive Council",
          null,
        ]) {
          await mount(RoleBadge, { role });
          assert.equal(container.textContent, "");
        }
      },
    );
    const { CommunityView } = await server.ssrLoadModule(
      "/src/views/CommunityView.jsx",
    );
    const { api } = await server.ssrLoadModule("/src/services/api.js");
    await t.test(
      "forum loads real canonical records, preserves failed drafts and applies server replies/likes",
      async () => {
        let rows = [];
        let fail = true;
        api.forums.list = async () => rows;
        api.forums.create = async (input) => {
          if (fail) throw Error("Servidor no disponible");
          const row = {
            id: "db-thread",
            author: "Sofía",
            identityRole: "mentor",
            title: input.title,
            content: input.content,
            category: input.category,
            likes: 0,
            likedByMe: false,
            commentsCount: 0,
            comments: [],
          };
          rows = [row];
          return row;
        };
        api.forums.reply = async (id, content) => {
          assert.equal(id, "db-thread");
          rows = [
            {
              ...rows[0],
              commentsCount: 1,
              comments: [
                {
                  id: "db-reply",
                  author: "Sofía",
                  identityRole: "mentor",
                  content,
                },
              ],
            },
          ];
          return rows[0];
        };
        api.forums.like = async (id, liked) => {
          assert.equal(id, "db-thread");
          assert.equal(liked, true);
          rows = [{ ...rows[0], likes: 1, likedByMe: true }];
          return rows[0];
        };
        await mount(CommunityView, {
          user: { id: "mentor", name: "Sofía", role: "mentor" },
        });
        assert.match(container.textContent, /No hay debates/);
        await click("Iniciar Nuevo Debate");
        await enter("Título del debate", "Pregunta real");
        await enter("Contenido del debate", "Contenido real");
        await click("Publicar Debate");
        assert.match(document.body.textContent, /Servidor no disponible/);
        assert.equal(
          document.querySelector('[aria-label="Título del debate"]').value,
          "Pregunta real",
        );
        fail = false;
        await click("Publicar Debate");
        assert.equal(document.querySelector('[role="dialog"]'), null);
        assert.match(container.textContent, /Pregunta real/);
        await click("0 Respuestas");
        await enter("Respuesta a Pregunta real", "Respuesta real");
        await click("Publicar respuesta");
        assert.match(container.textContent, /1 Respuestas/);
        assert.match(container.textContent, /Respuesta real/);
        await click("0 Aportes");
        assert.match(container.textContent, /1 Aportes/);
        await React.act(async () => root.render(null));
        await mount(CommunityView, { user: { id: "mentor", role: "mentor" } });
        assert.match(container.textContent, /Pregunta real/);
        assert.ok(container.querySelector('[aria-label="Rol: mentor"]'));
        api.forums.list = async () => {
          throw Error("Error de lectura");
        };
        await React.act(async () => root.render(null));
        await mount(CommunityView, {
          user: { id: "student", role: "student" },
        });
        assert.match(container.textContent, /Error de lectura/);
        assert.doesNotMatch(container.textContent, /Pregunta real/);
      },
    );
    await t.test(
      "real support conversation uses actual sender metadata immediately and after refresh",
      async () => {
        const { Conversation } = await server.ssrLoadModule(
          "/src/views/TicketsView.jsx",
        );
        const { api } = await server.ssrLoadModule("/src/services/api.js");
        api.tickets.messages = async () => [
          {
            id: "one",
            sender_id: "agent",
            sender_name: "Sofía",
            sender_role: "soporte",
            body: "Te ayudo",
            created_at: "2026-01-01",
          },
        ];
        const props = {
          ticket: { id: "ticket", student_id: "student" },
          user: { id: "student", role: "student" },
          busy: false,
          revision: 0,
          mutation: { current: 0 },
          onSend: async (body) => ({
            id: "sent",
            sender_id: "student",
            sender_name: "Ana",
            sender_role: "estudiante",
            body,
            created_at: "2026-01-01",
          }),
        };
        await mount(Conversation, props);
        assert.match(container.textContent, /Sofía/);
        assert.ok(container.querySelector('[aria-label="Rol: soporte"]'));
        await enter("Respuesta", "Gracias");
        await click("Enviar respuesta");
        const articles = container.querySelectorAll("article");
        assert.match(articles[articles.length - 1].textContent, /Gracias/);
        assert.equal(
          articles[articles.length - 1].querySelector('[aria-label^="Rol:"]'),
          null,
        );
        api.tickets.messages = async () => [
          {
            id: "two",
            sender_id: "missing",
            body: "Perfil eliminado",
            created_at: "2026-01-01",
          },
        ];
        await mount(Conversation, { ...props, revision: 1 });
        assert.match(container.textContent, /Participante/);
        assert.equal(
          container.querySelector('[aria-label="Rol: soporte"]'),
          null,
        );
      },
    );
    await t.test(
      "API-backed mentor lesson reply carries its identity badge",
      async () => {
        const { CoursePlayerView } = await server.ssrLoadModule(
          "/src/views/CoursePlayerView.jsx",
        );
        await mount(CoursePlayerView, {
          course: {
            id: "course",
            title: "Course",
            modules: [
              {
                id: "module",
                title: "Module",
                lessons: [
                  {
                    id: "lesson",
                    title: "Lesson",
                    content: "Reading",
                    resources: [],
                    questions: [
                      {
                        id: "question",
                        question: "¿Cómo?",
                        status: "answered",
                        mentorReply: "Respuesta real",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        });
        await click("Preguntas");
        assert.match(container.textContent, /Respuesta real/);
        assert.ok(container.querySelector('[aria-label="Rol: mentor"]'));
      },
    );
    await t.test(
      "private messages use assigned contacts, preserve failed draft and reject stale contact responses",
      async () => {
        const { MessagesView } = await server.ssrLoadModule(
          "/src/views/MessagesView.jsx",
        );
        let persisted = [];
        let fail = false;
        api.mentorChat.conversations = async () => [
          {
            studentId: "one",
            mentorId: "mentor",
            name: "Ana",
            identityRole: "estudiante",
          },
          {
            studentId: "two",
            mentorId: "mentor",
            name: "Bea",
            identityRole: "estudiante",
          },
        ];
        api.mentorChat.messages = async () => persisted;
        api.mentorChat.send = async (id, body) => {
          if (fail) throw Error("No enviado");
          const row = {
            id: "db-message",
            sender_id: "mentor",
            sender_name: "Luis",
            sender_role: "mentor",
            body,
          };
          persisted = [row];
          return row;
        };
        await mount(MessagesView, { user: { id: "mentor", role: "mentor" } });
        await click("Ana");
        assert.match(container.textContent, /No hay mensajes/);
        await enter("Mensaje", "  ");
        assert.equal(
          [...container.querySelectorAll("button")].find(
            (n) => n.textContent === "Enviar mensaje",
          ).disabled,
          true,
        );
        await enter("Mensaje", "Mensaje persistido");
        fail = true;
        await click("Enviar mensaje");
        assert.match(container.textContent, /No enviado/);
        assert.equal(
          container.querySelector('[aria-label="Mensaje"]').value,
          "Mensaje persistido",
        );
        fail = false;
        await click("Enviar mensaje");
        assert.match(container.textContent, /Mensaje persistido/);
        assert.ok(
          container.querySelector('[role="log"] [aria-label="Rol: mentor"]'),
        );
        await React.act(async () => root.render(null));
        await mount(MessagesView, { user: { id: "mentor", role: "mentor" } });
        await click("Ana");
        assert.match(container.textContent, /Mensaje persistido/);
        let resolveOld;
        api.mentorChat.messages = (id) =>
          id === "two"
            ? new Promise((resolve) => {
                resolveOld = resolve;
              })
            : Promise.resolve([]);
        await click("Bea");
        await click("Ana");
        await React.act(async () =>
          resolveOld([
            { id: "old", body: "STALE PRIVATE", sender_name: "Bea" },
          ]),
        );
        assert.doesNotMatch(container.textContent, /STALE PRIVATE/);
        await React.act(async () => root.render(null));
        api.mentorChat.conversations = async () => [];
        await mount(MessagesView, {
          user: { id: "unassigned", role: "student" },
        });
        assert.match(container.textContent, /No tienes un mentor asignado/);
      },
    );
    await t.test(
      "a poll started during send cannot overwrite the canonical sent message",
      async () => {
        const { MessagesView } = await server.ssrLoadModule(
          "/src/views/MessagesView.jsx",
        );
        await React.act(async () => root.render(null));
        let resolveSend, resolvePoll;
        let count = 0;
        api.mentorChat.conversations = async () => [
          {
            studentId: "one",
            mentorId: "mentor",
            name: "Ana",
            identityRole: "estudiante",
          },
        ];
        api.mentorChat.messages = async () => {
          count++;
          return count === 1
            ? []
            : new Promise((resolve) => {
                resolvePoll = resolve;
              });
        };
        api.mentorChat.send = () =>
          new Promise((resolve) => {
            resolveSend = resolve;
          });
        await mount(MessagesView, { user: { id: "mentor", role: "mentor" } });
        await click("Ana");
        await enter("Mensaje", "Keep canonical send");
        await click("Enviar mensaje");
        await React.act(
          async () => new Promise((resolve) => setTimeout(resolve, 3100)),
        );
        assert.ok(resolvePoll, "poll began during pending send");
        await React.act(async () =>
          resolveSend({
            id: "canonical",
            sender_id: "mentor",
            sender_name: "Luis",
            sender_role: "mentor",
            body: "Keep canonical send",
          }),
        );
        await React.act(async () => resolvePoll([]));
        assert.match(
          container.querySelector('[role="log"]').textContent,
          /Keep canonical send/,
        );
      },
    );
    await t.test(
      "account changes and logout cancel requests and discard previous private results",
      async () => {
        const { MessagesView } = await server.ssrLoadModule(
          "/src/views/MessagesView.jsx",
        );
        await React.act(async () => root.render(null));
        let resolveOld, oldSignal;
        api.mentorChat.conversations = (options) => {
          oldSignal = options.signal;
          return new Promise((resolve) => {
            resolveOld = resolve;
          });
        };
        await mount(MessagesView, {
          user: { id: "old-account", role: "student" },
        });
        assert.match(container.textContent, /Cargando contactos/);
        api.mentorChat.conversations = async () => [];
        await mount(MessagesView, {
          user: { id: "new-account", role: "student" },
        });
        assert.equal(oldSignal.aborted, true);
        await React.act(async () =>
          resolveOld([
            {
              studentId: "private",
              mentorId: "old",
              name: "PRIVATE OLD CONTACT",
            },
          ]),
        );
        assert.doesNotMatch(container.textContent, /PRIVATE OLD CONTACT/);
        assert.match(container.textContent, /No tienes un mentor asignado/);
        let requestSignal, resolveRequest;
        api.mentorChat.conversations = async () => [
          { studentId: "student", mentorId: "mentor", name: "Assigned" },
        ];
        api.mentorChat.messages = (_id, _mentor, options) => {
          requestSignal = options.signal;
          return new Promise((resolve) => {
            resolveRequest = resolve;
          });
        };
        await mount(MessagesView, {
          user: { id: "logout-account", role: "student" },
        });
        await click("Assigned");
        await React.act(async () =>
          root.render(React.createElement("p", null, "Signed out")),
        );
        assert.equal(requestSignal.aborted, true);
        await React.act(async () =>
          resolveRequest([{ id: "old", body: "PRIVATE OLD MESSAGE" }]),
        );
        assert.equal(container.textContent, "Signed out");
      },
    );
    await t.test(
      "old demo query still shows ordinary authenticated login with no test menu",
      async () => {
        await React.act(async () => root.render(null));
        localStorage.clear();
        const { App } = await server.ssrLoadModule("/src/App.jsx");
        await mount(App);
        assert.match(container.textContent, /Ingresar a mi plataforma/);
        assert.equal(container.querySelector('a[href*="demo="]'), null);
        assert.doesNotMatch(container.textContent, /Prueba de foro y chat/);
      },
    );
  } finally {
    await React.act(async () => root.unmount());
    await server.close();
    await window.happyDOM.close();
    for (const [key, value] of saved) {
      if (value) Object.defineProperty(globalThis, key, value);
      else delete globalThis[key];
    }
  }
});
