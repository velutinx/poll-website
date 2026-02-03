const SUPABASE_URL = 'https://uyfltjpfqbacdmoixhjg.supabase.co';
const SUPABASE_KEY = 'YOUR_PUBLIC_ANON_KEY'; // keep same key you already use
const POLL_ID = 'character_poll_1';

const grid = document.getElementById('grid');
const leaderboard = document.getElementById('leaderboard');

async function fetchResults() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/poll_result?poll_id=eq.${POLL_ID}&select=option_id,character_name,score&order=option_id`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  return res.json();
}

function render(results) {
  grid.innerHTML = '';

  const total = results.reduce((a, b) => a + b.score, 0) || 1;

  results.forEach((r, i) => {
    const pct = (r.score / total) * 100;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${i + 1}.jpg">
      <div class="label">${r.character_name}</div>
      <div class="progress">
        <div class="progress-bar" style="width:${pct.toFixed(0)}%"></div>
      </div>
    `;

    card.onclick = async () => {
      await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poll_id: POLL_ID,
          option_id: r.option_id
        })
      });
    };

    grid.appendChild(card);
  });

  leaderboard.innerHTML =
    `<b>Leaderboard</b><br><small>Includes Discord + Website votes</small><br><br>` +
    [...results]
      .sort((a, b) => b.score - a.score)
      .map(r => `${r.character_name}: ${r.score.toFixed(1)}`)
      .join('<br>');
}

async function update() {
  const results = await fetchResults();
  render(results);
}

update();
setInterval(update, 30_000);
