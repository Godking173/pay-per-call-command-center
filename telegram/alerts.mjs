// alerts.mjs: Telegram alerts from a dashboard snapshot. No AI, and nothing it doesn't need: it reads one JSON file and sends at most one message.
//
//   node telegram/alerts.mjs path/to/snapshot.json          send new alerts
//   node telegram/alerts.mjs path/to/snapshot.json --dry    print them, send nothing
//
// Needs a .env file next to where you run it (never commit it):
//   TELEGRAM_BOT_TOKEN=123456:ABC...   (from @BotFather)
//   TELEGRAM_CHAT_ID=123456789         (run once with --whoami after messaging your bot "hi")
//
// Remembers what it already sent in .alerts-state.json, so running it every minute never repeats an alert.
// All new alerts go out together in ONE message (no flood of separate messages).
import fs from 'node:fs';

const money = (c) => (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toFixed(Math.abs(c) % 100 ? 2 : 0);
const time12 = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: process.env.TZ_NAME || 'America/New_York' });

// ---------- the rules: snapshot in → list of { key, text } out (pure, tested in alerts_test.mjs) ----------
export function alertsFor(s) {
  const out = [], add = (key, text) => out.push({ key, text });
  if (s.balance <= 0) add('stopped', `🛑 CALLS STOPPED. Platform balance is ${money(s.balance)}. Every call is refused until you top up.`);
  else if (s.balance < 1000) add('low:' + Math.floor(s.balance / 500), `⚠️ Platform balance is ${money(s.balance)}. Calls stop at $0.`);
  for (const a of s.agents || []) {
    const price = a.linePrice || 0;
    if ((a.state === 'online' || a.state === 'in_call') && price && a.wallet < price) add('broke:' + a.id + ':' + a.wallet, `💸 ${a.name} is online but can't afford a call: wallet ${money(a.wallet)}, a call costs ${money(price)}. Text them to top up.`);
  }
  for (const c of s.liveCalls || []) {
    if (c.took) add('took:' + c.id, `🚩 ${c.agent} asked the caller for their phone number (call started ${time12(c.start)}). Listen to this call.`);
    if (c.ageOk === false) add('age:' + c.id, `🎂 ${c.agent}'s caller is ${c.age}, outside 50 to 85.${(Date.now() - Date.parse(c.start)) / 1000 >= (c.buffer || 90) ? ' It already billed: dispute it.' : ''}`);
  }
  const names = (s.agents || []).map((a) => a.name), since = Date.now() - 6 * 3600e3;
  for (const c of s.calls || []) {
    if (Date.parse(c.t) < since || c.a < 0) continue;
    if (/sold/i.test(c.s || '')) add('sold:' + c.id, `✅ Sale: ${names[c.a] || 'an agent'} closed one (${time12(c.t)}).`);
    if (c.e === 'agent' && !c.b && c.d >= (s.buffer || 90) - 10 && c.d < (s.buffer || 90) + 5) add('cut:' + c.id, `✂️ ${names[c.a] || 'An agent'} ended a call at ${c.d} seconds, right before the billing mark (${time12(c.t)}).`);
  }
  return out;
}

// ---------- remember what was sent ----------
export function newOnly(alerts, state) {
  const sent = new Set(state.sent || []), fresh = alerts.filter((a) => !sent.has(a.key));
  const live = new Set(alerts.map((a) => a.key));
  // "stopped" can fire again after the balance recovers and drops again
  const keep = [...sent].filter((k) => !(k === 'stopped' && !live.has('stopped'))).slice(-2000);
  return { fresh, state: { sent: [...keep, ...fresh.map((a) => a.key)] } };
}

async function main() {
  const [file, flag] = process.argv.slice(2);
  const env = Object.fromEntries((fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '').split('\n').filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN, CHAT = process.env.TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID;
  if (file === '--whoami') { const r = await (await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`)).json(); const ids = [...new Set((r.result || []).map((u) => u.message?.chat?.id).filter(Boolean))]; console.log(ids.length ? 'Your chat id: ' + ids.join(', ') : 'No messages yet. Send your bot "hi" in Telegram, then run this again.'); return; }
  if (!file) { console.log('Usage: node telegram/alerts.mjs snapshot.json [--dry]'); process.exit(1); }
  const snap = JSON.parse(fs.readFileSync(file, 'utf8')), SF = '.alerts-state.json';
  const state = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {}, { fresh, state: next } = newOnly(alertsFor(snap), state);
  if (!fresh.length) { console.log('No new alerts.'); return; }
  const text = fresh.map((a) => a.text).join('\n\n');
  if (flag === '--dry') { console.log(text); return; }
  if (!TOKEN || !CHAT) { console.log('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env'); process.exit(1); }
  for (let i = 0; i < 3; i++) { // the internet drops sometimes: try 3 times, a few seconds apart, then give up until the next run
    try { const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: true }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.description);
      fs.writeFileSync(SF + '.tmp', JSON.stringify(next)); fs.renameSync(SF + '.tmp', SF); console.log('Sent', fresh.length, 'alert(s).'); return; }
    catch (e) { console.log('Send failed:', e.message); await new Promise((r) => setTimeout(r, 4000)); } }
  process.exit(1);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
