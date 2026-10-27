export async function loadRoleResources(role, api, options) {
  if (role === 'soporte') return null;
  const student = ['estudiante', 'alumno'].includes(role);
  const mentor = ['mentor', 'docente'].includes(role);
  const admin = role === 'admin';
  const dashboard = student ? api.dashboard.student(options) : mentor ? api.dashboard.mentor(options) : admin ? api.dashboard.admin(options) : Promise.resolve(null);
  return Promise.all([
    student || mentor ? Promise.resolve([]) : api.courses.list(options),
    api.liveSessions.list(options), api.videos.list(options),
    admin ? api.users.list(options) : Promise.resolve([]), dashboard,
  ]);
}
