// onboard.js — the product layer on top of the dashboard: first-run setup, the connection picker with a "why" for each,
// a step-by-step guide (or a prompt for Claude), logo + name, "make more money" levers, open source, feedback, and the demo controls.
// Everything here is plain text and math on the numbers already on the page. No AI runs here, nothing is sent anywhere.
var DEMO_VIEWS; // filled in ONB_INIT (the page's render() looks here for the extra screens)
const REPO_URL = 'https://github.com/Godking173/pay-per-call-command-center', REPO_LIVE = true;
const OB_KEY = 'ppc.setup.v1';
const ICO = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const OBI = {
  ix: ICO('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  fb: ICO('<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
  ghl: ICO('<path d="M3 13l3-8h12l3 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 13h5l1.5 2.5h5L16 13h5"/>'),
  gcal: ICO('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  cal: ICO('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>'),
  tg: ICO('<path d="M21 4L3 11l6 2.5M21 4l-3 16-9-6.5M21 4L9 13.5V19l3-3"/>'),
  live: ICO('<path d="M3 12h4l3-8 4 16 3-8h4"/>'), wallet: ICO('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/>'), trend: ICO('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
  x: ICO('<path d="M6 6l12 12M18 6L6 18"/>'),
};
// ---------- every connection: why, what it adds, and how (by Claude or by hand). Plain English first; the technical word in bold after. ----------
const CONN = [
  { k: 'ix', name: 'InboundX', tag: 'Start here', why: 'Your calls, agents, wallets and money. This one connection lights up most of the dashboard.',
    see: 'The live floor (who is on a call and where they are in the script), every agent’s wallet, every call, your publishers, and what you made today, this week and this month.',
    term: '<b>Connector</b> = a secure plug that lets Claude read your InboundX account for you. You can unplug it any time in Claude’s settings.',
    steps: ['In <b>claude.ai</b>, open <b>Settings → Connectors</b>.', 'Find <b>InboundX</b>. If it is not in the list, open your InboundX console, go to <b>Settings</b>, and copy the AI / MCP connector link. Then in Claude press <b>Add custom connector</b> and paste it.', 'Press <b>Connect</b> and sign in with your InboundX owner login.', 'Ask Claude: <b>“Show me who is online in InboundX.”</b> If it answers with your agents, you are connected.'],
    prompt: 'Check that my InboundX connector works: list my agents with their wallet and status, my lines with their price, and my publishers. If anything is missing, tell me exactly which screen in InboundX to open to fix it.' },
  { k: 'fb', name: 'Facebook Ads', tag: '', why: 'See what each booked call and each paying agent cost you in ads, so you know which ads make money.',
    see: 'Ad spend per day next to bookings and new paying agents, cost per booked call, and cost to get one paying agent.',
    term: '<b>Cost per booked call</b> = ad money spent ÷ calls booked. The lower, the better.',
    steps: ['In <b>claude.ai → Settings → Connectors</b>, add a Facebook Ads connector (for example <b>Windsor.ai</b>, which connects Facebook Ads in a few clicks).', 'Sign in with the Facebook account that runs your ads and pick your <b>ad account</b>.', 'Ask Claude: <b>“How much did I spend on Facebook ads each day this week?”</b>', 'No connector? In Ads Manager press <b>Export</b> (daily spend, last 30 days) and drop the file into Claude.'],
    prompt: 'Connect my Facebook ad spend to my dashboard: daily spend for the last 30 days, then show cost per booked call and cost per new paying agent next to it. Use only real numbers from my ad account.' },
  { k: 'ghl', name: 'GoHighLevel', tag: '', why: 'Your leads, texts and booked calls. Shows who booked, who showed up and who paid, and lets Claude follow up for you.',
    see: 'The Pipeline screen: everyone who booked, their answers (licensed? which states?), who showed, who closed, and who still needs a follow-up.',
    term: '<b>Private Integration token</b> = a password made only for one tool. You can delete it in GoHighLevel any time and the tool stops working.',
    steps: ['In GoHighLevel open <b>Settings → Private Integrations</b> and press <b>Create</b>.', 'Give it read access to <b>Contacts, Conversations, Calendars and Opportunities</b>. Copy the token.', 'Give the token only to your own Claude setup (Claude on your computer, or a connector you add yourself). Never paste it in a group chat.', 'Ask Claude: <b>“Who booked a call with me this week in GoHighLevel?”</b>'],
    prompt: 'Help me connect GoHighLevel to my dashboard safely. Walk me through making a Private Integration token with read-only access to contacts, conversations, calendars and opportunities, then show this week’s booked calls and who showed up.' },
  { k: 'gcal', name: 'Google Calendar', tag: '', why: 'Every onboarding call you book shows on the dashboard calendar, so you never miss one.',
    see: 'The calendar on the Overview screen and the Pipeline screen, with each booked call and the time it starts.',
    term: 'Claude only reads your calendar. It never adds or deletes anything unless you ask.',
    steps: ['In <b>claude.ai → Settings → Connectors</b>, find <b>Google Calendar</b>.', 'Press <b>Connect</b> and sign in with the Google account that holds your booked calls.', 'Ask Claude: <b>“What calls do I have booked tomorrow?”</b>'],
    prompt: 'Read my Google Calendar and show my booked onboarding calls for the next 7 days on my dashboard, with the time and the person’s name.' },
  { k: 'cal', name: 'Cal.com', tag: '', why: 'If people book you through a Cal.com link, you see each booking the moment it is made, with the answers they gave.',
    see: 'New bookings in the Pipeline, with what they answered on the form (licensed, states, ready to invest).',
    term: '<b>Booking form answers</b> = the questions on your Cal.com page. Ask the right ones and you know who is worth the call before it starts.',
    steps: ['In <b>claude.ai → Settings → Connectors</b>, find <b>Cal.com</b>.', 'Press <b>Connect</b> and sign in.', 'Ask Claude: <b>“Show my Cal.com bookings this week with their form answers.”</b>'],
    prompt: 'Read my Cal.com bookings for this week and the answers each person gave on the form, and add them to my dashboard pipeline.' },
  { k: 'tg', name: 'Telegram', tag: 'Optional', why: 'Your phone buzzes when it matters: calls stopped, an agent out of money, a flagged call, a sale. Open the dashboard right inside Telegram.',
    see: 'Alerts on your phone, plus a button that opens this dashboard inside Telegram.',
    term: '<b>Bot</b> = a Telegram account run by a program instead of a person. <b>Token</b> = its password. Something has to run all day to send alerts, so this part runs on your computer (or a small server), not on this page.',
    steps: ['In Telegram, message <b>@BotFather</b>, send <b>/newbot</b>, pick a name. It gives you a <b>token</b>. Keep it private.', 'Send your new bot one message (“hi”) so it is allowed to message you back.', 'Open <b>Claude Code</b> on your computer, give it the token, and say: <b>“Set up my Telegram alerts from the Pay-Per-Call Command Center kit.”</b>', 'Pick which alerts you want. Start with: calls stopped, agent out of money, flagged call.'],
    prompt: 'Set up Telegram alerts for my pay-per-call business using the open-source Pay-Per-Call Command Center kit. Ask me for my bot token, store it only in a local .env file, and send me a test message. Alerts: calls stopped (balance $0), agent wallet can’t cover a call, agent asked for the caller’s number, caller outside age 50 to 85, sale closed.' },
];
const OBS = (() => { try { return JSON.parse(localStorage.getItem(OB_KEY) || 'null') || {}; } catch { return {}; } })();
OBS.picks = OBS.picks || ['ix']; OBS.mode = OBS.mode || 'claude';
const obSave = () => { try { localStorage.setItem(OB_KEY, JSON.stringify(OBS)); } catch {} };
const obCopy = (text) => `<button class="ob-btn sm" data-copy="${esc(text)}">Copy</button>`;
const promptBox = (text) => `<div class="ob-prompt"><pre>${esc(text)}</pre>${obCopy(text)}</div>`;
function masterPrompt() { const names = CONN.filter((c) => OBS.picks.includes(c.k)).map((c) => c.name);
  return `I run a pay-per-call business. Build me my own copy of the free, open-source Pay-Per-Call Command Center dashboard (${REPO_URL}).
1. Read its README.md and CLAUDE.md first and follow them exactly.
2. Connect: ${names.join(', ') || 'InboundX'}. Use only real numbers from my accounts. If something is not connected, show "not connected", never a guess.
3. Put my business name${BRAND && BRAND.name && BRAND.name !== 'Your Company' ? ' (' + BRAND.name + ')' : ''} and my logo on top.
4. Publish it as a page I can open on my phone.
5. Then check every number against my platform and tell me what matched and what did not.`; }
// ---------- pieces used by both the pop-up and the in-page screens ----------
const optCard = (c, on, attr) => `<button class="ob-opt" ${attr}="${c.k}" aria-pressed="${on}"><span class="t">${OBI[c.k]}${esc(c.name)}</span>${c.tag ? `<span class="tag${c.tag === 'Start here' ? '' : ' rec'}">${esc(c.tag)}</span>` : ''}<span class="w">${esc(c.why)}</span></button>`;
const pickGrid = (attr) => `<div class="ob-opts">${CONN.map((c) => optCard(c, OBS.picks.includes(c.k), attr)).join('')}</div>`;
const modeGrid = (attr) => `<div class="ob-opts two">${[['claude', 'Claude sets it up for me', 'Recommended. You copy one message into Claude and it does the connecting, then checks every number.', 'Recommended'], ['self', 'Step by step, myself', 'Short numbered steps for each connection, in plain English.', '']].map(([k, t, w, tag]) => `<button class="ob-opt" ${attr}="${k}" aria-pressed="${OBS.mode === k}"><span class="t">${esc(t)}</span>${tag ? `<span class="tag rec">${tag}</span>` : ''}<span class="w">${esc(w)}</span></button>`).join('')}</div>`;
function guide() { const list = CONN.filter((c) => OBS.picks.includes(c.k)); if (!list.length) return '<p class="ob-p">Pick at least one connection above.</p>';
  return (OBS.mode === 'claude' ? `<p class="ob-p"><b>One message does it.</b> Open Claude, paste this, and it walks you through the rest:</p>${promptBox(masterPrompt())}<p class="ob-p" style="margin-top:14px">Or go one connection at a time:</p>` : '') +
    `<div class="ob-guide">${list.map((c, i) => `<details class="ob-g"${i === 0 ? ' open' : ''}><summary>${OBI[c.k]}<b>${esc(c.name)}</b><span>${OBS.mode === 'claude' ? 'copy, paste, done' : c.steps.length + ' steps'}</span></summary><div class="ob-gb">
      <div><h4>Why</h4><p>${esc(c.why)}</p></div><div><h4>What you’ll see</h4><p>${esc(c.see)}</p></div>
      <div><h4>${OBS.mode === 'claude' ? 'Paste this into Claude' : 'How'}</h4>${OBS.mode === 'claude' ? promptBox(c.prompt) : `<ol>${c.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`}</div>
      <div class="ob-term">${c.term}</div></div></details>`).join('')}</div>`; }
const TIPS = () => `<div class="ob-tips">
  <div><b>Add any number you want</b>Tell Claude: “Add a tile for cost per sale this week” or “Show which publisher bills most, by hour.” It adds it and checks the math.</div>
  <div><b>Get better every week</b>Open <b>Make more money</b> every Monday. It compares this week to last and gives you the 3 moves worth the most.</div>
  <div><b>Change anything, it’s yours</b>Colors, names, which screens show, what each alert says. Tell Claude in plain words: “make it blue”, “remove Facebook”, “add my partner’s view”. Your logo: tap the top-left corner.</div>
  <div><b>Tell us what to build next</b>It’s free. Press <b>Send feedback</b> in the menu. It goes straight to the person who built it.</div></div>`;
// ---------- the first-run pop-up ----------
let OB_STEP = 0;
function obDraw() { const el = document.getElementById('obCard'), n = 6, dots = `<div class="ob-dots">${Array.from({ length: n }, (_, i) => `<i class="${i <= OB_STEP ? 'on' : ''}"></i>`).join('')}</div>`, x = `<button class="ob-x" data-ob="close" aria-label="Close">${OBI.x}</button>`;
  const back = OB_STEP ? '<button class="ob-btn ghost" data-ob="back">‹ Back</button>' : '';
  const S0 = () => `${dots}<div class="ob-eb">Free · made for pay-per-call owners</div><h2 class="ob-h" id="obTitle">Your whole call business, on one screen.</h2>
    <p class="ob-p">Welcome. We can connect all these numbers to your platform so you get a <b>full bird’s-eye view of your whole business</b>, live, on your phone. What you see behind this box is a live demo with made-up agents, so you can see everything before you connect anything.</p>
    <div class="ob-why"><div>${OBI.live}<b>Who’s on a call</b>and how far they are in the script, second by second</div><div>${OBI.wallet}<b>Every wallet</b>and who’s about to run out of money</div><div>${OBI.trend}<b>What you made</b>today, this week, this month, and what to fix</div></div>
    <div class="ob-row"><button class="ob-btn go" data-ob="next">Set it up for my business</button><button class="ob-btn" data-ob="close">Just look at the demo</button></div>`;
  const S1 = () => `${dots}<div class="ob-eb">Step 1 of 4 · Make it yours</div><h2 class="ob-h">Put your logo on top.</h2><p class="ob-p">Square images look best. It stays in this browser; your own copy will keep it for good.</p>
    <div class="ob-brand"><div class="ob-logo" id="obLogo">${BRAND.logo ? `<img src="${BRAND.logo}" alt="">` : esc(initials(BRAND.name || 'YC'))}</div><div class="ob-field"><label for="obName">Business name</label><input class="ob-in" id="obName" value="${esc(BRAND.name || '')}" autocomplete="off"><div class="ob-row" style="margin:0"><label class="ob-btn sm" for="obFile">Upload your logo</label><input id="obFile" type="file" accept="image/*" hidden></div></div></div>
    <div class="ob-row">${back}<span class="sp"></span><button class="ob-btn ghost" data-ob="next">Skip</button><button class="ob-btn go" data-ob="next">Next</button></div>`;
  const S2 = () => `${dots}<div class="ob-eb">Step 2 of 4 · Your tools</div><h2 class="ob-h">Which ones do you use?</h2><p class="ob-p">Pick all that apply. Each one adds a piece of the picture. You can add the rest later.</p>${pickGrid('data-obpick')}
    <div class="ob-row">${back}<span class="sp"></span><button class="ob-btn go" data-ob="next"${OBS.picks.length ? '' : ' disabled'}>Next</button></div>`;
  const S3 = () => `${dots}<div class="ob-eb">Step 3 of 4 · Setup</div><h2 class="ob-h">How do you want to set it up?</h2><p class="ob-p">Either way takes a few minutes and you can switch any time.</p>${modeGrid('data-obmode')}
    <div class="ob-row">${back}<span class="sp"></span><button class="ob-btn go" data-ob="next">Next</button></div>`;
  const S4 = () => `${dots}<div class="ob-eb">Step 4 of 4 · Connect</div><h2 class="ob-h">${OBS.mode === 'claude' ? 'Hand this to Claude.' : 'Your setup, step by step.'}</h2>${guide()}
    <div class="ob-row">${back}<span class="sp"></span><button class="ob-btn go" data-ob="next">I’m done</button></div>`;
  const S5 = () => `${dots}<div class="ob-eb">You’re set</div><h2 class="ob-h">Now it works for you.</h2><p class="ob-p">Four things worth knowing:</p>${TIPS()}
    <div class="ob-row"><button class="ob-btn go" data-ob="close">Open the live demo</button><button class="ob-btn" data-ob="grow">Show me how to make more</button></div>`;
  el.innerHTML = x + [S0, S1, S2, S3, S4, S5][OB_STEP](); el.scrollTop = 0; }
function obOpen(step = 0) { OB_STEP = step; document.getElementById('obScrim').hidden = false; obDraw(); setTimeout(() => (document.querySelector('#obCard .ob-btn.go') || document.querySelector('#obCard .ob-btn'))?.focus({ preventScroll: true }), 30); }
function obClose() { document.getElementById('obScrim').hidden = true; OBS.seen = true; obSave(); }
// ---------- the in-page screens ----------
function vConnect() { return `<section class="panel pg-opts"><div class="ph"><h2>Which ones do you use?</h2><span class="note">pick all that apply · each one adds a piece of the picture</span></div>${pickGrid('data-pgpick')}</section>
  <section class="panel pg-opts"><div class="ph"><h2>How do you want to set it up?</h2></div>${modeGrid('data-pgmode')}</section>
  <section class="panel"><div class="ph"><h2>${OBS.mode === 'claude' ? 'Hand this to Claude' : 'Your setup, step by step'}</h2><span class="note">plain English, nothing to install for most of it</span></div>${guide()}</section>
  <section class="panel"><div class="ph"><h2>After you’re connected</h2></div>${TIPS()}</section>`; }
function vGrow() { const m = model('d7'), k = m.k, pk = m.pk, x = m.x, low = AGENTS.filter((a) => a.ready === 'nomoney' && CALLS.some((c) => c.agent === a.name && c.day >= dayAdd(TODAY, -13))), one = AGENTS.filter((a) => a.ready === 'ready' && a.callsLeft === 1);
  const idle = AGENTS.filter((a) => a.ready === 'ready' && a.paid > 0 && !TOOK.has(a.name)), hrs = m.hourly.filter((h) => h.connected >= 3).sort((a, b) => b.billable / b.connected - a.billable / a.connected)[0];
  const rate = (kk) => (kk.sent ? kk.billable / kk.sent : 0), pubs = m.byPub.filter((p) => p.sent >= 5).sort((a, b) => rate(b) - rate(a)), cut = CALLS.filter((c) => c.cut && c.day >= dayAdd(TODAY, -6)).length;
  const lv = (n, cls, t, d) => `<section class="panel lever"><div class="n num ${cls}">${n}</div><b>${t}</b><p>${d}</p></section>`;
  const levers = [
    lv(money(x.missed), x.missed > 0 ? 'crit' : 'good', 'Calls you lost because nobody was online', `${k.lost} calls this week found no agent. At your usual bill rate that is about ${money(x.missed)} you didn’t make. Get one more agent live in your busiest hours.`),
    lv(low.length + one.length, low.length ? 'warn' : 'good', 'Agents about to stop getting calls', `${low.length} can’t afford the next call, ${one.length} have one call left: ${[...low, ...one].slice(0, 4).map((a) => esc(a.name.split(' ')[0])).join(', ') || 'nobody'}. A top-up text today keeps calls flowing.`),
    lv(money(sum(idle, (a) => a.wallet)), idle.length ? 'warn' : 'good', 'Money loaded, never used', `${idle.length} agent${idle.length === 1 ? ' has' : 's have'} paid and never taken a call. One phone call to get them logged in turns that into billed calls.`),
    lv(pct(k.billable, k.sent), rate(k) >= rate(pk) ? 'good' : 'warn', 'Calls that bill', `This week ${pct(k.billable, k.sent)} of calls billed, last week ${pct(pk.billable, pk.sent)}. ${pubs.length > 1 ? `${esc(pubs[0].name)} bills most (${pct(pubs[0].billable, pubs[0].sent)}); ${esc(pubs[pubs.length - 1].name)} least (${pct(pubs[pubs.length - 1].billable, pubs[pubs.length - 1].sent)}).` : ''}`),
    lv(hrs ? (hrs.h % 12 || 12) + (hrs.h < 12 ? ' AM' : ' PM') : '—', 'good', 'Your best hour', hrs ? `${pct(hrs.billable, hrs.connected)} of calls in that hour bill. Ask your best agents to be online then.` : 'Not enough calls yet.'),
    lv(cut, cut ? 'crit' : 'good', 'Calls cut right before the billing mark', cut ? 'An agent ended these within 10 seconds of the 90-second mark. Listen to them: it costs you money and burns your publishers.' : 'Nobody is cutting calls at the mark. Keep it that way.'),
  ];
  const Q = [['Every day', 'Read my dashboard for today. What is the one thing I should fix before tomorrow, and who do I need to call or text?'],
    ['Every Monday', 'Compare last week to the week before across every number on my dashboard. What changed and why? Give me the 3 moves that make the most money this week, with the math.'],
    ['Every Monday', 'Look at every call that did not bill last week. What pattern do you see (publisher, hour, agent, script step), and what change would fix it?'],
    ['Once a month', 'Which numbers am I not tracking that I should be? Add the most useful one to my dashboard and check it adds up.']];
  return `<section class="panel"><div class="ph"><h2>This week’s money levers</h2><span class="note">counted from your numbers, no guessing · this week vs last</span></div><p class="how" style="margin:-4px 0 12px">Each card is plain math on the calls and wallets in this dashboard. In the demo they use the made-up team; on yours they use your real one.</p></section>
  <div class="grid g-3">${levers.join('')}</div>
  <section class="panel"><div class="ph"><h2>Ask Claude, on a schedule</h2><span class="note">this is how it compounds</span></div><p class="how" style="margin:-4px 0 12px">Claude can read the same numbers you see. Ask these on the same day each week, and tell Claude to remember what you changed, so every week starts from what worked.</p>
    <div class="ob-guide">${Q.map(([w, q]) => `<div><div class="eyebrow" style="margin:6px 0">${w}</div>${promptBox(q)}</div>`).join('')}</div>
    <p class="how">Want it automatic? Tell Claude: <b>“Every Monday at 9 AM, run the weekly review on my dashboard and send it to me on Telegram.”</b></p></section>`; }
function vOpen() { const parts = [['The dashboard', 'This page. Every number is counted by code from your platform’s records, never guessed by AI.'], ['The call rules', 'One file that reads a call and marks the 5 script steps, the caller’s age and red flags. The same file feeds the dashboard and the alerts, so they never disagree.'],
    ['Telegram alerts', 'Calls stopped, agent out of money, flagged call, sale closed. Plus the dashboard inside Telegram.'], ['Claude instructions', 'A CLAUDE.md file your Claude reads first: how to connect, what never to do (move money, text the price), and how to check its own work.'],
    ['The checks', 'Every total is re-added from its parts on every refresh, and a truth check compares wallets and statuses with your platform. If anything is off, you get told.'], ['Lessons we paid for', 'Every mistake we hit building this (and the fix), so your copy starts where ours is now.']];
  return `<section class="panel"><div class="ph"><h2>Free and open source</h2><span class="note">${REPO_LIVE ? 'live on GitHub' : 'opening soon'}</span></div>
    <p class="ob-p" style="margin-top:2px">Open source means <b>you get all of it</b>: the code, the instructions, the alerts. You can read every line, change anything, and run it yourself. Nothing is locked.</p>
    <div class="ob-term" style="margin:0 0 14px"><b>It’s yours. Change anything.</b> You don’t need to code. Open Claude and say what you want: “make the buttons blue”, “add a tile for sales per agent”, “hide the Growth screen”, “text me when someone tops up”. Claude changes your copy and checks the numbers still add up.</div>
    <div class="ob-row" style="margin-bottom:6px">${REPO_LIVE ? `<a class="ob-btn go" href="${REPO_URL}" target="_blank" rel="noopener">Open on GitHub</a>` : '<span class="ob-btn" aria-disabled="true">GitHub link opens soon</span>'}<button class="ob-btn" data-go="connect">Connect my business</button></div></section>
  <div class="grid g-3">${parts.map(([t, d]) => `<section class="panel"><b style="font:700 19px var(--display)">${esc(t)}</b><p class="how" style="margin-top:6px">${esc(d)}</p></section>`).join('')}</div>
  <section class="panel"><div class="ph"><h2>Why it doesn’t break</h2></div><div class="ob-guide">${[['Code counts, AI explains', 'Numbers come from scripts that do the same thing every time. AI only reads them and tells you what they mean.'], ['Built once, reused forever', 'When a job repeats, it becomes a script. It never gets “re-thought” and come out different.'], ['Look before you change', 'Anything that changes your platform shows you a preview first and waits for your yes. Money is never moved by the tools.'], ['Proof, not promises', 'Every “done” comes with a check you can re-run yourself.']].map(([t, d]) => `<div class="ob-term"><b>${t}.</b> ${d}</div>`).join('')}</div></section>`; }
function demoSoon(name) { const k = /facebook|ad dm/i.test(name) ? 'fb' : 'ghl', c = CONN.find((x) => x.k === k);
  return `<section class="panel"><div class="ph"><h2>${esc(name)} comes from ${esc(c.name)}</h2><span class="note">not in the demo</span></div><p class="ob-p" style="margin-top:4px">${esc(c.why)}</p><div class="ob-row"><button class="ob-btn go" data-go="connect">Connect ${esc(c.name)}</button></div></section>`; }
// ---------- feedback: goes straight to the owner by email or Telegram (a public page can't store other people's messages) ----------
const FB_EMAIL = 'eli@hotinboundcalls.com', FB_TG = 'EliAiMafia';
let FB_TAG = 'Idea';
function fbOpen() { const el = document.getElementById('obCard'); document.getElementById('obScrim').hidden = false;
  el.innerHTML = `<button class="ob-x" data-ob="close" aria-label="Close">${OBI.x}</button><div class="ob-eb">It’s free · help shape it</div><h2 class="ob-h">Send feedback</h2><p class="ob-p">What should it do next? What confused you? It goes straight to Eli at Hot Inbound Calls, and every message gets read.</p>
    <div class="ob-chips">${['Love it', 'Idea', 'Confusing', 'Something broke'].map((t) => `<button class="ob-chip" data-fbtag="${t}" aria-pressed="${t === FB_TAG}">${t}</button>`).join('')}</div>
    <textarea class="ob-in" id="fbText" placeholder="Type here…"></textarea>
    <div class="ob-row"><a class="ob-btn go" id="fbMail" href="#" target="_blank" rel="noopener">Send by email</a><a class="ob-btn" id="fbTg" href="https://t.me/${FB_TG}" target="_blank" rel="noopener">Send on Telegram</a><span class="ob-msg" id="fbMsg"></span></div>`;
  fbLinks(); setTimeout(() => document.getElementById('fbText')?.focus(), 30); }
const fbBody = () => `[${FB_TAG}] ${(document.getElementById('fbText')?.value || '').trim()}\n\n(from the Call Command Center demo${BRAND.name && BRAND.name !== 'Your Company' ? ' · ' + BRAND.name : ''})`;
function fbLinks() { const m = document.getElementById('fbMail'); if (m) m.href = `mailto:${FB_EMAIL}?subject=${encodeURIComponent('Command Center feedback: ' + FB_TAG)}&body=${encodeURIComponent(fbBody())}`; }
function fbTelegram(e) { const t = (document.getElementById('fbText')?.value || '').trim(), msg = document.getElementById('fbMsg'); if (!t) { e.preventDefault(); msg.className = 'ob-msg bad'; msg.textContent = 'Type a message first.'; return; }
  try { navigator.clipboard.writeText(fbBody()); msg.className = 'ob-msg good'; msg.textContent = 'Copied. Paste it in the Telegram chat that just opened.'; } catch { msg.className = 'ob-msg'; msg.textContent = 'Copy your message, then paste it in Telegram.'; } }
// ---------- demo controls (bottom bar) ----------
const DJ = [['broke', 'Agent runs out of money'], ['flag', 'Flagged call'], ['age', 'Caller too old'], ['billing', 'About to bill'], ['sale', 'A sale closes'], ['stopped', 'Calls stop ($0 balance)']];
const DJ_NOTE = { broke: 'Kevin’s wallet hit $0. He’s online, but no calls can ring for him until he tops up. Watch the Live floor and Overview. He tops up again in about 2 minutes.',
  flag: 'Dana just asked the caller for their phone number on her personal cell. The card turns red and the flag says why.', age: 'Kevin’s caller was born in 1937. The Age step turns red: outside 50 to 85. If it passes 90 seconds it bills, so you’d dispute it.',
  billing: 'James is about 12 seconds from the 90-second mark. Watch the bar fill and the countdown hit “Billable”.', sale: 'Maria is quoting, taking bank info and getting the approval. Watch the stage track reach Approved.',
  stopped: 'The platform balance is below $0. Every call is refused until you top up. See the red banner on Overview and the top bar.', normal: 'Back to normal.' };
let DJ_ON = null, DJ_T = null;
function djDraw() { document.getElementById('dbar').innerHTML = `<span class="lv"><i></i>Live demo</span><span class="sl">Made-up team · show me:</span>${DJ.map(([k, t]) => `<button data-dj="${k}" class="${DJ_ON === k ? 'on' : ''}">${t}</button>`).join('')}${DJ_ON ? '<button data-dj="normal">Back to normal</button>' : ''}<button class="cta" data-dj="setup">Set up mine</button>`; }
function djPick(k) { if (k === 'setup') return obOpen(1); DEMO.jump(k === 'normal' ? 'reset' : k); DJ_ON = k === 'normal' ? null : k; djDraw();
  const n = document.getElementById('dnote'); n.textContent = DJ_NOTE[k]; n.hidden = false; clearTimeout(DJ_T); DJ_T = setTimeout(() => { n.hidden = true; }, 9000);
  refresh(DEMO.snap(), true); if (k !== 'normal' && k !== 'stopped' && ST.view !== 'floor') go('floor'); else if (k === 'stopped' && ST.view !== 'overview') go('overview'); }
// ---------- wiring ----------
function ONB_INIT(opt = {}) {
  DEMO_VIEWS = { connect: vConnect, grow: vGrow, opensource: vOpen };
  document.body.insertAdjacentHTML('beforeend', `<div class="ob-scrim" id="obScrim" hidden><div class="ob-card glassbox" id="obCard" role="dialog" aria-modal="true" aria-labelledby="obTitle"></div></div>${opt.demo ? '<div class="dbar glassbox" id="dbar" role="toolbar" aria-label="Demo controls"></div><div class="dnote glassbox" id="dnote" role="status" hidden></div>' : ''}`);
  if (opt.demo) djDraw();
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-ob],[data-obpick],[data-obmode],[data-pgpick],[data-pgmode],[data-dj],[data-fbtag],#fbMail,#fbTg,[data-fb],[data-tour]'); if (!t) return;
    const d = t.dataset;
    if (d.ob === 'close') return obClose(); if (d.ob === 'next') { OB_STEP = Math.min(5, OB_STEP + 1); if (OB_STEP === 5) { OBS.done = true; obSave(); } return obDraw(); } if (d.ob === 'back') { OB_STEP = Math.max(0, OB_STEP - 1); return obDraw(); }
    if (d.ob === 'grow') { obClose(); return go('grow'); }
    const toggle = (k) => { OBS.picks = OBS.picks.includes(k) ? OBS.picks.filter((x) => x !== k) : [...OBS.picks, k]; obSave(); };
    if (d.obpick) { toggle(d.obpick); return obDraw(); } if (d.obmode) { OBS.mode = d.obmode; obSave(); return obDraw(); }
    if (d.pgpick) { toggle(d.pgpick); return render(); } if (d.pgmode) { OBS.mode = d.pgmode; obSave(); return render(); }
    if (d.dj) return djPick(d.dj); if (d.fbtag) { FB_TAG = d.fbtag; document.querySelectorAll('[data-fbtag]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fbtag === FB_TAG))); fbLinks(); return; }
    if (t.id === 'fbTg') return fbTelegram(e); if (t.id === 'fbMail' && !(document.getElementById('fbText')?.value || '').trim()) { e.preventDefault(); const m = document.getElementById('fbMsg'); m.className = 'ob-msg bad'; m.textContent = 'Type a message first.'; return; } if (d.fb != null) return fbOpen(); if (d.tour != null) return obOpen(0); });
  document.addEventListener('input', (e) => { if (e.target.id === 'fbText') fbLinks(); if (e.target.id === 'obName') { BRAND.name = e.target.value; saveBrand(); const l = document.getElementById('obLogo'); if (l && !BRAND.logo) l.textContent = initials(BRAND.name || 'YC'); } });
  document.addEventListener('change', (e) => { if (e.target.id !== 'obFile') return; const f = e.target.files && e.target.files[0]; if (!f) return; const im = new Image(), u = URL.createObjectURL(f);
    im.onload = () => { const c = document.createElement('canvas'), s = Math.min(im.width, im.height); c.width = c.height = 128; c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128); BRAND.logo = c.toDataURL('image/png'); URL.revokeObjectURL(u); saveBrand(); const l = document.getElementById('obLogo'); if (l) l.innerHTML = `<img src="${BRAND.logo}" alt="">`; };
    im.src = u; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.getElementById('obScrim').hidden) obClose(); });
  if (opt.demo && !OBS.seen) obOpen(0);
}
