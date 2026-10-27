// Datos simulados de alta fidelidad para Comunidad del Intercambio

export const studentUser = {
  id: "usr_001",
  role: "student",
  name: "Alejandro Morales",
  title: "Fundador & CEO en ScaleTech",
  company: "ScaleTech LATAM",
  email: "estudiante@traction.com",
  phone: "+52 55 4892 1045",
  location: "Ciudad de México, México",
  linkedin: "https://linkedin.com/in/alejandro-morales",
  website: "https://scaletech.io",
  bio: "Emprendedor y profesional enfocado en el crecimiento empresarial, optimización de modelos de negocio y liderazgo de equipos de alto impacto. Participante activo en los programas y mentorías ejecutivas de la Comunidad del Intercambio.",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  plan: "Scale Pass",
  planTier: "scale", // "growth" | "scale" | "executive"
  enrolledSince: "Enero 2026",
  stats: {
    coursesInProgress: 3,
    completedLessons: 42,
    totalHoursWatched: 28.5,
    certificationsEarned: 1,
    attendanceRate: "92%"
  }
};

export const mentorUser = {
  id: "usr_mentor_01",
  role: "mentor",
  name: "Sofía Valenzuela",
  title: "Head of Sales & Mentora Oficial",
  email: "mentor@traction.com",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
  plan: "Mentor Oficial",
  planTier: "mentor",
  company: "ScaleB2B Ventures",
  stats: {
    assignedCourses: 2,
    upcomingLiveClasses: 2,
    activeStudents: 348,
    averageRating: "4.95 ★",
    questionsPending: 3
  }
};

export const adminUser = {
  id: "usr_admin_01",
  role: "admin",
  name: "Dirección General & CMS",
  title: "Administrador del Sistema",
  email: "admin@traction.com",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
  plan: "Administrador Maestro",
  planTier: "admin",
  stats: {
    totalStudents: 1480,
    mrr: "$142,500",
    totalCourses: 4,
    activeLiveSessions: 3
  }
};

export const demoAccounts = [
  {
    role: "student",
    label: "Estudiante",
    badge: "Alumno Activo",
    name: "Alejandro Morales",
    subtitle: "ScaleTech • Plan Scale Pass",
    email: "estudiante@traction.com",
    avatar: studentUser.avatar,
    user: studentUser
  },
  {
    role: "mentor",
    label: "Mentor",
    badge: "Claustro Oficial",
    name: "Sofía Valenzuela",
    subtitle: "ScaleB2B • Head of Sales",
    email: "mentor@traction.com",
    avatar: mentorUser.avatar,
    user: mentorUser
  },
  {
    role: "admin",
    label: "Administrador",
    badge: "Gestión CMS",
    name: "Dirección General",
    subtitle: "Control Total de Plataforma",
    email: "admin@traction.com",
    avatar: adminUser.avatar,
    user: adminUser
  }
];

export const mentorQuestions = [
  {
    id: "q_01",
    studentName: "Mateo Carvajal",
    studentCompany: "LogiFast",
    studentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    courseTitle: "Machine de Ventas B2B & Prospección Outbound",
    lessonTitle: "Lección 3.1: Framework SPICED",
    question: "Sofía, para un SaaS con ticket medio de $5,000/año, ¿recomiendas hacer la llamada de diagnóstico y la demo en una sola sesión o separadas?",
    timeAgo: "Hace 2 horas",
    status: "Pendiente"
  },
  {
    id: "q_02",
    studentName: "Valeria Gómez",
    studentCompany: "FinPay LatAm",
    studentAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    courseTitle: "Machine de Ventas B2B & Prospección Outbound",
    lessonTitle: "Lección 2.3: Cadencias de Prospección Multicanal",
    question: "Encontramos que el open rate en cold email subió a 42%, pero las respuestas están en 3%. ¿Qué hook recomiendas en el segundo follow-up?",
    timeAgo: "Hace 5 horas",
    status: "Pendiente"
  },
  {
    id: "q_03",
    studentName: "Ignacio Silva",
    studentCompany: "SaaSify",
    studentAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    courseTitle: "Estrategias de Negociación y Cierre de Grandes Cuentas",
    lessonTitle: "Lección 1.4: Mapeo de Stakeholders y Champion",
    question: "¿Cómo proceder cuando el Champion técnico apoya la compra pero el CFO bloquea por presupuesto de fin de año?",
    timeAgo: "Ayer",
    status: "Pendiente"
  }
];

