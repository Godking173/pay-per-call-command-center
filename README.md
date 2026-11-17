# Pay-Per-Call Command Center

**Your whole pay-per-call business on one screen, live, on your phone.** Free and open source.

Who's on a call right now, and how far they are in the script, second by second. Every agent's wallet and who's about to run out. What you made today, this week and this month. What to fix next.

▶ **See it live first:** https://claude.ai/artifact/KUQcsDeXjF1Y58MGLGjqi8 (12 made-up agents taking made-up calls in real time). Nothing in it is real data.

---

## Three ways to use it

| You want… | Do this | Time |
|---|---|---|
| **To see it** | Open the live demo. Press the buttons in the "Show me" bar at the bottom. | 1 min |
| **Your own, on your numbers** | Connect your InboundX to Claude, then paste the prompt below into Claude. It publishes `dashboard/live.html` for you, wired to **your** InboundX. | ~10 min |
| **Phone alerts too** | Set up the Telegram alerts (`telegram/`), run by Claude Code on your computer. | ~15 min |

### The one prompt (paste into Claude)

```
I run a pay-per-call business. Build me my own copy of the free, open-source Pay-Per-Call Command Center dashboard (https://github.com/Godking173/pay-per-call-command-center).
1. Read its README.md and CLAUDE.md first and follow them exactly.
2. Connect: InboundX. Use only real numbers from my accounts. If something is not connected, show "not connected", never a guess.
3. Put my business name and my logo on top.
4. Publish it as a page I can open on my phone.
5. Then check every number against my platform and tell me what matched and what did not.
```

Add any of these to step 2 if you use them: Facebook Ads, GoHighLevel, Google Calendar, Cal.com, Telegram. Each one is explained (why, what you'll see, how) in **[docs/CONNECT.md](docs/CONNECT.md)**.

---

## It's yours. Change anything.

You don't need to know how to code. Open Claude and say what you want, in plain words:

- *"Make the buttons blue and put my logo on top."*
- *"Add a tile for sales per agent this week."*
- *"Hide the Growth screen. I don't run ads."*
- *"Text me on Telegram when an agent tops up."*

Claude changes **your** copy and checks the numbers still add up. Nothing you change touches anyone else's.

## What's in here

| Folder | What it is |
|---|---|
| `dashboard/` | The dashboard. `demo.html` = the live demo with a made-up team (open it in any browser). `live.html` = **your** dashboard: it reads your InboundX through your own Claude connector. `src/` is the code; `build.py` rebuilds both. |
| `dashboard/src/call_rules.mjs` | **The call rules**: one file that reads a call and marks the 5 qualifying-script steps (Greet, Right call, Not free, Age, Bank), how far the call got (Intro → Approved), the caller's age, and red flags (agent asking for the caller's number). The same file grades calls on the dashboard and in the alerts, so the two never disagree. |
| `telegram/` | Phone alerts: calls stopped, agent out of money, flagged call, caller too old, sale, call cut at the billing mark. One message per check, never repeats. |
| `docs/` | How to connect each tool, which numbers to track and why, and the data format. |
| `CLAUDE.md` | Instructions **your** Claude reads first: how to build your copy, and what it must never do. |
| `LESSONS.md` | Every mistake we hit building this, and the fix, so your copy starts where ours is now. |

## Why it doesn't break

- **Code counts, AI explains.** Every number is counted by code from your platform's records, the same way every time. AI only reads the numbers and tells you what they mean.
- **Every total is checked twice.** The page re-adds every total from its parts on every refresh ("Numbers check: all agree"). If anything doesn't add up, it says so in red.
- **Look before you change.** Anything that changes your platform shows a preview first and waits for your yes. These tools never move money.
- **Private by default.** Phone numbers and long numbers (birth dates, bank numbers) are hidden on every screen you might share.

## Make it better every week

The **Make more money** screen compares this week to last and shows the levers worth the most: calls lost because nobody was online, agents about to run dry, money loaded but never used, your best hour, calls cut right before billing. Then ask Claude, every Monday:

```
Compare last week to the week before across every number on my dashboard. What changed and why? Give me the 3 moves that make the most money this week, with the math.
```

Want a number that isn't there? Tell Claude: *"Add a tile for cost per sale this week"*. It adds it and checks the math.

## Feedback

It's free, and it gets better from what you tell us. Use **Send feedback** in the dashboard menu, or open an issue here.

Made by [Hot Inbound Calls](https://hotinboundcalls.com). MIT license: use it, change it, share it.
