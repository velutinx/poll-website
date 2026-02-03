const SUPABASE_URL = "https://uyfltjpfqbacdmoixhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_u0lYHOySc4V3D9-Gix0zhQ_xFIzrhd0";

const POLL_ID = "character_poll_1";
const TOTAL = 12;

const grid = document.getElementById("grid");
const resultsBox = document.getElementById("results");

const leftImg = document.getElementById("leftImg");
const leftBig = document.getElementById("leftBig");
const rightImg = document.getElementById("rightImg");
const rightBig = document.getElementById("rightBig");

let rotateIndex = 1;
let characterNames = {};

/* ---------- voter id ---------- */
let voterHash = localStorage.getItem("voter_hash");
if (!voterHash) {
  voterHash = crypto.randomUUID();
  localStorage.setItem("voter_hash", voterHash);
}

/* ---------- load names ---------- */
async function fetchNames() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/poll_result?poll_id=eq.${POLL_ID}&select=option_id,character_name`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    }
  );

  const rows = await res.json();
  rows.forEach(r => {
    characterNames[r.option_id] = r.character_name;
  });
}

/* ---------- build cards ---------- */
async function buildCards() {
  await fetchNames();

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
      <div class="label">${characterNames[i] ?? `Character ${i}`}</div>
    `;

    card.onclick = async () => {
      showSelected(i);
      await vote(i);
    };

    grid.appendChild(card);
  }
}

/* ---------- big cards ---------- */
function showSelected(id) {
  leftBig.classList.remove("show");
  leftImg.src = `images/${id}.jpg`;
  requestAnimationFrame(() => leftBig.classList.add("show"));
}

function rotate() {
  rightBig.classList.remove("show");
  rightImg.src = `images/${rotateIndex}.jpg`;
  requestAnimationFrame(() => rightBig.classList.add("show"));
  rotateIndex = rotateIndex % TOTAL + 1;
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
  fetchLeaderboard();
}

/* ---------- results ---------- */
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

/* ---------- leaderboard ---------- */
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
    .map(r => `${r.character_name}: ${r.score.toFixed(1)}`)
    .join("<br>");
}

/* ---------- init ---------- */
await buildCards();
rotate();
showSelected(1);

setInterval(rotate, 3500);
fetchResults();
fetchLeaderboard();
setInterval(fetchResults, 30000);
setInterval(fetchLeaderboard, 30000);
