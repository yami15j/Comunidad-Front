import React, { useState } from "react";
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { CourseCard, EmptyState, PageHeading } from "../components/ui";
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
      <PageHeading
        eyebrow="MI APRENDIZAJE"
        title="Tu próximo paso, aquí."
        description="Todos tus programas en un solo lugar. Elige qué quieres aprender hoy y avanza a tu ritmo."
        icon={BookOpen}
        action={
          <span className="badge badge-emerald mt-1">
            {courses.length} programas disponibles
            <ArrowUpRight size={12} />
          </span>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-panel">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            type="search"
            aria-label="Buscar mis programas"
            className="w-full !border-transparent !bg-elevated !pl-10 !text-xs"
            placeholder="Buscar por programa o mentor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SlidersHorizontal size={15} className="mr-1 text-subtle" />
          <select
            aria-label="Filtrar por categoría"
            className="min-w-0 flex-1 !min-h-10 !text-xs sm:flex-none"
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
            className="min-w-0 flex-1 !min-h-10 !text-xs sm:flex-none"
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
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
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
