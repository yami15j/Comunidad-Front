import React, { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
const labels = {
  full: "Contenido, grabaciones y clases",
  content: "Contenido y grabaciones",
  live: "Solo clases en vivo",
};
function localDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function AdminAccessView({ courses, users, onChanged }) {
  const students = users.filter((u) => u.role === "estudiante");
  const [filters, setFilters] = useState({
    courseId: "",
    studentId: "",
    page: 0,
  });
  const [data, setData] = useState({ items: [], total: 0 });
  const [clock, setClock] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    courseId: "",
    studentId: "",
    accessType: "full",
    status: "active",
    expiresAt: "",
  });
  const load = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const rows = await api.administration.access(filters, { signal });
        if (!signal?.aborted) {
          setData(rows);
          setError("");
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filters],
  );
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect -- Subscribe to the selected server-side access filters.
    load(controller.signal).catch((e) => {
      if (e.name !== "AbortError") setError(e.message);
    });
    return () => controller.abort();
  }, [load]);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const input = {
        ...form,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : null,
      };
      if (editing) await api.administration.updateAccess(editing, input);
      else await api.administration.grantAccess(input);
      setMessage(
        "Acceso guardado. La plataforma aplica estas reglas en cada consulta.",
      );
      await load();
      await onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="academic-workspace grid gap-5">
      <h1>Accesos por curso o programa</h1>
      <p>
        Asigna permisos y vigencias manualmente. No se registran compras ni
        pagos.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <article className="card">
        <h2>{editing ? "Editar acceso" : "Asignar acceso"}</h2>
        <form onSubmit={submit}>
          <label>
            Estudiante
            <select
              required
              disabled={!!editing || busy}
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            >
              <option value="">Selecciona un estudiante</option>
              {students.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} - {u.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Curso o programa
            <select
              required
              disabled={!!editing || busy}
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            >
              <option value="">Selecciona un curso</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de acceso
            <select
              disabled={busy}
              value={form.accessType}
              onChange={(e) => setForm({ ...form, accessType: e.target.value })}
            >
              {Object.entries(labels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              disabled={busy}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </label>
          <label>
            Vigencia hasta (opcional, hora local)
            <input
              type="datetime-local"
              value={form.expiresAt}
              disabled={busy}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>
          <p>
            Sin fecha significa acceso sin vencimiento. Guardar el mismo
            estudiante y curso actualiza su acceso.
          </p>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Guardando..." : "Guardar acceso"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditing(null);
                setForm({
                  courseId: "",
                  studentId: "",
                  accessType: "full",
                  status: "active",
                  expiresAt: "",
                });
              }}
            >
              Nuevo acceso
            </button>
          )}
        </form>
      </article>
      <article className="card">
        <h2>Accesos registrados</h2>
        <label>
          Filtrar curso
          <select
            value={filters.courseId}
            onChange={(e) =>
              setFilters({ ...filters, courseId: e.target.value, page: 0 })
            }
          >
            <option value="">Todos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filtrar estudiante
          <select
            value={filters.studentId}
            onChange={(e) =>
              setFilters({ ...filters, studentId: e.target.value, page: 0 })
            }
          >
            <option value="">Todos</option>
            {students.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </label>
        {loading && <p>Cargando accesos...</p>}
        {!loading && !data.items.length && (
          <p>No hay accesos para estos filtros.</p>
        )}
        {data.items.map((item) => (
          <article className="card" key={item.id}>
            <h3>
              {users.find((u) => u.id === item.student_id)?.fullName ||
                "Usuario"}{" "}
              / {courses.find((c) => c.id === item.course_id)?.title || "Curso"}
            </h3>
            <p>
              {labels[item.access_type]} |{" "}
              {item.status !== "active"
                ? "Suspendido"
                : item.expires_at && new Date(item.expires_at).getTime() < clock
                  ? "Vencido"
                  : "Activo"}
            </p>
            <p>
              {item.expires_at
                ? "Vence: " + new Date(item.expires_at).toLocaleString("es-EC")
                : "Sin vencimiento"}
            </p>
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setEditing(item.id);
                setForm({
                  courseId: item.course_id,
                  studentId: item.student_id,
                  accessType: item.access_type,
                  status: item.status === "active" ? "active" : "suspended",
                  expiresAt: localDate(item.expires_at),
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Editar o suspender acceso
            </button>
          </article>
        ))}
        <p>{data.total} accesos registrados</p>
        <button
          className="btn btn-secondary"
          disabled={!filters.page || loading}
          onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
        >
          Anterior
        </button>
        <button
          className="btn btn-secondary"
          disabled={(filters.page + 1) * 50 >= data.total || loading}
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
        >
          Siguiente
        </button>
      </article>
    </section>
  );
}
