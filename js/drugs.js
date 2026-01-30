console.log('Drug directory JS loaded');

let drugs = [];

// Load drug data
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

    const matched = drugs.filter(d =>
      (d.Active_Content || '').toLowerCase().includes(q) ||
      (d.Category || '').toLowerCase().includes(q) ||
      (d.Ethical_Brand || '').toLowerCase().includes(q) ||
      (d.Generic_Brand || '').toLowerCase().includes(q)
    );

    if (matched.length === 0) {
      results.innerHTML =
        '<div class="monitor">No matching drugs found.</div>';
      return;
    }

    matched.forEach(d => {
      const card = document.createElement('div');
      card.className = 'tool';
      card.style.padding = '14px';
      card.style.marginBottom = '12px';

      card.innerHTML = `
        <div style="font-weight:700">${d.Active_Content}</div>
        <div style="font-size:0.85rem;color:var(--muted)">
          ${d.Category}
        </div>

        <div style="margin-top:8px;font-size:0.9rem">
          <b>Ethical:</b> ${d.Ethical_Brand}<br>
          <span style="color:var(--muted)">
            ${d.Ethical_Mfg} · ₹${d.Ethical_Price}
          </span>
        </div>

        <div style="margin-top:6px;font-size:0.9rem">
          <b>Generic:</b> ${d.Generic_Brand}<br>
          <span style="color:var(--muted)">
            ${d.Generic_Mfg} · ₹${d.Generic_Price}
          </span>
        </div>
      `;

      results.appendChild(card);
    });
  });
});