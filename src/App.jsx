import React, { useState, useEffect, useRef } from "react";
import {
  libraryResources as initialResources,
  notificationsList as initialNotifications,
  membershipPlans,
  communityThreads,
} from "./data/mockData";
import { api, clearSession, hasSession, saveSession } from "./services/api";
import {
  adaptCourse,
  adaptLiveSession,
  adaptMentor,
  adaptMentorQuestion,
  adaptUser,
  adaptVideo,
} from "./services/adapters";

import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { NotificationsModal } from "./components/NotificationsModal";
import { MembershipModal } from "./components/MembershipModal";
import { LiveSessionModal } from "./components/LiveSessionModal";

import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { MentorDashboardView } from "./views/MentorDashboardView";
import { CoursesListView } from "./views/CoursesListView";
import { CoursePlayerView } from "./views/CoursePlayerView";
import { LiveClassesView } from "./views/LiveClassesView";
import { ReplaysView } from "./views/ReplaysView";
import { LibraryView } from "./views/LibraryView";
import { MentorsView } from "./views/MentorsView";
import { CommunityView } from "./views/CommunityView";
import { ProfileView } from "./views/ProfileView";
import { AdminView } from "./views/AdminView";

import { ROLE_VIEWS, homeViewForRole } from "./services/access";
import { authenticateWithResources } from "./services/asyncFlows";
import { loadRoleResources } from "./services/applicationData";
import { TicketsView } from "./views/TicketsView";

const VIEW_PATHS = {
  tickets: "/soporte",
  dashboard: "/panel",
  "mentor-dashboard": "/mentor",
  courses: "/programas",
  live: "/clases-en-vivo",
  replays: "/replays",
  library: "/biblioteca",
  mentors: "/mentores",
  community: "/comunidad",
  profile: "/perfil",
  "admin-overview": "/administrador",
  "admin-courses": "/administrador/cursos",
  "admin-live": "/administrador/sesiones",
  "admin-users": "/administrador/usuarios",
};

const viewFromPath = (pathname) => {
  if (/^\/programas\/[^/]+$/.test(pathname)) return "course-player";
  return (
    Object.entries(VIEW_PATHS).find(([, path]) => path === pathname)?.[0] ||
    null
  );
};

const pathForView = (view, courseId) =>
  view === "course-player" ? `/programas/${courseId}` : VIEW_PATHS[view];

const loadLessonVideo = (lesson) =>
  lesson.videoId
    ? api.videos.playback(lesson.videoId)
    : Promise.resolve({ url: lesson.videoUrl || "" });

const loadLessonResource = (resource) =>
  api.dashboard.resourceAccess(resource.id);

function updateLessonInCourse(course, lessonId, completed) {
  if (!course?.modules?.length) return course;
  let lessonFound = false;
  const modules = course.modules.map((courseModule) => ({
    ...courseModule,
    lessons: courseModule.lessons.map((lesson) => {
      if (lesson.id !== lessonId) return lesson;
      lessonFound = true;
      return { ...lesson, completed };
    }),
  }));

  if (!lessonFound) return course;
  const lessons = modules.flatMap((courseModule) => courseModule.lessons);
  const completedLessonsCount = lessons.filter(
    (lesson) => lesson.completed,
  ).length;
  const progressPercent = lessons.length
    ? Math.round((completedLessonsCount / lessons.length) * 100)
    : 0;

  return {
    ...course,
    modules,
    completedLessonsCount,
    totalLessonsCount: lessons.length,
    progressPercent,
  };
}

function updateLessonDataInCourse(course, lessonId, updater) {
  if (!course?.modules?.length) return course;
  let lessonFound = false;
  const modules = course.modules.map((courseModule) => ({
    ...courseModule,
    lessons: courseModule.lessons.map((lesson) => {
      if (lesson.id !== lessonId) return lesson;
      lessonFound = true;
      return updater(lesson);
    }),
  }));
  return lessonFound ? { ...course, modules } : course;
}

