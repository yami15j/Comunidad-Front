import React, { useState } from "react";
import {
  BookOpen,
  Search,
} from "lucide-react";
import { CourseCard, EmptyState } from "../components/ui";
export function CoursesListView({ courses = [], onSelectCourse }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const categories = [
    ...new Set(courses.map((course) => course.category).filter(Boolean)),
  ];
  const filtered = courses.filter(
    (course) =>
      [course.title, course.tagline, course.mentorName]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (category === "all" || course.category === category) &&
      (status === "all" ||
        (status === "progress" &&
          course.progressPercent > 0 &&
          course.progressPercent < 100) ||
        (status === "completed" && course.progressPercent === 100) ||
        (status === "new" && !course.progressPercent)),
  );
  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Mi aprendizaje</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">Tu próximo paso, aquí.</h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-subtle sm:text-sm">Todos tus programas en un solo lugar. Elige qué aprender y avanza a tu ritmo.</p>
        </div>
        <span className="self-start rounded-full border border-brand-line bg-brand-soft px-3 py-1.5 text-[10px] font-semibold text-brand sm:self-center">{courses.length} {courses.length === 1 ? 'programa disponible' : 'programas disponibles'}</span>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            type="search"
            aria-label="Buscar mis programas"
            className="w-full !min-h-9 !rounded-xl !border-line !bg-surface !py-2 !pl-10 !text-xs focus:!border-brand"
            placeholder="Buscar por programa o mentor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <select
            aria-label="Filtrar por categoría"
            className="min-w-0 flex-1 !min-h-9 !rounded-xl !py-2 !text-[11px] sm:max-w-48 sm:flex-none"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por progreso"
            className="min-w-0 flex-1 !min-h-9 !rounded-xl !py-2 !text-[11px] sm:max-w-44 sm:flex-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="progress">En progreso</option>
            <option value="new">Por comenzar</option>
            <option value="completed">Completados</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-subtle">
        <p>
          {filtered.length} {filtered.length === 1 ? "programa" : "programas"}
        </p>
        <p>Tu formación, a tu ritmo</p>
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>article]:max-w-none">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={
            courses.length
              ? "No encontramos ese programa"
              : "Aún no tienes programas asignados"
          }
          description={
            courses.length
              ? "Prueba con otro nombre o cambia los filtros."
              : "Cuando te asignen un programa, podrás comenzar desde este espacio."
          }
          action={
            courses.length ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setStatus("all");
                }}
              >
                Limpiar filtros
              </button>
            ) : null
          }
        />
      )}
    </section>
  );
}
export default CoursesListView;
