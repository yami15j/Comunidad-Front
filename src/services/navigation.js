import {
  LayoutDashboard,
  BookOpen,
  Radio,
  Film,
  Library,
  Users,
  MessageSquare,
  LifeBuoy,
  GraduationCap,
  ShieldCheck,
  Bell,
  FolderOpen,
  UserRound,
} from "lucide-react";
export const ROLE_LABELS = {
  student: "Estudiante",
  mentor: "Mentor",
  admin: "Administrador",
  soporte: "Soporte",
};
export const NAVIGATION = {
  student: [
    {
      label: "MI APRENDIZAJE",
      items: [
        { id: "dashboard", label: "Mi dashboard", icon: LayoutDashboard },
        { id: "courses", label: "Mis programas", icon: BookOpen },
        { id: "live", label: "Clases en vivo", icon: Radio },
        { id: "replays", label: "Grabaciones", icon: Film },
      ],
    },
    {
      label: "EXPLORAR",
      items: [
        { id: "library", label: "Biblioteca", icon: Library },
        { id: "mentors", label: "Nuestros mentores", icon: GraduationCap },
        { id: "community", label: "Comunidad", icon: MessageSquare },
        { id: "tickets", label: "Centro de soporte", icon: LifeBuoy },
      ],
    },
  ],
  mentor: [
    {
      label: "MI ESPACIO DOCENTE",
      items: [
        {
          id: "mentor-dashboard",
          label: "Panel del mentor",
          icon: LayoutDashboard,
        },
        { id: "mentor-courses", label: "Cursos y estudiantes", icon: BookOpen },
        { id: "live", label: "Clases en vivo", icon: Radio },
        { id: "replays", label: "Mis grabaciones", icon: Film },
        { id: "library", label: "Biblioteca", icon: Library },
      ],
    },
    {
      label: "CONECTAR",
      items: [
        { id: "mentor-notifications", label: "Avisos y eventos", icon: Bell },
        { id: "community", label: "Comunidad", icon: MessageSquare },
      ],
    },
  ],
  admin: [
    {
      label: "ADMINISTRACIÓN",
      items: [
        { id: "admin-overview", label: "Vista general", icon: LayoutDashboard },
        { id: "admin-users", label: "Usuarios y permisos", icon: Users },
        {
          id: "admin-mentors",
          label: "Perfiles de mentores",
          icon: GraduationCap,
        },
      ],
    },
    {
      label: "CONTENIDO Y PROGRAMAS",
      items: [
        { id: "admin-courses", label: "Cursos y programas", icon: BookOpen },
        {
          id: "admin-curriculum",
          label: "Módulos y lecciones",
          icon: FolderOpen,
        },
        { id: "admin-live", label: "Clases y grabaciones", icon: Radio },
      ],
    },
    {
      label: "GESTIÓN",
      items: [
        {
          id: "admin-access",
          label: "Accesos por programa",
          icon: ShieldCheck,
        },
        { id: "admin-notifications", label: "Avisos y eventos", icon: Bell },
      ],
    },
  ],
  soporte: [
    {
      label: "ATENCIÓN A LA COMUNIDAD",
      items: [{ id: "tickets", label: "Mesa de soporte", icon: LifeBuoy }],
    },
  ],
};
export const navigationForRole = (role) =>
  NAVIGATION[role] || NAVIGATION.student;
export const pageForView = (role, view) =>
  navigationForRole(role)
    .flatMap((group) => group.items)
    .find((item) => item.id === view) || {
    label: view === "course-player" ? "Aula de aprendizaje" : "Mi perfil",
    icon: UserRound,
  };
