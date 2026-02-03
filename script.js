const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const resultsBox = document.getElementById("results");

/* ---------- voter id ---------- */
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
    </div>
    <div class="progress-text">0%</div>
    <div class="label">Loading…</div>
  `;

  card.onclick = () => vote(i);
  grid.appendChild(card);
}

/* ---------- vote ---------- */
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
        voter_hash: voterHash,
        source: "website"
      })
    }
  );

  fetchResults();
}

/* ---------- poll_result ---------- */
async function fetchResults() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/poll_result?poll_id=eq.${POLL_ID}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    }
  );

  const rows = await res.json();
  const totalScore = rows.reduce((a, b) => a + b.score, 0);

  // update cards
  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.dataset.id);
    const row = rows.find(r => r.option_id === id);
    if (!row) return;

    const percent =
      totalScore === 0 ? 0 : Math.round((row.score / totalScore) * 100);

    card.querySelector(".progress-fill").style.width = percent + "%";
    card.querySelector(".progress-text").textContent = percent + "%";
    card.querySelector(".label").textContent = row.character_name;
  });

  // leaderboard
  resultsBox.innerHTML = rows
    .sort((a, b) => b.score - a.score)
    .map(r => `${r.character_name}: ${r.score.toFixed(1)}`)
    .join("<br>");
}

fetchResults();
setInterval(fetchResults, 30000);
