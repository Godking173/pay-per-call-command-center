# Connect your tools

Pick the ones you use. **InboundX first**: it lights up most of the dashboard. Each section says why, what you will see, how to do it by hand, and the one message to paste into Claude if you would rather Claude do it.

## InboundX (Start here)

**Why:** Your calls, agents, wallets and money. This one connection lights up most of the dashboard.

**What you will see:** The live floor (who is on a call and where they are in the script), every agent’s wallet, every call, your publishers, and what you made today, this week and this month.

**How, step by step:**

1. In **claude.ai**, open **Settings → Connectors**.
2. Find **InboundX**. If it is not in the list, open your InboundX console, go to **Settings**, and copy the AI / MCP connector link. Then in Claude press **Add custom connector** and paste it.
3. Press **Connect** and sign in with your InboundX owner login.
4. Ask Claude: **“Show me who is online in InboundX.”** If it answers with your agents, you are connected.

**Or paste this into Claude:**

```
Check that my InboundX connector works: list my agents with their wallet and status, my lines with their price, and my publishers. If anything is missing, tell me exactly which screen in InboundX to open to fix it.
```

> **Connector** = a secure plug that lets Claude read your InboundX account for you. You can unplug it any time in Claude’s settings.

## Facebook Ads

**Why:** See what each booked call and each paying agent cost you in ads, so you know which ads make money.

**What you will see:** Ad spend per day next to bookings and new paying agents, cost per booked call, and cost to get one paying agent.

**How, step by step:**

1. In **claude.ai → Settings → Connectors**, add a Facebook Ads connector (for example **Windsor.ai**, which connects Facebook Ads in a few clicks).
2. Sign in with the Facebook account that runs your ads and pick your **ad account**.
3. Ask Claude: **“How much did I spend on Facebook ads each day this week?”**
4. No connector? In Ads Manager press **Export** (daily spend, last 30 days) and drop the file into Claude.

**Or paste this into Claude:**

```
Connect my Facebook ad spend to my dashboard: daily spend for the last 30 days, then show cost per booked call and cost per new paying agent next to it. Use only real numbers from my ad account.
```

> **Cost per booked call** = ad money spent ÷ calls booked. The lower, the better.

## GoHighLevel

**Why:** Your leads, texts and booked calls. Shows who booked, who showed up and who paid, and lets Claude follow up for you.

**What you will see:** The Pipeline screen: everyone who booked, their answers (licensed? which states?), who showed, who closed, and who still needs a follow-up.

**How, step by step:**

1. In GoHighLevel open **Settings → Private Integrations** and press **Create**.
2. Give it read access to **Contacts, Conversations, Calendars and Opportunities**. Copy the token.
3. Give the token only to your own Claude setup (Claude on your computer, or a connector you add yourself). Never paste it in a group chat.
4. Ask Claude: **“Who booked a call with me this week in GoHighLevel?”**

**Or paste this into Claude:**

```
Help me connect GoHighLevel to my dashboard safely. Walk me through making a Private Integration token with read-only access to contacts, conversations, calendars and opportunities, then show this week’s booked calls and who showed up.
```

> **Private Integration token** = a password made only for one tool. You can delete it in GoHighLevel any time and the tool stops working.

## Google Calendar

**Why:** Every onboarding call you book shows on the dashboard calendar, so you never miss one.

**What you will see:** The calendar on the Overview screen and the Pipeline screen, with each booked call and the time it starts.

**How, step by step:**

1. In **claude.ai → Settings → Connectors**, find **Google Calendar**.
2. Press **Connect** and sign in with the Google account that holds your booked calls.
3. Ask Claude: **“What calls do I have booked tomorrow?”**

**Or paste this into Claude:**

```
Read my Google Calendar and show my booked onboarding calls for the next 7 days on my dashboard, with the time and the person’s name.
```

> Claude only reads your calendar. It never adds or deletes anything unless you ask.

## Cal.com

**Why:** If people book you through a Cal.com link, you see each booking the moment it is made, with the answers they gave.

**What you will see:** New bookings in the Pipeline, with what they answered on the form (licensed, states, ready to invest).

**How, step by step:**

1. In **claude.ai → Settings → Connectors**, find **Cal.com**.
2. Press **Connect** and sign in.
3. Ask Claude: **“Show my Cal.com bookings this week with their form answers.”**

**Or paste this into Claude:**

```
Read my Cal.com bookings for this week and the answers each person gave on the form, and add them to my dashboard pipeline.
```

> **Booking form answers** = the questions on your Cal.com page. Ask the right ones and you know who is worth the call before it starts.

## Telegram (Optional)

**Why:** Your phone buzzes when it matters: calls stopped, an agent out of money, a flagged call, a sale. Open the dashboard right inside Telegram.

**What you will see:** Alerts on your phone, plus a button that opens this dashboard inside Telegram.

**How, step by step:**

1. In Telegram, message **@BotFather**, send **/newbot**, pick a name. It gives you a **token**. Keep it private.
2. Send your new bot one message (“hi”) so it is allowed to message you back.
3. Open **Claude Code** on your computer, give it the token, and say: **“Set up my Telegram alerts from the Pay-Per-Call Command Center kit.”**
4. Pick which alerts you want. Start with: calls stopped, agent out of money, flagged call.

**Or paste this into Claude:**

```
Set up Telegram alerts for my pay-per-call business using the open-source Pay-Per-Call Command Center kit. Ask me for my bot token, store it only in a local .env file, and send me a test message. Alerts: calls stopped (balance $0), agent wallet can’t cover a call, agent asked for the caller’s number, caller outside age 50 to 85, sale closed.
```

> **Bot** = a Telegram account run by a program instead of a person. **Token** = its password. Something has to run all day to send alerts, so this part runs on your computer (or a small server), not on this page.

