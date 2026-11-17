export function studentAccessSnapshot({ dashboard, videos, sessions }, now = Date.now()) {
  const courses = (dashboard.courses || []).filter(course => (!course.status || course.status === 'active') && (!course.accessExpiresAt || new Date(course.accessExpiresAt).getTime() > now)).map(course => course.accessType === 'live' ? { ...course, modules: [], totalLessonsCount: 0, totalModulesCount: 0, totalResourcesCount: 0 } : course);
  const contentIds = new Set(courses.filter(course => course.accessType !== 'live').map(course => course.id));
  const liveIds = new Set(courses.filter(course => course.accessType !== 'content').map(course => course.id));
  return { courses, videos: videos.filter(video => contentIds.has(video.courseId)), sessions: sessions.filter(session => liveIds.has(session.courseId)) };
}