export const currentUser = studentUser;

export const membershipPlans = [
  {
    id: "growth",
    name: "Growth Pass",
    badge: "Esencial",
    price: "$49 / mes",
    description: "Para emprendedores que buscan dominar los fundamentos y metodologías clave.",
    features: ["Acceso a todos los cursos grabados", "Biblioteca de plantillas y recursos", "Certificados de finalización"],
    isCurrent: false
  },
  {
    id: "scale",
    name: "Scale Pass",
    badge: "Más Popular",
    price: "$99 / mes",
    description: "Para fundadores y líderes que aceleran el crecimiento con interacción en tiempo real.",
    features: [
      "Todo lo de Growth",
      "Clases en vivo semanales con mentores",
      "Videoteca de grabaciones y replays ilimitados",
      "Acceso a la comunidad privada de networking"
    ],
    isCurrent: true
  },
  {
    id: "executive",
    name: "Executive Council",
    badge: "Exclusivo",
    price: "$199 / mes",
    description: "Para directivos y empresarios que requieren asesoría directa y círculos de alto impacto.",
    features: [
      "Todo lo de Scale",
      "Clínicas de negocio y mentorías 1 a 1 mensuales",
      "Cenas y eventos presenciales de networking",
      "Revisión personalizada de tu modelo financiero"
    ],
    isCurrent: false
  }
];

export const mentors = [
  {
    id: "men_01",
    name: "Sofía Valenzuela",
    role: "Ex-Head of Sales en unicornio B2B",
    company: "ScaleB2B Ventures",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    bio: "Lideró equipos comerciales llevando el ARR de $1M a $15M en 3 años. Experta en prospección outbound, estructuración de comisiones y cierres de alto ticket.",
    specialties: ["Ventas B2B", "Outbound", "Negociación", "Playbooks Comerciales"],
    rating: 4.95,
    studentsCount: 840,
    coursesCount: 2
  },
  {
    id: "men_02",
    name: "Carlos Mendívil",
    role: "CFO Fraccional & Asesor de Rondas Serie A/B",
    company: "Atlas Capital Partners",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    bio: "Más de 14 años estructurando modelos financieros para startups y medianas empresas. Ha participado en el levantamiento de más de $35M de inversión institucional.",
    specialties: ["Unit Economics", "Runway & Cashflow", "Levantamiento de Capital", "Valuación"],
    rating: 4.98,
    studentsCount: 1120,
    coursesCount: 3
  },
  {
    id: "men_03",
    name: "Diego Arismendi",
    role: "VP de Crecimiento & Product-Led Growth",
    company: "Orbit Tech",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    bio: "Pionero en estrategias de PLG y experimentación rápida en productos digitales. Especialista en optimización de embudos y retención neta de ingresos (NDR).",
    specialties: ["Product Growth", "Funnels", "Retención & Churn", "Experimentación"],
    rating: 4.91,
    studentsCount: 690,
    coursesCount: 2
  },
  {
    id: "men_04",
    name: "Elena Restrepo",
    role: "Executive Coach & Ex-Chief People Officer",
    company: "Leadership Horizons",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    bio: "Asesora a directores ejecutivos y comités de dirección en la transición de fundadores a ejecutivos de escala, cultura organizacional y gestión de equipos autónomos.",
    specialties: ["Liderazgo Estratégico", "Cultura", "OKRs", "Conversaciones Difíciles"],
    rating: 4.97,
    studentsCount: 950,
    coursesCount: 2
  }
];

