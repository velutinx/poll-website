const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const debug = document.getElementById("debug");
const combinedBox = document.getElementById("combined-results");

/* ---------- voter hash (1 per browser) ---------- */
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
    <img src="images/${i}.jpg" alt="Character ${i}">
    <div class="overlay">0%</div>
    <div class="label">Character ${i}</div>
  `;

  card.addEventListener("click", () => vote(i));
  grid.appendChild(card);
}

/* ---------- vote (UPSERT) ---------- */
async function vote(optionId) {
  const res = await fetch(
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

  if (!res.ok) {
    debug.textContent = "Vote failed";
    console.error(await res.text());
    return;
  }

  fetchWebsiteResults();
}

/* ---------- website-only results ---------- */
async function fetchWebsiteResults() {
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
  const totalVotes = votes.length;

  debug.textContent = `Total website votes: ${totalVotes}`;

  const counts = {};
  for (let i = 1; i <= TOTAL; i++) counts[i] = 0;
  votes.forEach(v => counts[v.option_id]++);

  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.dataset.id);
    const percent =
      totalVotes === 0 ? 0 : Math.round((counts[id] / totalVotes) * 100);
    card.classList.add("show");
    card.querySelector(".overlay").textContent = percent + "%";
  });
}

/* ---------- combined results (Discord + website) ---------- */
async function fetchCombinedResults() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/poll_result?poll_id=eq.${POLL_ID}&select=option_id,score&order=option_id.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    }
  );

  const rows = await res.json();

  if (!rows.length) {
    combinedBox.textContent = "No combined results yet";
    return;
  }

  combinedBox.innerHTML = rows
    .map(r => `Character ${r.option_id} — ${r.score.toFixed(1)}`)
    .join("<br>");
}

/* ---------- initial load ---------- */
fetchWebsiteResults();
fetchCombinedResults();

/* ---------- refresh intervals ---------- */
setInterval(fetchWebsiteResults, 3000);     // website UX
setInterval(fetchCombinedResults, 30000);   // Discord-aligned
