export const ROLE_VIEWS = {
 student: ['dashboard','courses','course-player','live','replays','library','mentors','community','profile','tickets'],
 mentor: ['mentor-dashboard','live','replays','library','community','profile'],
 admin: ['admin-overview','admin-courses','admin-live','admin-users','profile'],
 soporte: ['tickets','profile'],
};
export const homeViewForRole = role => ({admin:'admin-overview',mentor:'mentor-dashboard',soporte:'tickets'})[role] || 'dashboard';
export const canReadTicket = (ticket, user) => Boolean(ticket && ticket.status !== 'closed' && (user.role === 'soporte' ? ticket.assigned_to === user.id : user.role === 'student' && ticket.student_id === user.id));
export const visibleTickets = (tickets, user) => tickets.filter(ticket => user.role === 'soporte' ? !ticket.assigned_to || ticket.assigned_to === user.id : ticket.student_id === user.id);
