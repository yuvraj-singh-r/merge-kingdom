"use strict";
/* ============================================================
   RESERVED MODULE — leaderboard.js
   STATUS: Not implemented. Not loaded by index.html.

   FUTURE RESPONSIBILITY
   Global/friends leaderboard UI and score submission, likely
   backed by firebase.js.

   INTEGRATION RULES (see PROJECT_RULES.md, Section 8, 10 & 11)
   - UI must follow the existing tab/card patterns in js/panels.js.
   - Any remote or user-supplied text rendered here (player names,
     etc.) must be sanitized (textContent, not raw innerHTML
     concatenation) before rendering — see Section 10.
   - Submits existing state.score (kingdom score) rather than
     inventing a parallel scoring metric, unless a new metric is
     deliberately designed and documented here first.

   This file intentionally contains no executable logic yet.
   ============================================================ */
