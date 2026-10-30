import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
test("student library, calendar and Zoom access render real content and empty states", async () => {
  const server = await createServer({
    cacheDir: "node_modules/.vite-tests/student-views",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { LibraryView } = await server.ssrLoadModule(
      "/src/views/LibraryView.jsx",
    );
    const { LiveClassesView } = await server.ssrLoadModule(
      "/src/views/LiveClassesView.jsx",
    );
    globalThis.localStorage = { getItem: () => null };
    const { CoursePlayerView } = await server.ssrLoadModule(
      "/src/views/CoursePlayerView.jsx",
    );
    const emptyCourse = renderToStaticMarkup(
      React.createElement(CoursePlayerView, {
        course: { id: "c", modules: [] },
      }),
    );
    assert.match(emptyCourse, /Contenido por publicar/);
    const { LiveSessionModal } = await server.ssrLoadModule(
      "/src/components/LiveSessionModal.jsx",
    );
    const library = renderToStaticMarkup(
      React.createElement(LibraryView, { courses: [], replays: [] }),
    );
    assert.match(library, /Sin contenido disponible/);
    assert.doesNotMatch(library, /alert\(/);
    const scheduledAt = new Date().toISOString();
    const session = {
      id: "s",
      title: "Clase de prueba",
      scheduledAt,
      mentorName: "Profesora de prueba",
      effectiveStatus: "scheduled",
      joinUrl: "https://company.zoom.us/j/123",
      meetingId: "12345678901",
      meetingPasscode: "GuestCode1",
    };
    const calendar = renderToStaticMarkup(
      React.createElement(LiveClassesView, { liveClasses: [session] }),
    );
    assert.match(calendar, /Profesora de prueba/);
    assert.match(calendar, /Mes siguiente/);
    assert.match(calendar, /Clase de prueba/);
    const modal = renderToStaticMarkup(
      React.createElement(LiveSessionModal, {
        isOpen: true,
        liveClass: session,
      }),
    );
    assert.match(modal, /href="https:\/\/company.zoom.us\/j\/123"/);
    assert.match(modal, /noopener noreferrer/);
    assert.match(modal, /Ingreso manual a Zoom/);
    assert.match(modal, /12345678901/);
    assert.match(modal, /GuestCode1/);
    const closed = renderToStaticMarkup(
      React.createElement(LiveSessionModal, {
        isOpen: true,
        liveClass: { ...session, effectiveStatus: "ended" },
      }),
    );
    assert.doesNotMatch(closed, /href=/);
    assert.doesNotMatch(closed, /GuestCode1/);
    assert.match(closed, /ha finalizado/);

    const { MentorCoursesView } = await server.ssrLoadModule(
      "/src/views/MentorCoursesView.jsx",
    );
    const mentorCourse = {
      id: "course-a",
      title: "Mi curso asignado",
      docenteId: "mentor-a",
      modules: [
        {
          id: "module-a",
          title: "Modulo real",
          lessons: [
            {
              id: "lesson-a",
              title: "Leccion real",
              content: "Contenido del programa",
            },
          ],
        },
      ],
    };
    const mentorHtml = renderToStaticMarkup(
      React.createElement(MentorCoursesView, {
        courses: [mentorCourse],
        students: [],
        liveClasses: [],
      }),
    );
    assert.match(mentorHtml, /Mi curso asignado/);
    assert.match(mentorHtml, /Modulo real/);
    assert.match(mentorHtml, /Leccion real/);
    assert.match(mentorHtml, /Matricular estudiante por correo/);
    const { MentorsView } = await server.ssrLoadModule(
      "/src/views/MentorsView.jsx",
    );
    const profiles = renderToStaticMarkup(
      React.createElement(MentorsView, {
        mentors: [
          {
            id: "mentor-a",
            name: "Mentora real",
            bio: "Biografia guardada",
            role: "Especialista",
            company: "Organizacion",
          },
        ],
        courses: [mentorCourse],
      }),
    );
    assert.match(profiles, /Biografia guardada/);
    assert.doesNotMatch(profiles, /Machine de Ventas|empresarios entrenados/);
    const { NotificationsModal } = await server.ssrLoadModule(
      "/src/components/NotificationsModal.jsx",
    );
    const notifications = renderToStaticMarkup(
      React.createElement(NotificationsModal, {
        isOpen: true,
        notifications: [],
      }),
    );
    assert.match(notifications, /No tienes notificaciones disponibles/);
    const { AnnouncementsView } = await server.ssrLoadModule(
      "/src/views/AnnouncementsView.jsx",
    );
    const form = renderToStaticMarkup(
      React.createElement(AnnouncementsView, {
        role: "mentor",
        courses: [mentorCourse],
      }),
    );
    assert.match(form, /Mi curso asignado/);
    assert.doesNotMatch(form, /Toda la comunidad academica/);

    const { AdminAccessView } = await server.ssrLoadModule(
      "/src/views/AdminAccessView.jsx",
    );
    const accessAdmin = renderToStaticMarkup(
      React.createElement(AdminAccessView, {
        courses: [mentorCourse],
        users: [
          {
            id: "student-real",
            role: "estudiante",
            fullName: "Estudiante real",
            email: "student@example.com",
          },
        ],
      }),
    );
    assert.match(accessAdmin, /Estudiante real/);
    assert.match(accessAdmin, /Solo clases en vivo/);
    assert.match(accessAdmin, /Vigencia hasta/);
    assert.match(accessAdmin, /Suspendido/);
    const { AdminCurriculumView } = await server.ssrLoadModule(
      "/src/views/AdminCurriculumView.jsx",
    );
    const curriculumAdmin = renderToStaticMarkup(
      React.createElement(AdminCurriculumView, {
        courses: [mentorCourse],
        mentors: [],
      }),
    );
    assert.match(curriculumAdmin, /Mi curso asignado/);
    assert.match(curriculumAdmin, /Editor de cursos/);
  } finally {
    await server.close();
  }
});
