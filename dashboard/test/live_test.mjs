// live_test.mjs: opens dist/live.html in a real (headless) browser with a FAKE InboundX connector that answers in InboundX's real
// shapes (fields copied from real answers, values made up) and checks the page counts them right. Prints GREEN or RED.
import { chromium } from 'playwright';
const PAGE = new URL('../dist/live.html', import.meta.url).href, SHOTS = process.env.OUT || '/tmp/shots';
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 900 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => {
  const now = Date.now(), iso = (ms) => new Date(ms).toISOString(), nm = (t) => ({ untrusted: true, label: 'name', text: t });
  const A1 = 'aaaaaaaa-0000-0000-0000-000000000001', A2 = 'aaaaaaaa-0000-0000-0000-000000000002', A3 = 'aaaaaaaa-0000-0000-0000-000000000003', C1 = 'cccccccc-0000-0000-0000-000000000001', P1 = 'pppppppp-0000-0000-0000-000000000001';
  const calls = [ // newest first, like InboundX
    { id: 'live-1', created_at: iso(now - 70e3), campaign_id: C1, publisher_id: P1, assigned_agent_id: A1, duration_seconds: null, billable: false, disposition: null, price_cents: 6500, publisher_payout_cents: null, ended_reason: null },
    { id: 'k3', created_at: iso(now - 3600e3), campaign_id: C1, publisher_id: P1, assigned_agent_id: A2, duration_seconds: 49, billable: false, disposition: 'Caller thought it was free', price_cents: 6500, publisher_payout_cents: null, ended_reason: 'remote_ended' },
    { id: 'k2', created_at: iso(now - 7200e3), campaign_id: C1, publisher_id: P1, assigned_agent_id: A2, duration_seconds: 557, billable: true, disposition: 'Sold', price_cents: 6500, publisher_payout_cents: 4500, ended_reason: 'caller_hangup' },
    { id: 'k1', created_at: iso(now - 9000e3), campaign_id: C1, publisher_id: P1, assigned_agent_id: null, duration_seconds: 0, billable: false, disposition: null, price_cents: 6500, publisher_payout_cents: null, ended_reason: 'rtb_expired' }];
  const R = {
    team_status: { counts: {}, agents: [{ agent_id: A1, name: nm('Test Agent One'), state: 'on_call', reason: null }, { agent_id: A2, name: nm('Test Agent Two'), state: 'online', reason: null },
      { agent_id: A3, name: nm('Test Agent Three'), state: 'offline', reason: 'Balance is 500 cents. The cheapest campaign they can take needs 6000 cents. They add money, or the agency funds them.' }] },
    list_wallets: { wallets: [{ id: 'w1', user_id: A1, balance_cents: 26000, status: 'active', currency: 'USD' }, { id: 'w2', user_id: A2, balance_cents: 13000, status: 'active', currency: 'USD' }, { id: 'w3', user_id: A3, balance_cents: 500, status: 'active', currency: 'USD' }] },
    finance_summary: { finance: { platform_balance_cents: 792, platform_subscription_status: 'active', overdraft_cents: 0 } },
    list_rtb_pings: { pings: [{ id: 'p1', received_at: iso(now - 60e3), publisher_id: P1, campaign_id: C1, answered: false, decline_reason: 'no_agent_online' }, { id: 'p2', received_at: iso(now - 70e3), publisher_id: P1, campaign_id: C1, answered: true, decline_reason: null }] },
    list_calls: { calls },
    list_agents: { agents: [{ id: A1, first_name: nm('Test'), last_name: nm('Agent One'), approval_status: 'approved', is_suspended: false, created_at: iso(now - 30 * 864e5) }] },
    list_campaigns: { campaigns: [{ id: C1, name: 'FE Test Line', slug: 'x', active: true, price_cents: 6500, deleted_at: null, is_test: false }] },
    list_publishers: { publishers: [{ id: P1, company_name: { untrusted: true, label: 'publisher name', text: 'Test Publisher' }, is_active: true }] },
    list_disputes: { disputes: [{ id: 'd1', call_id: 'k2', user_id: A2, status: 'pending', reason: { untrusted: true, label: 'dispute reason', text: 'Technical/audio issue' }, submitted_at: iso(now - 864e5) }] },
    get_transcript: { turns: [{ channel: 'agent', text: 'Thank you for calling, this is Ann, a licensed agent. Who do I have the pleasure of speaking with?' }, { channel: 'caller', text: 'Hi, this is Ruth.' },
      { channel: 'agent', text: "You're calling about final expense coverage, right?" }, { channel: 'caller', text: 'Yes.' }, { channel: 'agent', text: 'What is your date of birth?' }, { channel: 'caller', text: 'June 2nd, 1950.' }] } };
  window.__calls = []; const mcp = { callTool: (server, tool, input) => { window.__calls.push([server, tool]); return R[tool] ? Promise.resolve({ payload: R[tool] }) : Promise.reject({ code: 'tool_error', message: 'unknown ' + tool }); } };
  window.claude = { use: (n) => Promise.resolve(n === 'mcp' ? mcp : null) };
});
await p.goto(PAGE); await p.waitForTimeout(1500);
const r = await p.evaluate(() => ({ empty: !!S.empty, agents: AGENTS.map((a) => a.name + ':' + a.state + ':' + a.wallet + ':' + a.ready), bal: S.balance, chip: document.getElementById('balChip').textContent,
  calls: S.calls.length, billed: S.calls.filter((c) => c.b).length, noagent: S.calls.filter((c) => c.e === 'noagent').length, live: S.liveCalls.map((c) => c.agent + '|' + c.steps.map((s) => s.k + '=' + s.ans).join(',') + '|age ' + c.age),
  pubPayout: S.pubs[0].payout, disputes: S.disputes.map((d) => d.agent + ':' + d.amount), pings: S.pings, servers: [...new Set(window.__calls.map((c) => c[0]))], side: document.getElementById('sideNote').textContent, dbar: !!document.getElementById('dbar'), welcome: !document.getElementById('obScrim').hidden }));