export const liveClasses = [
  {
    id: "live_01",
    title: "Taller Práctico: Desarmando un Pipeline B2B en Tiempo Real",
    subtitle: "Auditoría en vivo de secuencias outbound, tasas de respuesta y cómo revertir objeciones de precio.",
    mentorId: "men_01",
    mentorName: "Sofía Valenzuela",
    mentorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    date: "Hoy",
    time: "18:30 (GMT-5)",
    duration: "90 min",
    isToday: true,
    isLiveNow: false,
    joinUrl: "https://zoom.us/j/traction-live-892",
    attendeesCount: 142,
    category: "Ventas & Crecimiento",
    badge: "En Vivo Hoy",
    summary: "En esta sesión interactiva revisaremos los pipelines de 3 alumnos seleccionados y construiremos un script de objeciones aplicable mañana mismo.",
    deliverables: [
      { name: "Plantilla de Matriz de Objeciones (Excel)", size: "1.4 MB" },
      { name: "Guía de 5 Emails de Prospección Fría (PDF)", size: "850 KB" }
    ]
  },
  {
    id: "live_02",
    title: "Clínica Financiera: Cómo Calcular tu LTV real y evitar el Churn Fantasma",
    subtitle: "Aprende a medir con precisión el valor de vida del cliente desagregando cohorts y descuentos.",
    mentorId: "men_02",
    mentorName: "Carlos Mendívil",
    mentorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    date: "Jueves 23 Oct",
    time: "19:00 (GMT-5)",
    duration: "75 min",
    isToday: false,
    isLiveNow: false,
    joinUrl: "https://zoom.us/j/traction-live-904",
    attendeesCount: 98,
    category: "Finanzas & Escala",
    badge: "Próxima Semana",
    summary: "Revisión matemática y estratégica del cálculo de retención de cohortes para presentar a inversionistas o directiva.",
    deliverables: [
      { name: "Calculadora de Cohorts & LTV/CAC (Google Sheets)", size: "2.1 MB" }
    ]
  },
  {
    id: "live_03",
    title: "Masterclass Estratégica: Transición de Founder a CEO de Alto Rendimiento",
    subtitle: "Sistemas de delegación, gestión del tiempo ejecutivo y diseño de comités de dirección.",
    mentorId: "men_04",
    mentorName: "Elena Restrepo",
    mentorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    date: "Martes 28 Oct",
    time: "17:30 (GMT-5)",
    duration: "60 min",
    isToday: false,
    isLiveNow: false,
    joinUrl: "https://zoom.us/j/traction-live-911",
    attendeesCount: 165,
    category: "Liderazgo Ejecutivo",
    badge: "Membresía Scale & Exec",
    summary: "Diseñado para fundadores cuyos equipos han crecido a más de 10 personas y sienten que el día a día los sobrepasa.",
    deliverables: [
      { name: "Framework de Delegación en 4 Niveles (Notion)", size: "Online Link" }
    ]
  }
];

export const replays = [
  {
    id: "rep_01",
    title: "Mastering el Pitch Comercial B2B para C-Levels",
    mentor: "Sofía Valenzuela",
    date: "12 Octubre 2026",
    duration: "1h 24m",
    category: "Ventas B2B",
    views: 520,
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
    description: "Cómo estructurar una llamada de 20 minutos con directores corporativos para despertar urgencia sin sonar agresivo."
  },
  {
    id: "rep_02",
    title: "Modelado Financiero de Runway y Punto de Equilibrio",
    mentor: "Carlos Mendívil",
    date: "05 Octubre 2026",
    duration: "1h 40m",
    category: "Finanzas",
    views: 780,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    description: "Paso a paso para proyectar tus flujos de caja y definir cuándo y cuánto capital necesitas para no poner en riesgo la operación."
  },
  {
    id: "rep_03",
    title: "Activación y Onboarding: Las primeras 72 horas del cliente",
    mentor: "Diego Arismendi",
    date: "28 Septiembre 2026",
    duration: "1h 15m",
    category: "Growth & Producto",
    views: 410,
    thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    description: "Estrategias prácticas de time-to-value para maximizar la adopción de usuarios y reducir el abandono temprano."
  },
  {
    id: "rep_04",
    title: "Cómo implementar OKRs sin burocracia que mate la agilidad",
    mentor: "Elena Restrepo",
    date: "21 Septiembre 2026",
    duration: "1h 05m",
    category: "Liderazgo",
    views: 640,
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    description: "Metodología probada para alinear objetivos trimestrales con métricas de negocio reales y mantener la motivación."
  }
];

