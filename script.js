const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const debug = document.getElementById("debug");
const focus = document.getElementById("focus");
const focusImg = document.getElementById("focusImg");
const resultsBox = document.getElementById("results");

let currentFocus = 1;
let focusTimer;

/* ---------- voter hash ---------- */
let voterHash = localStorage.getItem("voter_hash");
if (!voterHash) {
  voterHash = crypto.randomUUID();
  localStorage.setItem("voter_hash", voterHash);
}

/* ---------- build cards ---------- */
for (let i = 1; i <= TOTAL; i++) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = i;

  card.innerHTML = `
    <img src="images/${i}.jpg">
    <div class="progress">
      <div class="progress-fill"></div>
      <div class="progress-text">0%</div>
    </div>
    <div class="label">Character ${i}</div>
  `;

  card.addEventListener("click", () => {
    vote(i);
    showFocus(i);
  });

  grid.appendChild(card);
}

/* ---------- voting ---------- */
async function vote(optionId) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/votes?on_conflict=poll_id,voter_hash`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        poll_id: POLL_ID,
        option_id: optionId,
        voter_hash: voterHash
      })
    }
  );

  fetchResults();
}

/* ---------- focus rotation ---------- */
function showFocus(id) {
  clearTimeout(focusTimer);

  focus.classList.remove("show");
  focusImg.src = `images/${id}.jpg`;

  requestAnimationFrame(() => {
    focus.classList.add("show");
  });

  currentFocus = id;
  focusTimer = setTimeout(autoRotate, 2600);
}

function autoRotate() {
  const next = currentFocus % TOTAL + 1;
  showFocus(next);
}

/* ---------- website votes ---------- */
async function fetchResults() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?poll_id=eq.${POLL_ID}&select=option_id`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    }
  );

  const votes = await res.json();
  debug.textContent = `Total votes: ${votes.length}`;

  const counts = {};
  for (let i = 1; i <= TOTAL; i++) counts[i] = 0;
  votes.forEach(v => counts[v.option_id]++);

  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.dataset.id);
    const percent =
      votes.length === 0 ? 0 : Math.round((counts[id] / votes.length) * 100);

    card.querySelector(".progress-fill").style.width = percent + "%";
    card.querySelector(".progress-text").textContent = percent + "%";
  });
}

/* ---------- leaderboard (discord + website) ---------- */
async function fetchLeaderboard() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/poll_result?poll_id=eq.${POLL_ID}&order=score.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    }
  );

  const rows = await res.json();
  resultsBox.innerHTML = rows
    .map(r => `Character ${r.option_id}: ${r.score.toFixed(1)}`)
    .join("<br>");
}

/* ---------- init ---------- */
fetchResults();
fetchLeaderboard();
showFocus(1);

setInterval(fetchResults, 30000);
setInterval(fetchLeaderboard, 30000);
