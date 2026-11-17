// ---------- data layer: ONE snapshot object in, everything else is computed. The live build swaps SNAP for connector data. ----------
const TZ = -4 * 3600e3, DAY = 864e5; let S, NOW, BUF, TODAY, CALLS, AGENTS, TOOK, BOOK, ALLK, EVENTS; // filled by load(snapshot); a newer snapshot simply calls load() again
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayOf = (t) => new Date((typeof t === 'number' ? t : Date.parse(t)) + TZ).toISOString().slice(0, 10);
const dayAdd = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const loc = (t, o) => new Date((typeof t === 'number' ? t : Date.parse(t)) + TZ).toLocaleString('en-US', { timeZone: 'UTC', ...o });
const fmtDay = (d) => loc(d + 'T16:00:00Z', { month: 'short', day: 'numeric' });
const fmtWhen = (t) => loc(t, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
const fmtFull = (t) => loc(t, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const fmtTime = (t) => loc(t, { hour: 'numeric', minute: '2-digit' });
const money = (c) => { if (c == null || isNaN(c)) return '—'; const whole = Math.round(c) % 100 === 0, v = Math.abs(c) / 100; return (c < 0 ? '−' : '') + '$' + v.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }); };
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const dur = (s) => (s == null ? '—' : s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's');
const ago = (ms) => { const m = Math.round(ms / 60000); if (m < 60) return m + ' min ago'; const h = Math.floor(m / 60); return h < 48 ? h + ' h ago' : Math.round(h / 24) + ' days ago'; };
const sum = (a, f) => a.reduce((t, x) => t + (f(x) || 0), 0);
const initials = (n) => String(n || '?').split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
const LINE_PRICE = { gold: 6000, premium: 6500, vip: 7000 }, LINE_NAME = { gold: 'Gold · $60', premium: 'Premium · $65', vip: 'VIP · $70' }, LINE_FULL = { gold: 'FE Social Gold', premium: 'FE Social Premium', vip: 'FE Social VIP' };
// v2.5: the line now comes from InboundX's own roster (lineName / linePrice / lineAll); the short keys above are the fallback
const lineLabel = (a) => (a && a.lineName ? a.lineName.replace(/^FE (Social )?/, '') + (a.linePrice ? ' · ' + money(a.linePrice) : '') + (a.lineN > 1 ? ' (+' + (a.lineN - 1) + ' more)' : '') : a ? LINE_NAME[a.line] || null : null);

function load(snap) { S = snap; NOW = Date.parse(S.asOf); BUF = S.buffer; TODAY = dayOf(NOW);
CALLS = S.calls.map((c, i) => ({ ...c, i, day: dayOf(c.t), hr: new Date(Date.parse(c.t) + TZ).getUTCHours(),
  agent: c.a >= 0 ? S.agents[c.a].name : null, line: S.lines[c.l].name, pub: S.pubs[c.p].name,
  sold: /sold/i.test(c.s), lost: c.a < 0 && c.e === 'noagent', hung: c.e === 'agent' && !c.b,
  cut: c.e === 'agent' && !c.b && c.d >= BUF - 10 && c.d < BUF + 5, early: c.a >= 0 && !c.b && c.e === 'caller' && c.d != null && c.d < BUF }));
AGENTS = S.agents.map((a, ai) => ({ ...a, ai })).filter((a) => !a.gone).map((a) => { const price = a.linePrice || LINE_PRICE[a.line] || 5000;
  const ready = a.susp ? 'susp' : !a.idOk ? 'noid' : a.wallet < price ? 'nomoney' : 'ready', state = a.state || 'offline';
  return { ...a, price, ready, state, callsLeft: a.susp ? 0 : Math.floor(a.wallet / price) }; });
TOOK = new Set(S.calls.filter((c) => c.a >= 0).map((c) => S.agents[c.a].name));
BOOK = S.people.map((p, i) => ({ ...p, i, at: p.start }));
ALLK = kOf(CALLS);
EVENTS = BOOK.map((b) => ({ t: Date.parse(b.start), day: dayOf(b.start), name: b.name || 'Booked call', past: Date.parse(b.start) < NOW, i: b.i })).sort((a, b) => a.t - b.t);
}
const PERIODS = { today: { label: 'Today', days: 1, prev: 'yesterday' }, d7: { label: 'Last 7 days', days: 7, prev: 'the 7 days before' }, d30: { label: 'Last 30 days', days: 30, prev: 'the 30 days before' } };

