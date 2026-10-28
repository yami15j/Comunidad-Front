import test from 'node:test';
import assert from 'node:assert/strict';
import { homeViewForRole, ROLE_VIEWS, canReadTicket, visibleTickets } from '../src/services/access.js';
test('support has only tickets and profile; existing academic roles retain their homes', () => {
 assert.equal(homeViewForRole('soporte'), 'tickets');
 assert.deepEqual(ROLE_VIEWS.soporte, ['tickets', 'profile']);
 assert.equal(homeViewForRole('mentor'), 'mentor-dashboard');
 assert.ok(ROLE_VIEWS.student.includes('tickets'));
 assert.ok(!ROLE_VIEWS.admin.includes('tickets'));
});
test('ticket participation excludes other support agents and closed conversations', () => {
 const user = {id:'s',role:'soporte'};
 assert.equal(canReadTicket({status:'open',assigned_to:null},user),false);
 assert.equal(canReadTicket({status:'in_progress',assigned_to:'s'},user),true);
 assert.equal(canReadTicket({status:'closed',assigned_to:'s'},user),false);
 assert.equal(canReadTicket({status:'open',student_id:'a'},{id:'a',role:'student'}),true);
 assert.equal(canReadTicket({status:'open',student_id:'b'},{id:'a',role:'student'}),false);
 assert.deepEqual(visibleTickets([{id:1,assigned_to:null},{id:2,assigned_to:'s'},{id:3,assigned_to:'other'}], user).map(t=>t.id),[1,2]);
});
