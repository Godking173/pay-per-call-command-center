# build.py — builds the LIVE DEMO page (dist/index.html) from the same dashboard sources the real one uses.
# The dashboard files in src/ (v2.css, v2a.js, v2b.js, body.html, call_rules.mjs) are copies of the real ones; the demo changes
# are small, named patches below, and each one MUST match (the build stops if the real code moved), so the demo can't silently drift.
import re, os
S = 'src/'
rd = lambda f: open(S + f).read()
IC = {'grid':'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
'pulse':'<path d="M3 12h4l3-8 4 16 3-8h4"/>','phone':'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
'users':'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.7.8 2.7 2.6 3 5.2"/>',
'radio':'<circle cx="12" cy="12" r="2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
'cal':'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>','wallet':'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/>',
'trend':'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>','horn':'<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>','msg':'<path d="M4 5h16v11H9l-5 4z"/>','inbox':'<path d="M3 13l3-8h12l3 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 13h5l1.5 2.5h5L16 13h5"/>',
'plug':'<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>','spark':'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
'code':'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>','play':'<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>'}
body = re.sub(r'%(\w+)%', lambda m: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[m.group(1)] + '</svg>', rd('body.html'))

v2b = rd('v2b.js')
def patch(name, old, new, src=None):
    global v2b
    assert v2b.count(old) == 1, f'PATCH FAILED: {name} (found {v2b.count(old)} times) — the real dashboard code changed; update this patch'
    v2b = v2b.replace(old, new)
patch('extra screens', "inbox: ['Inbox', '', false] };", "inbox: ['Inbox', '', false], connect: ['Connect your business', 'Pick what you use · we walk you through it', false], grow: ['Make more money', 'This week’s levers, counted from your numbers', false], opensource: ['Open source', 'Free · every line is yours to read and change', false] };")
patch('render extra screens', "growth: vGrowth }[v]", "growth: vGrowth, ...(DEMO_VIEWS || {}) }[v]")
patch('coming-soon screens', "const vSoon = (name) => `", "const vSoon = (name) => MODE === 'demo' || MODE === 'live' ? demoSoon(name) : `")
patch('live call words', "  else done(null, 'Not available in this view.'); }", "  else if (MODE === 'demo') { const tt = DEMO.turns(id); done(tt, tt ? null : 'No words yet.'); }\n  else if (MODE === 'live') { const tt = LIVE.turns(id); done(tt, tt ? null : 'No words yet. InboundX writes them a few seconds behind.'); }\n  else done(null, 'Not available in this view.'); }")
patch('past call words', "  else bad('Not available in this view.'); }", "  else if (MODE === 'demo') setTimeout(() => { const tt = DEMO.turns(id); tt ? set({ st: 'ok', turns: tt }) : bad('No words were written down for this call.'); }, 0);\n  else if (MODE === 'live') LIVE.past(id).then((tt) => set({ st: 'ok', turns: tt }), () => bad('The words did not load. Close this panel and open it again.'));\n  else bad('Not available in this view.'); }")
patch('freshness chip', "function fresh() { const el = $('asOf'); ", "function fresh() { const el = $('asOf'); if (MODE === 'demo') { el.className = 'chip live'; el.innerHTML = '<i class=\"pulse\"></i>Live demo · <b>made-up numbers</b>'; return; } ")
patch('side note', "if (MODE !== 'preview') $('sideNote').innerHTML = '<b>Live.</b>", "if (MODE === 'demo') $('sideNote').innerHTML = '<b>Live demo.</b> A made-up team, moving in real time. Connect your platform and it shows yours.'; else if (MODE === 'live') $('sideNote').innerHTML = '<b>Live from your InboundX.</b> Every number is counted by code from your own records, with no AI in the loop.'; else if (MODE !== 'preview') $('sideNote').innerHTML = '<b>Live.</b>")
patch('live panel footer', "src: MODE === 'artifact' ? 'InboundX transcript", "src: MODE === 'demo' ? 'Made-up call · graded live by the same call rules the real dashboard uses' : MODE === 'live' ? 'InboundX transcript (your connector) · graded by the call rules in this page' : MODE === 'artifact' ? 'InboundX transcript")
# FIX (Nov 17): the call panel re-grades the call from words with long numbers hidden ("1954" -> "•••"), so it lost the caller's age and
# downgraded a qualified call to "Age ?" / "Not qualified yet" while the floor card said Qualified. Keep the stronger answer per step.
patch('panel keeps stronger step answers', "steps: sc.steps.map((s) => ({ k: s.k, asked: !!s.asked, ans: s.ans || null, said: s.said ? hideDigits(s.said).slice(0, 90) : null })), qualified: !!sc.qualified, failed: sc.failed || null, asked: sc.asked,",
  "...(() => { const st = sc.steps.map((s, i) => { const o = (c.steps || [])[i]; return (!s.ans || s.ans === '?') && o && (o.ans === 'pass' || o.ans === 'fail') ? o : { k: s.k, asked: !!s.asked, ans: s.ans || null, said: s.said ? hideDigits(s.said).slice(0, 90) : null }; }), q = st.slice(1);"
  " return { steps: st, qualified: q.every((s) => s.ans === 'pass'), failed: (q.find((s) => s.ans === 'fail') || {}).k || null, asked: Math.max(sc.asked || 0, st.filter((s) => s.asked).length) }; })(),")
