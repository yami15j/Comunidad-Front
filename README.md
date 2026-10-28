# Community frontend

Run this React application against the community API. Authentication uses real API accounts; the backend remains responsible for authorization.

## Run locally

1. Use Node.js 22 or newer and run `npm install` in this directory.
2. Set `VITE_API_URL=http://localhost:3000` in a local `.env.local` if needed. The same address is the default. Never put server credentials or service keys in Vite variables.
3. Start the backend, then run `npm run dev` and open the address Vite prints.

## Support workflow

Students can open **Soporte** to create tickets, read their own conversations, and reply. Accounts with backend role `soporte` land on **Mesa de soporte**, which shows available tickets and tickets assigned to that account. Support users must claim an available ticket before reading or replying. Only the assigned support account can close it.

Closing requires confirmation and permanently deletes the conversation. Closed tickets cannot receive messages or reopen. Ticket lists and conversations refresh every three seconds. Failed requests display an error and allow retry. A failed ticket request does not turn a successful login into a login error. An expired session returns to login and removes the conversation from the screen.

Support accounts load tickets and their profile without requesting courses, videos, or live sessions. Admin and mentor pages remain restricted to their existing roles. Account roles are assigned through the backend, never selected at login.

Live-session schedules still display course, date, and duration. Embedded provider access is unavailable until a new integration is configured.

## Verify

Run `npm test` for the dependency-free access, API contract, resource-isolation, and session-expiry regression tests. Run `npm run lint` and `npm run build` using this project's installed dependencies. For a browser smoke test, sign in with an existing student account, create a ticket, sign in with an existing support account, claim it, exchange replies, and confirm closure removes its messages. Use provisioned account details locally; do not commit credentials.

## Student learning workspace

Students use their enrolled courses, published modules/lessons, announcements, notes, questions and progress from the API. The library contains real courses, masterclasses, workshops, ready recordings and lesson resources; empty categories remain empty until content is published. Resource links are authorized by the backend.

The class agenda includes a monthly calendar in the device timezone. Administrators enter a Zoom HTTPS link when scheduling a class or update it later under **Agendar Vivos & Replays**. The details dialog opens Zoom in a separate tab; ended classes do not offer an entry link. No video provider SDK is required.

Administrators publish a downloaded Zoom recording under **Agendar Vivos & Replays > Publicar grabacion**, selecting the course and optionally its class. Uploading bytes must succeed before the recording is marked ready. Students see published recordings in the videoteca and library. Zoom recording and transfer are manual. Existing backend storage and retention settings still apply.

The last visited lesson and video position are stored per authenticated student/course. Video position is saved periodically, on pause, and when switching lessons. Offline or interrupted saves display an error; the latest successfully saved point is restored on return. Lesson completion updates the displayed percentage after the API confirms it.

Backend changes are in the sibling Traction API repository. Apply its migration **20261028000100_student_resume_zoom.sql** before running this version; it adds Zoom links, private resume data, course content types and recording/session associations without replacing existing data. Run **npm test**, **npm run build**, and **npm run lint** for validation.

## Mentor autonomy and administration

Administrators have **Perfiles de mentores** and **Avisos y eventos** in the sidebar. Mentor profiles show saved professional data and actual assigned courses. The mentor selected when creating a course is persisted together with the course; existing course assignments remain managed by administrators.

Mentors use **Mis cursos y estudiantes** to review their assigned course outlines, enroll already registered student accounts by exact email, schedule Zoom classes, upload recordings and update meeting links. They can edit their own professional profile and publish course notices/events without administrator approval. Enrollment and publication permissions are checked by the API against the course assignment; mentors cannot change roles or enroll in another mentor's courses.

Notifications now come from real classes, published lessons/resources, ready recordings and published notices/events. Read status is stored per user. The bell refreshes every 15 seconds while the page is visible and on focus; clicking a notification refreshes the academic data. Support accounts do not load academic notifications. No email, push or Google Calendar integration is enabled.

The API requires migration **20261028000200_notifications.sql** in addition to the student workspace migration. This adds private read records, event kinds and a service-only feed scoped by enrollment/course assignment.

## Administrative curriculum and manual access

Use **Modulos y lecciones** (or **Abrir editor curricular** in a course) to edit course data and its teacher, create ordered modules/lessons, attach a ready video from the same course, add complementary links, upload private files and publish/withdraw materials. Draft lessons/resources remain hidden from students.

Use **Accesos por programa** to grant full, content/recordings-only or live-class-only access. Access may be suspended or expire at a chosen date. These rules are enforced by the backend on dashboards, files, videos, lesson actions, Zoom schedules and notifications. Existing enrollments keep full access without expiry. No purchase or payment workflow was added.

Apply backend migration **20261028000300_administration_access.sql** before using these screens. Community, assessments and mentoring remain future module extensions, not advertised as completed administrative features. Backend verification and extension guidance are documented in its docs/administration.md.

## Tailwind design system

The frontend uses Tailwind CSS 4 with the official Vite plugin. The existing sky blue, white and slate palette is retained. Shared colors, typography, radii, surfaces and components live in src/index.css; reusable brand, avatar, cards, metrics, progress, empty states and keyboard-accessible dialogs live in src/components/ui.jsx. Role navigation is defined in src/services/navigation.js. Static inline declarations across the legacy screens were migrated to Tailwind utilities; dynamic progress/video styling remains driven by state.

The redesigned login, app shell, student dashboard, program cards, library, calendar, recordings, mentor profiles, personal profile, notifications and support share these primitives. Administrative and mentor forms use responsive layouts and data tables can scroll horizontally on narrow screens. The mobile drawer closes on navigation and global search supports mobile. Reduced-motion and visible keyboard focus styles are included.

All roles can enable or disable **Modo oscuro** from the profile menu. This replaces the former membership action. Surfaces, fields, text, alerts and dialogs use the same theme; the sky blue branding is retained. The preference is stored locally in this browser, restored before the app renders, and synchronized across tabs. Signing out does not reset it. This changes appearance only and does not change course access.

Run npm test for the existing API/access regressions plus DOM interaction checks for login, role navigation, search, course selection, profile saving, lesson completion and modal keyboard behavior. npm run build compiles Tailwind into the production CSS; there is no runtime CSS CDN dependency.
