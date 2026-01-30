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

    if (q.length < 2) return; // prevents junk results

    /* ===== SCORE + FILTER ===== */
    const matched = drugs
      .map(d => {
        let score = 0;

        const molecule = (d.Active_Content || '').toLowerCase();
        const category = (d.Category || '').toLowerCase();
        const ethicalBrand = (d.Ethical_Brand || '').toLowerCase();
        const genericBrand = (d.Generic_Brand || '').toLowerCase();

        /* 1️⃣ MOLECULE MATCH (HIGHEST PRIORITY) */
        if (molecule.startsWith(q)) score += 12;
        else if (molecule.includes(q)) score += 8;

        /* 2️⃣ BRAND MATCH */
        if (ethicalBrand.startsWith(q)) score += 10;
        else if (ethicalBrand.includes(q)) score += 6;

        if (genericBrand.startsWith(q)) score += 9;
        else if (genericBrand.includes(q)) score += 5;

        /* 3️⃣ CATEGORY — WEAK, ONLY IF QUERY LONG */
        if (q.length >= 4 && category.includes(q)) score += 1;

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
      card.style.padding = '12px';
      card.style.marginBottom = '10px';

      card.innerHTML = `
        <div style="font-weight:700;font-size:0.95rem">
          ${d.Active_Content}
        </div>

        <div style="font-size:0.75rem;color:var(--muted)">
          ${d.Category}
        </div>

        <div style="margin-top:6px;font-size:0.85rem">
          <b>Ethical:</b> ${d.Ethical_Brand || '-'}
          <span style="color:var(--muted)">
            · ${d.Ethical_Mfg || '-'} · ₹${d.Ethical_Price || '-'}
          </span>
        </div>

        <div style="margin-top:4px;font-size:0.85rem">
          <b>Generic:</b> ${d.Generic_Brand || '-'}
          <span style="color:var(--muted)">
            · ${d.Generic_Mfg || '-'} · ₹${d.Generic_Price || '-'}
          </span>
        </div>

        ${
          d.Max_Dose
            ? `<div style="margin-top:4px;font-size:0.75rem;color:var(--muted)">
                Max dose: ${d.Max_Dose}
               </div>`
            : ''
        }
      `;

      results.appendChild(card);
    });
  });
});
