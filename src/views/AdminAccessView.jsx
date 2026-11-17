import { Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar } from "../components/ui";
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
    <section className="admin-access-page grid gap-6">
      <p className="text-xs leading-5 text-subtle">Gestiona los permisos y la vigencia de cada estudiante.</p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="!text-base">{editing ? "Editar acceso" : "Asignar acceso"}</h2><p className="mt-1 text-[11px] text-subtle">Selecciona a quién dar acceso y define sus permisos.</p></div><span className="text-[10px] font-medium text-subtle">Guardado manual</span></div>
        <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2 [&_label]:grid [&_label]:min-w-0 [&_label]:gap-1.5 [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-muted [&_select]:w-full [&_select]:!min-h-10 [&_select]:!rounded-xl [&_select]:!bg-elevated/30 [&_select]:!py-2 [&_select]:!text-xs [&_input]:w-full [&_input]:!min-h-10 [&_input]:!rounded-xl [&_input]:!bg-elevated/30 [&_input]:!py-2 [&_input]:!text-xs">
          <div className="min-w-0 space-y-4 lg:border-r lg:border-line lg:pr-5"><p className="text-[10px] font-bold uppercase tracking-wider text-brand">Estudiante y curso</p>
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
          </div>
          <div className="min-w-0 space-y-4"><p className="text-[10px] font-bold uppercase tracking-wider text-brand">Permisos y vigencia</p>
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
            Fecha de vencimiento (opcional)
            <input
              type="datetime-local"
              value={form.expiresAt}
              disabled={busy}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>
          <p className="text-[10px] leading-5 text-subtle">Deja la fecha vacía para un acceso sin vencimiento.</p>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 lg:col-span-2"><p className="max-w-md text-[10px] leading-5 text-subtle">Si el estudiante ya tiene acceso al curso, se actualizarán sus permisos.</p><div className="flex items-center gap-2">
          <button className="btn btn-primary !min-h-9 !rounded-xl !text-xs" disabled={busy}>
            {busy ? "Guardando..." : "Guardar acceso"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-secondary !min-h-9 !rounded-lg !text-xs"
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
          </div></footer>
        </form>
      </article>
      <article className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="!text-base">Accesos registrados</h2><p className="mt-1 text-[11px] text-subtle">Consulta los permisos de cada estudiante.</p></div><span className="text-[11px] text-subtle">{data.total} {data.total === 1 ? "acceso" : "accesos"}</span></header>
        <div className="flex flex-wrap gap-3">
        <label className="grid w-full gap-1.5 text-[10px] font-semibold text-subtle sm:w-60">
          Filtrar curso
          <select className="!min-h-9 !rounded-lg !bg-surface !py-2 !text-xs"
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
        <label className="grid w-full gap-1.5 text-[10px] font-semibold text-subtle sm:w-60">
          Filtrar estudiante
          <select className="!min-h-9 !rounded-lg !bg-surface !py-2 !text-xs"
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

        </div>
        {loading && <p role="status" className="py-4 text-center text-xs text-subtle">Cargando accesos...</p>}
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_130px_75px] items-center gap-4 border-b border-line bg-elevated/40 px-4 py-3 text-[9px] font-bold uppercase tracking-wide text-subtle xl:grid"><span>Estudiante y curso</span><span>Permisos</span><span>Estado</span><span>Vigencia</span><span className="text-right">Acciones</span></div>
          {!loading && !data.items.length && <p className="py-10 text-center text-xs text-subtle">No hay accesos para estos filtros.</p>}
          {data.items.map(item => {
            const student = users.find(user => user.id === item.student_id);
            const state = item.status !== "active" ? "Suspendido" : item.expires_at && new Date(item.expires_at).getTime() < clock ? "Vencido" : "Activo";
            return <article key={item.id} className="grid items-center gap-3 border-b border-line/70 px-4 py-3 transition last:border-0 hover:bg-brand-soft/15 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_130px_75px] xl:gap-4">
              <div className="flex min-w-0 items-center gap-2.5"><Avatar name={student?.fullName || "Usuario"} src={student?.avatarUrl} className="size-8 !text-[10px]" /><div className="min-w-0"><p className="break-words text-xs font-semibold text-ink">{student?.fullName || "Usuario"}</p><p className="mt-1 break-words text-[10px] text-subtle">{courses.find(course => course.id === item.course_id)?.title || "Curso"}</p><p className="mt-1 text-[9px] text-subtle">{item.suspension_count || 0} suspensiones registradas</p></div></div>
              <p className="text-[11px] leading-5 text-muted">{labels[item.access_type] || item.access_type}</p>
              <span className={"inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold " + (state === "Activo" ? "bg-success-soft text-success" : state === "Vencido" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning")}><span className="size-1 rounded-full bg-current" />{state}</span>
              <div className="text-[10px] text-subtle">{item.expires_at ? <><p className="font-medium text-muted">{new Date(item.expires_at).toLocaleDateString("es-EC")}</p><p className="mt-0.5">{new Date(item.expires_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</p></> : "Sin vencimiento"}</div>
              <div className="justify-self-end">
            <button
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-[11px] font-bold text-brand transition hover:bg-brand hover:text-on-brand disabled:opacity-50"
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
              <Edit size={13} />Editar
            </button>
              </div>
            </article>;
          })}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-subtle"><p>{data.total} accesos registrados</p><nav aria-label="Páginas de accesos" className="flex items-center gap-3"><button type="button" className="inline-flex items-center gap-1 disabled:opacity-30" disabled={!filters.page || loading} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}><ChevronLeft size={14} />Anterior</button><span>{filters.page + 1} de {Math.max(1, Math.ceil(data.total / 50))}</span><button type="button" className="inline-flex items-center gap-1 disabled:opacity-30" disabled={(filters.page + 1) * 50 >= data.total || loading} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Siguiente<ChevronRight size={14} /></button></nav></footer>
      </article>
    </section>
  );
}
