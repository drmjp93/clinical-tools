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

  if (!search || !results) return;

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    results.innerHTML = '';

    if (q.length < 2) return;

    /* ===== PHASE 1: MOLECULE + BRAND ONLY ===== */
    let matched = drugs
      .map(d => {
        let score = 0;

        const molecule = (d.Active_Content || '').toLowerCase();
        const ethical = (d.Ethical_Brand || '').toLowerCase();
        const generic = (d.Generic_Brand || '').toLowerCase();

        if (molecule.startsWith(q)) score += 20;
        else if (molecule.includes(q)) score += 12;

        if (ethical.startsWith(q)) score += 15;
        else if (ethical.includes(q)) score += 8;

        if (generic.startsWith(q)) score += 14;
        else if (generic.includes(q)) score += 7;

        return score > 0 ? { ...d, _score: score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score);

    /* ===== PHASE 2: CATEGORY FALLBACK ONLY ===== */
    if (matched.length === 0 && q.length >= 4) {
      matched = drugs.filter(d =>
        (d.Category || '').toLowerCase().includes(q)
      );
    }

    if (matched.length === 0) {
      results.innerHTML =
        '<div class="monitor">No matching drugs found.</div>';
      return;
    }

    /* ===== RENDER ===== */
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
      `;

      results.appendChild(card);
    });
  });
});
