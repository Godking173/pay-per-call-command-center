import { chromium } from 'playwright';
const b = await chromium.launch({});
const W = +(process.env.W || 1366), H = +(process.env.H || 900), OUT = process.env.OUT || '/tmp/shots';
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load/.test(m.text()) && errs.push(m.text()));
await p.goto('file://' + process.cwd() + '/dist/index.html', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(800);
const snap = async (n) => p.screenshot({ path: `${OUT}/${n}_${W}.png` });
for (const step of [0, 1, 2, 3, 4, 5]) { await p.evaluate((s) => obOpen(s), step); await p.waitForTimeout(150); await snap('ob' + step); }
await p.evaluate(() => obClose());
for (const v of (process.env.V || 'overview,floor,agents,calls,money,pipeline,connect,grow,opensource,ads').split(',')) {
  await p.evaluate((v) => go(v), v); await p.waitForTimeout(300);
  const h = await p.evaluate(() => document.getElementById('main').scrollHeight);
  await p.setViewportSize({ width: W, height: Math.min(Math.max(h, H), 4200) }); await p.waitForTimeout(200); await snap('v_' + v); await p.setViewportSize({ width: W, height: H });
  console.log(v, 'h', h, 'overflowX', await p.evaluate(() => document.getElementById('main').scrollWidth > document.getElementById('main').clientWidth + 1));
}
await p.evaluate(() => go('floor')); await p.waitForTimeout(300);
const live = await p.evaluate(() => S.liveCalls.map((c) => c.agent + ' ' + c.reached)); console.log('live', live);
await p.evaluate(() => openSheet('live:' + S.liveCalls[0].id)); await p.waitForTimeout(700); await snap('sheet_live');
const lines = await p.evaluate(() => document.querySelectorAll('#liveTx div').length); console.log('panel lines', lines);
await p.evaluate(() => { STACK.length = 0; drawSheet(); });
for (const k of ['broke', 'flag', 'stopped']) { await p.evaluate((k) => djPick(k), k); await p.waitForTimeout(3500); await snap('dj_' + k); }
const c = await p.evaluate(() => CALLS.filter((c) => c.a >= 0).slice(-1)[0].i); await p.evaluate((i) => openSheet('call:' + i), c); await p.waitForTimeout(500); await snap('sheet_call');
console.log('ERRORS', errs); await b.close();
