const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const debug = document.getElementById("debug");

/* -----------------------------
   Persistent anonymous voter ID
-------------------------------- */
let voterId = localStorage.getItem("voter_id");
if (!voterId) {
  voterId = crypto.randomUUID();
  localStorage.setItem("voter_id", voterId);
}

/* -----------------------------
   Build cards
-------------------------------- */
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

/* -----------------------------
   Vote (UPSERT)
-------------------------------- */
async function vote(optionId) {
  debug.textContent = "Submitting vote…";

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?on_conflict=poll_id,voter_id`,
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
        voter_id: voterId,
        option_id: optionId,
        source: "website"
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    debug.textContent = "VOTE FAILED";
    console.error("Vote error:", err);
    return;
  }

  fetchResults();
}

/* -----------------------------
   Fetch + render results
-------------------------------- */
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

  debug.textContent = `Total votes detected: ${totalVotes}`;

  const counts = {};
  for (let i = 1; i <= TOTAL; i++) counts[i] = 0;
  votes.forEach(v => counts[v.option_id]++);

  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.dataset.id);
    const percent = totalVotes
      ? Math.round((counts[id] / totalVotes) * 100)
      : 0;

    card.classList.add("show");
    card.querySelector(".overlay").textContent = percent + "%";
  });
}

/* -----------------------------
   Initial load + refresh
-------------------------------- */
fetchResults();
setInterval(fetchResults, 3000);
