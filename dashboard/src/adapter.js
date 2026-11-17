// adapter.js — LIVE mode: reads YOUR InboundX through YOUR claude.ai connector and builds the snapshot the page draws.
// No AI here, nothing stored anywhere: every number is counted by this code from what InboundX answers, the same way every time.
// Change these three lines to make it yours (or just tell Claude "change my business name to …"):
const IX_SERVER = 'Inbound X';            // your InboundX connector's name in claude.ai (Settings → Connectors)
const MY_BUSINESS = 'My Business';        // shown top-left until you upload a logo there
const SKIP_AGENTS = [];                   // names to leave out of every number, e.g. your own test account: ['My Test Agent']
const LIVE = (() => {
  const st = { calls: new Map(), agents: [], names: {}, wallets: {}, camps: [], pubs: [], pings: [], disputes: [], fin: null, live: {}, at: {}, err: null, fullAt: 0, slowAt: 0 };
  let mcp = null, busy = false;
  const txt = (v) => String((v && typeof v === 'object' ? v.text : v) ?? '').trim();
  const pay = (r) => { let p = r && r.payload; if (typeof p === 'string') { try { p = JSON.parse(p); } catch {} } return (p && p.structuredContent) || p || {}; };
  const call = (tool, input = {}) => mcp.callTool(IX_SERVER, tool, { ...input, purpose: 'Command Center dashboard refresh' }).then((r) => { st.at[tool] = new Date().toISOString(); return pay(r); });
  const END = { agent_hangup_button: 'agent', agent_sdk_hangup: 'agent', agent_hangup: 'agent', caller_hangup: 'caller', remote_ended: 'remote', rtb_late_arrival_no_agent: 'noagent', rtb_expired: 'noagent', rtb_claim_failed: 'noagent' };
  const ERR = { not_in_manifest: 'InboundX is not turned on for this page. Ask Claude to add your InboundX connector to it.', not_granted: 'Allow this page to use InboundX when it asks (or open it in claude.ai).', server_not_connected: 'Your InboundX connector is not connected. Claude → Settings → Connectors → InboundX → Connect.', rate_limited: 'InboundX asked us to slow down. Trying again shortly.', server_unavailable: 'InboundX is not answering. Trying again.' };
  const errMsg = (e) => ERR[e && e.code] || ('InboundX did not answer' + (e && e.message ? ': ' + String(e.message).slice(0, 120) : '') + '. Trying again.');
  // ---------- reads ----------
  async function slow() { // things that change slowly: every 5 minutes
    const [ag, ca, pu, di] = await Promise.all([call('list_agents', { limit: 1000 }), call('list_campaigns', { limit: 200 }), call('list_publishers', { limit: 200 }), call('list_disputes', { limit: 100 })]);
    st.names = Object.fromEntries((ag.agents || []).map((a) => [a.id, { name: [txt(a.first_name), txt(a.last_name)].filter(Boolean).join(' '), joined: a.created_at, susp: !!a.is_suspended }]));
    st.camps = (ca.campaigns || []).filter((c) => !c.deleted_at && !c.is_test); st.pubs = pu.publishers || []; st.disputes = di.disputes || []; st.slowAt = Date.now(); }
  async function calls(full) { const r = await call('list_calls', full ? { limit: 1000 } : { limit: 40 }); for (const c of r.calls || []) st.calls.set(c.id, c); if (full) st.fullAt = Date.now(); }
  async function fast() { const [ts, wa, fi, pg] = await Promise.all([call('team_status'), call('list_wallets', { limit: 1000 }), call('finance_summary'), call('list_rtb_pings', { limit: 500 })]);
    st.agents = ts.agents || []; st.wallets = Object.fromEntries((wa.wallets || []).map((w) => [w.user_id, w.balance_cents || 0])); st.fin = fi.finance || null; st.pings = pg.pings || []; }
  async function liveWords(onCall) { // the words of each call in progress, graded by the same call rules as the demo and the alerts
    const keep = {};
    for (const a of onCall) { const c = [...st.calls.values()].filter((x) => x.assigned_agent_id === a.agent_id && x.duration_seconds == null).sort((x, y) => (x.created_at < y.created_at ? 1 : -1))[0]; if (!c) continue;
      try { const t = await call('get_transcript', { id: c.id }); keep[c.id] = { call: c, turns: (t.turns || []).map((u) => ({ who: u.channel === 'agent' ? 'agent' : 'caller', text: String(u.text || '') })) }; } catch { keep[c.id] = st.live[c.id] || { call: c, turns: [] }; } }
    st.live = keep; }
  // ---------- InboundX answers → the snapshot ----------
  function build() { const skip = new Set(SKIP_AGENTS.map((n) => n.toLowerCase())), now = Date.now(), A = [], idx = {};
    const campBy = Object.fromEntries(st.camps.map((c) => [c.id, c])), pubBy = Object.fromEntries(st.pubs.map((p) => [p.id, p]));
    const allCalls = [...st.calls.values()].filter((c) => c.duration_seconds != null).sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
    const lastPrice = {}; for (const c of allCalls) if (c.assigned_agent_id && c.price_cents) lastPrice[c.assigned_agent_id] = c.price_cents;
    const cheapest = Math.min(...st.camps.filter((c) => c.active).map((c) => c.price_cents || Infinity)), billedBy = {};
    for (const c of allCalls) if (c.billable && c.assigned_agent_id) billedBy[c.assigned_agent_id] = (billedBy[c.assigned_agent_id] || 0) + (c.price_cents || 0);
    for (const t of st.agents) { const id = t.agent_id, n = st.names[id] || {}, name = txt(t.name) || n.name || 'Unnamed account'; if (skip.has(name.toLowerCase())) continue;
      const reason = String(t.reason || ''), need = +(reason.match(/needs (\d+) cents/) || [])[1] || null, price = need || lastPrice[id] || (isFinite(cheapest) ? cheapest : 6000);
      const camp = st.camps.find((c) => c.price_cents === price), wallet = st.wallets[id] || 0;
      idx[id] = A.length; A.push({ id: id.slice(0, 8), name, stage: 'live', idOk: !/identity verification/i.test(reason), wallet, paid: wallet + (billedBy[id] || 0) /* at least this much: wallet + billed calls */, free: 0, phone: null, email: null,
        joined: n.joined || null, firstPaid: billedBy[id] ? (allCalls.find((c) => c.assigned_agent_id === id && c.billable) || {}).created_at || null : null, origin: null,
        lineName: camp ? camp.name : null, linePrice: price, lineN: 1, lineAll: camp ? [[camp.name, price]] : [], line: null, susp: !!n.susp || /suspended/i.test(reason),
        state: t.state === 'on_call' ? 'in_call' : t.state === 'online' ? 'online' : 'offline', since: null, why: reason }); }
    const lines = [...st.camps.map((c) => ({ id: c.id.slice(0, 8), name: c.name, price: c.price_cents })), { id: 'other', name: 'Other line', price: null }], li = (cid) => { const i = st.camps.findIndex((c) => c.id === cid); return i < 0 ? lines.length - 1 : i; };
    const payouts = {}; for (const c of allCalls) if (c.publisher_payout_cents) { (payouts[c.publisher_id] = payouts[c.publisher_id] || {})[c.publisher_payout_cents] = ((payouts[c.publisher_id] || {})[c.publisher_payout_cents] || 0) + 1; }
    const usual = (pid) => { const m = payouts[pid]; return m ? +Object.entries(m).sort((a, b) => b[1] - a[1])[0][0] : null; };
    const pubs = [...st.pubs.map((p) => ({ id: p.id.slice(0, 8), name: txt(p.company_name) || 'Publisher', payout: usual(p.id) })), { id: 'other', name: 'Other publisher', payout: null }], pi = (pid) => { const i = st.pubs.findIndex((p) => p.id === pid); return i < 0 ? pubs.length - 1 : i; };
    const calls = []; for (const c of allCalls) { const aid = c.assigned_agent_id; if (aid && idx[aid] == null) { if (skip.has((st.names[aid]?.name || '').toLowerCase())) continue; idx[aid] = A.length; A.push({ id: aid.slice(0, 8), name: st.names[aid]?.name || 'Former agent', stage: 'gone', idOk: true, wallet: 0, paid: 0, free: 0, joined: null, origin: null, line: null, susp: false, gone: true }); }
      const b = c.billable ? 1 : 0; calls.push({ id: c.id, t: c.created_at.slice(0, 19) + 'Z', a: aid ? idx[aid] : -1, l: li(c.campaign_id), p: pi(c.publisher_id), d: c.duration_seconds, b, pr: b ? c.price_cents || 0 : 0, po: c.publisher_payout_cents || 0, e: aid ? END[c.ended_reason] || 'other' : 'noagent', s: c.disposition || '' }); }
    const today = dayOf(now), pt = st.pings.filter((p) => dayOf(p.received_at) === today), acc = pt.filter((p) => p.answered).length;
    const liveCalls = Object.values(st.live).map(({ call: c, turns }) => card(c, turns, A[idx[c.assigned_agent_id]], lines[li(c.campaign_id)], pubs[pi(c.publisher_id)]));
    const bal = st.fin ? (st.fin.platform_balance_cents || 0) - (st.fin.overdraft_cents || 0) : 0, stt = A.map((a) => a.state);
    return { asOf: new Date(now).toISOString(), brand: { name: MY_BUSINESS, logo: null }, costs: { name: 'InboundX', platformMonthly: 50000, talkPerMin: 6 }, workspace: '', buffer: 90, balance: bal, agents: A, lines, pubs, calls, people: [],
      growth: { ads: [], bookings: [], outcomes: [], siteStart: today, spendAllTime: 0 },
      pings: { window: 'today', total: pt.length, accepted: acc, arrived: acc, noAgent: pt.filter((p) => p.decline_reason === 'no_agent_online').length, state: pt.filter((p) => /state/.test(p.decline_reason || '')).length, last: (st.pings[0] || {}).received_at || null },
      disputes: st.disputes.filter((d) => d.status === 'pending').map((d) => { const c = st.calls.get(d.call_id) || {}; return { id: d.id, agent: (A[idx[d.user_id]] || {}).name || st.names[d.user_id]?.name || 'Agent', filed: d.submitted_at, status: d.status, reason: txt(d.reason), callId: d.call_id, amount: c.price_cents || null, pub: c.publisher_id ? txt((st.pubs.find((p) => p.id === c.publisher_id) || {}).company_name) : null, what: txt(d.reason) || 'Disputed call' }; }),
      liveCalls, lastCards: [], paidThrough: null, live: { onCall: stt.filter((s) => s === 'in_call').length, waiting: stt.filter((s) => s === 'online').length, paused: 0 },
      sources: { calls: st.at.list_calls || null, floor: st.at.team_status || null, ads: null, bookings: null, lines: st.at.list_campaigns || null, disputes: st.at.list_disputes || null } }; }
  function card(c, turns, a, line, pub) { const T = turns, A = T.filter((t) => t.who === 'agent').map((t) => t.text.toLowerCase()).join(' | '), chk = RULES.scriptCheck(T), hit = RULES.stagesHit(A), age = RULES.callerAgeFrom(T), order = RULES.STAGES.map(([k]) => k), took = RULES.TOOK_NUMBER.test(A);
    return { id: c.id, agent: a ? a.name : 'Agent', line: line ? line.name : null, price: c.price_cents || 0, state: null, pub: pub ? pub.name : null, start: c.created_at, buffer: 90, words: T.length, stages: order, hit,
      steps: chk.steps.map((s) => ({ k: s.k, asked: !!s.asked, ans: s.ans || null, said: s.said ? hideDigits(s.said).slice(0, 90) : null })), qualified: !!chk.qualified, failed: chk.failed || null, asked: chk.asked,
      reached: order.filter((k) => hit.includes(k)).pop() || null, dealLine: null, flags: took ? ['Asked for the caller’s phone number. Listen to this call.'] : [], ended: false, endedAt: null, dur: null, billable: null, disposition: null, endedHow: null,
      took, age: age ?? null, ageOk: age == null ? null : age >= 50 && age <= 85, last: T.slice(-4).map((t) => [t.who === 'agent' ? 'a' : 'c', hideDigits(t.text).slice(0, 220)]), at: Date.now() }; }
  // ---------- the loop: every 5 s while someone is on a call, every 30 s otherwise; slow lists every 5 min; full call list every 10 min ----------
  async function tick() { if (busy) return; busy = true;
    try { const now = Date.now(); if (now - st.slowAt > 300e3) await slow(); await Promise.all([fast(), calls(now - st.fullAt > 600e3)]);
      await liveWords(st.agents.filter((a) => a.state === 'on_call')); LINK_DOWN = false; FEED_MSG = ''; refresh(build(), true); }
    catch (e) { LINK_DOWN = true; FEED_MSG = errMsg(e); if (S.empty) $('view').innerHTML = `<section class="panel">${empty('Connecting to your InboundX', esc(FEED_MSG))}</section>`; fresh(); }
    finally { busy = false; setTimeout(tick, st.agents.some((a) => a.state === 'on_call') ? 5000 : 30000); } }
  function start() { $('view').innerHTML = `<section class="panel">${empty('Connecting to your InboundX', 'Reading your agents, wallets and calls. The first load takes a few seconds.')}</section>`;
    const has = typeof claude !== 'undefined' && claude.use; (has ? claude.use('mcp') : Promise.resolve(null)).then((m) => { if (!m) throw { code: 'not_granted' }; mcp = m; tick(); })
      .catch((e) => { LINK_DOWN = true; FEED_MSG = errMsg(e); $('view').innerHTML = `<section class="panel">${empty('Connect your InboundX', esc(FEED_MSG))}<p style="text-align:center;margin:0 0 18px"><button class="ob-btn go" data-go="connect">How to connect</button></p></section>`; fresh(); }); }
  function turns(id) { const x = st.live[id]; return x ? x.turns.map((t) => [t.who === 'agent' ? 'a' : 'c', hideDigits(t.text)]) : null; }
  async function past(id) { const t = await call('get_transcript', { id }); return (t.turns || []).map((u) => [u.channel === 'agent' ? 'a' : 'c', hideDigits(u.text)]); }
  return { start, turns, past, build, _st: st, _set: (m) => { mcp = m; } };
})();
