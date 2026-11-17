# The snapshot: the one object the page draws

The dashboard draws everything from one JSON object. Build it from your platform, call `refresh(snapshot)`, and every screen updates. A full made-up example: [`examples/snapshot.sample.json`](../examples/snapshot.sample.json).

**Money is always in cents** (`6500` = $65). Times are ISO strings in UTC (`2026-11-17T14:38:39Z`). The page shows them in 12-hour Eastern time.

| Field | Shape | Notes |
|---|---|---|
| `asOf` | time | When these numbers were read. The page shows how old they are. |
| `brand` | `{ name, logo }` | `logo` = small square image as a data URL, or `null`. |
| `costs` | `{ name, platformMonthly, talkPerMin }` | Your call platform's monthly fee and cost per talk minute (cents). |
| `buffer` | seconds | When a call becomes billable (90). |
| `balance` | cents, **can be negative** | Platform balance. ≤ 0 → CALLS STOPPED. |
| `agents[]` | `{ id, name, stage, idOk, wallet, paid, phone, email, joined, firstPaid, origin, lineName, linePrice, lineN, lineAll, line, susp, state, since }` | `state`: `in_call` · `online` (waiting) · `wrap_up` · `paused` · `offline`. `since` = ms when that state started. Phone/email already masked. |
| `lines[]` | `{ id, name, price }` | Your campaigns and their price per call. |
| `pubs[]` | `{ id, name, payout }` | Publishers and what you pay per billable call. |
| `calls[]` | `{ id, t, a, l, p, d, b, pr, po, e, s }` | One per call, oldest first. `a` = index into `agents` (−1 = never reached one), `l` lines index, `p` pubs index, `d` seconds, `b` 1 if billable, `pr` agent paid, `po` you owe, `e` who ended it (`agent` · `caller` · `noagent` · `remote` · `other`), `s` result the agent picked ("Sold", "Quoted"…). |
| `liveCalls[]` | call card | Calls in progress: script steps, stages, age, flags, last 4 lines (long digits hidden). See `card()` in `dashboard/src/demo.js`. |
| `lastCards[]` | call card | The call that just ended, for agents in wrap-up. |
| `live` | `{ onCall, waiting, paused }` | Counts for the header. |
| `pings` | `{ window, total, accepted, arrived, noAgent, state, last }` | Offers from publishers today and why refused ones were refused. |
| `disputes[]` | `{ id, agent, filed, status, reason, callId, amount, pub, what }` | Open disputes. |
| `people[]` | booked calls | `{ name, phone, email, start, created, status, licensed, states, timing, invests, team, outcome }`. From your calendar / booking tool. |
| `growth` | `{ ads[], bookings[], outcomes[], siteStart, spendAllTime }` | `ads[] = { d: 'YYYY-MM-DD', s: spend cents, site: cents }`. |
| `sources` | `{ calls, floor, ads, bookings, lines, disputes }` | When each source last answered. Shown on the Money screen. |

Anything you can't fill yet: send an empty list (`[]`) and the screen says "nothing yet". Never fill it with guesses.