function kOf(list) {
  const con = list.filter((c) => c.a >= 0), bill = list.filter((c) => c.b), early = list.filter((c) => c.early);
  const k = { sent: list.length, connected: con.length, billable: bill.length, paid: sum(bill, (c) => c.pr), owed: sum(list, (c) => c.po),
    sold: list.filter((c) => c.sold).length, lost: list.filter((c) => c.lost).length, hung: list.filter((c) => c.hung).length, cut: list.filter((c) => c.cut).length,
    early: early.length, fast: early.filter((c) => c.d < 30).length };
  k.margin = k.paid - k.owed; k.perCall = k.sent ? k.paid / k.sent : null; k.profitCall = k.sent ? k.margin / k.sent : null; return k;
}
function groupBy(list, key) { const m = new Map(); for (const c of list) { const k = key(c); if (k == null) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(c); } return m; }
function model(pkey) {
  const P = PERIODS[pkey], from = dayAdd(TODAY, -(P.days - 1)), pFrom = dayAdd(from, -P.days);
  const W = CALLS.filter((c) => c.day >= from && c.day <= TODAY), PW = CALLS.filter((c) => c.day >= pFrom && c.day < from);
  const k = kOf(W), pk = kOf(PW);
  const byAgent = [...groupBy(W, (c) => c.agent)].map(([name, l]) => ({ name, ...kOf(l) })).sort((a, b) => b.paid - a.paid || b.billable - a.billable || b.sent - a.sent);
  const byLine = [...groupBy(W, (c) => c.line)].map(([name, l]) => ({ name, ...kOf(l) })).sort((a, b) => b.margin - a.margin);
  const byPub = [...groupBy(W, (c) => c.pub)].map(([name, l]) => ({ name, ...kOf(l), lines: [...groupBy(l, (c) => c.line)].map(([n, x]) => ({ name: n, ...kOf(x) })).sort((a, b) => b.sent - a.sent) })).sort((a, b) => b.sent - a.sent);
  const hourly = Array.from({ length: 24 }, (_, h) => { const l = W.filter((c) => c.hr === h && c.a >= 0); return { h, connected: l.length, billable: l.filter((c) => c.b).length }; });
  const G = S.growth, inR = (d) => d >= from && d <= TODAY;
  const daily = Array.from({ length: 30 }, (_, i) => { const d = dayAdd(TODAY, i - 29), l = CALLS.filter((c) => c.day === d); return { d, inP: d >= from, ...kOf(l), ads: (G.ads.find((r) => r.d === d) || {}).s || 0, booked: G.bookings.filter((b) => b.added && dayOf(b.added) === d).length, signups: AGENTS.filter((a) => a.joined && dayOf(a.joined) === d).length }; });
  const other = k.sent - k.billable - k.hung - k.early - k.lost;
  // the rest of the business: costs, agents, supply, growth
  const con = W.filter((c) => c.a >= 0), bill = W.filter((c) => c.b), mins = Math.round(sum(con, (c) => c.d) / 60), talk = mins * S.costs.talkPerMin, fee = Math.round((S.costs.platformMonthly / 30) * P.days);
  const ads = sum(G.ads.filter((r) => inR(r.d)), (r) => r.s), siteAds = sum(G.ads.filter((r) => inR(r.d)), (r) => r.site);
  const named = byAgent.filter((a) => a.name), nowNames = new Set(named.map((a) => a.name)), prevNames = [...new Set(PW.map((c) => c.agent).filter(Boolean))];
  const booked = G.bookings.filter((b) => b.added && inR(dayOf(b.added))).length, newPay = AGENTS.filter((a) => a.firstPaid && inR(dayOf(a.firstPaid)));
  const left = sum(AGENTS, (a) => a.callsLeft), pace7 = CALLS.filter((c) => c.b && c.day >= dayAdd(TODAY, -6)).length / 7, payout = S.pubs[0].payout || 0;
  const x = { mins, talk, fee, ads, siteAds, net: k.margin - talk - fee - ads, active: named.length, perActive: named.length ? k.paid / named.length : null, topShare: k.paid && named[0] ? named[0].paid / k.paid : null, topName: named[0] ? named[0].name : '',
    quiet: prevNames.filter((n) => !nowNames.has(n)), pubShare: k.sent && byPub[0] ? byPub[0].sent / k.sent : null, pubName: byPub[0] ? byPub[0].name : '',
    missed: k.billable && k.connected ? Math.round(k.lost * (k.billable / k.connected) * (k.margin / k.billable)) : 0, prepaid: sum(AGENTS, (a) => a.callsLeft * Math.max(0, a.price - payout)), left, daysToDeliver: pace7 ? left / pace7 : null,
    costPerSale: k.sold ? k.paid / k.sold : null, avgBilled: bill.length ? Math.round(sum(bill, (c) => c.d) / bill.length) : null, booked, signups: AGENTS.filter((a) => a.joined && inR(dayOf(a.joined))).length, newPay, cpb: booked ? siteAds / booked : null, cac: newPay.length ? ads / newPay.length : null };
  return { pkey, P, from, W, k, pk, x, hasPrev: CALLS.length > 0 && CALLS[0].day <= pFrom, byAgent, byLine, byPub, hourly, daily,
    outcome: [['Billed', k.billable, 'var(--s1)'], ['Agent ended it early', k.hung, 'var(--s2)'], ['Caller left early', k.early, 'var(--s3)'], ['Never reached an agent', k.lost, 'var(--s4)'], ['Other', Math.max(0, other), 'var(--mute)']] };
}
// ---------- what needs the owner right now (built from the data, not written by hand) ----------
function attention() {
  const out = [], rdy = AGENTS.filter((a) => a.ready === 'ready'), live = S.live.onCall + S.live.waiting;
  if (S.balance <= 0) out.push({ lv: 'crit', t: `ALL CALLS ARE STOPPED · call balance ${money(S.balance)}`, d: 'InboundX refuses every offer from every publisher until the call balance is topped up (InboundX Settings → Billing).', go: 'money', btn: 'Money' });
  else if (S.balance < 1000) out.push({ lv: 'crit', t: `Call balance is ${money(S.balance)}`, d: `About ${dur(Math.round(S.balance / 6) * 60).replace(/ \d+s$/, '')} of talk time left. Calls stop at $0.`, go: 'money', btn: 'Money' });
  const idle = rdy.filter((a) => a.paid > 0 && !TOOK.has(a.name));
  const few = (arr, f) => arr.slice(0, 5).map(f).join(', ') + (arr.length > 5 ? ` and ${arr.length - 5} more` : '');
  if (idle.length > 3) out.push({ lv: 'warn', t: `${idle.length} agents have money loaded and have never taken a call`, d: `${money(sum(idle, (a) => a.wallet))} sitting idle: ${few(idle.slice().sort((a, b) => b.wallet - a.wallet), (a) => a.name.split(' ')[0] + ' ' + money(a.wallet))}.`, go: 'agents', btn: 'Agents' });
  else for (const a of idle) out.push({ lv: 'warn', t: `${a.name} has ${money(a.wallet)} and has never taken a call`, d: `Paid, ID done, on ${lineLabel(a) || 'no line'}. ` + (a.line && !CALLS.some((c) => c.line === LINE_FULL[a.line] && c.day >= dayAdd(TODAY, -13)) ? 'No calls have come to that line in 2 weeks. Move them to a line that gets calls.' : 'One phone call gets this money working.'), go: 'agents', btn: 'Agents' });
  const short = AGENTS.filter((a) => a.ready === 'nomoney' && CALLS.some((c) => c.agent === a.name && c.day >= dayAdd(TODAY, -6)));
  if (short.length) out.push({ lv: 'warn', t: `${short.length} active agent${short.length > 1 ? 's' : ''} can't afford the next call`, d: few(short, (a) => `${a.name.split(' ')[0]} ${money(a.wallet)}`) + '. They were taking calls this week.', go: 'floor', btn: 'Live floor' });
  if (!live) { const last = CALLS[CALLS.length - 1]; out.push({ lv: 'info', t: 'Nobody is live', d: `${rdy.length} agents could take a call right now if they logged in. Last call ${fmtWhen(last.t)}.`, go: 'floor', btn: 'Live floor' }); }
  for (const x of S.disputes) out.push({ lv: 'warn', t: `Dispute waiting ${Math.round((NOW - Date.parse(x.filed)) / DAY)} days: ${x.agent}`, d: x.what + '.', go: 'calls', btn: 'Calls' });
  const cuts = [...groupBy(CALLS.filter((c) => c.cut && c.day >= dayAdd(TODAY, -6)), (c) => c.agent)].filter(([, l]) => l.length >= 2);
  if (cuts.length) out.push({ lv: 'warn', t: `Cutting calls right at the billing mark: ${few(cuts, ([n, l]) => n.split(' ')[0] + ' ×' + l.length)}`, d: `Ended by the agent within 10 seconds of the ${BUF}-second mark, this week. Listen to those calls.`, go: 'calls', btn: 'Calls' });
  const fresh = AGENTS.filter((a) => a.joined && NOW - Date.parse(a.joined) < 2 * DAY);
  if (fresh.length) out.push({ lv: 'info', t: `${fresh.length} new sign-up${fresh.length > 1 ? 's' : ''} in the last 2 days`, d: few(fresh, (a) => a.name) + '.', go: 'pipeline', btn: 'Pipeline' });
  const nb = BOOK.filter((b) => Date.parse(b.at) > NOW); if (nb.length) { const d0 = dayOf(nb[0].at), n0 = nb.filter((b) => dayOf(b.at) === d0).length;
    out.push({ lv: 'good', t: `${n0} booked call${n0 > 1 ? 's' : ''} on ${loc(nb[0].at, { weekday: 'long' })}`, d: `First one ${fmtTime(nb[0].at)} with ${nb[0].name}. ${nb.length} booked in total.`, go: 'pipeline', btn: 'Pipeline' }); }
  return out;
}
// ---------- v2.2: checks, minutes, calendar events (pure; the test file runs these in Node) ----------
const weekStart = (d) => dayAdd(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7));
const minsFrom = (d0) => Math.round(sum(CALLS.filter((c) => c.a >= 0 && c.day >= d0), (c) => c.d) / 60);
function checks(m) { const k = m.k, W = m.W, inP = m.daily.filter((d) => d.inP), tri = k.billable <= k.connected && k.connected <= k.sent;
  const rows = [['Margin = agents paid − publishers', k.margin, sum(W, (c) => c.pr - c.po), 1], ['Agents add up to the total paid', sum(m.byAgent, (a) => a.paid), k.paid, 1], ['Lines add up to all calls', sum(m.byLine, (l) => l.sent), k.sent, 0],
    ['Publishers add up to what we owe', sum(m.byPub, (p) => p.owed), k.owed, 1], ['Hours add up to connected calls', sum(m.hourly, (h) => h.connected), k.connected, 0], ['Call outcomes add up to all calls', sum(m.outcome, (o) => o[1]), k.sent, 0],
    ['Days add up to billable calls', sum(inP, (d) => d.billable), k.billable, 0], ['Bottom line re-added from its parts', k.paid - k.owed - m.x.talk - m.x.fee - m.x.ads, m.x.net, 1],
    ['Weeks add up to everything owed, all time', sum([...groupBy(CALLS, (c) => weekStart(c.day))], ([, l]) => sum(l, (c) => c.po)), sum(CALLS, (c) => c.po), 1]].map(([name, a, b, isMoney]) => ({ name, a, b, isMoney, ok: Math.abs(a - b) < 0.5 }));
  const odd = W.filter((c) => c.po && S.pubs[c.p].payout && c.po !== S.pubs[c.p].payout).length;
  rows.push({ name: 'Every publisher payout is the agreed rate', a: odd, b: 0, ok: odd === 0 }, { name: 'Billed ≤ reached an agent ≤ calls in', a: tri ? 1 : 0, b: 1, ok: tri, flag: true }); return rows; }
