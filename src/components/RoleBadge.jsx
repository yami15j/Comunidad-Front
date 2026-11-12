import React from "react";
import { Headset, GraduationCap, ShieldCheck } from "lucide-react";
import "./RoleBadge.css";

const roles = {
  soporte: { label: "soporte", Icon: Headset },
  mentor: { label: "mentor", Icon: GraduationCap },
  admin: { label: "administrador", Icon: ShieldCheck },
};
export function RoleBadge({ role }) {
  const normalized = typeof role === "string" ? role.trim().toLowerCase() : "";
  const key = normalized === "docente" ? "mentor" : normalized;
  const identity = roles[key];
  if (!identity || !Object.hasOwn(roles, key)) return null;
  const { label, Icon } = identity;
  return <span className={`role-badge role-badge--${key}`} aria-label={`Rol: ${label}`}><Icon size={13} aria-hidden="true" /><span className="role-badge__label">{label}</span></span>;
}
