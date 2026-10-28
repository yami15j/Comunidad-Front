import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserRound,
  ArrowUpRight,
  Moon,
  X,
} from "lucide-react";
import { Avatar } from "./ui";
import {
  navigationForRole,
  pageForView,
  ROLE_LABELS,
} from "../services/navigation";
export function Header({
  user,
  currentRole,
  currentView,
  onOpenNotifications,
  unreadCount,
  theme = "light",
  onToggleTheme,
  onNavigate,
  searchTerm = "",
  onSearchChange,
  onLogout,
  onToggleSidebar,
  courses = [],
  onSelectCourse,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const profile = useRef(null);
  const search = useRef(null);
  const searchInput = useRef(null);
  const page = pageForView(currentRole, currentView);
  const pages = navigationForRole(currentRole)
    .flatMap((group) => group.items)
    .filter((item) =>
      item.label.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()),
    );
  const matches = courses
    .filter((course) =>
      [course.title, course.category]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm.toLocaleLowerCase()),
    )
    .slice(0, 5);
  useEffect(() => {
    function outside(event) {
      if (!profile.current?.contains(event.target)) setProfileOpen(false);
      if (!search.current?.contains(event.target)) {
        setSearchOpen(false);
        setMobileSearch(false);
      }
    }
    function keyboard(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setSearchOpen(false);
        setMobileSearch(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
        if (window.innerWidth < 768) setMobileSearch(true);
        searchInput.current?.focus();
      }
    }
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, []);
  useEffect(() => {
    if (mobileSearch) searchInput.current?.focus();
  }, [mobileSearch]);
  const navigate = (id) => {
    onNavigate(id);
    setProfileOpen(false);
    setSearchOpen(false);
    setMobileSearch(false);
  };
  return (
    <header className="sticky top-0 z-30 flex h-20 min-w-0 items-center justify-between gap-3 border-b border-line/80 bg-surface/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9 xl:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="icon-button -ml-2"
          aria-label="Abrir o cerrar menú"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-[10px] font-medium text-subtle sm:flex">
            <span>Mi plataforma</span>
            <ChevronRight size={10} />
            <span>{ROLE_LABELS[currentRole]}</span>
          </div>
          <p className="truncate text-sm font-bold tracking-tight sm:mt-1">
            {page.label}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          className="icon-button md:hidden"
          aria-label="Abrir búsqueda"
          onClick={() => {
            setMobileSearch(true);
            setSearchOpen(true);
          }}
        >
          <Search size={18} />
        </button>
        <div
          ref={search}
          className={
            mobileSearch
              ? "absolute top-[72px] right-4 left-4 rounded-2xl border border-line bg-surface p-2 shadow-floating md:relative md:inset-auto md:border-0 md:p-0 md:shadow-none"
              : "relative hidden md:block"
          }
        >
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
            />
            <input
              ref={searchInput}
              type="search"
              aria-label={
                currentRole === "soporte"
                  ? "Buscar tickets"
                  : "Buscar cursos o secciones"
              }
              placeholder={
                currentRole === "soporte"
                  ? "Buscar tickets..."
                  : "Buscar en tu plataforma..."
              }
              className={
                "!min-h-10 !border-line/80 !bg-elevated/70 !pl-10 !pr-10 !text-xs " +
                (mobileSearch ? "!w-full md:!w-52 xl:!w-64" : "!w-52 xl:!w-64")
              }
              value={searchTerm}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setSearchOpen(true);
              }}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[9px] text-subtle">
              ⌘ K
            </span>
          </div>
          {searchOpen && searchTerm && currentRole !== "soporte" && (
            <div className="absolute top-12 right-0 w-full overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-floating md:w-80">
              {matches.length > 0 && (
                <>
                  <p className="px-3 py-2 text-[9px] font-bold tracking-widest text-subtle">
                    PROGRAMAS
                  </p>
                  {matches.map((course) => (
                    <button
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-brand-soft"
                      key={course.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setMobileSearch(false);
                        onSelectCourse?.(course);
                      }}
                    >
                      {course.title}
                      <ArrowUpRight size={13} className="shrink-0 text-brand" />
                    </button>
                  ))}
                </>
              )}
              <p className="px-3 py-2 text-[9px] font-bold tracking-widest text-subtle">
                IR A UNA SECCIÓN
              </p>
              {pages.slice(0, 5).map((item) => (
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-muted hover:bg-brand-soft hover:text-brand"
                  key={item.id}
                  onClick={() => navigate(item.id)}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
              {!matches.length && !pages.length && (
                <p className="px-3 py-5 text-xs text-subtle">
                  No encontramos resultados.
                </p>
              )}
              <button
                className="flex w-full items-center justify-end gap-1 px-3 py-2 text-[10px] text-subtle"
                onClick={() => {
                  setSearchOpen(false);
                  setMobileSearch(false);
                }}
              >
                Cerrar
                <X size={11} />
              </button>
            </div>
          )}
        </div>
        <button
          className="icon-button relative"
          onClick={onOpenNotifications}
          aria-label={
            "Notificaciones" +
            (unreadCount ? ", " + unreadCount + " sin leer" : "")
          }
        >
          <Bell size={19} strokeWidth={1.7} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full border-2 border-surface bg-brand px-0.5 text-[8px] leading-3 font-bold text-on-brand">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div ref={profile} className="relative">
          <button
            aria-label="Abrir menú de perfil"
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 rounded-xl p-1 text-left transition hover:bg-elevated sm:pr-2"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <Avatar name={user.name} src={user.avatarUrl} className="size-9" />
            <div className="hidden max-w-36 xl:block">
              <p className="truncate text-xs font-bold">{user.name}</p>
              <p className="mt-0.5 text-[10px] text-subtle">
                {ROLE_LABELS[currentRole]}
              </p>
            </div>
            <ChevronDown
              size={13}
              className={
                "hidden text-subtle transition-transform sm:block " +
                (profileOpen ? "rotate-180" : "")
              }
            />
          </button>
          {profileOpen && (
            <div className="absolute top-14 right-0 w-64 rounded-2xl border border-line bg-surface p-2 shadow-floating">
              <div className="border-b border-line px-3 py-3">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="mt-1 truncate text-[11px] text-subtle">
                  {user.email}
                </p>
              </div>
              <button
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-muted hover:bg-elevated"
                onClick={() => navigate("profile")}
              >
                <UserRound size={16} />
                Mi perfil y datos
              </button>
              <button
                type="button"
                role="switch"
                aria-label="Modo oscuro"
                aria-checked={theme === "dark"}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-muted hover:bg-elevated"
                onClick={onToggleTheme}
              >
                <Moon size={16} />
                Modo oscuro
                <span
                  aria-hidden="true"
                  className={
                    "ml-auto flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors " +
                    (theme === "dark"
                      ? "border-brand bg-brand"
                      : "border-line-strong bg-elevated")
                  }
                >
                  <span
                    className={
                      "size-3.5 rounded-full bg-surface shadow-sm transition-transform " +
                      (theme === "dark" ? "translate-x-4" : "translate-x-0")
                    }
                  />
                </span>
              </button>
              <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-danger hover:bg-danger-soft"
                onClick={onLogout}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
