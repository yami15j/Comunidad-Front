import { studentAccessSnapshot } from "./services/studentAccess";
import { AdminRecordings } from "./components/AdminRecordings";
import { LoaderCircle } from "lucide-react";
import { Brand, EmptyState } from "./components/ui";
import React, { useState, useEffect, useRef } from "react";
import { MessagesView } from "./views/MessagesView";
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
import { useNotifications } from "./hooks/useNotifications";
import { useTheme } from "./hooks/useTheme";
import { AdminCurriculumView } from "./views/AdminCurriculumView";
import { AdminAccessView } from "./views/AdminAccessView";
import { AnnouncementsView } from "./views/AnnouncementsView";
import { MentorCoursesView } from "./views/MentorCoursesView";
import { MentorLiveManager } from "./views/MentorLiveManager";
import { RecordingUpload } from "./components/RecordingUpload";
import { TicketsView } from "./views/TicketsView";
import { PasswordRecoveryView, readPasswordRecovery } from "./views/PasswordRecoveryView";

const VIEW_PATHS = {
  "admin-support": "/administrador/soporte",
  "admin-curriculum": "/administrador/cursos/contenido",
  "admin-access": "/administrador/accesos",
  "admin-mentors": "/administrador/mentores",
  "admin-notifications": "/administrador/avisos",
  "mentor-courses": "/mentor/cursos",
  "mentor-notifications": "/mentor/avisos",
  tickets: "/soporte",
  dashboard: "/panel",
  "mentor-dashboard": "/mentor",
  courses: "/programas",
  live: "/clases-en-vivo",
  replays: "/replays",
  library: "/biblioteca",
  mentors: "/mentores",
  community: "/comunidad",
  messages: "/mensajes",
  profile: "/perfil",
  "admin-overview": "/administrador",
  "admin-courses": "/administrador/cursos",
  "admin-live": "/administrador/sesiones",
  "admin-users": "/administrador/usuarios",
};