await p.evaluate(() => go('overview')); await p.waitForTimeout(300); const check = await p.evaluate(() => document.body.innerText.match(/All agree|disagree|don.t add up/i)?.[0] || 'none');
await p.screenshot({ path: SHOTS + '/live_overview.png', fullPage: false }); await p.evaluate(() => go('floor')); await p.waitForTimeout(300); await p.screenshot({ path: SHOTS + '/live_floor.png', fullPage: true });
let bad = 0; const ok = (n, c) => { console.log((c ? '  ok  ' : '  FAIL ') + n); if (!c) bad++; };
ok('page loaded the snapshot', !r.empty); ok('3 agents, states mapped', r.agents.length === 3 && /One:in_call/.test(r.agents[0]) && /Two:online/.test(r.agents[1]) && /Three:offline:500:nomoney/.test(r.agents[2]));
ok('platform balance $7.92 from finance_summary', r.bal === 792 && /7\.92/.test(r.chip)); ok('3 finished calls (live one not counted yet)', r.calls === 3); ok('1 billed', r.billed === 1); ok('call nobody took = noagent', r.noagent === 1);
ok('live call graded: Greet, Right call, Age 76 pass', r.live.length === 1 && /Greet=pass/.test(r.live[0]) && /Right call=pass/.test(r.live[0]) && /Age=pass/.test(r.live[0]) && /age 76/.test(r.live[0]));
ok('publisher payout = usual payout $45', r.pubPayout === 4500); ok('dispute shows agent + amount', r.disputes[0] === 'Test Agent Two:6500'); ok('pings today: 2 offers, 1 taken, 1 no agent', r.pings.total === 2 && r.pings.accepted === 1 && r.pings.noAgent === 1);
ok('talks only to the InboundX connector', r.servers.length === 1 && r.servers[0] === 'Inbound X'); ok('Numbers check says All agree', /All agree/i.test(check)); ok('no demo bar, no welcome pop-up on your own copy', !r.dbar && !r.welcome); ok('no page errors', !errs.length);
if (errs.length) console.log(errs); console.log(bad ? `RED: ${bad} failed` : 'GREEN: live page reads InboundX correctly'); await b.close(); process.exit(bad ? 1 : 0);
