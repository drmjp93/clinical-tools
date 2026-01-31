document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECTORS MATCHING YOUR HTML IDs
    const searchInput = document.getElementById('drugSearch');
    const container = document.getElementById('drugResults');
    let allDrugs = [];

    // 2. DYNAMIC CSS INJECTION (Refined for better spacing)
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --card-bg: #111316; /* Slightly darker for contrast */
            --accent-color: #00e5ff; /* Sharp Cyan */
            --border-color: #333;
            --badge-bg: #2c3e50;
            --text-secondary: #9ca3af;
        }

        /* Results Grid */
        #drugResults {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Increased min-width slightly */
            gap: 16px;
            padding-bottom: 20px;
            margin-top: 10px;
        }

        /* Drug Card */
        .drug-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: transform 0.2s, border-color 0.2s;
        }

        .drug-card:hover {
            transform: translateY(-2px);
            border-color: #555;
        }

        /* Header: Molecule Name + Category */
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }

        .molecule-name {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--accent-color);
            line-height: 1.4;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            /* PREVENT MID-WORD WRAPPING */
            word-break: normal; 
            overflow-wrap: break-word;
            hyphens: none;
        }

        .category-badge {
            background-color: var(--badge-bg);
            color: #fff;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 700;
            white-space: nowrap;
            flex-shrink: 0;
            text-transform: uppercase;
            height: fit-content;
        }

        /* Brands Container */
        .brands-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            background: #1a1d21;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #2a2a2a;
        }

        .brands-container.has-two {
            grid-template-columns: 1fr 1fr;
        }

        /* Mobile Breakpoint for brands */
        @media (max-width: 450px) {
            .brands-container.has-two {
                grid-template-columns: 1fr; 
                gap: 16px;
            }
        }

        .brand-item {
            display: flex;
            flex-direction: column;
        }

        .brand-label {
            font-size: 0.65rem;
            color: var(--text-secondary);
            margin-bottom: 4px;
            text-transform: uppercase;
            font-weight: 600;
            opacity: 0.7;
        }

        .brand-name {
            font-size: 0.95rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 2px;
            word-break: break-word; /* Allow brand names to wrap if super long */
        }

        .brand-meta {
            font-size: 0.8rem;
            color: #888;
            display: flex;
            flex-direction: column; 
            gap: 2px;
        }

        .price-tag {
            color: #4caf50; /* Green */
            font-weight: 600;
        }

        /* Dosing Section - FIXED LAYOUT */
        .dosing-section {
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid #2a2a2a;
            font-size: 0.85rem;
            color: #d1d5db;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .dose-row {
            /* Using Grid here ensures the label ('Max Dose') always gets enough space */
            display: grid;
            grid-template-columns: 75px 1fr; 
            gap: 10px;
            align-items: baseline;
        }
        
        .dose-label {
            font-weight: 700;
            color: #6b7280; /* Muted gray for label */
            white-space: nowrap; /* Prevents "Note" from splitting */
        }

        .dose-value {
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);


    // 3. LOAD DATA
    fetch('/data/drugs.json')
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(data => {
            allDrugs = Array.isArray(data) ? data : (data.drugs || []);
        })
        .catch(err => {
            console.error("Error loading drugs:", err);
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#ff6b6b;">Error loading drug database. Check console.</div>`;
        });


    // 4. SMART SEARCH LOGIC
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            container.innerHTML = '';
            return;
        }

        const terms = query.split(/\s+/); 

        const filtered = allDrugs.filter(drug => {
            const searchString = `
                ${drug.Active_Content || ''} 
                ${drug["FIRST BRAND"] || ''} 
                ${drug["SECOND BRAND"] || ''}
                ${drug.Category || ''}
            `.toLowerCase();

            return terms.every(term => searchString.includes(term));
        });

        filtered.sort((a, b) => {
            const nameA = (a.Active_Content || '').toLowerCase();
            const nameB = (b.Active_Content || '').toLowerCase();
            
            const aStarts = nameA.startsWith(query);
            const bStarts = nameB.startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!bStarts && aStarts) return 1;

            const aCommas = (nameA.match(/,/g) || []).length;
            const bCommas = (nameB.match(/,/g) || []).length;
            if (aCommas !== bCommas) return aCommas - bCommas;
            
            return nameA.length - nameB.length;
        });

        renderDrugs(filtered);
    });


    // 5. RENDER CARDS
    function renderDrugs(drugs) {
        container.innerHTML = '';

        if (drugs.length === 0) {
            container.innerHTML = `<div style="text-align:center; grid-column: 1/-1; padding:20px; color:#666;">No medicines found.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        drugs.forEach(drug => {
            const hasBrand2 = drug["SECOND BRAND"] && drug["SECOND BRAND"] !== "-" && drug["SECOND BRAND"].trim() !== "";
            const hasDose = (drug.Max_Dose_Adult && drug.Max_Dose_Adult.trim() !== "") || 
                          (drug.Max_Dose_Notes && drug.Max_Dose_Notes.trim() !== "");

            const formatPrice = (price) => {
                if (!price || price === "-" || price === "0") return "";
                return `(₹${price})`;
            };

            const price1 = formatPrice(drug["FIRST PRICE"]);
            const price2 = formatPrice(drug["SECOND PRICE"]);

            const card = document.createElement('div');
            card.className = 'drug-card';

            card.innerHTML = `
                <div class="card-header">
                    <div class="molecule-name">${drug.Active_Content || 'Unknown'}</div>
                    <div class="category-badge">${drug.Category || 'Rx'}</div>
                </div>

                <div class="brands-container ${hasBrand2 ? 'has-two' : ''}">
                    <div class="brand-item">
                        <span class="brand-label">Primary Brand</span>
                        <span class="brand-name">${drug["FIRST BRAND"] || '-'}</span>
                        <div class="brand-meta">
                            <span>${drug["FIRST MFG"] || ''}</span>
                            <span class="price-tag">${price1}</span>
                        </div>
                    </div>

                    ${hasBrand2 ? `
                    <div class="brand-item" style="${hasBrand2 ? 'border-left:1px solid #333; padding-left: 12px;' : ''}">
                        <span class="brand-label">Alternative</span>
                        <span class="brand-name">${drug["SECOND BRAND"]}</span>
                        <div class="brand-meta">
                            <span>${drug["SECONF MFG"] || ''}</span>
                            <span class="price-tag">${price2}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>

                ${hasDose ? `
                <div class="dosing-section">
                    ${drug.Max_Dose_Adult ? `
                    <div class="dose-row">
                        <span class="dose-label">Max Dose</span>
                        <span class="dose-value">${drug.Max_Dose_Adult}</span>
                    </div>` : ''}
                    
                    ${drug.Max_Dose_Notes ? `
                    <div class="dose-row">
                        <span class="dose-label">Note</span>
                        <span class="dose-value">${drug.Max_Dose_Notes}</span>
                    </div>` : ''}
                </div>
                ` : ''}
            `;

            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }
});
