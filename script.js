const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const resultsBox = document.getElementById("results");

const featuredLeft = document.getElementById("featured-left");
const featuredRight = document.getElementById("featured-right");

/* ---------- voter ---------- */
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
    <div class="progress"><div class="progress-fill"></div></div>
    <div class="progress-text">0%</div>
    <div class="label">Loading…</div>
  `;

  card.addEventListener("click", () => vote(i));
  grid.appendChild(card);
}

/* ---------- vote ---------- */
async function vote(optionId) {
  await fetch(`${SUPABASE_URL}/rest/v1/votes?on_conflict=poll_id,voter_hash`, {
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
      voter_hash: voterHash,
      source: "website"
    })
  });

  fetchResults();
}

/* ---------- results ---------- */
async function fetchResults() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/poll_result?poll_id=eq.${POLL_ID}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } }
  );

  const rows = await res.json();
  const total = rows.reduce((a, b) => a + b.score, 0);

  rows.forEach(r => {
    const card = document.querySelector(`.card[data-id="${r.option_id}"]`);
    if (!card) return;

    const pct = total ? Math.round((r.score / total) * 100) : 0;
    card.querySelector(".progress-fill").style.width = pct + "%";
    card.querySelector(".progress-text").textContent = pct + "%";
    card.querySelector(".label").textContent = r.character_name;
  });

  const sorted = [...rows].sort((a,b)=>b.score-a.score);

  // featured cards
  if (sorted[0]) {
    featuredLeft.querySelector("img").src = `images/${sorted[0].option_id}.jpg`;
    featuredLeft.querySelector(".label").textContent = sorted[0].character_name;
  }
  if (sorted[1]) {
    featuredRight.querySelector("img").src = `images/${sorted[1].option_id}.jpg`;
    featuredRight.querySelector(".label").textContent = sorted[1].character_name;
  }

  resultsBox.innerHTML = sorted
    .map(r => `${r.character_name}: ${r.score.toFixed(1)}`)
    .join("<br>");
}

fetchResults();
setInterval(fetchResults, 30000);
