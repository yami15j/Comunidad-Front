import React, { useState } from "react";
import {
  ArrowUpRight,
  Menu,
  LogOut,
  UserRound,
  Radio,
} from "lucide-react";
import { Brand, Avatar } from "./ui";
import { navigationForRole, ROLE_LABELS } from "../services/navigation";
import { homeViewForRole } from "../services/access";
export function Sidebar({
  supportFilter = "pending",
  supportCounts = {},
  onSupportFilterChange,
  currentView,
  onNavigate,
  currentRole,
  user,
  liveClasses = [],
  onLogout,
  isOpen = true,
  onToggleSidebar,
}) {
  const [supportMenuOpen, setSupportMenuOpen] = useState(true);
  const live = liveClasses.find((session) => session.isLiveNow);
  const next =
    live ||
    [...liveClasses]
      .filter((session) => session.effectiveStatus === "scheduled")
      .sort((a, b) =>
        String(a.scheduledAt).localeCompare(String(b.scheduledAt)),
      )[0];
  return (
    <aside
      aria-label="Navegación principal"
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
      className={
        "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-surface transition-transform duration-300 " +
        (isOpen ? "translate-x-0" : "-translate-x-full")
      }
    >
      <div className="flex h-24 shrink-0 items-center justify-between gap-2 px-4">
        <button
          onClick={() => onNavigate(homeViewForRole(currentRole))}
          aria-label="Ir al inicio"
          className="min-w-0 flex-1"
        >
          <Brand />
        </button>
        <button
          aria-label="Cerrar menú lateral"
          aria-expanded={isOpen}
          className="icon-button size-10 shrink-0 rounded-xl border border-line bg-elevated text-muted"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-3">
        {navigationForRole(currentRole).map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-subtle/70">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  currentView === item.id ||
                  (currentView === "course-player" && item.id === "courses") ||
                  (currentRole === "admin" && currentView === "admin-curriculum" && item.id === "admin-courses");
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.id}>
                  <button
                    aria-current={active ? "page" : undefined}
                    aria-expanded={item.id === "admin-support" ? active && supportMenuOpen : undefined}
                    onClick={() => {
                      if (item.id === "admin-support") setSupportMenuOpen(active ? !supportMenuOpen : true);
                      onNavigate(item.id);
                    }}
                    className={
                      "group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold transition " +
                      (active
                        ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand-celeste-border)]"
                        : "text-muted hover:bg-elevated hover:text-ink")
                    }
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2 : 1.6}
                      className={
                        active
                          ? "text-brand"
                          : "text-subtle group-hover:text-brand"
                      }
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.id === "live" && live && (
                      <span aria-label="Clase en vivo" className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-950/40 dark:text-red-300"><span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" />En vivo</span>
                    )}
                    {active && (
                      <span className="h-4 w-0.5 rounded-full bg-brand" />
                    )}
                  </button>
                  {onSupportFilterChange && ((currentRole === "soporte" && item.id === "tickets") || (currentRole === "admin" && item.id === "admin-support" && active && supportMenuOpen)) && <div className="ml-5 mt-2 space-y-1 border-l border-line pl-3" aria-label="Estado del ticket">
                    {[["all", "Todos"], ["pending", "Pendientes"], ["resolved", "Resueltos"]].map(([value, label]) => <button key={value} type="button" aria-pressed={active && supportFilter === value} onClick={() => { onSupportFilterChange(value); onNavigate(item.id); }} className={"flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-xs font-semibold transition " + (active && supportFilter === value ? "bg-brand-soft text-brand" : "text-subtle hover:bg-elevated hover:text-ink")}><span>{label}</span><span className={"inline-flex min-w-7 items-center justify-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] " + (value === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" : value === "resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-brand-line bg-brand-soft text-brand")}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{supportCounts[value] || 0}</span></button>)}
                    {currentRole === "soporte" && <button type="button" aria-pressed={active && supportFilter === "options"} onClick={() => { onSupportFilterChange("options"); onNavigate(item.id); }} className={"flex min-h-10 w-full items-center rounded-xl px-3 text-left text-xs font-semibold transition " + (active && supportFilter === "options" ? "bg-brand-soft text-brand" : "text-subtle hover:bg-elevated hover:text-ink")}>Mis etiquetas y estados</button>}
                  </div>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 space-y-4 p-4">
        {next && currentRole !== "soporte" && (
          <button
            onClick={() =>
              onNavigate(currentRole === "admin" ? "admin-live" : "live")
            }
            className="w-full rounded-2xl border border-brand-line/60 bg-brand-soft/70 p-4 text-left transition hover:border-brand/40"
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-brand">
              <Radio size={13} />
              {live ? "EN VIVO AHORA" : "EN TU AGENDA"}
              <ArrowUpRight size={13} className="ml-auto" />
            </div>
            <p className="line-clamp-2 text-xs leading-5 font-bold text-ink">
              {next.title}
            </p>
            <p className="mt-1.5 text-[10px] text-subtle">
              {next.date} · {next.time}
            </p>
          </button>
        )}
        <div className="border-t border-line pt-4">
          <button
            onClick={() => onNavigate("profile")}
            className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-elevated"
          >
            <Avatar
              name={user?.name}
              src={user?.avatarUrl}
              className="size-9"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">
                {user?.name}
              </p>
              <p className="mt-0.5 text-[10px] text-subtle">
                {ROLE_LABELS[currentRole]}
              </p>
            </div>
            <UserRound
              size={16}
              className="text-subtle group-hover:text-brand"
            />
          </button>
          <button
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-subtle transition hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
export default Sidebar;