patch('sources wording', "when your Mac last got new data from each system", "when the dashboard last got new data from each system")

v2a = rd('v2a.js')
assert v2a.count("c.line === LINE_FULL[a.line]") == 1
v2a = v2a.replace("c.line === LINE_FULL[a.line]", "c.line === (a.lineName || LINE_FULL[a.line])")  # demo line names differ from the real ones
rules = rd('call_rules.mjs').replace('export ', '')
def page(mode, title, engine, start, finish):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
{rd('v2.css')}
{rd('onboard.css')}</style>
</head>
<body>
{body}
<script>
const MODE = '{mode}';
/* ==== CALL RULES (the one copy of the call-listening rules; the demo calls are graded by the same code as real ones) ==== */
const RULES = (() => {{
{rules}
return {{ STAGES, stagesHit, scriptCheck, callerAgeFrom, TOOK_NUMBER }}; }})();
/* ==== DATA ENGINE ==== */
{engine}
{start}
/* ==== MODEL ==== */
{v2a}
/* ==== PRODUCT LAYER ==== */
{rd('onboard.js')}
/* ==== PAGE ==== */
{v2b}
{finish}
</script>
</body>
</html>
'''
import json
EMPTY = {'empty': True, 'asOf': None, 'brand': {'name': 'My Business', 'logo': None}, 'costs': {'name': 'InboundX', 'platformMonthly': 50000, 'talkPerMin': 6}, 'workspace': '', 'buffer': 90, 'balance': 0,
  'agents': [], 'lines': [{'id': 'other', 'name': 'Other line', 'price': None}], 'pubs': [{'id': 'other', 'name': 'Other publisher', 'payout': None}], 'calls': [], 'people': [],
  'growth': {'ads': [], 'bookings': [], 'outcomes': [], 'siteStart': '2026-01-01', 'spendAllTime': 0}, 'pings': {'window': 'today', 'total': 0, 'accepted': 0, 'arrived': 0, 'last': None},
  'disputes': [], 'liveCalls': [], 'lastCards': [], 'paidThrough': None, 'live': {'onCall': 0, 'waiting': 0, 'paused': 0}}
os.makedirs('dist', exist_ok=True)
demo = page('demo', 'Call Command Center · Live Demo', rd('demo.js'), 'const SNAP = DEMO.snap();', 'ONB_INIT({ demo: true });\nsetInterval(() => refresh(DEMO.snap()), 3000);')
live = page('live', 'Call Command Center', rd('adapter.js'), 'const SNAP = ' + json.dumps(EMPTY) + '; SNAP.asOf = new Date().toISOString();', 'ONB_INIT({ demo: false });\nLIVE.start();')
open('dist/index.html', 'w').write(demo); open('dist/live.html', 'w').write(live)
print('dist/index.html', len(demo) // 1024, 'KB · dist/live.html', len(live) // 1024, 'KB')
