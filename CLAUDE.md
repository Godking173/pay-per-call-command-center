# CLAUDE.md: read this first

You are helping a pay-per-call business owner build **their own** copy of this dashboard, on **their own** numbers. Most owners are not technical. Explain every technical word in plain English the first time you use it ("connector = a secure plug that lets me read your InboundX account").

## Never

1. **Never invent a number.** Every number on the page comes from the owner's own accounts, counted by code. If a source isn't connected, show "not connected". Don't put a guess or a sample there.
2. **Never move money.** No top-ups, credits, refunds or charges. If the platform's tools can only *propose* a money change, say it's a proposal and that the owner confirms it in their console.
3. **Never change the platform without a yes.** InboundX change tools return a preview first. Show the owner that preview, ask **one** question, and confirm only after a clear yes. One preview per question: confirm tokens expire, and asking several at once has made them expire before.
4. **Never show private numbers on a shared screen.** Hide phone numbers (show the last 4) and any run of 3+ digits in call words (birth dates, bank and card numbers). `hideDigits()` in the page already does this. Use it.
5. **Never say "done" without proof.** Proof is a check the owner can re-run (see "Check your work").
6. **Never paste secrets** (bot tokens, API keys) into the page, a chat with other people, or a file that gets shared. They go in a local `.env` file only.
7. Times are always 12-hour with AM/PM ("5:30 PM"), never 24-hour.

## How the page works (one idea)

The page draws **one object**: the snapshot (`docs/SNAPSHOT.md`). Everything you see (tiles, charts, the live floor, the script bars) is computed from it by `dashboard/src/v2a.js` (the math) and `v2b.js` (the screens). To show real numbers, you only have to **build a real snapshot** and call `refresh(snapshot)`. Don't rewrite the screens.

The demo does exactly this with made-up data (`dashboard/src/demo.js` builds the snapshot; the last lines of `build.py` refresh it every 3 seconds).

## Build the owner's copy (claude.ai page, live from their InboundX)

`dashboard/live.html` is already built for this. It reads InboundX through the owner's own connector with `dashboard/src/adapter.js` (no AI, nothing stored).

1. Make sure their InboundX connector works: call `team_status` once and show the owner their agents. If it fails, walk them through `docs/CONNECT.md` → InboundX.
2. Set the 3 lines at the top of `dashboard/src/adapter.js`: `IX_SERVER` (their connector's name exactly as Claude lists it, e.g. "Inbound X"), `MY_BUSINESS`, and `SKIP_AGENTS` (their own test accounts). Run `python3 build.py`.
3. Publish `dist/live.html` as an artifact, then declare the `mcp` capability for their InboundX connector with these tools: `team_status, list_wallets, finance_summary, list_rtb_pings, list_calls, list_agents, list_campaigns, list_publishers, list_disputes, get_transcript`. The first time the owner opens it, the page asks them to allow InboundX. Tell them to press Allow.
4. Logo: they tap the top-left corner and upload it.
5. Run `node test/live_test.mjs` (needs `npm i playwright`): it must print GREEN. It checks the page against a fake InboundX that answers in InboundX's real format.

What the page knows and doesn't: InboundX's tools don't give each agent's line directly, so the price per call comes from InboundX's own "needs N cents" note or the agent's last call. "Paid" is at least wallet + billed calls. Wrap-up and paused show as offline. Ads, bookings and calendar are empty until you connect those (docs/CONNECT.md); never fill them with guesses.

## Check your work (do all of these, report each)

- **Numbers check** on the Overview must say "All agree" (every total re-added from its parts).
- **Truth check, done a different way:** pick 3 agents. Compare the wallet on the page with `list_wallets`, and the status with `team_status`. Pick 3 calls and compare seconds, billable, and price with `list_calls`. A check that compared nothing is a FAIL, not a pass.
- Open the page on a phone-width screen (390 px). Nothing cut off, nothing overlapping.
- Tell the owner exactly what matched, what didn't, and what's not connected yet.

## Telegram alerts (optional)

`telegram/alerts.mjs` reads a snapshot JSON file and sends new alerts in **one** message (it remembers what it sent). Something on the owner's computer has to write that snapshot file on a schedule: with Claude Code, make a small script that builds the same snapshot from InboundX and saves it, then runs `node telegram/alerts.mjs snapshot.json`. Run `node telegram/alerts_test.mjs` first: it must say GREEN. Token and chat id go in `.env` only.

## Make it better every week

When the owner asks for a new number: add it as a pure function of the snapshot (like `kOf` / `model` in `v2a.js`), add it to the Numbers check if it's a total, and show where it comes from. When something goes wrong: fix it, then add a line to `LESSONS.md` and a check that would have caught it.

Read `LESSONS.md` before you start. Each line there cost real money or time once.
