# Lessons we paid for

Every line here is a real mistake we made building this for a working pay-per-call business, plus the fix. Your copy starts with all of them already fixed. Add your own at the bottom.

## Numbers

1. **A check that compares nothing must fail.** Our first truth check said GREEN after comparing zero wallets, because the reader was broken. Now: fewer than 3 wallets compared = RED.
2. **Keep the minus sign.** A negative platform balance ("−$1.20") was read as $1.20, so the page showed money when every call was being refused. Parse signed numbers; at ≤ $0 show **CALLS STOPPED** everywhere.
3. **Text glued to numbers.** A wallet read as "$130.00Last top-up" broke the reader and the wallet showed wrong. Match numbers with clear edges, then check them against the platform.
4. **Don't trust "saved", read it back.** A tool printed an error after the change had actually gone through. The platform's own read-back is the truth.
5. **Refresh money when a call ends**, not only on a timer, or the floor shows a wallet that's already been charged.
6. **Count money in cents.** No rounding drift between tiles.

## Calls and the script

7. **Hidden digits can hide the answer.** The call panel re-graded calls from words with long numbers hidden, so "born 1954" became "•••", the caller's age disappeared, and a qualified call showed "Not qualified yet". Fix: when re-grading can't see an answer, keep the stronger answer that was already found.
8. **Don't strip the deal line.** Removing "$" amounts to protect privacy also hid the coverage and the monthly price. Keep the carrier / coverage / price line as spoken; hide only long digit runs.
9. **One copy of the call rules.** The dashboard and the alerts once used two copies that drifted apart and disagreed. Now both load `call_rules.mjs`.
10. **"Pricing starts as low as $50 to $100" is not a quote.** Strip price ranges before deciding a quote was given.
11. **A caller saying "no, I was calling about the $25,000 policy" is a yes.** Check what they're calling about before the leading "no".

## The platform (InboundX)

12. **Putting an agent on a line takes 3 things:** the line allows them, they're on the line's roster, and they re-pick the line in Take Calls. Check all 3 before saying "done".
13. **"No eligible agent" on offers usually means nobody on that line covers the caller's state, or nobody is online.** Read the refusal reasons before blaming the publisher.
14. **One preview, one question, then confirm.** Confirm tokens expire in minutes.

## Running it

15. **Never use a tool that waits for you while you're away.** A check that needed a click blocked everything for 9 hours overnight.
16. **Background robots must never slow the computer or jump in front of your window.** One browser per job, tabs not windows, run hidden.
17. **When the internet drops, retry every couple of minutes.** Don't open more tabs or processes.
18. **One alert message per check.** Ten messages per call trains you to ignore them.
19. **Comments in one-line code:** a `//` comment swallowed the rest of a line and silently broke the live refresh. Use `/* … */` inside long lines.