export const initialCourses = [
  {
    id: "course_01",
    title: "Machine de Ventas B2B & Prospección Outbound",
    tagline: "Estructura un proceso comercial predecible, escalable y con métricas de conversión de élite.",
    category: "Ventas Estratégicas",
    level: "Avanzado",
    mentorId: "men_01",
    mentorName: "Sofía Valenzuela",
    mentorRole: "Ex-Head of Sales B2B",
    mentorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    progressPercent: 68,
    completedLessonsCount: 8,
    totalLessonsCount: 12,
    estimatedHours: "8.5 horas",
    isEnrolled: true,
    lastLessonId: "les_08",
    rating: 4.96,
    modules: [
      {
        id: "mod_01",
        title: "Módulo 1: La Arquitectura del Outbound Moderno",
        description: "Dejar de depender del 'boca a boca' y diseñar un motor de generación de oportunidades constante.",
        lessons: [
          {
            id: "les_01",
            title: "1.1 Por qué las empresas se estancan: El mito del producto que se vende solo",
            duration: "18 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            summary: "Análisis de cuellos de botella en ventas B2B. Por qué esperar inbound es riesgoso en mercados competitivos.",
            notes: "Regla de oro: El 80% de las oportunidades de alto valor surgen de prospección proactiva dirigida a compradores de decisión.",
            resources: [
              { title: "Diagnóstico de Madurez Comercial (PDF)", type: "pdf", size: "1.2 MB" }
            ]
          },
          {
            id: "les_02",
            title: "1.2 Definición matemática de tu ICP (Ideal Customer Profile)",
            duration: "24 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            summary: "Cómo delimitar el segmento con mayor probabilidad de compra, menor ciclo de ventas y menor churn.",
            notes: "No vendas a todos. El cliente ideal debe tener: dolor urgente, presupuesto asignado y autoridad para decidir.",
            resources: [
              { title: "Template ICP & Buyer Persona Matrix (Excel)", type: "excel", size: "2.4 MB" }
            ]
          },
          {
            id: "les_03",
            title: "1.3 Las 3 métricas que todo fundador debe monitorear a diario",
            duration: "21 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            summary: "Ratio de conversión de reunión a propuesta, ciclo de ventas promedio (CAC Payback) y valor de ticket anual.",
            notes: "Métricas vanidosas vs métricas de tracción. Si no puedes predecir el mes siguiente, no tienes una máquina de ventas.",
            resources: []
          }
        ]
      },
      {
        id: "mod_02",
        title: "Módulo 2: Secuencias y Mensajes de Alta Conversión",
        description: "Aprende a redactar mensajes fríos por correo y LinkedIn que los directores de empresa realmente contesten.",
        lessons: [
          {
            id: "les_04",
            title: "2.1 La anatomía del Cold Email de 4 oraciones",
            duration: "22 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            summary: "Estructura de gancho, relevancia contextual, caso de éxito concreto y llamado a la acción de baja fricción.",
            notes: "Nunca pidas 45 minutos en el primer correo. Pide 10 minutos para validar si el problema resuena con su agenda actual.",
            resources: [
              { title: "10 Ejemplos Reales de Cold Emails con >40% Open Rate (PDF)", type: "pdf", size: "3.1 MB" }
            ]
          },
          {
            id: "les_05",
            title: "2.2 Estrategia multicanal: Sincronizando LinkedIn, Correo y Voz",
            duration: "26 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            summary: "El cadenciamiento de 14 días. Cuándo interactuar con posts del prospecto y cuándo enviar el mensaje privado.",
            notes: "La persistencia inteligente gana: la mayoría de cierres suceden entre el 4to y 7mo punto de contacto.",
            resources: [
              { title: "Cadencia de Prospección de 14 Días (Notion)", type: "link", size: "Enlace" }
            ]
          },
          {
            id: "les_06",
            title: "2.3 Automatización con personalización a escala mediante IA",
            duration: "30 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
            summary: "Cómo investigar 100 cuentas en minutos y redactar líneas introductorias únicas sin perder el toque humano.",
            notes: "La IA es tu asistente de investigación, pero la voz y la empatía estratégica siguen siendo tuyas.",
            resources: []
          }
        ]
      },
      {
        id: "mod_03",
        title: "Módulo 3: Discovery Calls y Demostraciones Ganadoras",
        description: "El arte de diagnosticar el dolor del cliente para que la solución sea la única opción lógica.",
        lessons: [
          {
            id: "les_07",
            title: "3.1 Framework SPICED para descubrir urgencia y dolor oculto",
            duration: "28 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            summary: "Situation, Pain, Impact, Critical Event, Decision. Las preguntas que hacen que el prospecto te cuente su mayor dolor.",
            notes: "Quien habla más del 40% del tiempo en una llamada de discovery está perdiendo la venta.",
            resources: [
              { title: "Hoja de Preguntas SPICED para Discovery Call (PDF)", type: "pdf", size: "900 KB" }
            ]
          },
          {
            id: "les_08",
            title: "3.2 Cómo estructurar una Demo que no aburra (El enfoque de 3 historias)",
            duration: "35 min",
            completed: false, // Lección actual!
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
            summary: "Deja de mostrar botones y características técnicas. Muestra cómo cambia la vida del cliente antes y después.",
            notes: "La demo debe comenzar por el final: muestra el resultado tangible que les interesa en los primeros 5 minutos.",
            resources: [
              { title: "Playbook de Estructura de Demo B2B (Slide Deck)", type: "ppt", size: "4.5 MB" }
            ]
          },
          {
            id: "les_09",
            title: "3.3 Manejo y anticipación de las 4 objeciones clásicas",
            duration: "25 min",
            completed: false,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
            summary: "'No tenemos presupuesto', 'Envíame un correo con la info', 'Ya trabajamos con otro proveedor' y 'No es el momento'.",
            notes: "Las objeciones no son rechazos, son solicitudes de mayor certeza.",
            resources: []
          }
        ]
      },
      {
        id: "mod_04",
        title: "Módulo 4: Negociación, Propuestas y Cierre de Contratos",
        description: "Protege tus márgenes y asegura acuerdos plurianuales con términos favorables.",
        lessons: [
          {
            id: "les_10",
            title: "4.1 La propuesta de 1 página: Eliminando la fricción de compras",
            duration: "20 min",
            completed: false,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            summary: "Por qué las propuestas de 30 páginas retrasan las decisiones y cómo un One-Pager acelera la firma.",
            notes: "",
            resources: [
              { title: "Plantilla One-Page Executive Proposal (Doc)", type: "doc", size: "1.1 MB" }
            ]
          },
          {
            id: "les_11",
            title: "4.2 Concesiones tácticas: El principio de 'Nunca des nada sin pedir algo a cambio'",
            duration: "22 min",
            completed: false,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
            summary: "Si el cliente pide descuento, tú pides plazo de pago adelantado, caso de estudio público o contrato a 2 años.",
            notes: "",
            resources: []
          },
          {
            id: "les_12",
            title: "4.3 Contratación y compensación del equipo comercial de alto impacto",
            duration: "32 min",
            completed: false,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
            summary: "Modelos OTE (On-Target Earnings), ramp-up de 90 días y cómo estructurar aceleradores de cuota.",
            notes: "",
            resources: [
              { title: "Calculadora de Planes de Comisiones B2B (Excel)", type: "excel", size: "1.8 MB" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "course_02",
    title: "Unit Economics, Finanzas y Métricas de Escala para Founders",
    tagline: "Domina tus estados financieros, controla el burn rate y prepara tu negocio para ser rentable o levantar capital.",
    category: "Finanzas & Estrategia",
    level: "Intermedio / Escala",
    mentorId: "men_02",
    mentorName: "Carlos Mendívil",
    mentorRole: "CFO Fraccional & Investor",
    mentorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    progressPercent: 35,
    completedLessonsCount: 4,
    totalLessonsCount: 10,
    estimatedHours: "7.0 horas",
    isEnrolled: true,
    lastLessonId: "les_02_04",
    rating: 4.98,
    modules: [
      {
        id: "mod_02_01",
        title: "Módulo 1: La Verdad detrás del Cashflow y Runway",
        description: "Aprende a diferenciar utilidad contable de dinero real en el banco.",
        lessons: [
          {
            id: "les_02_01",
            title: "1.1 Estado de Flujos vs P&L: La trampa de las ventas a crédito",
            duration: "25 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            summary: "Por qué empresas rentables en papel quiebran por falta de liquidez en caja.",
            notes: "Caja es rey, flujo es reina.",
            resources: [{ title: "Modelo de Proyección de Caja a 13 Semanas (Excel)", type: "excel", size: "3.2 MB" }]
          },
          {
            id: "les_02_02",
            title: "1.2 Anatomía del CAC: Costos directos, indirectos y tiempo del fundador",
            duration: "30 min",
            completed: true,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            summary: "El cálculo correcto del Costo de Adquisición de Clientes sin autoengañarse.",
            notes: "",
            resources: []
          }
        ]
      }
    ]
  },
  {
    id: "course_03",
    title: "Estrategia de Crecimiento & Product-Led Growth (PLG)",
    tagline: "Convierte tu producto en el principal imán de adquisición, retención y expansión de clientes.",
    category: "Crecimiento & Producto",
    level: "Avanzado",
    mentorId: "men_03",
    mentorName: "Diego Arismendi",
    mentorRole: "VP de Crecimiento",
    mentorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    progressPercent: 12,
    completedLessonsCount: 1,
    totalLessonsCount: 8,
    estimatedHours: "6.0 horas",
    isEnrolled: true,
    lastLessonId: "les_03_01",
    rating: 4.92,
    modules: []
  },
  {
    id: "course_04",
    title: "Liderazgo Ejecutivo y Cultura de Alto Desempeño",
    tagline: "Transición efectiva de operador táctico a líder visionario capaz de alinear y empoderar equipos.",
    category: "Liderazgo & Equipos",
    level: "Todos los niveles",
    mentorId: "men_04",
    mentorName: "Elena Restrepo",
    mentorRole: "Executive Coach",
    mentorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    progressPercent: 0,
    completedLessonsCount: 0,
    totalLessonsCount: 9,
    estimatedHours: "5.5 horas",
    isEnrolled: false,
    lastLessonId: null,
    rating: 4.97,
    modules: []
  }
];

export const libraryResources = [
  {
    id: "res_01",
    title: "Simulador Financiero de Runway & Cashflow (36 Meses)",
    category: "Finanzas",
    type: "Plantilla Excel",
    fileType: "xlsx",
    size: "3.4 MB",
    downloads: 1420,
    rating: 4.9,
    description: "Modelo financiero dinámico con escenarios optimista, base y conservador para planificar contratación y gastos."
  },
  {
    id: "res_02",
    title: "Playbook de Procesos Comerciales y Guión de Cierre",
    category: "Ventas B2B",
    type: "Documento Notion",
    fileType: "notion",
    size: "Enlace Directo",
    downloads: 980,
    rating: 4.95,
    description: "Estructura completa para documentar tu proceso de ventas para que cualquier nuevo vendedor comience a vender en <30 días."
  },
  {
    id: "res_03",
    title: "Framework de OKRs Trimestrales para Equipos de Alta Velocidad",
    category: "Liderazgo",
    type: "Plantilla Notion",
    fileType: "notion",
    size: "Enlace Directo",
    downloads: 1150,
    rating: 4.88,
    description: "Sistema para fijar 3 Objetivos clave y 3 Resultados Clave por trimestre sin perder foco ni dispersar recursos."
  },
  {
    id: "res_04",
    title: "Calculadora de Unit Economics: LTV, CAC y Payback Period",
    category: "Finanzas",
    type: "Hoja de Cálculo",
    fileType: "sheets",
    size: "1.8 MB",
    downloads: 870,
    rating: 4.97,
    description: "Evalúa si cada cliente adquirido aporta valor económico neto a la empresa o si estás quemando capital en marketing."
  },
  {
    id: "res_05",
    title: "Matriz de Contratación Ejecutiva & Scorecard de Entrevistas",
    category: "Liderazgo",
    type: "Guía PDF",
    fileType: "pdf",
    size: "2.1 MB",
    downloads: 640,
    rating: 4.85,
    description: "Cómo evaluar habilidades técnicas, liderazgo y ajuste cultural sin sesgos al entrevistar gerentes o directores."
  }
];

export const notificationsList = [
  {
    id: "notif_01",
    title: "¡Clase en vivo hoy a las 18:30!",
    description: "Sofía Valenzuela liderará el taller 'Desarmando un Pipeline B2B'. Prepara tus dudas para la sesión en vivo.",
    time: "Hace 15 min",
    read: false,
    type: "live"
  },
  {
    id: "notif_02",
    title: "Nuevo recurso disponible en Finanzas",
    description: "Se ha subido el 'Simulador Financiero de Runway 36 meses' a la biblioteca de herramientas.",
    time: "Hace 3 horas",
    read: false,
    type: "resource"
  },
  {
    id: "notif_03",
    title: "Replay listo para ver",
    description: "La grabación de 'Mastering el Pitch Comercial' ya está disponible en la videoteca de replays.",
    time: "Ayer",
    read: true,
    type: "replay"
  }
];

export const communityThreads = [
  {
    id: "th_01",
    author: "Mateo Carvajal",
    authorRole: "Fundador de LogiFast (Logística B2B)",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    badge: "Scale Member",
    title: "¿Cómo están estructurando la comisión de su primer SDR en LatAm?",
    content: "Estamos buscando contratar nuestro primer SDR dedicado a outbound en México y Colombia. ¿Recomiendan salario base 70% y variable 30% basado en reuniones calificadas, o fijar metas por contratos cerrados?",
    category: "Ventas B2B",
    likes: 24,
    commentsCount: 11,
    timeAgo: "Hace 2 horas",
    isPinned: true
  },
  {
    id: "th_02",
    author: "Valeria Gómez",
    authorRole: "COO en FinPay",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    badge: "Executive Council",
    title: "Caso de éxito: Redujimos el ciclo de ventas de 65 a 28 días aplicando el One-Pager",
    content: "Quiero compartir una victoria del equipo: implementamos el framework de la clase de Sofía de propuesta de 1 página y las firmas se aceleraron drásticamente. Menos aprobaciones legales en los clientes corporativos.",
    category: "Casos de Éxito",
    likes: 47,
    commentsCount: 19,
    timeAgo: "Hace 6 horas",
    isPinned: false
  }
];

export const adminOverviewStats = {
  totalStudents: 1480,
  activeThisMonth: 1120,
  mrr: "$142,500 USD",
  averageCompletionRate: "74%",
  upcomingClassesCount: 6,
  mentorsCount: 8
};
