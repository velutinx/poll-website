import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY_HERE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const POLL_ID = "characters_poll_1";

// --------------------------------------------------
// STABLE VOTER ID (THIS IS CRITICAL)
// --------------------------------------------------
let voterId = localStorage.getItem("voter_id");

if (!voterId) {
  voterId = crypto.randomUUID();
  localStorage.setItem("voter_id", voterId);
}

console.log("VOTER ID:", voterId);

// --------------------------------------------------
// VOTE FUNCTION
// --------------------------------------------------
async function vote(characterId) {
  const { error } = await supabase
    .from("votes")
    .upsert(
      {
        poll_id: POLL_ID,
        voter_id: voterId,
        character_id: characterId,
      },
      {
        onConflict: "poll_id,voter_id",
      }
    );

  if (error) {
    console.error("Vote error:", error);
    return;
  }

  loadResults();
}

// --------------------------------------------------
// LOAD RESULTS
// --------------------------------------------------
async function loadResults() {
  const { data, error } = await supabase
    .from("votes")
    .select("character_id");

  if (error) {
    console.error(error);
    return;
  }

  const counts = {};
  data.forEach(v => {
    counts[v.character_id] = (counts[v.character_id] || 0) + 1;
  });

  const total = data.length || 1;

  document.querySelectorAll(".card").forEach(card => {
    const id = card.dataset.id;
    const percent = Math.round(((counts[id] || 0) / total) * 100);
    card.querySelector(".overlay").textContent = percent + "%";
  });
}

// --------------------------------------------------
// BUILD GRID (EXAMPLE)
// --------------------------------------------------
const grid = document.getElementById("grid");

for (let i = 1; i <= 6; i++) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = i;

  card.innerHTML = `
    <img src="chars/${i}.jpg">
    <div class="overlay">0%</div>
    <div class="label">Character ${i}</div>
  `;

  card.onclick = () => vote(i);
  grid.appendChild(card);
}

loadResults();