const viewFromPath = (pathname) => {
  if (pathname === "/administrador/contenido") return "admin-curriculum";
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
  const [passwordRecovery, setPasswordRecovery] = useState(() => readPasswordRecovery(window.location));
  useEffect(() => {
    if (passwordRecovery) window.history.replaceState({}, '', '/recuperar-contrasena');
  }, [passwordRecovery]);
  const { theme, toggleTheme } = useTheme();

  const authGeneration = useRef(0);
  const courseOpenGeneration = useRef(0);
  const resourceJob = useRef(null);
  const mentorDataRevision = useRef(0);

  // Auth & Multi-Role State
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);
  const [isBootstrapping, setIsBootstrapping] = useState(hasSession);
  const [appError, setAppError] = useState("");
  const [communicationTarget, setCommunicationTarget] = useState(null);
  const [notificationTicketId, setNotificationTicketId] = useState(null);

  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem("traction_auth_role") || "student";
  });

  const [user, setUser] = useState(null);

  // Application Data State
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [replays, setReplays] = useState([]);
  const [isWatchingReplay, setIsWatchingReplay] = useState(false);

  const [mentors, setMentors] = useState([]);

  const [adminCourseId, setAdminCourseId] = useState(
    () => new URLSearchParams(window.location.search).get("curso") || "",
  );

  const [announcements, setAnnouncements] = useState([]);
  const studentDataRevision = useRef(0);
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

  const [supportFilter, setSupportFilter] = useState("pending");
  const [supportCounts, setSupportCounts] = useState({ pending: 0, resolved: 0, all: 0 });

  // Navigation State
  const [requestedCurrentView, setCurrentView] = useState(() => {
    const routeView = viewFromPath(window.location.pathname);
    if (routeView) return routeView;
    const savedRole = localStorage.getItem("traction_auth_role");
    return homeViewForRole(savedRole);
  });

  const currentView = ROLE_VIEWS[currentRole]?.includes(requestedCurrentView)
    ? requestedCurrentView
    : homeViewForRole(currentRole);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [routeRevision, setRouteRevision] = useState(0);

  // Modals State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [liveSessionModalData, setLiveSessionModalData] = useState(null);
  const [notificationLiveTarget, setNotificationLiveTarget] = useState(null);

  // Sidebar Open / Collapsed State ("guardar y abrir / desplazar")
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return false;
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
    if (dashboard?.courses) setCourses(dashboard.courses.map(adaptCourse));
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

  const loadApplicationData = async (
    profile,
    generation = authGeneration.current,
    options = {},
  ) => {
    const payload = await loadRoleResources(profile.role, api, options);
    if (!payload) return adaptUser(profile);
    const isStudent =
      profile.role === "estudiante" || profile.role === "alumno";
    const isMentor = profile.role === "mentor" || profile.role === "docente";
    const isAdmin = profile.role === "admin";
    const [coursePayload, sessionRows, videoRows, userRows, dashboard] =
      payload;
    const dashboardMentors = new Map(
      (dashboard?.mentors || []).map((mentor) => [String(mentor.id), mentor]),
    );
    const studentSnapshot = isStudent ? studentAccessSnapshot({ dashboard, videos: videoRows, sessions: sessionRows }) : null;
    const courseRows = (studentSnapshot?.courses || dashboard?.courses || coursePayload).map((course) => {
      const mentor = isStudent ? dashboard?.mentors?.[0] : course.docenteId
        ? dashboardMentors.get(String(course.docenteId))
        : null;
      if (isStudent) return {
        ...course,
        mentorName: mentor?.fullName || "Mentor por asignar",
        mentorTitle: mentor?.title || "Tu mentor asignado",
        mentorAvatar: mentor?.avatarUrl || "",
      };
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
    const adaptedSessions = (studentSnapshot?.sessions || sessionRows).map((session) => ({
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

    if (generation !== authGeneration.current || options.signal?.aborted)
      return adaptedUser;
    setUser(adaptedUser);
    setCourses(adaptedCourses);
    setLiveClasses(adaptedSessions);
    setReplays((studentSnapshot?.videos || videoRows).map((video) => adaptVideo(video, adaptedCourses)));
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
      setMentors((dashboard.mentors || []).map(adaptMentor));
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
      onAuthenticated: (profile) => {
        const account = adaptUser(profile);
        setUser(account);
        setCurrentRole(account.role);
        setIsAuthenticated(true);
        localStorage.setItem("traction_authenticated", "true");
        localStorage.setItem("traction_auth_role", account.role);
      },
      onSettled: () => setIsBootstrapping(false),
      loadResources: (profile, options) =>
        loadApplicationData(profile, generation, options),
      onResourceError: (error) => setAppError(error.message),
      onResourceJob: (cancel) => {
        resourceJob.current = cancel;
      },
    }).catch((error) => {
      if (!active || generation !== authGeneration.current) return;
      clearSession();
      setIsAuthenticated(false);
      setUser(null);
      setAppError(error.message);
    });
    return () => {
      active = false;
      resourceJob.current?.();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || currentRole !== "student" || !user?.id) return;
    const controller = new AbortController();
    const generation = authGeneration.current;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const options = { signal: controller.signal };
        const revision = studentDataRevision.current;
        const profile = await api.me(options);
        if (controller.signal.aborted || generation !== authGeneration.current) return;
        const account = adaptUser(profile);
        if (account.role !== "student") {
          await loadApplicationData(profile, generation, options);
          if (controller.signal.aborted || generation !== authGeneration.current) return;
          setCurrentRole(account.role); setCurrentView(homeViewForRole(account.role));
          localStorage.setItem("traction_auth_role", account.role); return;
        }
        const [dashboard, videos, sessions] = await Promise.all([api.dashboard.student(options), api.videos.list(options), api.liveSessions.list(options)]);
        if (controller.signal.aborted || generation !== authGeneration.current) return;
        const snapshot = studentAccessSnapshot({ dashboard, videos, sessions });
        if (revision !== studentDataRevision.current) return;
        const mentor = dashboard.mentors?.[0];
        const freshCourses = snapshot.courses.map(course => adaptCourse({ ...course, mentorName: mentor?.fullName || "Mentor por asignar", mentorTitle: mentor?.title || "Tu mentor asignado", mentorAvatar: mentor?.avatarUrl || "" }));
        const preserve = (previous, next) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
        setCourses(previous => preserve(previous, freshCourses));
        setReplays(previous => preserve(previous, snapshot.videos.map(video => adaptVideo(video, freshCourses))));
        setLiveClasses(previous => preserve(previous, snapshot.sessions.map(session => adaptLiveSession(session, freshCourses))));
        setMentors(previous => preserve(previous, (dashboard.mentors || []).map(adaptMentor)));
        setLiveSessionModalData(current => current ? preserve(current, snapshot.sessions.find(session => session.id === current.id) ? adaptLiveSession(snapshot.sessions.find(session => session.id === current.id), freshCourses) : null) : current);
        setAnnouncements(previous => preserve(previous, dashboard.announcements || []));
        setUser(previous => preserve(previous, { ...previous, ...account, stats: { ...previous?.stats, ...dashboard.stats, totalHoursWatched: Number(((dashboard.stats?.totalMinutesLearned || 0) / 60).toFixed(1)) } }));
        setSelectedCourse(current => {
          if (!current) return current;
          const updated = freshCourses.find(course => course.id === current.id);
          return updated && updated.accessType !== "live" ? preserve(current, updated) : null;
        });
      } catch (error) { if (!controller.signal.aborted) setAppError("No se pudieron actualizar tus accesos: " + error.message); }
      finally { pending = false; }
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); };
  }, [isAuthenticated, isBootstrapping, currentRole, user?.id]);

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
    if (isBootstrapping || passwordRecovery) return;
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
  }, [isAuthenticated, isBootstrapping, currentRole, passwordRecovery]);

  useEffect(() => {
    const handlePopState = () => {
      if (passwordRecovery) return;
      ++courseOpenGeneration.current;
      // A different course can share the same view; URL changes must reload it.
      setSelectedCourse(null);
      setSelectedLessonId(null);
      setRouteRevision((revision) => revision + 1);
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
  }, [isAuthenticated, currentRole, passwordRecovery]);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/programas\/([^/]+)$/);
    if (!match || !courses.length) return;
    const course = courses.find(
      (item) => encodeURIComponent(String(item.id)) === match[1],
    );
    if (!course || course.accessType === "live" || selectedCourse?.id === course.id) return;
    let active = true;
    const generation = authGeneration.current;
    const load = async () => {
      let resume = null;
      if (currentRole === "student") {
        try {
          resume = await api.dashboard.resume(course.id);
        } catch (error) {
          if (active)
            setAppError("No se pudo recuperar tu avance: " + error.message);
        }
      }
      if (!active || generation !== authGeneration.current) return;
      const lessons = course.modules?.flatMap((module) => module.lessons) || [];
      setSelectedLessonId(
        lessons.find((lesson) => lesson.id === resume?.lessonId)?.id ||
          lessons.find((lesson) => !lesson.completed)?.id ||
          lessons[0]?.id ||
          null,
      );
      setSelectedCourse({ ...course, resume });
    };
    load();
    return () => {
      active = false;
    };
  }, [courses, currentRole, selectedCourse?.id, routeRevision]);

  // Handle real API login
  const handleLogin = async ({ email, password }) => {
    resourceJob.current?.();
    const generation = ++authGeneration.current;
    await authenticateWithResources({
      authenticate: () => api.login(email, password),
      isCurrent: () => generation === authGeneration.current,
      onAuthenticated: (session) => {
        saveSession(session);
        const account = adaptUser(session.user);
        setAppError("");
        setUser(account);
        setCurrentRole(account.role);
        setIsAuthenticated(true);
        localStorage.setItem("traction_authenticated", "true");
        localStorage.setItem("traction_auth_role", account.role);
        const homeView = homeViewForRole(account.role);
        setCurrentView(homeView);
        window.history.replaceState({}, "", pathForView(homeView));
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onSettled: () => setIsBootstrapping(false),
      loadResources: (session, options) =>
        loadApplicationData(session.user, generation, options),
      onResourceError: (error) => setAppError(error.message),
      onResourceJob: (cancel) => {
        resourceJob.current = cancel;
      },
    });
  };


  // Handle Logout
  const handleLogout = () => {
    resourceJob.current?.();
    ++authGeneration.current;
    clearSession();
    setIsBootstrapping(false);
    setUsers([]);
    setReplays([]);
    setMentors([]);
    setSelectedCourse(null);
    setSelectedLessonId(null);
    setLiveSessionModalData(null);
    setIsNotificationsOpen(false);
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
    // localStorage is shared by tabs. Revalidate the profile when another tab
    // switches accounts instead of retaining the previous account's role/UI.
    const synchronizeSession = (event) => {
      if (event.key === null || (event.key === "traction_access_token" &&
          event.oldValue !== event.newValue)) {
        window.location.reload();
      }
    };
    window.addEventListener("traction:session-expired", expire);
    window.addEventListener("storage", synchronizeSession);
    return () => {
      window.removeEventListener("traction:session-expired", expire);
      window.removeEventListener("storage", synchronizeSession);
    };
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
    studentDataRevision.current += 1;
    const adapted = adaptUser(saved);
    setUser((previous) => ({ ...previous, ...adapted, stats: previous.stats }));
    if (currentRole === "mentor") {
      const profileFields = { mentorName: adapted.name, mentorTitle: saved.title || "Mentor", mentorAvatar: saved.avatarUrl || "" };
      setCourses(rows => rows.map(course => ({ ...course, ...profileFields })));
      setLiveClasses(rows => rows.map(session => ({ ...session, ...profileFields })));
    }
    return adapted;
  };

  // Handle Navigation
  const handleNavigate = (viewId) => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    if (!ROLE_VIEWS[currentRole]?.includes(viewId)) return;
    setLiveSessionModalData(null);
    setCurrentView(viewId);
    const nextPath = pathForView(viewId, selectedCourse?.id);
    if (nextPath && window.location.pathname !== nextPath)
      window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Course in Player
  const handleSelectCourse = async (course) => {
    if (course.accessType === "live") {
      handleNavigate("live");
      return;
    }
    const requestId = ++courseOpenGeneration.current;
    const generation = authGeneration.current;
    let resume = null;
    if (currentRole === "student") {
      try {
        resume = await api.dashboard.resume(course.id);
      } catch (error) {
        setAppError(
          "No se pudo recuperar el punto de avance: " + error.message,
        );
      }
    }
    if (
      requestId !== courseOpenGeneration.current ||
      generation !== authGeneration.current
    )
      return;
    setSelectedCourse({ ...course, resume });
    // Select first lesson or first uncompleted
    const allLessons = (course.modules || []).flatMap((m) => m.lessons);
    const firstUncompleted = allLessons.find((l) => !l.completed);
    setSelectedLessonId(
      allLessons.some((lesson) => lesson.id === resume?.lessonId)
        ? resume.lessonId
        : firstUncompleted
          ? firstUncompleted.id
          : allLessons[0]?.id || null,
    );
    setCurrentView("course-player");
    window.history.pushState({}, "", pathForView("course-player", course.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle Lesson Completion and Recalculate Course Progress Percentage
  const pendingCompletions = useRef(new Set());
  const handleToggleLessonCompletion = async (courseId, lessonId) => {
    if (pendingCompletions.current.has(lessonId)) return false;
    pendingCompletions.current.add(lessonId);
    const generation = authGeneration.current;
    const course = courses.find((item) => item.id === courseId);
    const lesson = course?.modules
      ?.flatMap((courseModule) => courseModule.lessons)
      .find((item) => item.id === lessonId);
    if (!lesson) {
      pendingCompletions.current.delete(lessonId);
      return false;
    }

    const nextCompleted = !lesson.completed;
    const applyCompletion = (completed) => {
      studentDataRevision.current += 1;
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

    try {
      await api.dashboard.updateLessonProgress(lessonId, nextCompleted);
      if (generation !== authGeneration.current) return false;
      applyCompletion(nextCompleted);
      setAppError("");
    } catch (error) {
      setAppError(
        error.message || "No se pudo guardar el progreso de la lección.",
      );
      return false;
    } finally {
      pendingCompletions.current.delete(lessonId);
    }
    return true;
  };

  const handleSaveLessonNote = async (courseId, lessonId, content) => {
    const saved = await api.dashboard.saveLessonNote(lessonId, content);
    studentDataRevision.current += 1;
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
    ++mentorDataRevision.current;
    const updated = await api.dashboard.answerMentorQuestion(questionId, reply);
    ++mentorDataRevision.current;
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

  const {
    notifications,
    notificationError,
    reloadNotifications,
    markNotificationsRead,
  } = useNotifications(user?.id, currentRole, isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || currentRole !== 'mentor' || !user?.id) return;
    const controller = new AbortController();
    const generation = authGeneration.current;
    let timer, pending = false;
    const refresh = async () => {
      if (pending || controller.signal.aborted) return;
      clearTimeout(timer); pending = true;
      const version = mentorDataRevision.current;
      try {
        if (document.visibilityState === 'hidden') return;
        const data = await api.dashboard.mentor({ signal: controller.signal });
        if (controller.signal.aborted || generation !== authGeneration.current || version !== mentorDataRevision.current) return;
        const next = { ...data, questions: (data.questions || []).map(adaptMentorQuestion) };
        const preserve = (before, after) => JSON.stringify(before) === JSON.stringify(after) ? before : after;
        setMentorDashboard(before => preserve(before, next));
        setUser(before => preserve(before, { ...before, stats: { ...before?.stats, ...data.stats } }));
      } catch (error) { if (!controller.signal.aborted) setAppError('No se pudieron actualizar las dudas: ' + error.message); }
      finally { pending = false; if (!controller.signal.aborted) timer = setTimeout(refresh, 3000); }
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearTimeout(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [isAuthenticated, isBootstrapping, currentRole, user?.id]);

  const refreshMentorDashboard = async () => {
    const generation = authGeneration.current;
    const data = await api.dashboard.mentor();
    if (generation !== authGeneration.current) return;
    setMentorDashboard({
      ...data,
      questions: (data.questions || []).map(adaptMentorQuestion),
    });
    setCourses(data.courses.map(adaptCourse));
    setUser((current) => ({
      ...current,
      stats: { ...current.stats, ...data.stats },
    }));
  };
  const enrollFromMentor = async (courseId, email) => {
    await api.courses.enrollByEmail(courseId, email);
    await refreshMentorDashboard().catch((error) =>
      setAppError(
        "La matricula se guardo, pero el panel no se pudo actualizar: " +
          error.message,
      ),
    );
  };

  // Notifications handlers
  const handleMarkAllNotificationsAsRead = () => {
    markNotificationsRead(
      notifications.filter((item) => !item.read).map((item) => item.id),
    );
  };

  const handleNotificationClick = (notif) => {
    markNotificationsRead([notif.id]);
    if (notif.type === 'question' && currentRole === 'mentor') {
      handleNavigate('mentor-dashboard'); setIsNotificationsOpen(false); return;
    }
    if (notif.type === 'answer' && currentRole === 'student') {
      const course = courses.find(item => item.id === notif.courseId);
      if (course) handleSelectCourse(course).then(() => setSelectedLessonId(notif.lessonId));
      else handleNavigate('courses');
      setIsNotificationsOpen(false); return;
    }
    if (notif.type === "forum" || notif.type === "chat") {
      const [, first, second] = notif.id.split(":");
      setCommunicationTarget({ id: notif.id, threadId: first, studentId: first, mentorId: second });
      handleNavigate(notif.type === "forum" ? "community" : "messages");
      setIsNotificationsOpen(false);
      return;
    }
    if (notif.type === "support" && ["student", "soporte"].includes(currentRole)) {
      setNotificationTicketId(notif.ticketId);
      handleNavigate("tickets");
      setIsNotificationsOpen(false);
      return;
    }
    const generation = authGeneration.current;
    loadApplicationData(
      { ...user, role: currentRole === "student" ? "estudiante" : currentRole },
      generation,
    ).catch((error) => {
      if (generation === authGeneration.current) setAppError(error.message);
    });
    if (currentRole === "admin") {
      handleNavigate(
        notif.type === "live" || notif.type === "replay"
          ? "admin-live"
          : "admin-notifications",
      );
      setIsNotificationsOpen(false);
      return;
    }
    if (
      currentRole === "mentor" &&
      ["content", "resource", "announcement", "event"].includes(notif.type)
    ) {
      handleNavigate("mentor-courses");
      setIsNotificationsOpen(false);
      return;
    }
    if (notif.type === "live") {
      setNotificationLiveTarget({ sessionId: notif.sessionId || notif.id.split(":")[1], revision: Date.now() });
      handleNavigate("live");
    } else if (notif.type === "resource") {
      handleNavigate("library");
    } else if (notif.type === "replay") {
      handleNavigate("replays");
    }
    if (["content", "announcement", "event"].includes(notif.type)) {
      handleNavigate(notif.type === "content" ? "courses" : "dashboard");
    }
    setIsNotificationsOpen(false);
  };

  const handleEditCourse = async (id, input) => {
    const generation = authGeneration.current;
    const updated = await api.administration.updateCourse(id, { title: input.title, description: input.tagline || "", category: input.category, level: input.level, contentType: input.contentType, docenteId: input.docenteId || undefined });
    if (generation !== authGeneration.current) return;
    setCourses(current => current.map(course => course.id === id ? { ...course, title: updated.title, description: updated.description, tagline: updated.description, category: updated.category, level: updated.level, contentType: updated.content_type, docenteId: updated.docente_id } : course));
    if (input.image) {
      try { await handleCourseCover(id, input.image); }
      catch (error) { throw new Error("Los datos del curso se guardaron, pero la imagen no: " + error.message); }
    }
    await refreshAdminDashboard();
  };

  const handleCourseCover = async (courseId, file) => {
    const generation = authGeneration.current;
    const updated = await api.courses.uploadCover(courseId, file);
    if (generation !== authGeneration.current) return;
    setCourses(current => current.map(course => course.id === courseId ? { ...course, thumbnail: updated.thumbnail } : course));
  };

  const handleDeleteCourse = async courseId => {
    const generation = authGeneration.current;
    await api.courses.remove(courseId);
    if (generation !== authGeneration.current) return;
    setCourses(current => current.filter(course => course.id !== courseId));
    setLiveClasses(current => current.filter(session => session.courseId !== courseId));
    setReplays(current => current.filter(replay => replay.courseId !== courseId));
    setSelectedCourse(current => current?.id === courseId ? null : current);
    await refreshAdminDashboard();
  };

  // Admin add course
  const handleAddCourse = async (newCourse) => {
    const generation = authGeneration.current;
    const created = await api.courses.create({
      title: newCourse.title,
      image: newCourse.image,
      description: newCourse.tagline || "",
      contentType: newCourse.contentType || "course",
      docenteId: newCourse.docenteId || undefined,
      category: newCourse.category || "",
      level: newCourse.level || "",
    });
    if (generation !== authGeneration.current) return;
    const mentor = mentors.find((item) => item.id === created.docenteId);
    setCourses((current) => [
      adaptCourse(
        {
          ...created,
          mentorName: mentor?.name,
          mentorTitle: mentor?.role,
          mentorAvatar: mentor?.avatar,
        },
        current.length,
      ),
      ...current,
    ]);
    await refreshAdminDashboard();
  };

  // Admin schedule live class
  const handleAddLiveClass = async (newLive) => {
    const generation = authGeneration.current;
    if (!newLive.courseId) throw new Error("Selecciona el curso de la sesión.");
    const created = await api.liveSessions.create({
      courseId: newLive.courseId,
      title: newLive.title,
      scheduledAt: newLive.scheduledAt,
      durationMinutes: newLive.durationMinutes,
      joinUrl: newLive.joinUrl || undefined,
      meetingId: newLive.meetingId || undefined,
      meetingPasscode: newLive.meetingPasscode || undefined,
    });
    if (generation !== authGeneration.current) return;
    setLiveClasses((current) => [
      adaptLiveSession(created, courses),
      ...current,
    ]);
    if (currentRole === "mentor")
      await refreshMentorDashboard().catch((error) =>
        setAppError(
          "La clase se guardo, pero el panel no se pudo actualizar: " +
            error.message,
        ),
      );
    else await refreshAdminDashboard();
    reloadNotifications();
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

  const refreshAdminCourses = async () => {
    const generation = authGeneration.current;
    const rows = await api.courses.list();
    if (generation !== authGeneration.current) return;
    setCourses(
      rows.map((course, index) => {
        const mentor = users.find((user) => user.id === course.docenteId);
        return adaptCourse(
          {
            ...course,
            mentorName: mentor?.fullName,
            mentorTitle: mentor?.title,
            mentorAvatar: mentor?.avatarUrl,
          },
          index,
        );
      }),
    );
    await refreshAdminDashboard();
  };
  const openCurriculum = (course) => {
    setAdminCourseId(course.id);
    handleNavigate("admin-curriculum");
    window.history.replaceState({}, "", `/administrador/cursos/contenido?curso=${encodeURIComponent(course.id)}`);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  if (passwordRecovery) return <PasswordRecoveryView recovery={passwordRecovery} onDone={() => { handleLogout(); setPasswordRecovery(null); window.history.replaceState({}, '', '/login'); }} />;

  if (isBootstrapping) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-canvas p-6"
        role="status"
      >
        <Brand />
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 text-xs font-semibold text-subtle shadow-panel">
          <LoaderCircle size={16} className="animate-spin text-brand" />
          Preparando tu espacio...
        </div>
      </div>
    );
  }

  // Si no está autenticado, renderizar el portal corporativo de Login
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} onRecover={api.recoverPassword} />;
  }

  return (
    <div
      className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}
    >
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-[200] rounded-xl bg-brand px-4 py-3 text-on-brand focus:not-sr-only"
      >
        Saltar al contenido
      </a>
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
        supportFilter={supportFilter}
        supportCounts={supportCounts}
        onSupportFilterChange={setSupportFilter}
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
        className={`main-content-wrapper ${!isSidebarOpen ? "sidebar-collapsed" : ""} ${currentRole === "soporte" && currentView === "tickets" ? "support-fixed-workspace" : ""} ${currentView === "messages" ? "messages-workspace" : ""}`}
      >
        <Header
          user={user}
          currentRole={currentRole}
          currentView={currentView}
          courses={courses}
          onSelectCourse={(course) =>
            currentRole === "admin"
              ? openCurriculum(course)
              : currentRole === "mentor"
                ? handleNavigate("mentor-courses")
                : handleSelectCourse(course)
          }
          onOpenNotifications={() => { reloadNotifications(); setIsNotificationsOpen(true); }}
          unreadCount={unreadNotificationsCount}
          notifications={notifications}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={handleNavigate}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLogout={handleLogout}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        <main
          className="content-body view-enter"
          id="main-content"
          key={currentView}
        >
          {liveSessionModalData && <LiveSessionModal fullPage isOpen onClose={() => setLiveSessionModalData(null)} liveClass={liveSessionModalData} />}
          <div hidden={Boolean(liveSessionModalData)}>
          {appError && (
            <div
              role="alert"
              className="mb-4 [padding:12px_16px] [border-radius:10px] bg-warning-soft border border-warning-line text-warning flex justify-between gap-4"
            >
              <span>{appError}</span>
              <button
                type="button"
                onClick={() => setAppError("")}
                className="[border:0px] [background:transparent] [color:inherit] cursor-pointer font-bold"
              >
                Cerrar
              </button>
            </div>
          )}
          {((currentView === "tickets" && ["soporte", "student"].includes(currentRole)) || (currentView === "admin-support" && currentRole === "admin")) && (
              <TicketsView onOptionsClose={() => setSupportFilter("pending")} sidebarFilter={supportFilter} onCountsChange={setSupportCounts} key={`${user.id}:${notificationTicketId || ""}`} user={user} searchTerm={searchTerm} initialTicketId={notificationTicketId} />
            )}
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
          {currentView === "course-player" && !selectedCourse && (
            <EmptyState
              title="Curso no disponible"
              description="Si el curso no aparece, revisa tus programas o solicita que se active tu acceso."
              action={<button className="btn btn-primary" onClick={() => handleNavigate("courses")}>Ver mis programas</button>}
            />
          )}
          {currentView === "course-player" && selectedCourse && (
            <CoursePlayerView
              key={selectedCourse.id}
              onSaveResume={
                currentRole === "student" ? api.dashboard.saveResume : undefined
              }
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
          {currentRole === "mentor" && currentView === "live" && (
            <MentorLiveManager courses={courses} liveClasses={liveClasses}
              onSchedule={handleAddLiveClass}
              onUpdate={async (id, input) => {
                const generation = authGeneration.current;
                const updated = await api.liveSessions.update(id, input);
                if (generation !== authGeneration.current) return;
                setLiveClasses(rows => rows.map(row => row.id === id ? adaptLiveSession(updated, courses) : row));
                reloadNotifications();
              }} />
          )}
          {currentView === "live" && (
            <LiveClassesView
              initialTarget={notificationLiveTarget}
              courses={courses}
              replays={replays}
              onPlay={video => api.videos.playback(video.id)}
              liveClasses={liveClasses}
              onOpenLiveSession={(live) => setLiveSessionModalData(live)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Vista: Videoteca de Replays (Grabaciones) */}
          {currentRole === "mentor" && currentView === "replays" && !isWatchingReplay && (
              <RecordingUpload allowExternal={user?.role === "admin"}
                showLinkEditor={false}
                courses={courses}
                liveClasses={liveClasses}
                onUploaded={(video) =>
                  setReplays((current) => [
                    adaptVideo(video, courses),
                    ...current,
                  ])
                }
                onSessionUpdated={(updated) =>
                  setLiveClasses((current) =>
                    current.map((session) =>
                      session.id === updated.id
                        ? adaptLiveSession(updated, courses)
                        : session,
                    ),
                  )
                }
              />
          )}
          {currentView === "replays" && (
            <ReplaysView
              onViewingChange={setIsWatchingReplay}
              compact={currentRole === "mentor"}
              replays={replays}
              onNavigate={handleNavigate}
              onPlay={(video) => api.videos.playback(video.id)}
            />
          )}

          {/* Vista: Biblioteca de Recursos y Plantillas */}
          {currentView === "library" && (
            <LibraryView
              courses={courses}
              replays={replays}
              onSelectCourse={handleSelectCourse}
              onOpenResource={loadLessonResource}
              onPlay={(video) => api.videos.playback(video.id)}
            />
          )}

          {/* Vista: Mentores de Élite */}
          {currentView === "mentors" && (
            <MentorsView
              mentors={mentors}
              courses={courses}
              onSelectCourse={handleSelectCourse}
            />
          )}

          {/* Vista: Comunidad & Debates */}
          {currentView === "messages" && <MessagesView key={`${user.id}:${communicationTarget?.id || ""}`} user={user} initialContact={communicationTarget} />}
          {currentView === "community" && (
            <CommunityView key={`${user.id}:${communicationTarget?.id || ""}`} user={user} initialThreadId={communicationTarget?.threadId} />
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


          {currentView === "admin-mentors" && (
            <MentorsView
              fullPageProfile
              onSaveProfile={async (id, input) => {
                const updated = await api.administration.updateMentorProfile(id, input);
                setUsers(current => current.map(account => account.id === id ? { ...account, ...updated } : account));
                return adaptMentor(updated);
              }}
              mentors={users
                .filter((account) => account.role === "mentor")
                .map(adaptMentor)}
              courses={courses}
              onSelectCourse={() => handleNavigate("admin-courses")}
            />
          )}
          {(currentView === "admin-notifications" ||
            currentView === "mentor-notifications") && (
            <AnnouncementsView
              role={currentRole}
              courses={courses}
              onPublished={reloadNotifications}
            />
          )}
          {currentView === "mentor-courses" && (
            <>
              <MentorCoursesView
                onRefresh={refreshMentorDashboard}
                courses={courses}
                students={mentorDashboard.students || []}
                liveClasses={liveClasses}
                onEnroll={enrollFromMentor}
                onPlay={(videoId) => api.videos.playback(videoId)}
              />

            </>
          )}
          {currentView === "admin-curriculum" && (
            <AdminCurriculumView
              courses={courses}
              mentors={mentors}
              initialCourseId={adminCourseId}
              onBack={() => handleNavigate("admin-courses")}
              onCourseUpdated={refreshAdminCourses}
            />
          )}
          {currentView === "admin-access" && (
            <AdminAccessView
              courses={courses}
              users={users}
              onChanged={refreshAdminDashboard}
            />
          )}
          {/* Vistas de Administración (CMS) */}
          {(currentView === "admin-overview" ||
            currentView === "admin-courses" ||
            currentView === "admin-live" ||
            currentView === "admin-users") && (
            <AdminView
              recordingsLibrary={<AdminRecordings recordings={replays} courses={courses} onPlay={video => api.videos.playback(video.id)} onRefresh={async () => { const generation = authGeneration.current; const videos = await api.videos.list(); if (generation === authGeneration.current) setReplays(videos.map(video => adaptVideo(video, courses))); }} />}
              recordingPanel={currentRole === "admin" && currentView === "admin-live" ? (
                <RecordingUpload
                  showLinkEditor={false}
                  allowExternal
                  courses={courses}
                  liveClasses={liveClasses}
                  onSessionUpdated={(updated) =>
                    setLiveClasses(rows => rows.map(row => row.id === updated.id ? adaptLiveSession(updated, courses) : row))
                  }
                  onUploaded={(video) =>
                    setReplays(rows => [adaptVideo(video, courses), ...rows.filter(row => row.id !== video.id)])
                  }
                />
              ) : null}
              courses={courses}
              liveClasses={liveClasses}
              onEditCurriculum={openCurriculum}
              onAddCourse={handleAddCourse}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onUploadCourseCover={handleCourseCover}
              onAddLiveClass={handleAddLiveClass}
              onDeleteLiveClass={async (id) => {
                const generation = authGeneration.current;
                await api.liveSessions.remove(id);
                if (generation !== authGeneration.current) return;
                setLiveClasses(rows => rows.filter(row => row.id !== id));
              }}
              onUpdateLiveClass={async (id, input) => {
                const generation = authGeneration.current;
                const updated = await api.liveSessions.update(id, input);
                if (generation !== authGeneration.current) return;
                setLiveClasses(rows => rows.map(row => row.id === id ? adaptLiveSession(updated, courses) : row));
              }}
              mentors={mentors}
              users={users}
              dashboard={adminDashboard}
              currentUserId={user.id}
              onAssignMentor={async (studentId, mentorId) => {
                const assignment = await api.users.assignMentor(studentId, mentorId);
                setUsers(rows => rows.map(row => row.id === studentId ? { ...row, mentorId: assignment.mentorId } : row));
              }}
              onUpdateUserRole={handleUpdateUserRole}
              onAssignUserToCourse={handleAssignUserToCourse}
              onCreateUser={handleCreateUser}
              onEditUser={async (id, input) => {
                const generation = authGeneration.current;
                const saved = await api.users.update(id, input);
                if (generation !== authGeneration.current) return;
                setUsers(rows => rows.map(row => row.id === id ? { ...row, ...saved } : row));
                if (id === user.id) setUser(previous => ({ ...previous, ...adaptUser(saved), stats: previous.stats }));
                await refreshAdminDashboard();
              }}
              onDeleteUser={async (id) => {
                const generation = authGeneration.current;
                await api.users.remove(id);
                if (generation !== authGeneration.current) return;
                setUsers(rows => rows.filter(row => row.id !== id).map(row => row.mentorId === id ? { ...row, mentorId: null } : row));
                try { await loadApplicationData({ ...user, role: "admin" }, generation); }
                catch { setAppError("La cuenta se eliminó, pero no se pudo actualizar todo el panel. Recarga la página."); }
              }}
              currentView={currentView}
              onNavigate={handleNavigate}
            />
          )}
          </div>
        </main>
      </div>

      {/* Modal de Notificaciones */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        error={notificationError}
        onRetry={reloadNotifications}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
      />


    </div>
  );
}

export default App;
