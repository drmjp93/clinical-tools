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
      d.generic.toLowerCase().includes(q) ||
      d.class.toLowerCase().includes(q) ||
      d.brands.some(b => b.name.toLowerCase().includes(q))
    );

    if (matched.length === 0) {
      results.innerHTML =
        '<div class="monitor">No matching drugs found.</div>';
      return;
    }

    matched.forEach(d => {
      const card = document.createElement('div');
      card.style.marginBottom = '12px';
      card.style.padding = '12px';
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = '12px';
      card.style.background = 'var(--card)';

      let brandList = d.brands
        .map(b => `${b.name} – ₹${b.price}`)
        .join('<br>');

      card.innerHTML = `
        <b>${d.generic}</b><br>
        <small>${d.class}</small><br><br>
        <div style="font-size:0.85rem">${brandList}</div>
      `;

      results.appendChild(card);
    });
  });
});
