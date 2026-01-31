<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Character Poll</title>

<style>
  body {
    margin: 0;
    font-family: sans-serif;
    background: url("background.jpg") center / cover no-repeat fixed;
  }

  #grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 24px;
    max-width: 1200px;
    margin: auto;
  }

  .card {
    position: relative;
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
  }

  .card img {
    width: 100%;
    display: block;
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.65);
    color: #fff;
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: .2s;
  }

  .card.show .overlay {
    opacity: 1;
  }

  .label {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(0,0,0,.7);
    color: #fff;
    text-align: center;
    padding: 6px;
    font-size: 14px;
  }
</style>
</head>

<body>

<div id="grid"></div>

<!-- ⚠️ MUST BE type="module" -->
<script type="module">
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const POLL_ID = "character_poll_1";
const TOTAL = 12;

// --------------------------------------------------
// STABLE VOTER ID
// --------------------------------------------------
let voterId = localStorage.getItem("voter_id");
if (!voterId) {
  voterId = crypto.randomUUID();
  localStorage.setItem("voter_id", voterId);
}

// --------------------------------------------------
// BUILD GRID
// --------------------------------------------------
const grid = document.getElementById("grid");

for (let i = 1; i <= TOTAL; i++) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = i;

  card.innerHTML = `
    <img src="images/${i}.jpg">
    <div class="overlay">0%</div>
    <div class="label">Character ${i}</div>
  `;

  card.onclick = () => vote(i);
  grid.appendChild(card);
}

// --------------------------------------------------
// VOTE (UPSERT)
// --------------------------------------------------
async function vote(characterId) {
  await supabase.from("votes").upsert(
    {
      poll_id: POLL_ID,
      voter_id: voterId,
      option_id: characterId
    },
    { onConflict: "poll_id,voter_id" }
  );

  fetchResults();
}

// --------------------------------------------------
// FETCH RESULTS
// --------------------------------------------------
async function fetchResults() {
  const { data } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", POLL_ID);

  if (!data) return;

  const counts = {};
  for (let i = 1; i <= TOTAL; i++) counts[i] = 0;
  data.forEach(v => counts[v.option_id]++);

  const totalVotes = data.length || 1;

  document.querySelectorAll(".card").forEach(card => {
    const id = Number(card.dataset.id);
    const percent = Math.round((counts[id] / totalVotes) * 100);
    card.classList.add("show");
    card.querySelector(".overlay").textContent = percent + "%";
  });
}

fetchResults();
</script>

</body>
</html>
