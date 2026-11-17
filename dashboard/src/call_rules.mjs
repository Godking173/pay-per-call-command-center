// call_rules.mjs — THE one copy of the call-listening rules (zero AI): callback-number words, call stages, the 5-step script check.
// Used by: crm/ix_call_recap.mjs (→ floor watcher, live script, sale proof, tests) AND the HIC Command Center dashboard
// (copied in by crm/verify/sync_call_rules.mjs — never edit the dashboard copy by hand). Nov 13 2026: created after the two copies drifted.
// Corpus check on every saved real call: node crm/verify/script_check_corpus.mjs <dashboard.html> --probe

// ---------- CALLBACK-NUMBER words (agent moving the caller to his own phone) ----------
export const TOOK_NUMBER = /(what'?s|what is|give me) (your|a good) (phone )?number|good (phone )?number for you|i'?ll (give you a )?call( you)?( back| right back)?\b|call you (right )?back|(call you|give you a call) on my (personal|own|cell)|(what'?s|what is|can i (get|have)|provide me|give me) your (phone |cell |telephone )?number|give you a (quick )?call ?back|(a |real quick )callback|call you (right|real quick|in a (sec|minute))|my personal (line|number|phone|cell)|\b2\d\d number\b|(what was|what'?s|what is) a good (phone |cell )?number|get back in (contact|touch) with you|in case (this|the) (line|call) (ends|drops|disconnects)|callback number|(what'?s|what is) (it )?going to be (a good |your )?(phone |cell )?number|(giving|give) you a (phone )?call (from|right now|on)|giving you a (phone )?call\b|call(ing)? you from (my|that) (phone|number|cell)|(are you|you should be) receiving a (phone )?call|pick (up )?the phone( there)?\??$|pick (it )?up\b.*(ring|call)/; // Oct 29: Ali's wording that slipped past (5 calls): "what's going to be a good phone number… giving you a phone call… pick up the phone"

// ---------- STAGES — how far the call got (agent's words only). Nov 13 (v33): tuned on 52 real calls (crm/verify/script_check_corpus.mjs) ----------
export const STAGES = [ // the order a final-expense call normally goes
  ['Intro', /how (can|may) i help( you)?|on a recorded line|who do i have|who am i (speaking|talking)|pleasure of speaking|your name|this is \w+.{0,40}(licensed|final expense|life insurance|insurance agent|department)|licensed (insurance )?agent|thank(s| you) for calling/], // Nov 13: "this is alan with the final expense… who am i speaking to?" never lit
  ['Qualified', /aware .{0,40}(life insurance|not a free)|(realize|understand) .{0,30}not a free|not a free program|checkings? or savings?|savings? or checkings?|50 and 85|working,? retired,? or disabled|what i can qualify you for/], // Nov 13: agents say "checkingS or savingS"
  ['Age', /date of birth|birth ?date|how old|what('?s| is) your (age|birthday)|year (were you|you were) born|(ages? of|between) 50 and 8\d|between the ages? of \d\d and \d\d/],
  ['Beneficiary', /beneficiar|who would you (like|want) to (leave|receive|get)|who (would|will|is going to) (receive|get|be getting) (the|this|that) (money|benefit|coverage|check)|leave (this|the) (money|benefit|policy) to/],
  ['Health', /\bheart\b|cancer|diabet|copd|kidney|stroke|neuropathy|medical (records|history|questions|conditions)|health questions|any (health|medical) (issues|problems|conditions)|medications?\b|hospitali[sz]ed|blood pressure|oxygen|nursing home/],
  ['Quote', /\$\s?\d{2,3}(\.\d\d)?|\b\d{2,3}\.\d\d\b|\d{2,3} dollars|\b\d{2,3} (a|per) month/],
  ['Bank info', /routing|account number|checkbook|bank do you|what bank|which bank|bank locally|do you bank|name of (your|the) bank|banking with/],
  ['Application', /pin code|text code|6-digit|signature|\be-?sign(ed|ing|ature)?\b|text messages|confirm your social\b|last (four|4) of your social|submit(ted|ting)? (the |your |this )?application/], // Oct 27: \b — 'e-?sign' matched inside 'designed'
  ['Approved', /you (were|are|got) approved|approved for|(been|got|you'?re) (fully )?(submitted and )?approved/], // Nov 13: "fully submitted and approved"
];
// "plans start as low as $50 to $100 a month" is the not-free warning, not a quote → strip price RANGES before looking for a quote (Nov 13)
const PRICE_RANGE = /(plans?|they|it|programs?|these) (do |can |will |usually )?(start|starts|starting|range|ranges|run|go) (anywhere )?(as low as|at|from|around|between)[^.?!|]*|anywhere (from|between) [^.?!|]*|(as low as|between) \$?\d{2,3}( dollars)? (to|and) \$?\d{2,3}[^.?!|]*/g;
export function stagesHit(agentText) { const noRange = agentText.replace(PRICE_RANGE, ' '); return STAGES.filter(([k, re]) => re.test(k === 'Quote' ? noRange : agentText)).map(([k]) => k); }

// ---------- SCRIPT CHECK (Oct 28, Eli: "make sure they follow the script … if all qualification questions are qualified, that call should be billable") ----------
// The 5 steps of "START HERE: HIC Qualifying Script (every call)". For each step: did the AGENT ask it (his own words count),
// and what did the CALLER answer. ans: 'pass' | 'fail' | '?' (asked, answer unclear) | null (not asked). qualified = steps 2–5 all pass.
export const SCRIPT_STEPS = [
  ['Greet', /licensed|who do i have|who am i (speaking|talking)|pleasure of speaking|may i have your name|who('?s| is) (this|calling)|thank(s| you) for calling|^\W*(hi|hello|hey),? this is \w+|this is \w+.{0,40}(final expense|life insurance|insurance agent|department)|how (can|may) i help( you)?|on a recorded line/], // Nov 13: an agent's greeting
  ['Right call', /(you'?re|you are|you were|were you) (just )?(calling|looking|interested|giving (us )?a call)|(giving|give) (us )?a call in|call(ing)? in (about|for|regarding)|about (life|final expense|burial|funeral) (insurance|coverage|expenses?),? (right|correct)|calling (about|for|in about|in for|to (get|set|see))|burial or cremation|final expense coverage|funeral expenses?,? (right|correct)|(get|set|setting) (up )?(your|those|the) (funeral|final|burial)/],
  ['Not free', /not (a )?free|isn'?t (a )?free|aren'?t free|are not free|no(t a)? government|small monthly|monthly (payment|premium|cost|fee)|there is a monthly|(plans?|they|programs?) (do )?(start|range) (anywhere )?(as low as|at|around|from)|can you afford|is that (affordable|comfortable)|afford that|month-to-month|think it was free/],
  ['Age', /how old|date of birth|birth ?date|what('?s| is) your (age|birthday)|year (were you|you were) born|what year were you|(ages? of|between) 50 and 8\d|between the ages? of \d\d and \d\d/], // Nov 13: "payment depends on your AGE and health" is not asking the age
  ['Bank', /checkings? or savings?|savings? or checkings?|(active|a) (bank|checkings?|savings?) account|direct express|what bank|which bank|bank do you|do you bank|financial institution|bank (locally|with)/], // Nov 13: "checkingS or savingS", "do you bank locally"
];
// a line that matches a step's words but is really about something else → don't count it for that step
const NOT_THIS = { 'Right call': /already have|in place|currently have/ }; // Nov 13: "do you already have life insurance… you're looking to get more?" + "no, I already have some" was marked a FAIL
const YES = /\b(yes|yeah|yep|yup|ya|correct|right|uh-?huh|mm-?hmm|mhm|sure|exactly|of course|i do|i have|that'?s right|okay|ok|makes sense|i understand|i know|i realize|i'?m aware|i am aware|i can afford|i could afford|i can do|that'?s fine|that works|sounds good|no problem|absolutely|definitely)\b/;
// a clear NO beats everything; then a yes (or a named bank) is a pass; a bare "no" at the start is a fail
const HARD_NO = {
  'Right call': /didn'?t call|wrong number|not interested|stop calling|scam|wasn'?t what i (was )?call|not what i (was )?(call|look)/,
  'Not free': /thought (it|this) (was|would be) free|supposed to be free|(it'?s|is it|isn'?t it|wasn'?t it) free\b|for free\b|can'?t afford|cannot afford|couldn'?t afford|no money|ain'?t got (no )?money|don'?t have (the |any )?money|too (much|expensive)|can'?t pay|barely (get|make|cover)/, // Nov 13: a caller REPEATING "it's not a free—" was marked a fail
  'Bank': /direct express|\bebt\b|no bank|don'?t have (a |any )?(bank|checking|savings|account)|cash ?app|prepaid|haven'?t got (one|a|an)\b/,
};
const STEP_YES = { 'Bank': /\b(chase|wells fargo|bank of america|citi(bank)?|capital one|pnc|us bank|truist|regions|td bank|navy federal|credit union|fifth third|huntington|bmo|usaa|woodforest|first \w+|\w+ bank|checkings?|savings?|i bank|banked|bank (locally|with))\b/ }; // Nov 13: "Chase." was not a yes
const SOFT_NO = /^\W*(no|nope|nah)\b/;
function judge(k, r) { if (HARD_NO[k] && HARD_NO[k].test(r)) return 'fail'; if ((STEP_YES[k] && STEP_YES[k].test(r)) || YES.test(r)) return 'pass'; if (SOFT_NO.test(r)) return 'fail'; return '?'; }
const CALLER_RIGHT_CALL = /(calling|called|call|looking|interested|inquir\w*|asking) (in |up )?(about|for|into|regarding|on)? ?.{0,25}(life insurance|final expense|burial|funeral|cremation)|(ad|commercial|advertisement|tv) (about|for|on) .{0,25}(burial|funeral|final expense|life insurance)/; // Nov 13: "i'm looking for life insurance" = right call, said by the caller
STEP_YES['Right call'] = CALLER_RIGHT_CALL; // Nov 13: "no, I was calling about the $25,000 life insurance" was a FAIL because it starts with "no"
const WORD_NUM = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }, WORD_ONE = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
function yearIn(s) {
  const y = s.match(/\b(19[2-9]\d)\b/); if (y) return +y[1];
  const w = s.match(/\bnineteen[- ](twenty|thirty|forty|fifty|sixty|seventy|eighty)(?:[- ](one|two|three|four|five|six|seven|eight|nine))?\b/); if (w) return 1900 + WORD_NUM[w[1]] + (WORD_ONE[w[2]] || 0); // Nov 13: spoken years
  const dt = s.match(/\b\d{1,2}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*(\d{2,4})\b/); if (dt) { const yy = +dt[1]; const yr = yy < 100 ? 1900 + yy : yy; if (yr >= 1920 && yr <= 2010) return yr; }
  return null; }
const ASKED_AGE = /how old|your age|ages? of|between the ages|50 and 85|date of birth|birth ?date|born/;
export function callerAgeFrom(turns) { // a birth year / date the caller says (or the agent reads back right after asking), or a number right after "how old"
  for (let i = 0; i < turns.length; i++) { const t = turns[i], s = t.text.toLowerCase();
    const prevA = turns.slice(Math.max(0, i - 4), i).filter(x => x.who === 'agent').map(x => x.text.toLowerCase()).join(' ');
    if (t.who === 'agent') { if (!ASKED_AGE.test(prevA) || ASKED_AGE.test(s.slice(0, 40))) continue; // Nov 13: agent reads it back — "07/14/52. all right, perfect."
      const yr = yearIn(s.slice(0, 40)); if (yr) return 2026 - yr; continue; }
    const yr = yearIn(s); if (yr) return 2026 - yr;
    const m = s.match(/\b(\d{2,3})\b/); if (m && /how old|your age|ages? of|between the ages|50 and 85/.test(prevA) && +m[1] >= 18 && +m[1] <= 110) return +m[1];
    const v = s.match(/\b(?:i'?m|i am|age is|i turn(?:ed)?|i'll be)\s+(\d{2})\b(?!\s*(?:dollars|minutes|percent|%))/); if (v && +v[1] >= 18 && +v[1] <= 105) return +v[1]; }
  return null; }
export function scriptCheck(turns) {
  const steps = SCRIPT_STEPS.map(([k]) => ({ k, asked: false, ans: null, said: null }));
  const isStep = (k, re, a) => re.test(a) && !(NOT_THIS[k] && NOT_THIS[k].test(a));
  turns.forEach((t, i) => { if (t.who !== 'agent') return; const a = t.text.toLowerCase();
    SCRIPT_STEPS.forEach(([k, re], si) => { if (!isStep(k, re, a)) return; const st = steps[si]; st.asked = true;
      if (si === 0) { st.ans = 'pass'; return; }
      // the caller's next 1–3 lines (stop at the next agent line that asks a different step)
      const reply = []; for (let j = i + 1; j < turns.length && reply.length < 3; j++) { const u = turns[j]; if (u.who === 'agent') { if (SCRIPT_STEPS.some(([k2, r2], s2) => s2 !== si && isStep(k2, r2, u.text.toLowerCase()))) break; continue; } reply.push(u.text.toLowerCase()); }
      // a caller line on the same second as the question often arrives just before it
      if (!reply.length && turns[i - 1]?.who === 'caller') reply.push(turns[i - 1].text.toLowerCase());
      const r = reply.join(' | '); if (!r) return;
      let ans = '?'; if (k === 'Age') { const age = callerAgeFrom(turns.slice(0, i + 5)); if (age != null) { ans = age >= 50 && age <= 85 ? 'pass' : 'fail'; st.said = 'age ' + age; } }
      else ans = judge(k, r);
      if (st.ans !== 'fail' && ans !== '?') { st.ans = ans; st.said = st.said || r.slice(0, 60); } else if (!st.ans) st.ans = ans; }); });
  if (!steps[3].ans || steps[3].ans === '?') { const age = callerAgeFrom(turns); if (age != null) { steps[3].ans = age >= 50 && age <= 85 ? 'pass' : 'fail'; steps[3].said = 'age ' + age + (steps[3].asked ? '' : ' (caller said it, agent didn\'t ask)'); } }
  if (steps[1].ans !== 'pass' && steps[1].ans !== 'fail') { const c = turns.find(t => t.who === 'caller' && CALLER_RIGHT_CALL.test(t.text.toLowerCase()) && !HARD_NO['Right call'].test(t.text.toLowerCase()));
    if (c) { steps[1].ans = 'pass'; steps[1].said = c.text.toLowerCase().slice(0, 60) + (steps[1].asked ? '' : ' (caller said it)'); } }
  const q = steps.slice(1), asked = steps.filter(s => s.asked || s.ans === 'pass').length;
  const failed = q.find(s => s.ans === 'fail') || null, qualified = q.every(s => s.ans === 'pass');
  return { steps, asked, qAsked: q.filter(s => s.asked).length, qualified, failed: failed ? failed.k : null,
    line: steps.map(s => `${s.ans === 'pass' ? '✅' : s.ans === 'fail' ? '❌' : s.asked ? '❔' : '⬜'} ${s.k}`).join('  ') };
}
