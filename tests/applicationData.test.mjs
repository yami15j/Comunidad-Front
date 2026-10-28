import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoleResources } from '../src/services/applicationData.js';
test('support login and restore never request academic resources',async()=>{
 const forbidden=new Proxy({}, {get(){throw Error('academic request');}});
 assert.equal(await loadRoleResources('soporte',forbidden),null);
});
test('academic accounts preserve role-specific dashboard and resources',async()=>{
 const calls=[]; const method=name=>async()=>{calls.push(name);return [name];};
 const api={courses:{list:method('courses')},liveSessions:{list:method('sessions')},videos:{list:method('videos')},users:{list:method('users')},dashboard:{student:method('student'),mentor:method('mentor'),admin:method('admin')}};
 assert.deepEqual(await loadRoleResources('estudiante',api),[[],['sessions'],['videos'],[],['student']]);
 assert.deepEqual(calls,['student','sessions','videos']);calls.length=0;
 await loadRoleResources('admin',api);
 assert.deepEqual(calls,['admin','courses','sessions','videos','users']);
});
