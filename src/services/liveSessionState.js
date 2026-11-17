export function liveSessionState(session, now = Date.now()) {
  const start = new Date(session.scheduledAt || session.createdAt).getTime();
  const end = start + (Number(session.durationMinutes) || 60) * 60000;
  const status = session.status === 'ended' || now >= end ? 'ended' : session.status === 'live' || (now >= start && now < end) ? 'live' : 'scheduled';
  return { effectiveStatus: status, isLiveNow: status === 'live', badge: status === 'live' ? 'En vivo' : status === 'ended' ? 'Finalizada' : 'Programada' };
}

export function compareLiveSessions(a, b) {
  const rank = { live: 0, scheduled: 1, ended: 2 };
  const priority = (rank[a.effectiveStatus] ?? 1) - (rank[b.effectiveStatus] ?? 1);
  return priority || (a.effectiveStatus === 'ended' ? new Date(b.scheduledAt) - new Date(a.scheduledAt) : new Date(a.scheduledAt) - new Date(b.scheduledAt));
}
