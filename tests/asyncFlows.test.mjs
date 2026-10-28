import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateWithResources, runTicketMutation } from '../src/services/asyncFlows.js';
const deferred=()=>{let resolve; const promise=new Promise(done=>resolve=done);return {promise,resolve};};
test('validated authentication settles before hung resources and reports bounded resource failure',async()=>{
 const events=[]; const hung=deferred(); let signal;
 await authenticateWithResources({authenticate:async()=>({id:'a'}),isCurrent:()=>true,onAuthenticated:()=>events.push('authenticated'),onSettled:()=>events.push('settled'),loadResources:(_account,options)=>{signal=options.signal;return hung.promise;},onResourceError:error=>events.push(error.message),timeoutMs:5});
 assert.deepEqual(events,['authenticated','settled']);
 await new Promise(resolve=>setTimeout(resolve,15));
 assert.equal(signal.aborted,true); assert.equal(events[2],'Resource loading timed out. Please retry.');
 hung.resolve();
});
test('stale authentication cannot publish session or resource results',async()=>{
 const pending=deferred();let current=true;const events=[];
 const job=authenticateWithResources({authenticate:()=>pending.promise,isCurrent:()=>current,onAuthenticated:()=>events.push('accepted'),onSettled:()=>events.push('settled'),loadResources:()=>events.push('resources')});
 current=false;pending.resolve({id:'old'});await job;assert.deepEqual(events,[]);
});
test('claim and close completion preserve selection made while operation was pending',async()=>{
 for(const status of ['in_progress','closed']){
  const pending=deferred();let selection=0;const updates=[];
  const job=runTicketMutation({action:()=>pending.promise,signal:new AbortController().signal,selectionVersion:()=>selection,onTicket:ticket=>updates.push(ticket.status),onSelect:id=>updates.push(id)});
  selection++;pending.resolve({id:'A',subject:'Ticket A',status});await job;
  assert.deepEqual(updates,[status]);
 }
});
test('creation selects new ticket only if selection stayed unchanged; aborted mutation publishes nothing',async()=>{
 const updates=[]; const controller=new AbortController();
 await runTicketMutation({action:async()=>({id:'new',subject:'New'}),signal:controller.signal,selectionVersion:()=>0,onTicket:()=>updates.push('saved'),onSelect:id=>updates.push(id)});
 assert.deepEqual(updates,['saved','new']);
 controller.abort();await runTicketMutation({action:async()=>({id:'late',subject:'Late'}),signal:controller.signal,selectionVersion:()=>0,onTicket:()=>updates.push('late'),onSelect:id=>updates.push(id)});
 assert.deepEqual(updates,['saved','new']);
});