export function App() {
  // Configuración de visualización: Modo Blanco Corporativo
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("traction_theme", "light");
  }, []);

  const authGeneration = useRef(0);
  const resourceJob = useRef(null);

  // Auth & Multi-Role State
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);
  const [isBootstrapping, setIsBootstrapping] = useState(hasSession);
  const [appError, setAppError] = useState("");

  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem("traction_auth_role") || "student";
  });

  const [user, setUser] = useState(null);

  // Application Data State
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [replays, setReplays] = useState([]);
  const [resources] = useState(initialResources);
  const [mentors, setMentors] = useState([]);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [announcements, setAnnouncements] = useState([]);
  const [adminDashboard, setAdminDashboard] = useState({
    stats: {},
    recentActivity: [],
  });
  const [mentorDashboard, setMentorDashboard] = useState({
    stats: {},
    students: [],
    questions: [],
    recentActivity: [],
  });

  // Navigation State
  const [requestedCurrentView, setCurrentView] = useState(() => {
    const routeView = viewFromPath(window.location.pathname);
    if (routeView) return routeView;
    const savedRole = localStorage.getItem("traction_auth_role");
    return homeViewForRole(savedRole);
  });

  const currentView = ROLE_VIEWS[currentRole]?.includes(requestedCurrentView) ? requestedCurrentView : homeViewForRole(currentRole);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Modals State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [liveSessionModalData, setLiveSessionModalData] = useState(null);

  // Sidebar Open / Collapsed State ("guardar y abrir / desplazar")
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("traction_sidebar_open");
    if (saved !== null) return saved === "true";
    return true;
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("traction_sidebar_open", String(next));
      return next;
    });
  };

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  const applyAdminDashboardData = (dashboard) => {
    setAdminDashboard(dashboard || { stats: {}, recentActivity: [] });
    setMentors((dashboard?.mentors || []).map(adaptMentor));
    setUser((current) =>
      current?.role === "admin"
        ? {
            ...current,
            stats: { ...current.stats, ...(dashboard?.stats || {}) },
          }
        : current,
    );
  };

  const refreshAdminDashboard = async () => {
    try {
      const dashboard = await api.dashboard.admin();
      applyAdminDashboardData(dashboard);
    } catch (error) {
      setAppError(
        error.message || "No se pudo actualizar el panel administrativo.",
      );
    }
  };

  const loadApplicationData = async (profile, generation = authGeneration.current, options = {}) => {
    const payload = await loadRoleResources(profile.role, api, options);
    if (!payload) return adaptUser(profile);
    const isStudent =
      profile.role === "estudiante" || profile.role === "alumno";
    const isMentor = profile.role === "mentor" || profile.role === "docente";
    const isAdmin = profile.role === "admin";
    const [coursePayload, sessionRows, videoRows, userRows, dashboard] = payload;
    const dashboardMentors = new Map(
      (dashboard?.mentors || []).map((mentor) => [String(mentor.id), mentor]),
    );
    const courseRows = (dashboard?.courses || coursePayload).map((course) => {
      const mentor = course.docenteId
        ? dashboardMentors.get(String(course.docenteId))
        : null;
      return mentor
        ? {
            ...course,
            mentorName: mentor.fullName,
            mentorTitle: mentor.title,
            mentorAvatar: mentor.avatarUrl,
          }
        : course;
    });
    const adaptedCourses = courseRows.map(adaptCourse);
    const courseStudentCounts = new Map(
      (dashboard?.courses || []).map((course) => [
        String(course.id),
        course.activeStudents || 0,
      ]),
    );
    const adaptedSessions = sessionRows.map((session) => ({
      ...adaptLiveSession(session, adaptedCourses),
      attendeesCount: courseStudentCounts.get(String(session.courseId)) || 0,
    }));
    const adaptedUser = adaptUser(profile);
    adaptedUser.stats = isStudent
      ? {
          ...adaptedUser.stats,
          ...dashboard.stats,
          totalHoursWatched: Number(
            (dashboard.stats.totalMinutesLearned / 60).toFixed(1),
          ),
        }
      : {
          ...adaptedUser.stats,
          ...(dashboard?.stats || {}),
        };

    if (generation !== authGeneration.current || options.signal?.aborted) return adaptedUser;
    setUser(adaptedUser);
    setCourses(adaptedCourses);
    setLiveClasses(adaptedSessions);
    setReplays(videoRows.map(adaptVideo));
    setUsers(userRows);
    setAnnouncements(dashboard?.announcements || []);
    setAdminDashboard(isAdmin ? dashboard : { stats: {}, recentActivity: [] });
    setMentorDashboard(
      isMentor
        ? {
            ...dashboard,
            questions: (dashboard?.questions || []).map(adaptMentorQuestion),
          }
        : { stats: {}, students: [], questions: [], recentActivity: [] },
    );
    if (isAdmin) {
      setMentors(
        (
          dashboard?.mentors ||
          userRows.filter((item) => item.role === "mentor")
        ).map(adaptMentor),
      );
    } else if (isStudent) {
      const mentorById = new Map();
      for (const course of adaptedCourses) {
        if (!course.docenteId || mentorById.has(course.docenteId)) continue;
        mentorById.set(
          course.docenteId,
          adaptMentor({
            id: course.docenteId,
            fullName: course.mentorName,
            title: course.mentorRole,
            avatarUrl: course.mentorAvatar,
          }),
        );
      }
      setMentors([...mentorById.values()]);
    } else {
      setMentors([]);
    }
    return adaptedUser;
  };

  useEffect(() => {
    if (!hasSession()) return;
    let active = true;
    const generation = ++authGeneration.current;
    authenticateWithResources({
      authenticate: () => api.me(),
      isCurrent: () => active && generation === authGeneration.current,
      onAuthenticated: profile => {
        const account = adaptUser(profile);
        setUser(account);
        setCurrentRole(account.role);
        setIsAuthenticated(true);
        localStorage.setItem("traction_authenticated", "true");
        localStorage.setItem("traction_auth_role", account.role);
      },
      onSettled: () => setIsBootstrapping(false),
      loadResources: (profile, options) => loadApplicationData(profile, generation, options),
      onResourceError: error => setAppError(error.message),
      onResourceJob: cancel => { resourceJob.current = cancel; },
    }).catch(error => {
      if (!active || generation !== authGeneration.current) return;
      clearSession(); setIsAuthenticated(false); setUser(null); setAppError(error.message);
    });
    return () => { active = false; resourceJob.current?.(); };
  }, []);

  // Mantener la lista administrativa sincronizada con nuevos registros.
  useEffect(() => {
    if (!isAuthenticated || currentRole !== "admin") return;
    let active = true;

    const refreshUsers = async () => {
      try {
        const latestUsers = await api.users.list();
        if (active) setUsers(latestUsers);
      } catch (error) {
        if (active && error.status !== 401) setAppError(error.message);
      }
    };

    const handleFocus = () => refreshUsers();
    const intervalId = window.setInterval(refreshUsers, 5000);
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    if (!isAuthenticated || currentRole === "soporte") return;
    let active = true;
    const refreshLiveSessions = async () => {
      try {
        const rows = await api.liveSessions.list();
        if (active)
          setLiveClasses(
            rows.map((session) => adaptLiveSession(session, courses)),
          );
      } catch (error) {
        if (active && error.status !== 401) setAppError(error.message);
      }
    };
    const intervalId = window.setInterval(refreshLiveSessions, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, currentRole, courses]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      if (window.location.pathname !== "/login")
        window.history.replaceState({}, "", "/login");
      return;
    }

    const requestedView = viewFromPath(window.location.pathname);
    const allowed =
      requestedView && ROLE_VIEWS[currentRole]?.includes(requestedView);
    if (!allowed) {
      const homeView = homeViewForRole(currentRole);
      setCurrentView(homeView);
      window.history.replaceState({}, "", pathForView(homeView));
    }
  }, [isAuthenticated, isBootstrapping, currentRole]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticated) {
        setCurrentView(homeViewForRole(currentRole));
        return;
      }
      const nextView = viewFromPath(window.location.pathname);
      if (nextView && ROLE_VIEWS[currentRole]?.includes(nextView)) {
        setCurrentView(nextView);
      } else {
        const homeView = homeViewForRole(currentRole);
        setCurrentView(homeView);
        window.history.replaceState({}, "", pathForView(homeView));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/programas\/([^/]+)$/);
    if (!match || !courses.length) return;
    const course = courses.find(
      (item) => String(item.id) === decodeURIComponent(match[1]),
    );
    if (!course) return;
    setSelectedCourse(course);
    const lessons = course.modules?.flatMap((module) => module.lessons) || [];
    setSelectedLessonId(
      (current) =>
        current ||
        lessons.find((lesson) => !lesson.completed)?.id ||
        lessons[0]?.id ||
        null,
    );
  }, [courses]);

  // Handle real API login
  const handleLogin = async ({ email, password }) => {
    resourceJob.current?.();
    const generation = ++authGeneration.current;
    await authenticateWithResources({
      authenticate: () => api.login(email, password),
      isCurrent: () => generation === authGeneration.current,
      onAuthenticated: session => {
        saveSession(session);
        const account = adaptUser(session.user);
        setAppError(""); setUser(account); setCurrentRole(account.role); setIsAuthenticated(true);
        localStorage.setItem("traction_authenticated", "true");
        localStorage.setItem("traction_auth_role", account.role);
        const homeView = homeViewForRole(account.role);
        setCurrentView(homeView);
        window.history.replaceState({}, "", pathForView(homeView));
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onSettled: () => setIsBootstrapping(false),
      loadResources: (session, options) => loadApplicationData(session.user, generation, options),
      onResourceError: error => setAppError(error.message),
      onResourceJob: cancel => { resourceJob.current = cancel; },
    });
  };

  const handleRegister = async ({ fullName, email, password }) => {
    await api.register(fullName, email, password);
    await handleLogin({ email, password });
  };

  // Handle Logout
  const handleLogout = () => {
    resourceJob.current?.();
    ++authGeneration.current;
    clearSession();
    setIsBootstrapping(false);
    setUsers([]); setReplays([]); setMentors([]);
    setSelectedCourse(null); setSelectedLessonId(null);
    setLiveSessionModalData(null);
    setIsNotificationsOpen(false); setIsMembershipModalOpen(false);
    setAppError("");
    setIsAuthenticated(false);
    setUser(null);
    setCourses([]);
    setLiveClasses([]);
    setAnnouncements([]);
    setAdminDashboard({ stats: {}, recentActivity: [] });
    setMentorDashboard({
      stats: {},
      students: [],
      questions: [],
      recentActivity: [],
    });
    setCurrentView("dashboard");
    window.history.replaceState({}, "", "/login");
  };

  useEffect(() => {
    const expire = () => handleLogout();
    window.addEventListener("traction:session-expired", expire);
    return () => window.removeEventListener("traction:session-expired", expire);
  }, []);

  // Handle Update User Profile
  const handleUpdateUser = async (updatedData, avatarFile) => {
    const payload = {
      fullName: updatedData.name,
      email: updatedData.email,
      title: updatedData.title,
      company: updatedData.company,
      phone: updatedData.phone,
      location: updatedData.location,
      linkedin: updatedData.linkedin || undefined,
      website: updatedData.website || undefined,
      bio: updatedData.bio,
    };
    if (
      !avatarFile &&
      updatedData.avatar &&
      !updatedData.avatar.startsWith("data:")
    )
      payload.avatarUrl = updatedData.avatar;
    let saved = await api.profile.update(payload);
    if (avatarFile) saved = await api.profile.uploadAvatar(avatarFile);
    const adapted = adaptUser(saved);
    setUser((previous) => ({ ...previous, ...adapted, stats: previous.stats }));
    return adapted;
  };

  // Handle Navigation
  const handleNavigate = (viewId) => {
    if (!ROLE_VIEWS[currentRole]?.includes(viewId)) return;
    setCurrentView(viewId);
    const nextPath = pathForView(viewId, selectedCourse?.id);
    if (nextPath && window.location.pathname !== nextPath)
      window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Course in Player
  const handleSelectCourse = (course) => {
    if (!course.modules?.length) {
      setAppError(
        "Este curso todavía no tiene módulos publicados en el backend.",
      );
      return;
    }
    setSelectedCourse(course);
    // Select first lesson or first uncompleted
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const firstUncompleted = allLessons.find((l) => !l.completed);
    setSelectedLessonId(
      firstUncompleted ? firstUncompleted.id : allLessons[0]?.id || null,
    );
    setCurrentView("course-player");
    window.history.pushState({}, "", pathForView("course-player", course.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle Lesson Completion and Recalculate Course Progress Percentage
  const handleToggleLessonCompletion = async (courseId, lessonId) => {
    const course = courses.find((item) => item.id === courseId);
    const lesson = course?.modules
      ?.flatMap((courseModule) => courseModule.lessons)
      .find((item) => item.id === lessonId);
    if (!lesson) return;

    const nextCompleted = !lesson.completed;
    const applyCompletion = (completed) => {
      setCourses((current) =>
        current.map((item) =>
          item.id === courseId
            ? updateLessonInCourse(item, lessonId, completed)
            : item,
        ),
      );
      setSelectedCourse((current) =>
        current?.id === courseId
          ? updateLessonInCourse(current, lessonId, completed)
          : current,
      );
      setUser((current) => ({
        ...current,
        stats: {
          ...current.stats,
          completedLessons: Math.max(
            0,
            current.stats.completedLessons + (completed ? 1 : -1),
          ),
        },
      }));
    };

    applyCompletion(nextCompleted);
    try {
      await api.dashboard.updateLessonProgress(lessonId, nextCompleted);
      setAppError("");
    } catch (error) {
      applyCompletion(!nextCompleted);
      setAppError(
        error.message || "No se pudo guardar el progreso de la lección.",
      );
    }
  };

  const handleSaveLessonNote = async (courseId, lessonId, content) => {
    const saved = await api.dashboard.saveLessonNote(lessonId, content);
    const updateNote = (course) =>
      updateLessonDataInCourse(course, lessonId, (lesson) => ({
        ...lesson,
        note: saved.content,
        noteUpdatedAt: saved.updatedAt,
      }));
    setCourses((current) =>
      current.map((course) =>
        course.id === courseId ? updateNote(course) : course,
      ),
    );
    setSelectedCourse((current) =>
      current?.id === courseId ? updateNote(current) : current,
    );
    return saved;
  };

  const handleCreateLessonQuestion = async (courseId, lessonId, question) => {
    const created = await api.dashboard.createLessonQuestion(
      lessonId,
      question,
    );
    const appendQuestion = (course) =>
      updateLessonDataInCourse(course, lessonId, (lesson) => ({
        ...lesson,
        questions: [created, ...(lesson.questions || [])],
      }));
    setCourses((current) =>
      current.map((course) =>
        course.id === courseId ? appendQuestion(course) : course,
      ),
    );
    setSelectedCourse((current) =>
      current?.id === courseId ? appendQuestion(current) : current,
    );
    return created;
  };

  const handleAnswerMentorQuestion = async (questionId, reply) => {
    const updated = await api.dashboard.answerMentorQuestion(questionId, reply);
    setMentorDashboard((current) => ({
      ...current,
      stats: {
        ...current.stats,
        questionsPending: Math.max(
          0,
          (current.stats?.questionsPending || 0) - 1,
        ),
        questionsAnswered: (current.stats?.questionsAnswered || 0) + 1,
      },
      questions: current.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              status: "Respondida",
              mentorReply: updated.mentorReply,
              answeredAt: updated.answeredAt,
              updatedAt: updated.updatedAt,
            }
          : question,
      ),
    }));
    setUser((current) => ({
      ...current,
      stats: {
        ...current.stats,
        questionsPending: Math.max(
          0,
          (current.stats?.questionsPending || 0) - 1,
        ),
        questionsAnswered: (current.stats?.questionsAnswered || 0) + 1,
      },
    }));
    return updated;
  };

  // Membership tier change handler
  const handleSelectTier = (tierId, tierName) => {
    setUser((prev) => ({
      ...prev,
      plan: tierName,
      planTier: tierId,
    }));
  };

  // Notifications handlers
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    if (notif.type === "live") {
      handleNavigate("live");
    } else if (notif.type === "resource") {
      handleNavigate("library");
    } else if (notif.type === "replay") {
      handleNavigate("replays");
    }
    setIsNotificationsOpen(false);
  };

  // Admin add course
  const handleAddCourse = async (newCourse) => {
    const created = await api.courses.create({
      title: newCourse.title,
      description: newCourse.tagline || "",
    });
    setCourses((current) => [adaptCourse(created, current.length), ...current]);
    await refreshAdminDashboard();
  };

  // Admin schedule live class
  const handleAddLiveClass = async (newLive) => {
    if (!newLive.courseId) throw new Error("Selecciona el curso de la sesión.");
    const created = await api.liveSessions.create({
      courseId: newLive.courseId,
      title: newLive.title,
      scheduledAt: newLive.scheduledAt,
      durationMinutes: newLive.durationMinutes,
    });
    setLiveClasses((current) => [
      adaptLiveSession(created, courses),
      ...current,
    ]);
    await refreshAdminDashboard();
  };

  const handleUpdateUserRole = async (userId, role) => {
    const updated = await api.users.updateRole(userId, role);
    setUsers((current) =>
      current.map((item) => (item.id === userId ? updated : item)),
    );
    await refreshAdminDashboard();
    return updated;
  };

  const handleCreateUser = async (input) => {
    const created = await api.users.create(input);
    setUsers((current) => [created, ...current]);
    await refreshAdminDashboard();
    return created;
  };

  const handleAssignUserToCourse = async (userId, role, courseId) => {
    if (role === "mentor" || role === "docente") {
      const updatedCourse = await api.courses.assignTeacher(courseId, userId);
      const assignedMentor = users.find((account) => account.id === userId);
      const adaptedCourse = adaptCourse({
        ...updatedCourse,
        mentorName: assignedMentor?.fullName,
        mentorTitle: assignedMentor?.title,
        mentorAvatar: assignedMentor?.avatarUrl,
      });
      setCourses((current) =>
        current.map((course) =>
          course.id === courseId ? adaptedCourse : course,
        ),
      );
      await refreshAdminDashboard();
      return updatedCourse;
    }
    if (role === "estudiante" || role === "alumno") {
      const enrollment = await api.courses.enroll(courseId, userId);
      await refreshAdminDashboard();
      return enrollment;
    }
    throw new Error("Los administradores no requieren asignación a cursos.");
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  if (isBootstrapping) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--bg-main)",
          color: "var(--text-main)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo.png"
            alt="Comunidad del Intercambio"
            style={{ width: 64, height: 64, objectFit: "contain" }}
          />
          <p style={{ marginTop: 14, color: "var(--text-muted)" }}>
            Conectando con la plataforma…
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, renderizar el portal corporativo de Login
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div
      className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}
      data-theme="light"
    >
      {/* Backdrop para móviles al abrir la barra lateral */}
      {isSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={handleToggleSidebar}
          title="Toca para guardar menú lateral"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentRole={currentRole}
        user={user}
        liveClasses={liveClasses}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Main Content Area */}
      <div
        className={`main-content-wrapper ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}
      >
        <Header
          user={user}
          currentRole={currentRole}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={unreadNotificationsCount}
          onOpenMembershipModal={() => setIsMembershipModalOpen(true)}
          onNavigate={handleNavigate}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLogout={handleLogout}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="content-body">
          {appError && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                borderRadius: 10,
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                color: "#9A3412",
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span>{appError}</span>
              <button
                type="button"
                onClick={() => setAppError("")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cerrar
              </button>
            </div>
          )}
          {currentView === "tickets" && (currentRole === "soporte" || currentRole === "student") && <TicketsView key={user.id} user={user} searchTerm={searchTerm} />}
          {/* Vista: Dashboard de Estudiante */}
          {currentView === "dashboard" && (
            <DashboardView
              user={user}
              courses={courses}
              liveClasses={liveClasses}
              announcements={announcements}
              onSelectCourse={handleSelectCourse}
              onOpenLiveSession={(live) => setLiveSessionModalData(live)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Vista: Dashboard del Mentor */}
          {currentView === "mentor-dashboard" && (
            <MentorDashboardView
              user={user}
              liveClasses={liveClasses}
              courses={courses}
              dashboard={mentorDashboard}
              onAnswerQuestion={handleAnswerMentorQuestion}
              onOpenLiveSession={(live) => setLiveSessionModalData(live)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Vista: Catálogo de Cursos */}
          {currentView === "courses" && (
            <CoursesListView
              courses={courses}
              onSelectCourse={handleSelectCourse}
            />
          )}

          {/* Vista: Reproductor de Cursos y Lecciones */}
          {currentView === "course-player" && selectedCourse && (
            <CoursePlayerView
              course={selectedCourse}
              initialLessonId={selectedLessonId}
              onBack={() => handleNavigate("courses")}
              onToggleLessonCompletion={handleToggleLessonCompletion}
              onLoadLessonVideo={loadLessonVideo}
              onOpenLessonResource={loadLessonResource}
              onSaveLessonNote={handleSaveLessonNote}
              onCreateLessonQuestion={handleCreateLessonQuestion}
            />
          )}

          {/* Vista: Clases en Vivo & Calendario */}
          {currentView === "live" && (
            <LiveClassesView
              liveClasses={liveClasses}
              onOpenLiveSession={(live) => setLiveSessionModalData(live)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Vista: Videoteca de Replays (Grabaciones) */}
          {currentView === "replays" && (
            <ReplaysView
              replays={replays}
              onNavigate={handleNavigate}
              onPlay={(video) => api.videos.playback(video.id)}
            />
          )}

          {/* Vista: Biblioteca de Recursos y Plantillas */}
          {currentView === "library" && <LibraryView resources={resources} />}

          {/* Vista: Mentores de Élite */}
          {currentView === "mentors" && (
            <MentorsView
              mentors={mentors}
              courses={courses}
              onSelectCourse={handleSelectCourse}
            />
          )}

          {/* Vista: Comunidad & Debates */}
          {currentView === "community" && (
            <CommunityView threads={communityThreads} user={user} />
          )}

          {/* Vista: Mi Perfil & Datos */}
          {currentView === "profile" && (
            <ProfileView
              user={user}
              onUpdateUser={handleUpdateUser}
              courses={courses}
              onNavigate={handleNavigate}
            />
          )}

          {/* Vistas de Administración (CMS) */}
          {(currentView === "admin-overview" ||
            currentView === "admin-courses" ||
            currentView === "admin-live" ||
            currentView === "admin-users") && (
            <AdminView
              courses={courses}
              liveClasses={liveClasses}
              onAddCourse={handleAddCourse}
              onAddLiveClass={handleAddLiveClass}
              mentors={mentors}
              users={users}
              dashboard={adminDashboard}
              currentUserId={user.id}
              onUpdateUserRole={handleUpdateUserRole}
              onAssignUserToCourse={handleAssignUserToCourse}
              onCreateUser={handleCreateUser}
              currentView={currentView}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Modal de Notificaciones */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
      />

      {/* Modal de Planes de Membresía */}
      <MembershipModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        plans={membershipPlans}
        currentTier={user.planTier}
        onSelectTier={handleSelectTier}
      />

      {/* Modal de Sala de Clase en Vivo */}
      <LiveSessionModal
        isOpen={!!liveSessionModalData}
        onClose={() => setLiveSessionModalData(null)}
        liveClass={liveSessionModalData}
      />
    </div>
  );
}

export default App;
