export function zoomLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      /(^|\.)zoom\.(us|com)$/.test(url.hostname) &&
      (!url.port || url.port === "443") &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function libraryItems(courses, videos) {
  return [
    ...courses.map((course) => ({
      ...course,
      key: "course-" + course.id,
      type: /masterclass/i.test(course.contentType || course.category)
        ? "Masterclasses"
        : /taller|workshop/i.test(course.contentType || course.category)
          ? "Talleres"
          : "Cursos",
      course,
    })),
    ...videos
      .filter((video) => video.status === "ready")
      .map((video) => ({
        ...video,
        key: "video-" + video.id,
        type: "Grabaciones",
        video,
      })),
    ...courses.flatMap((course) =>
      (course.modules || []).flatMap((module) =>
        module.lessons.flatMap((lesson) =>
          (lesson.resources || []).map((resource) => ({
            ...resource,
            key: "resource-" + resource.id,
            type: "Recursos",
            courseTitle: course.title,
            lessonTitle: lesson.title,
            resource,
          })),
        ),
      ),
    ),
  ];
}
