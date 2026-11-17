// alerts_test.mjs: node telegram/alerts_test.mjs → prints GREEN or RED. Uses the made-up sample snapshot, never a real one.
import fs from 'node:fs';
import { alertsFor, newOnly } from './alerts.mjs';
const base = JSON.parse(fs.readFileSync(new URL('../examples/snapshot.sample.json', import.meta.url)));
const clone = () => JSON.parse(JSON.stringify(base));
let bad = 0; const check = (name, ok) => { console.log((ok ? '  ok  ' : '  FAIL ') + name); if (!ok) bad++; };

let s = clone(); s.balance = -120; check('balance at or below $0 → CALLS STOPPED', alertsFor(s).some((a) => a.key === 'stopped'));
s = clone(); s.balance = 18640; check('healthy balance → no balance alert', !alertsFor(s).some((a) => /^(stopped|low)/.test(a.key)));
s = clone(); s.balance = 700; check('balance under $10 → low warning', alertsFor(s).some((a) => a.key.startsWith('low')));
s = clone(); check('online agent whose wallet can\'t cover a call → alert (Robert in the sample)', alertsFor(s).some((a) => a.key.startsWith('broke:') && /Robert/.test(a.text)));
s = clone(); check('offline agent with $0 → no alert (not taking calls)', !alertsFor(s).some((a) => /Megan/.test(a.text)));
s = clone(); s.liveCalls[0].took = true; check('agent asked for the caller\'s number → flag', alertsFor(s).some((a) => a.key.startsWith('took:')));
s = clone(); s.liveCalls[0].ageOk = false; s.liveCalls[0].age = 89; check('caller outside 50 to 85 → alert', alertsFor(s).some((a) => a.key.startsWith('age:') && /89/.test(a.text)));
s = clone(); s.calls.push({ id: 'x1', t: new Date().toISOString(), a: 0, l: 1, p: 0, d: 400, b: 1, pr: 6500, po: 4500, e: 'agent', s: 'Sold' }); check('sale in the last 6 hours → alert', alertsFor(s).some((a) => a.key === 'sold:x1'));
s = clone(); s.calls.push({ id: 'x2', t: new Date().toISOString(), a: 0, l: 1, p: 0, d: 86, b: 0, pr: 0, po: 0, e: 'agent', s: '' }); check('agent cut a call at 86 s → alert', alertsFor(s).some((a) => a.key === 'cut:x2'));
// memory: nothing repeats, "stopped" can come back after a recovery
s = clone(); s.balance = -1; let r1 = newOnly(alertsFor(s), {}), r2 = newOnly(alertsFor(s), r1.state);
check('second run sends nothing new', r1.fresh.length > 0 && r2.fresh.length === 0);
s.balance = 5000; const r3 = newOnly(alertsFor(s), r2.state); s.balance = -1; const r4 = newOnly(alertsFor(s), r3.state);
check('calls stopped → recovered → stopped again alerts again', r4.fresh.some((a) => a.key === 'stopped'));
console.log(bad ? `RED: ${bad} check(s) failed` : 'GREEN: all alert checks pass'); process.exit(bad ? 1 : 0);
