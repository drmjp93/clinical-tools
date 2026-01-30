console.log('Drug directory JS loaded');

let drugs = [];

/* ================= LOAD DRUG DATA ================= */

fetch('/data/drugs.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load drugs.json');
    return res.json();
  })
  .then(data => {
    drugs = data;
    console.log('Drugs loaded:', drugs.length);
  })
  .catch(err => {
    console.error('Drug JSON error:', err);
  });

/* ================= SEARCH LOGIC ================= */

document.addEventListener('DOMContentLoaded', () => {

  const search = document.getElementById('drugSearch');
  const results = document.getElementById('drugResults');

  if (!search || !results) {
    console.error('Drug search elements not found');
    return;
  }

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    results.innerHTML = '';

    if (!q) return;

    /* ===== RANKED MATCHING ===== */

    const matched = drugs
      .map(d => {

        let score = 0;

        const active   = (d.Active_Content || '').toLowerCase();
        const category = (d.Category || '').toLowerCase();
        const ethical  = (d.Ethical_Brand || '').toLowerCase();
        const generic  = (d.Generic_Brand || '').toLowerCase();

        // 1️⃣ Brand name match (HIGHEST priority)
        if (ethical.includes(q) || generic.includes(q)) score += 100;

        // 2️⃣ Exact active content match
        if (active === q) score += 80;

        // 3️⃣ Partial active content match
        if (active.includes(q)) score += 50;

        // 4️⃣ Category match
        if (category.includes(q)) score += 10;

        return score > 0 ? { ...d, _score: score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score);

    if (matched.length === 0) {
      results.innerHTML =
        '<div class="monitor">No matching drugs found.</div>';
      return;
    }

    /* ===== RENDER RESULTS ===== */

    matched.forEach(d => {

      const card = document.createElement('div');
      card.className = 'tool';
      card.style.padding = '14px';
      card.style.marginBottom = '12px';

      card.innerHTML = `
        <div style="font-weight:700">
          ${d.Active_Content}
        </div>

        <div style="font-size:0.85rem;color:var(--muted)">
          ${d.Category}
        </div>

        <div style="margin-top:8px;font-size:0.9rem">
          <b>Ethical:</b> ${d.Ethical_Brand}<br>
          <span style="color:var(--muted)">
            ${d.Ethical_Mfg || ''} · ₹${d.Ethical_Price || '-'}
          </span>
        </div>

        <div style="margin-top:6px;font-size:0.9rem">
          <b>Generic:</b> ${d.Generic_Brand || '-'}<br>
          <span style="color:var(--muted)">
            ${d.Generic_Mfg || ''} · ₹${d.Generic_Price || '-'}
          </span>
        </div>
      `;

      results.appendChild(card);
    });
  });
});