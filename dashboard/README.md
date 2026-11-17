# dashboard/

- `live.html`: YOUR dashboard, built. Reads your InboundX through your claude.ai connector (`src/adapter.js`). See CLAUDE.md for the 3 lines to set.
- `demo.html`: the live demo, built. Open it in any browser; it needs no internet except for the font.
- `src/`: the code. `v2a.js` = the math (pure functions of the snapshot), `v2b.js` = the screens, `v2.css` = the look, `call_rules.mjs` = the call rules, `demo.js` = the made-up team, `adapter.js` = reads your InboundX, `onboard.js` / `onboard.css` = setup, connect, make more money, feedback.
- `build.py`: `python3 build.py` → `dist/index.html` (demo) and `dist/live.html` (yours). Each demo change to the screens is a named patch that must match, so the build stops loudly instead of drifting.
- `shot.mjs`: `npm i playwright && python3 build.py && node shot.mjs` → screenshots of every screen (desktop; `W=390 H=844` for phone) and a list of any page errors. Must print `ERRORS []`.
- `test/live_test.mjs`: `node test/live_test.mjs` → GREEN or RED. Opens `dist/live.html` with a fake InboundX in InboundX's real answer format and checks every number.
