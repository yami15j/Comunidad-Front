const courseImages = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80",
];

const avatar =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80";

function formatDuration(minutes = 0) {
  if (!minutes) return "Duración pendiente";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

function adaptLesson(lesson) {
  return {
    ...lesson,
    duration: lesson.duration || formatDuration(lesson.durationMinutes),
    summary:
      lesson.summary ||
      "El contenido de esta lección estará disponible próximamente.",
    content: lesson.content || "",
    note: lesson.note || "",
    noteUpdatedAt: lesson.noteUpdatedAt || null,
    questions: lesson.questions || [],
    resources: (lesson.resources || []).map((resource) => ({
      ...resource,
      kind: resource.kind || "download",
      resourceType: resource.resourceType || "document",
      sourceType: resource.sourceType || "storage",
    })),
  };
}

export function roleToFrontend(role) {
  if (role === "docente") return "mentor";
  if (role === "alumno" || role === "estudiante") return "student";
  return role;
}

export function adaptUser(user) {
  const role = roleToFrontend(user.role);
  return {
    ...user,
    role,
    name: user.fullName || user.email,
    title:
      user.title ||
      (role === "soporte" ? "Equipo de soporte" : role === "admin"
        ? "Administrador del Sistema"
        : role === "mentor"
          ? "Mentor"
          : "Miembro de la Comunidad"),
    avatar: user.avatarUrl || avatar,
    plan:
      role === "soporte" ? "Soporte" : role === "admin"
        ? "Administrador"
        : role === "mentor"
          ? "Mentor Oficial"
          : "Miembro activo",
    planTier: role,
    stats:
      role === "soporte" ? {} : role === "admin"
        ? { totalStudents: 0, mrr: "—", totalCourses: 0, activeLiveSessions: 0 }
        : role === "mentor"
          ? {
              assignedCourses: 0,
              upcomingLiveClasses: 0,
              activeStudents: 0,
              averageRating: "—",
              questionsPending: 0,
            }
          : {
              enrolledCourses: 0,
              coursesInProgress: 0,
              completedCourses: 0,
              completedLessons: 0,
              totalLessons: 0,
              totalHoursWatched: 0,
              averageProgress: 0,
              upcomingClasses: 0,
              certificationsEarned: 0,
              attendanceRate: "—",
            },
  };
}

export function adaptCourse(course, index = 0) {
  const modules = (course.modules || []).map((courseModule) => ({
    ...courseModule,
    lessons: (courseModule.lessons || []).map(adaptLesson),
  }));
  const lessons = modules.flatMap((courseModule) => courseModule.lessons);
  const completedLessonsCount =
    course.completedLessonsCount ??
    lessons.filter((lesson) => lesson.completed).length;
  const totalLessonsCount = course.totalLessonsCount ?? lessons.length;
  const estimatedMinutes =
    course.estimatedMinutes ??
    lessons.reduce((total, lesson) => total + (lesson.durationMinutes || 0), 0);
  const totalResourcesCount =
    course.totalResourcesCount ??
    lessons.reduce((total, lesson) => total + lesson.resources.length, 0);

  return {
    ...course,
    tagline:
      course.description ||
      "Programa de formación de Comunidad del Intercambio.",
    category: course.category || "Sin categoría",
    level: course.level || "Sin nivel definido",
    mentorName:
      course.mentorName ||
      (course.docenteId ? "Mentor asignado" : "Por asignar"),
    mentorRole:
      course.mentorTitle || course.mentorRole || "Mentor del programa",
    mentorAvatar: course.mentorAvatar || avatar,
    thumbnail: course.thumbnail || courseImages[index % courseImages.length],
    progressPercent: course.progressPercent ?? 0,
    completedLessonsCount,
    totalLessonsCount,
    totalModulesCount: course.totalModulesCount ?? modules.length,
    totalResourcesCount,
    estimatedMinutes,
    estimatedHours: estimatedMinutes
      ? formatDuration(estimatedMinutes)
      : "Contenido en preparación",
    isEnrolled: course.isEnrolled ?? true,
    rating: course.rating ?? null,
    modules,
  };
}

export function adaptLiveSession(session, courses = []) {
  const scheduled = new Date(session.scheduledAt || session.createdAt);
  const durationMinutes = session.durationMinutes || 60;
  const end = new Date(scheduled.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  const isWithinSchedule = now >= scheduled && now < end;
  const isEndedByTime = now >= end;
  const course = courses.find(
    (item) => String(item.id) === String(session.courseId),
  );
  const effectiveStatus =
    session.status === "ended" || isEndedByTime
      ? "ended"
      : session.status === "live" || isWithinSchedule
        ? "live"
        : "scheduled";
  return {
    ...session,
    subtitle: course
      ? `Sesión de ${course.title}`
      : "Sesión de formación en vivo",
    mentorName:
      course?.mentorName ||
      (session.startedBy ? "Mentor asignado" : "Por confirmar"),
    mentorAvatar: course?.mentorAvatar || "",
    date: Number.isNaN(scheduled.getTime())
      ? "Fecha por confirmar"
      : scheduled.toLocaleDateString("es-EC", { dateStyle: "medium" }),
    time: Number.isNaN(scheduled.getTime())
      ? ""
      : scheduled.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    duration: `${durationMinutes} min`,
    isToday: scheduled.toDateString() === now.toDateString(),
    isLiveNow: effectiveStatus === "live",
    attendeesCount: 0,
    category: course?.category || "Sin categoría",
    badge:
      effectiveStatus === "live"
        ? "En vivo ahora"
        : effectiveStatus === "ended"
          ? "Finalizada"
          : "Programada",
    effectiveStatus,
    deliverables: [],
  };
}

export function adaptVideo(video) {
  const created = new Date(video.createdAt);
  return {
    ...video,
    thumbnail: courseImages[0],
    category: video.status === "ready" ? "Disponible" : "Procesando",
    mentor: "Comunidad del Intercambio",
    date: Number.isNaN(created.getTime())
      ? "—"
      : created.toLocaleDateString("es-EC"),
    views: "—",
    duration: video.durationSeconds
      ? `${Math.ceil(video.durationSeconds / 60)} min`
      : "Duración pendiente",
  };
}

export function adaptMentor(profile) {
  return {
    id: profile.id,
    name: profile.fullName || profile.name || profile.email || "Mentor",
    role: profile.title || profile.role || "Mentor",
    company: profile.company || "",
    avatar: profile.avatarUrl || profile.avatar || "",
    bio: profile.bio || "",
    specialties: profile.specialties || [],
    rating: profile.rating ?? null,
    studentsCount: profile.studentsCount ?? 0,
  };
}

export function adaptMentorQuestion(question) {
  const createdAt = new Date(question.createdAt);
  return {
    ...question,
    studentName: question.studentName || "Estudiante",
    studentCompany: question.studentCompany || "Sin empresa registrada",
    studentAvatar: question.studentAvatar || "",
    status: question.status === "answered" ? "Respondida" : "Pendiente",
    timeAgo: Number.isNaN(createdAt.getTime())
      ? "Fecha no disponible"
      : createdAt.toLocaleString("es-EC", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
  };
}
