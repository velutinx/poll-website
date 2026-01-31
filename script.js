const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const debug = document.getElementById("debug");

/* ────────────────────────────── */
/* VOTER HASH (ONE PER COMPUTER)  */
/* ────────────────────────────── */

function getVoterHash() {
  let hash = localStorage.getItem("voter_hash");
  if (!hash) {
    hash = crypto.randomUUID();
    localStorage.setItem("voter_hash", hash);
  }
  return hash;
}

const VOTER_HASH = getVoterHash();

/* ────────────────────────────── */
/* BUILD CARDS                    */
/* ────────────────────────────── */

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

/* ────────────────────────────── */
/* VOTE                           */
/* ────────────────────────────── */

async function vote(optionId) {
  debug.textContent = "Submitting vote…";

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/votes`,
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
        voter_hash: VOTER_HASH
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    debug.textContent = "Vote failed (already voted)";
    console.warn(text);
    return;
  }

  fetchResults();
}

/* ────────────────────────────── */
/* FETCH RESULTS                  */
/* ────────────────────────────── */

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
  const totalVotes = votes.length;

  debug.textContent = `Total votes: ${totalVotes}`;

  if (totalVotes === 0) return;

  const counts = {};
  for (let i = 1; i <= TOTAL; i++) counts[i] = 0;
  votes.forEach(v => counts[v.option_id]++);

  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.dataset.id);
    const percent = Math.round((counts[id] / totalVotes) * 100);
    card.classList.add("show");
    card.querySelector(".overlay").textContent = percent + "%";
  });
}

/* INITIAL LOAD + LIVE UPDATE */
fetchResults();
setInterval(fetchResults, 3000);
