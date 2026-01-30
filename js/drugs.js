console.log('Drug directory JS loaded');

let drugs = [];

/* ================= LOAD JSON ================= */

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

/* ================= SEARCH ================= */

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

    /* ---------- RANKED SEARCH ---------- */
    const matched = drugs
      .map(d => {
        let score = 0;

        if ((d.Molecule || '').toLowerCase().startsWith(q)) score += 5;
        if ((d.Molecule || '').toLowerCase().includes(q)) score += 3;

        if ((d.Category || '').toLowerCase().includes(q)) score += 1;

        if (Array.isArray(d.Brands)) {
          d.Brands.forEach(b => {
            if ((b.Name || '').toLowerCase().startsWith(q)) score += 6;
            else if ((b.Name || '').toLowerCase().includes(q)) score += 4;
          });
        }

        return score > 0 ? { ...d, _score: score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score);

    if (matched.length === 0) {
      results.innerHTML =
        '<div class="monitor">No matching drugs found.</div>';
      return;
    }

    /* ---------- RENDER ---------- */

    matched.forEach(d => {

      const card = document.createElement('div');
      card.className = 'tool';
      card.style.padding = '10px 12px';
      card.style.marginBottom = '10px';

      /* ---- Brand list (compact) ---- */
      let brandHtml = '';

      if (Array.isArray(d.Brands)) {
        brandHtml = d.Brands.map(b => `
          <div style="
            display:flex;
            justify-content:space-between;
            font-size:0.78rem;
            line-height:1.25;
            margin-top:2px
          ">
            <span><b>${b.Name || ''}</b></span>
            <span style="color:var(--muted)">
              ${b.Price ? '₹' + b.Price : ''}
            </span>
          </div>
        `).join('');
      }

      card.innerHTML = `
        <div style="font-weight:700;font-size:0.95rem">
          ${d.Molecule || ''}
        </div>

        <div style="font-size:0.7rem;color:var(--muted)">
          ${d.Category || ''}
        </div>

        ${d.Max_Dose ? `
          <div style="font-size:0.7rem;color:#93c5fd">
            Max: ${d.Max_Dose}
          </div>
        ` : ''}

        <div style="margin-top:6px">
          ${brandHtml}
        </div>
      `;

      results.appendChild(card);
    });
  });
});