// ---------- charts (plain SVG; one scale each; hover on every mark) ----------
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function colChart(el, items, o) { // items: [{label, v, v2?, tip, hi}]  o: {fmt, color, color2, every}
  const W = el.clientWidth || 600, H = el.clientHeight || 210, L = 46, R = 8, T = 10, B = 24, iw = W - L - R, ih = H - T - B;
  const max = niceMax(Math.max(1, ...items.map((d) => Math.max(d.v, d.v2 || 0)))), min = Math.min(0, ...items.map((d) => d.v)), lo = min < 0 ? -niceMax(-min) : 0;
  const y = (v) => T + ih - ((v - lo) / (max - lo)) * ih, slot = iw / items.length, bw = Math.max(3, Math.min(24, slot - 4));
  let s = '';
  for (const tv of [lo, ...(lo < 0 ? [0] : []), max / 2, max]) s += `<line x1="${L}" x2="${W - R}" y1="${y(tv)}" y2="${y(tv)}" stroke="rgba(255,255,255,${tv === 0 ? 0.22 : 0.07})"/><text x="${L - 8}" y="${y(tv) + 4}" text-anchor="end">${o.fmt(tv)}</text>`;
  items.forEach((d, i) => { const cx = L + slot * i + slot / 2, bar = (v, w, col, op) => { if (!v) return ''; const y0 = y(Math.max(v, 0)), h = Math.max(1.5, Math.abs(y(v) - y(0))), r = Math.min(4, w / 2, h);
      const p = v > 0 ? `M${cx - w / 2},${y0 + h}V${y0 + r}q0,${-r} ${r},${-r}h${w - 2 * r}q${r},0 ${r},${r}V${y0 + h}z` : `M${cx - w / 2},${y0}V${y0 + h - r}q0,${r} ${r},${r}h${w - 2 * r}q${r},0 ${r},${-r}V${y0}z`;
      return `<path d="${p}" fill="${v < 0 ? 'var(--crit)' : col}" opacity="${op}"/>`; };
    if (d.v2 != null) s += bar(d.v2, bw, 'var(--mute)', 1) + bar(d.v, Math.max(3, bw - 6), o.color, 1); else s += bar(d.v, bw, o.color, d.hi === false ? 0.32 : 1);
    if (i % (o.every || 1) === 0) s += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>`;
    s += `<rect x="${L + slot * i}" y="${T}" width="${slot}" height="${ih}" fill="transparent" data-tip="${esc(d.tip)}"/>`; });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || 'chart')}">${s}</svg>`;
}
function spark(el, vals, hiFrom) { const W = el.clientWidth || 260, H = el.clientHeight || 74, max = Math.max(1, ...vals), min = Math.min(0, ...vals), x = (i) => (i / (vals.length - 1)) * (W - 8) + 4, y = (v) => H - 6 - ((v - min) / (max - min)) * (H - 14);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`), a = `M${pts.join('L')}`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" style="width:100%;height:100%;overflow:visible"><path d="${a}L${x(vals.length - 1)},${H}L${x(0)},${H}z" fill="var(--s1)" opacity=".12"/><path d="${a}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/><path d="M${pts.slice(hiFrom).join('L')}" fill="none" stroke="var(--s1)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="4.5" fill="var(--s1)" stroke="var(--bg)" stroke-width="2"/></svg>`; }
const segbar = (parts, total) => `<div class="segbar" role="img" aria-label="${esc(parts.map((p) => p[0] + ' ' + p[1]).join(', '))}">${parts.filter((p) => p[1] > 0).map((p) => `<div style="flex:${p[1]} 1 0;background:${p[2]}" data-tip="${esc(p[0])}\n${p[1]} of ${total} (${pct(p[1], total)})">${p[1] / total > 0.08 ? pct(p[1], total) : ''}</div>`).join('')}</div>
  <div class="legend">${parts.filter((p) => p[1] > 0).map((p) => `<span><i style="background:${p[2]}"></i>${esc(p[0])}<b class="num">${p[1]}</b></span>`).join('')}</div>`;
const hbars = (rows, fmt) => { const max = Math.max(1, ...rows.map((r) => Math.abs(r.v))); return rows.map((r) => `<div class="hbar"${r.sheet != null ? ` data-sheet="agent:${r.sheet}" tabindex="0" role="button"` : ''} data-tip="${esc(r.tip || '')}"><span class="nm">${esc(r.name)}</span><div><div class="tr${r.v < 0 ? ' neg' : ''}" style="width:${Math.max(1.5, (Math.abs(r.v) / max) * 100)}%${r.color ? ';background:' + r.color : ''}"></div></div><span class="vl num">${fmt(r.v)}</span></div>`).join(''); };
const meter = (v, max, target, lv) => `<div class="meter ${lv}"><i style="width:${Math.max(2, Math.min(100, (v / max) * 100))}%"></i>${target != null ? `<u style="left:${Math.min(100, (target / max) * 100)}%" title="target"></u>` : ''}</div>`;
const pill = (lv, text) => `<span class="pill ${lv}">${esc(text)}</span>`;
const delta = (now, prev, upGood = true, m) => { if (!m.hasPrev || (!prev && !now)) return ''; if (!prev) return `<span class="delta">new</span>`; const d = (now - prev) / Math.abs(prev), up = d >= 0; return `<span class="delta ${Math.abs(d) < 0.005 ? '' : up === upGood ? 'up' : 'down'}" title="vs ${esc(m.P.prev)}">${up ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))}%</span>`; };
load(SNAP);
