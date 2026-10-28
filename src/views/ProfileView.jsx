import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Camera,
  CheckCircle2,
  Edit3,
  Globe,
  LoaderCircle,
  Mail,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { Avatar, PageHeading } from "../components/ui";
import { homeViewForRole } from "../services/access";
import { ROLE_LABELS } from "../services/navigation";
const formForUser = (user) => ({
  name: user.name || "",
  title: user.title || "",
  company: user.company || "",
  email: user.email || "",
  phone: user.phone || "",
  location: user.location || "",
  linkedin: user.linkedin || "",
  website: user.website || "",
  bio: user.bio || "",
  avatar: user.avatarUrl || "",
});
function Field({
  label,
  field,
  form,
  setForm,
  editing,
  type = "text",
  placeholder,
  maxLength,
}) {
  return (
    <label className="grid gap-2 text-[11px] font-semibold text-muted">
      {label}
      <input
        type={type}
        value={form[field]}
        readOnly={!editing}
        required={field === "name"}
        minLength={field === "name" ? 2 : undefined}
        maxLength={maxLength}
        placeholder={placeholder || "Sin especificar"}
        className={
          "w-full " +
          (!editing ? "!border-transparent !bg-elevated/70 !text-muted" : "")
        }
        onChange={(event) =>
          setForm((current) => ({ ...current, [field]: event.target.value }))
        }
      />
    </label>
  );
}
export function ProfileView({ user, onUpdateUser, onNavigate }) {
  const [form, setForm] = useState(() => formForUser(user));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInput = useRef(null);
  async function save(event) {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const saved = await onUpdateUser({ ...form }, avatarFile);
      setForm((current) => ({
        ...current,
        ...saved,
        name: saved.name,
        avatar: saved.avatarUrl || saved.avatar || "",
      }));
      setAvatarFile(null);
      setEditing(false);
      setSuccess(true);
    } catch (failure) {
      setError(failure.message || "No se pudo guardar tu perfil.");
    } finally {
      setSaving(false);
    }
  }
  function photo(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 5 MB.");
      return;
    }
    setAvatarFile(file);
    setEditing(true);
    setSuccess(false);
    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((current) => ({ ...current, avatar: reader.result }));
    reader.readAsDataURL(file);
  }
  function cancel() {
    setForm(formForUser(user));
    setAvatarFile(null);
    setEditing(false);
    setError("");
  }
  const stats = user.stats || {};
  const role = user.role;
  const numbers =
    role === "student"
      ? [
          { label: "Programas", value: stats.enrolledCourses ?? 0 },
          { label: "Lecciones", value: stats.completedLessons ?? 0 },
        ]
      : role === "mentor"
        ? [
            { label: "Cursos", value: stats.assignedCourses ?? 0 },
            { label: "Estudiantes", value: stats.activeStudents ?? 0 },
          ]
        : role === "admin"
          ? [
              { label: "Cursos", value: stats.totalCourses ?? 0 },
              { label: "Estudiantes", value: stats.totalStudents ?? 0 },
            ]
          : [];
  return (
    <section className="space-y-7">
      <PageHeading
        eyebrow="TU IDENTIDAD EN LA COMUNIDAD"
        title="Un perfil que habla de ti."
        description="Mantén tus datos actualizados y comparte tu experiencia con tu comunidad."
        icon={UserRound}
        action={
          !editing ? (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditing(true);
                setSuccess(false);
              }}
            >
              <Edit3 size={14} />
              Editar perfil
            </button>
          ) : (
            <span className="badge badge-emerald">Editando tu perfil</span>
          )
        }
      />
      {error && <p role="alert">{error}</p>}
      {success && (
        <p
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-xs font-semibold text-brand"
        >
          <CheckCircle2 size={16} />
          Tu perfil y fotografía se actualizaron correctamente.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-panel">
          <div className="relative h-24 overflow-hidden bg-linear-to-br from-brand-soft via-sky-100/60 to-slate-100">
            <span
              aria-hidden="true"
              className="absolute -top-10 -right-5 size-40 rounded-full border-[20px] border-white/40"
            />
          </div>
          <div className="relative px-6 pb-6">
            <div className="-mt-10 mb-4 inline-flex rounded-full bg-surface p-1.5">
              <Avatar
                name={form.name}
                src={form.avatar}
                className="size-20 !text-xl"
              />
              <button
                aria-label="Cambiar foto de perfil"
                className="absolute top-12 left-20 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-brand text-on-brand shadow-sm"
                onClick={() => fileInput.current?.click()}
                disabled={saving}
              >
                <Camera size={12} />
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={photo}
            />
            <p className="mb-2">
              <span className="badge badge-emerald">
                {ROLE_LABELS[role] || "Miembro"}
              </span>
            </p>
            <h2 className="text-xl leading-7">{form.name}</h2>
            <p className="mt-1 text-xs leading-6 text-subtle">
              {form.title || ROLE_LABELS[role]}
            </p>
            <div className="mt-5 space-y-3 border-t border-line pt-5 text-[11px] text-subtle">
              <p className="flex items-start gap-2.5 break-all">
                <Mail size={14} className="mt-0.5 shrink-0" />
                {user.email}
              </p>
              {form.company && (
                <p className="flex items-center gap-2.5">
                  <Building2 size={14} className="shrink-0" />
                  {form.company}
                </p>
              )}
              {form.location && (
                <p className="flex items-center gap-2.5">
                  <MapPin size={14} className="shrink-0" />
                  {form.location}
                </p>
              )}
            </div>
            {numbers.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-elevated p-4">
                {numbers.map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-xl font-extrabold tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[9px] text-subtle">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 text-[10px] leading-5 text-subtle/70">
              Tu fotografía y perfil profesional acompañan tu participación en
              la plataforma.
            </p>
          </div>
        </aside>
        <form onSubmit={save} className="space-y-6">
          <article className="rounded-[22px] border border-line bg-surface p-5 shadow-panel sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <UserRound size={18} />
              </span>
              <div>
                <h2 className="text-base">Información personal</h2>
                <p className="mt-0.5 text-[11px] text-subtle">
                  Los datos básicos de tu cuenta.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nombre completo"
                field="name"
                form={form}
                setForm={setForm}
                editing={editing}
                maxLength={120}
              />
              <label className="grid gap-2 text-[11px] font-semibold text-muted">
                Correo electrónico
                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full !border-transparent !bg-elevated/70 !text-subtle"
                />
              </label>
              <Field
                label="Teléfono"
                field="phone"
                type="tel"
                form={form}
                setForm={setForm}
                editing={editing}
                maxLength={40}
              />
              <Field
                label="Ciudad / país"
                field="location"
                form={form}
                setForm={setForm}
                editing={editing}
                maxLength={160}
              />
            </div>
          </article>
          <article className="rounded-[22px] border border-line bg-surface p-5 shadow-panel sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Building2 size={18} />
              </span>
              <div>
                <h2 className="text-base">Perfil profesional</h2>
                <p className="mt-0.5 text-[11px] text-subtle">
                  Tu experiencia y lo que te mueve.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Cargo o especialidad"
                field="title"
                form={form}
                setForm={setForm}
                editing={editing}
                maxLength={160}
              />
              <Field
                label="Empresa / organización"
                field="company"
                form={form}
                setForm={setForm}
                editing={editing}
                maxLength={160}
              />
              <Field
                label="LinkedIn"
                field="linkedin"
                type="url"
                form={form}
                setForm={setForm}
                editing={editing}
                placeholder="https://linkedin.com/in/tu-perfil"
              />
              <Field
                label="Sitio web"
                field="website"
                type="url"
                form={form}
                setForm={setForm}
                editing={editing}
                placeholder="https://tu-sitio.com"
              />
              <label className="grid gap-2 text-[11px] font-semibold text-muted sm:col-span-2">
                Acerca de ti
                <textarea
                  maxLength={2000}
                  rows={5}
                  readOnly={!editing}
                  placeholder="Comparte un poco de tu experiencia, tus intereses y tus objetivos."
                  className={
                    "w-full " +
                    (!editing
                      ? "!border-transparent !bg-elevated/70 !text-muted"
                      : "")
                  }
                  value={form.bio}
                  onChange={(event) =>
                    setForm({ ...form, bio: event.target.value })
                  }
                />
                <span className="text-right text-[9px] font-normal text-subtle">
                  {form.bio.length} / 2000
                </span>
              </label>
            </div>
          </article>
          {editing && (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={cancel}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}{" "}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}
          {!editing && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="flex items-center gap-2 text-xs font-semibold text-subtle hover:text-brand"
                onClick={() => onNavigate(homeViewForRole(role))}
              >
                <ArrowLeft size={14} />
                Volver a mi espacio
              </button>
              {/^https?:\/\//.test(form.website) && (
                <a
                  className="flex items-center gap-2 text-xs font-semibold text-brand"
                  href={form.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe size={13} />
                  Mi sitio web
                  <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
export default ProfileView;
