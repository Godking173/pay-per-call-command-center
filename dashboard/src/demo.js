// demo.js — the LIVE DEMO engine (zero network, zero real data).
// Every agent, caller, publisher, wallet and call on the demo page is MADE UP here. Nothing is read from any real account.
// It builds the same "snapshot" object the real dashboard gets from InboundX, and moves it forward every few seconds,
// so the demo shows exactly what the real page shows: agents waiting, on a call (script bar filling in), in wrap-up,
// paused, running out of money, topping up, a flagged call, a caller outside the age range, and the platform balance hitting $0.
const DEMO = (() => {
  const T0 = Date.now(), MIN = 60e3, HR = 36e5, DAYMS = 864e5;
  let seed = 20261117; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z'), uid = () => 'demo-' + Math.floor(rnd() * 1e12).toString(36);
  // own copies of three tiny helpers (the page's versions are defined later in the file)
  const hd = (x) => String(x || '').replace(/(?:\d[\s\-.,\/]*){3,}/g, '••• ').replace(/\s+/g, ' ').trim(), clk = (x) => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0'), usd = (c) => '$' + Math.round(c / 100);
  const LINES = [{ id: 'gold', name: 'Final Expense Gold', price: 6000 }, { id: 'premium', name: 'Final Expense Premium', price: 6500 }, { id: 'vip', name: 'Final Expense VIP', price: 7000 }];
  const PUBS = [{ id: 'p1', name: 'Summit Media', payout: 4500 }, { id: 'p2', name: 'BlueRiver Leads', payout: 4500 }, { id: 'p3', name: 'Northstar Calls', payout: 4500 }];

  // ---------- the calls (made-up words that walk through the 5-step qualifying script) ----------
  // [second, who, words]. {A} = agent's first name, {C} = caller's first name.
  const SCRIPTS = {
    GOOD: { len: 400, end: 'agent', billable: true, disp: 'Sold', deal: 'Mutual of Omaha · $10,000 coverage · $48.20 a month', how: 'Agent ended the call', turns: [
      [0, 'a', 'Thank you for calling, this is {A}, a licensed agent on a recorded line. Who do I have the pleasure of speaking with?'], [6, 'c', 'Hi, this is {C}.'],
      [10, 'a', "Hi {C}. You're calling about final expense coverage, right? To help with funeral costs?"], [16, 'c', 'Yes, I saw the ad on TV about burial insurance.'],
      [22, 'a', "Perfect. Just so you're aware, this is not a free program. There is a small monthly premium. Is that okay with you?"], [30, 'c', 'Yes, I understand.'],
      [36, 'a', 'Great. What is your date of birth?'], [41, 'c', 'March 3rd, 1954.'],
      [48, 'a', 'Thank you. And do you have a checking or savings account?'], [54, 'c', 'Yes, a checking account with Wells Fargo.'],
      [62, 'a', 'Wonderful. Who would you like to leave this money to?'], [70, 'c', 'My daughter, Karen.'],
      [80, 'a', 'Any heart problems, cancer, diabetes or stroke in the last two years?'], [88, 'c', 'No, just some blood pressure medicine.'],
      [100, 'a', "That's fine. Let me pull up the best rates for you."], [150, 'a', 'Okay {C}, for $10,000 in coverage it comes out to $48.20 a month.'], [160, 'c', 'That sounds good. I can do that.'],
      [175, 'a', "Great. What bank do you use, and what's the routing number on your checks?"], [185, 'c', 'Wells Fargo. Let me get my checkbook.'], [230, 'c', 'Okay, I have it here.'],
      [260, 'a', "Thank you. I'm sending a text code to your phone for your signature."], [280, 'c', 'I got it. It says 4 8 2 1 9 0.'],
      [300, 'a', "Perfect, I'm submitting the application now."], [360, 'a', 'Congratulations {C}, you were approved! Your policy starts on the first.'], [368, 'c', 'Oh, thank you so much.'],
      [380, 'a', "You're welcome. You'll get the papers in the mail in about two weeks."]] },
    FREE: { len: 58, end: 'caller', billable: false, disp: 'Not interested', deal: null, how: 'Caller hung up', turns: [
      [0, 'a', 'Thanks for calling, this is {A}, licensed insurance agent. Who am I speaking with?'], [5, 'c', 'This is {C}.'],
      [9, 'a', 'Hi {C}, you were calling about burial insurance, correct?'], [14, 'c', 'Yeah, the one on the commercial.'],
      [19, 'a', 'Okay. Just so you know, these plans are not free. There is a monthly premium.'], [29, 'c', "Oh, I thought it was free. I can't afford that, I'm on a fixed income."],
      [38, 'a', 'I understand. Some plans are very affordable. Can I ask how old you are?'], [45, 'c', "No, that's alright. I'm not interested."], [52, 'c', 'Bye now.']] },
    TOOK: { len: 240, end: 'agent', billable: true, disp: 'Callback', deal: 'Lincoln Heritage · $8,000 coverage · $39.75 a month', how: 'Agent ended the call', took: 65, turns: [
      [0, 'a', 'Thank you for calling, this is {A}, a licensed agent. How can I help you?'], [5, 'c', "Hi, I'm calling about the final expense insurance I saw online."],
      [12, 'a', "Sure. You're looking to get your final expense coverage set up, right?"], [18, 'c', "Yes ma'am."],
      [24, 'a', 'Before we start, these plans are not free, there is a small monthly payment. Is that okay?'], [31, 'c', "Yes, that's fine."],
      [38, 'a', 'What year were you born?'], [43, 'c', 'Nineteen fifty-eight.'],
      [50, 'a', 'Do you have a checking or savings account?'], [55, 'c', 'Savings, with my credit union.'],
      [65, 'a', "Okay great. In case the line drops, what's a good number for you? I'll call you right back on my personal cell."], [75, 'c', "Sure, it's 4 0 7 5 5 5 0 1 4 2."],
      [85, 'a', 'Got it. Who would you want to receive the benefit?'], [92, 'c', 'My son.'],
      [110, 'a', 'Any heart, cancer or kidney issues?'], [118, 'c', 'No.'],
      [150, 'a', "For $8,000 in coverage it's $39.75 a month."], [160, 'c', 'Okay, let me think about it.'],
      [200, 'a', "No problem, I'll give you a call back tomorrow."], [230, 'c', 'Alright, thank you.']] },
    AGE: { len: 105, end: 'agent', billable: true, disp: 'Not qualified', deal: null, how: 'Agent ended the call', turns: [
      [0, 'a', 'Thanks for calling, this is {A}, a licensed agent on a recorded line. Who do I have?'], [5, 'c', 'This is {C}.'],
      [9, 'a', "Hi {C}, you're calling in about burial coverage, right?"], [14, 'c', "That's right."],
      [19, 'a', "Just so you know, this is not a free program. There's a small monthly premium."], [26, 'c', 'Yes, I know.'],
      [32, 'a', 'What is your date of birth?'], [37, 'c', 'July 9th, 1937.'],
      [45, 'a', "Thank you {C}. Unfortunately our plans stop at age 85, so I can't write a policy for you today."], [55, 'c', 'Oh, okay. Is there anything else?'],
      [70, 'a', "I'd check with your bank, they may have options."], [95, 'c', 'Alright, thanks anyway.']] },
  };
  const CALLERS = ['Dorothy', 'Earl', 'Gloria', 'Harold', 'Bernice', 'Walter', 'Loretta', 'Clarence', 'Mildred', 'Eugene', 'Shirley', 'Ronald'];
  const USST = ['FL', 'TX', 'GA', 'OH', 'NC', 'TN', 'AL', 'MI', 'PA', 'SC', 'LA', 'MO'];
  const wordsOf = (key, agent, caller, upTo) => SCRIPTS[key].turns.filter(([s]) => s <= upTo).map(([s, w, t]) => ({ s, who: w === 'a' ? 'agent' : 'caller', text: t.replace(/\{A\}/g, agent.split(' ')[0]).replace(/\{C\}/g, caller) }));

  // ---------- the team (8 made-up agents + 4 who are off today) ----------
  // prog = what each agent does, over and over: wait → call → wrap-up … ('broke' = online but the wallet can't cover a call, 'topup' = adds money)
  const W = (n) => ['wait', n], C = (k, who, st, p = 0) => ['call', k, who, st, p], R = (n) => ['wrap', n];
  const TEAM = [
    { name: 'Maria Lopez', line: 1, base: 52000, paid: 195000, days: 41, origin: 'booked-call', prog: [W(40), C('GOOD', 'Dorothy', 'FL'), R(30)], off: 175 },
    { name: 'James Carter', line: 0, base: 30000, paid: 120000, days: 33, origin: 'self-serve', prog: [W(45), C('FREE', 'Earl', 'GA', 1), R(20), W(60), C('AGE', 'Walter', 'OH', 2), R(25)], off: 50 },
    { name: 'Dana Whitfield', line: 2, base: 21000, paid: 70000, days: 19, origin: 'self-serve', prog: [W(100), C('TOOK', 'Gloria', 'TX'), R(35)], off: 20 },
    { name: 'Kevin Brooks', line: 1, base: 13000, paid: 65000, days: 12, origin: 'booked-call', prog: [['topup', 1], W(35), C('AGE', 'Harold', 'TN', 2), R(25), W(30), C('GOOD', 'Loretta', 'AL'), R(30), ['broke', 150]], off: 60 },
    { name: 'Tasha Green', line: 0, base: 36000, paid: 90000, days: 27, origin: 'before-site', fixed: 'paused', since: 7 },
    { name: 'Robert Hale', line: 0, base: 4000, paid: 60000, days: 22, origin: 'self-serve', fixed: 'online', since: 11 },
    { name: 'Luis Ortega', line: 1, base: 65000, paid: 65000, days: 4, origin: 'booked-call', fixed: 'offline', fresh: true },
    { name: 'Priya Shah', line: 2, base: 0, paid: 0, days: 1, origin: 'self-serve', fixed: 'offline', noid: true },
    { name: 'Megan Ross', line: 1, base: 0, paid: 130000, days: 37, origin: 'before-site', fixed: 'offline' },
    { name: 'Andre Mitchell', line: 2, base: 28000, paid: 210000, days: 52, origin: 'before-site', fixed: 'offline' },
    { name: 'Sofia Reyes', line: 1, base: 19500, paid: 117000, days: 30, origin: 'self-serve', fixed: 'offline' },
    { name: 'Brian Cole', line: 0, base: 12000, paid: 96000, days: 45, origin: 'before-site', fixed: 'offline' },
  ];
  const segLen = (g) => (g[0] === 'call' ? SCRIPTS[g[1]].len : g[1]);
  for (const a of TEAM) { a.wallet = a.base; a.key = null; a.cur = null; a.last = null; if (a.prog) a.L = a.prog.reduce((t, g) => t + segLen(g), 0); }
  const where = (a, now) => { let p = ((((now - T0) / 1000 + a.off) % a.L) + a.L) % a.L, i = 0; const cyc = Math.floor(((now - T0) / 1000 + a.off) / a.L);
    while (p >= segLen(a.prog[i])) { p -= segLen(a.prog[i]); i++; } return { i, el: p, g: a.prog[i], key: cyc + ':' + i, start: now - p * 1000 }; };

  // ---------- 30 days of made-up history ----------
  const CALLS = [], HIST_AG = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11];
  const dayStart = (ms) => { const d = new Date(ms - 4 * HR); d.setUTCHours(0, 0, 0, 0); return d.getTime() + 4 * HR; }; // midnight, Eastern (the page shows Eastern)
  const cutoff = T0 - 12 * MIN, today0 = dayStart(T0);
  for (let d = 29; d >= 0; d--) { const d0 = today0 - d * DAYMS, n = between(16, 30) - ([0, 6].includes(new Date(d0 + 12 * HR).getUTCDay()) ? 8 : 0);
    const startH = d === 0 ? Math.max(0, Math.min(9, (cutoff - d0) / HR - 8)) : 9;
    for (let j = 0; j < n; j++) { const t = d0 + (startH + rnd() * 10) * HR; if (t > cutoff) continue; const ai = HIST_AG[Math.floor(rnd() * HIST_AG.length)], ag = TEAM[ai], r = rnd(), p = rnd() < 0.55 ? 0 : rnd() < 0.65 ? 1 : 2;
      let c; if (r < 0.08) c = { a: -1, d: null, b: 0, e: 'noagent', s: '', scr: null };
      else if (r < 0.36) c = { a: ai, d: between(8, 85), b: 0, e: 'caller', s: '', scr: 'FREE' };
      else if (r < 0.43) c = { a: ai, d: between(20, 70), b: 0, e: 'agent', s: 'Not qualified', scr: 'AGE' };
      else if (r < 0.46) c = { a: ai, d: between(15, 200), b: 0, e: 'remote', s: '', scr: 'FREE' };
      else { const dd = between(95, 2400); c = { a: ai, d: dd, b: 1, e: rnd() < 0.7 ? 'agent' : 'caller', s: dd > 900 && rnd() < 0.5 ? 'Sold' : ['Quoted', 'Callback', 'Not interested', 'Sold'][between(0, 3)], scr: dd > 300 ? 'GOOD' : 'TOOK' }; }
      if (ai === 8 && d === 0) continue; // Megan ran out of money before today
      CALLS.push({ id: uid(), t: iso(t), l: c.a >= 0 ? TEAM[c.a].line : between(0, 2), p, pr: c.b ? LINES[c.a >= 0 ? TEAM[c.a].line : 0].price : 0, po: c.b ? PUBS[p].payout : 0, who: CALLERS[between(0, CALLERS.length - 1)], ...c }); } }
  // two calls Brian ended right before the 90-second mark this week (the dashboard flags it), and one call he billed on a 91-year-old (in dispute)
  for (const [h, dd] of [[50, 86], [26, 84]]) CALLS.push({ id: uid(), t: iso(T0 - h * HR), a: 11, l: 0, p: 1, d: dd, b: 0, pr: 0, po: 0, e: 'agent', s: '', scr: 'AGE', who: 'Mildred' });
  const disputed = { id: uid(), t: iso(T0 - 3 * DAYMS), a: 11, l: 0, p: 1, d: 104, b: 1, pr: 6000, po: 4500, e: 'agent', s: 'Not qualified', scr: 'AGE', who: 'Clarence' }; CALLS.push(disputed);
  CALLS.sort((x, y) => (x.t < y.t ? -1 : 1));
  // Luis has money and has never taken a call; Priya has not finished her ID
  const PINGS = { noAgent: 0, state: 0 };
  { const tc = CALLS.filter((c) => Date.parse(c.t) >= today0).length; PINGS.noAgent = Math.round(tc * 0.22); PINGS.state = Math.round(tc * 0.12); }

  // ---------- booked calls, ads, sign-ups (made up) ----------
  const at = (dayOff, h, m = 0) => today0 + dayOff * DAYMS + (h + 0) * HR + m * MIN;
  const PEOPLE = [
    ['Carla M.', at(-3, 11), at(-4, 15), { showed: true, closed: true, min: 24.5, objection: null, next: 'Onboarded, first top-up done', review: 'Clean close' }, 'TX, FL, GA'],
    ['Derrick T.', at(-2, 14, 30), at(-3, 9), { showed: true, closed: false, min: 9.2, objection: 'Wants to see call volume first', next: 'Send the live demo + follow up tomorrow', review: 'Ask for the top-up on the call' }, 'OH, MI, PA'],
    ['Angela P.', at(-1, 10), at(-2, 18), { showed: false, closed: false, min: 0, objection: null, next: 'Text to rebook', review: null }, 'NC, SC'],
    ['Marcus W.', at(0, 13), at(-1, 20), null, 'AL, TN, MS, LA'],
    ['Yolanda S.', at(1, 11), at(0, 8), null, 'FL'],
    ['Trevor B.', at(2, 15, 30), at(0, 9, 30), null, 'TX, OK, KS, MO'],
  ].map(([name, start, created, outcome, states], i) => ({ name, phone: '•••-•••-' + String(1200 + i * 137).slice(-4), email: name[0].toLowerCase() + '•••@example.com', start: iso(start), created: iso(created), status: 'confirmed', tz: null, src: i % 2 ? 'Facebook ad' : 'Website', ad: i % 2 ? 'Calls that pay' : null, placement: null, page: null, rank: 'normal', licensed: 'yes', states, timing: 'immediately', invests: 'yes', team: 'just_me', outcome, dm: null, account: null }));
  const ADS = Array.from({ length: 30 }, (_, i) => ({ d: new Date(today0 - (29 - i) * DAYMS + 12 * HR - 4 * HR).toISOString().slice(0, 10), s: between(1800, 3600), site: between(0, 1200) }));
  const BOOKINGS = [...PEOPLE.map((p) => ({ added: p.created, start: p.start })), ...Array.from({ length: 9 }, (_, i) => { const t = today0 - between(5, 28) * DAYMS + 12 * HR; return { added: iso(t), start: iso(t + DAYMS) }; })];
  const OUTCOMES = [...PEOPLE.filter((p) => p.outcome).map((p) => ({ date: p.start.slice(0, 10), showed: p.outcome.showed, closed: p.outcome.closed, min: p.outcome.min })), { date: iso(today0 - 9 * DAYMS).slice(0, 10), showed: true, closed: true, min: 31 }, { date: iso(today0 - 12 * DAYMS).slice(0, 10), showed: true, closed: false, min: 12 }];

  // ---------- the moving parts ----------
  let BAL = 18640, STOP = false, lastTick = Date.now(), NOTE = null; const LAST = {};
  function card(a, now, ended) { const c = a.cur, sc = SCRIPTS[c.key], el = ended ? c.el : (now - c.start) / 1000, turns = wordsOf(c.key, a.name, c.who, el);
    const T = turns.map((t) => ({ who: t.who, text: t.text })), A = T.filter((t) => t.who === 'agent').map((t) => t.text.toLowerCase()).join(' | ');
    const chk = RULES.scriptCheck(T), hit = RULES.stagesHit(A), age = RULES.callerAgeFrom(T), order = RULES.STAGES.map(([k]) => k), took = RULES.TOOK_NUMBER.test(A);
    return { id: c.id, agent: a.name, line: LINES[a.line].name, price: LINES[a.line].price, state: c.st, pub: PUBS[c.p].name, start: iso(c.start), buffer: 90, words: T.length,
      stages: order, hit, steps: chk.steps.map((s) => ({ k: s.k, asked: !!s.asked, ans: s.ans || null, said: s.said ? hd(s.said).slice(0, 90) : null })), qualified: !!chk.qualified, failed: chk.failed || null, asked: chk.asked,
      reached: order.filter((k) => hit.includes(k)).pop() || null, dealLine: sc.deal && hit.includes('Quote') ? sc.deal : null,
      flags: took ? ['Asked for the caller’s phone number at ' + clk(sc.took) + ', which can move the sale off the platform. Listen to this call.'] : [],
      ended: !!ended, endedAt: ended ? iso(c.start + c.el * 1000) : null, dur: ended ? Math.round(c.el) : null, billable: ended ? c.el >= 90 : null, disposition: ended ? sc.disp : null, endedHow: ended ? sc.how : null,
      took, age: age ?? null, ageOk: age == null ? null : age >= 50 && age <= 85, last: T.slice(-4).map((t) => [t.who === 'agent' ? 'a' : 'c', hd(t.text).slice(0, 220)]), at: now }; }
  function finish(a, ai) { const c = a.cur; if (!c) return; const sc = SCRIPTS[c.key], b = c.el >= 90;
    CALLS.push({ id: c.id, t: iso(c.start), a: ai, l: a.line, p: c.p, d: Math.round(c.el), b: b ? 1 : 0, pr: b ? LINES[a.line].price : 0, po: b ? PUBS[c.p].payout : 0, e: sc.end, s: sc.disp, scr: c.key, who: c.who });
    a.last = card(a, Date.now(), true); LAST[c.id] = a.last; a.cur = null; }
  function step(now) { const dt = Math.max(0, (now - lastTick) / 1000); lastTick = now; let active = 0;
    TEAM.forEach((a, ai) => { if (!a.prog) return; const w = where(a, now);
      if (w.key !== a.key) { if (a.cur) { a.cur.el = Math.min(SCRIPTS[a.cur.key].len, a.cur.el); finish(a, ai); }
        a.key = w.key; a.segStart = w.start;
        if (w.g[0] === 'topup') { a.wallet = a.base; NOTE = { t: now, msg: a.name.split(' ')[0] + ' topped up ' + usd(a.base) }; }
        if (w.g[0] === 'broke') a.wallet = 0;
        if (w.g[0] === 'call') { a.cur = { id: uid(), key: w.g[1], who: w.g[2], st: w.g[3], p: w.g[4], start: w.start, el: w.el, charged: false }; } }
      if (a.cur) { a.cur.el = w.g[0] === 'call' ? w.el : a.cur.el; active++; if (!a.cur.charged && a.cur.el >= 90) { a.cur.charged = true; a.wallet = Math.max(0, a.wallet - LINES[a.line].price); } } });
    if (!STOP) BAL = Math.max(-500, BAL - (active * 6 * dt) / 60);
    if (rnd() < dt / 45) PINGS.noAgent++; if (rnd() < dt / 90) PINGS.state++; }
  function stateOf(a, now) { if (a.fixed) return [a.fixed, now - (a.since || 30) * MIN];
    const w = where(a, now), g = w.g[0]; return [g === 'call' ? 'in_call' : g === 'wrap' ? 'wrap_up' : 'online', a.segStart || w.start]; }
  function snap() { const now = Date.now(); step(now);
    const agents = TEAM.map((a) => { const [state, since] = stateOf(a, now), L = LINES[a.line], joined = T0 - a.days * DAYMS;
      return { id: 'ag' + a.name.length + a.name[0], name: a.name, stage: 'live', idOk: !a.noid, wallet: a.wallet, paid: a.paid, free: 0, phone: '•••-•••-' + (4100 + a.name.length * 37), email: a.name[0].toLowerCase() + '•••@example.com',
        joined: iso(joined), firstPaid: a.paid ? iso(joined + 3 * HR) : null, origin: a.origin, lineName: L.name, linePrice: L.price, lineN: 1, lineAll: [[L.name, L.price]], line: L.id, susp: false, state, since }; });
    const live = TEAM.filter((a) => a.cur).map((a) => card(a, now, false)), wraps = TEAM.filter((a) => a.prog && a.last && stateOf(a, now)[0] === 'wrap_up').map((a) => a.last);
    const st = agents.map((a) => a.state), tc = CALLS.filter((c) => Date.parse(c.t) >= today0), acc = tc.filter((c) => c.a >= 0).length + live.length;
    return { asOf: iso(now), demo: true, brand: { name: 'Your Company', logo: null }, costs: { name: 'InboundX', platformMonthly: 50000, talkPerMin: 6 }, workspace: 'Demo workspace', buffer: 90,
      balance: STOP ? -120 : Math.round(BAL), agents, lines: LINES.map((l) => ({ id: l.id, name: l.name, price: l.price })), pubs: PUBS.map((p) => ({ ...p })), calls: CALLS.map(({ scr, who, ...c }) => c), people: PEOPLE,
      growth: { ads: ADS, bookings: BOOKINGS, outcomes: OUTCOMES, siteStart: ADS[0].d, spendAllTime: ADS.reduce((t, r) => t + r.s, 0) + 184000 },
      pings: { window: 'today', total: acc + PINGS.noAgent + PINGS.state, accepted: acc, arrived: acc, noAgent: PINGS.noAgent, state: PINGS.state, last: iso(now - 20e3) },
      disputes: [{ id: 'demo-dispute', agent: 'Brian Cole', filed: iso(T0 - 2.8 * DAYMS), status: 'pending', reason: 'Caller too old', callId: disputed.id, amount: 6000, pub: 'BlueRiver Leads', what: 'Caller said she was born in 1935 (91), billed $60' }],
      liveCalls: live, lastCards: wraps, paidThrough: iso(today0 - 7 * DAYMS).slice(0, 10), live: { onCall: st.filter((s) => s === 'in_call').length, waiting: st.filter((s) => s === 'online').length, paused: st.filter((s) => s === 'paused').length },
      sources: { calls: iso(now - 4e3), floor: iso(now - 2e3), ads: iso(now - 9 * MIN), bookings: iso(now - 6 * MIN), lines: iso(now - 3 * MIN), disputes: iso(now - 5 * MIN) } }; }
  // the whole call so far (the call panel), and the words of a finished call
  function turns(id) { const a = TEAM.find((x) => x.cur && x.cur.id === id); if (a) return wordsOf(a.cur.key, a.name, a.cur.who, (Date.now() - a.cur.start) / 1000).map((t) => [t.who === 'agent' ? 'a' : 'c', hd(t.text)]);
    const c = CALLS.find((x) => x.id === id); if (!c || !c.scr) return null; return wordsOf(c.scr, TEAM[c.a].name, c.who, c.d ?? 0).map((t) => [t.who === 'agent' ? 'a' : 'c', hd(t.text)]); }
  // "Show me…" buttons: jump an agent to the moment that shows a case
  function jump(kind) { const now = Date.now(), set = (ai, segI, el) => { const a = TEAM[ai]; let p = 0; for (let i = 0; i < segI; i++) p += segLen(a.prog[i]); a.off = p + el - (now - T0) / 1000; a.key = null; a.cur = null; };
    STOP = false;
    if (kind === 'stopped') STOP = true;
    else if (kind === 'broke') { set(3, 7, 2); }
    else if (kind === 'flag') { set(2, 1, 66); TEAM[2].wallet = TEAM[2].base; }
    else if (kind === 'age') { set(3, 2, 38); TEAM[3].wallet = TEAM[3].base; }
    else if (kind === 'sale') { set(0, 1, 352); }
    else if (kind === 'billing') { set(1, 4, 78); }
    lastTick = now; return kind; }
  return { snap, turns, jump, note: () => NOTE, stopped: () => STOP };
})();
