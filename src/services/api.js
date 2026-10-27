const API_URL = (
  import.meta.env?.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "traction_access_token";
const REFRESH_TOKEN_KEY = "traction_refresh_token";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function getErrorMessage(payload, fallback) {
  if (Array.isArray(payload?.message)) return payload.message.join(", ");
  return payload?.message || payload?.error || fallback;
}

async function request(path, options = {}) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      `No se pudo conectar con la API en ${API_URL}. Comprueba que el backend esté iniciado.`,
      0,
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && localStorage.getItem(ACCESS_TOKEN_KEY) === token) {
      clearSession();
      window.dispatchEvent(new Event("traction:session-expired"));
    }
    throw new ApiError(
      getErrorMessage(payload, `Error ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload;
}

export function saveSession(session) {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("traction_authenticated");
  localStorage.removeItem("traction_auth_role");
}

export function hasSession() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export const api = {
  tickets: {
    list: (options) => request("/tickets", options),
    create: (input, options) => request("/tickets", { ...options, method: "POST", body: JSON.stringify(input) }),
    messages: (id, options) => request(`/tickets/${id}/messages`, options),
    send: (id, body, options) => request(`/tickets/${id}/messages`, { ...options, method: "POST", body: JSON.stringify({ body }) }),
    claim: (id, options) => request(`/tickets/${id}/claim`, { ...options, method: "POST" }),
    close: (id, options) => request(`/tickets/${id}/close`, { ...options, method: "POST" }),
  },
  health: () => request("/health/db"),
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (fullName, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    }),
  me: () => request("/auth/me"),
  profile: {
    update: (input) =>
      request("/auth/me", { method: "PATCH", body: JSON.stringify(input) }),
    uploadAvatar: (file) => {
      const body = new FormData();
      body.append("avatar", file);
      return request("/auth/me/avatar", { method: "POST", body });
    },
  },
  courses: {
    list: (options) => request("/courses", options),
    create: (input) =>
      request("/courses", { method: "POST", body: JSON.stringify(input) }),
    assignTeacher: (courseId, docenteId) =>
      request(`/courses/${courseId}/docente`, {
        method: "PATCH",
        body: JSON.stringify({ docenteId }),
      }),
    enroll: (courseId, studentId) =>
      request(`/courses/${courseId}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      }),
  },
  liveSessions: {
    list: (options) => request("/live-sessions", options),
    create: (input) =>
      request("/live-sessions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    end: (id) => request(`/live-sessions/${id}/end`, { method: "POST" }),
  },
  videos: {
    list: (options) => request("/videos", options),
    playback: (id) => request(`/videos/${id}/playback`),
  },
  dashboard: {
    student: (options) => request("/dashboard/student", options),
    mentor: (options) => request("/dashboard/mentor", options),
    admin: (options) => request("/dashboard/admin", options),
    resourceAccess: (resourceId) =>
      request(`/dashboard/student/resources/${resourceId}/access`),
    updateLessonProgress: (lessonId, completed) =>
      request(`/dashboard/student/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      }),
    saveLessonNote: (lessonId, content) =>
      request(`/dashboard/student/lessons/${lessonId}/note`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      }),
    createLessonQuestion: (lessonId, question) =>
      request(`/dashboard/student/lessons/${lessonId}/questions`, {
        method: "POST",
        body: JSON.stringify({ question }),
      }),
    answerMentorQuestion: (questionId, reply) =>
      request(`/dashboard/mentor/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify({ reply }),
      }),
  },
  users: {
    list: (options) => request("/users", options),
    create: (input) =>
      request("/users", { method: "POST", body: JSON.stringify(input) }),
    updateRole: (id, role) =>
      request(`/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
  },
};

export { API_URL };
