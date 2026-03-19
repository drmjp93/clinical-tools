document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('drugSearch');
    const container = document.getElementById('drugResults');
    let debounceTimer;

    // --- 1. CSS STYLES ---
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --bg-body: #0d1117;
            --bg-panel: #161b22;
            --bg-hover: #1f242c;
            --border: #30363d;
            --accent: #58a6ff;
            --text-main: #e6edf3;
            --text-muted: #8b949e;
            --success: #238636;
            --success-fg: #3fb950;
            --warning: #d29922;      /* Yellow for Adjust */
            --caution: #db6d28;      /* Orange for Caution */
            --danger: #f85149;       /* Red for Avoid */
            --selection: rgba(88, 166, 255, 0.1);
        }

        @media (max-width: 768px) {
            .list-item:active {
                background: rgba(88, 166, 255, 0.15);
                transform: scale(0.95);
            }
        }

        .list-item:active .li-chevron { transform: translateX(3px); }
        .li-chevron { transition: transform 0.2s ease; }
        .detail-content { animation: fadeIn 0.85s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .brand-box:active { transform: scale(0.97); }

        .mobile-hint {
            display: none; padding: 10px 14px; font-size: 0.75rem; color: #8b949e;
            background: #0d1117; border-bottom: 1px dashed #30363d; text-align: center;
        }
        
        .li-chevron {
            display: none; color: #6e7681; font-size: 1rem; margin-left: 8px; flex-shrink: 0;
        }

        @media (max-width: 768px) {
            .li-chevron { display: inline; }
            .mobile-hint { display: block; }
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-body); }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }

        #drugResults {
            display: none; height: 75vh; border: 1px solid var(--border); border-radius: 12px;
            overflow: hidden; clip-path: inset(0px round 12px); margin-top: 16px;
            background: var(--bg-panel); box-shadow: 0 8px 24px rgba(0,0,0,0.4); position: relative;
        }

        .list-pane {
            width: 320px; flex-shrink: 0; border-right: 1px solid var(--border);
            overflow-y: auto; background: #0d1117; display: flex; flex-direction: column;
        }
        .list-item {
            padding: 14px 16px; border-bottom: 1px solid #21262d; cursor: pointer;
            transition: background 0.2s, padding 0.2s; position: relative;
        }
        .list-item:hover { background: var(--bg-hover); }
        .list-item.active { 
            background: var(--selection); 
            background: linear-gradient(90deg, rgba(88, 166, 255, 0.1) 0%, transparent 100%);
            border-left: 3px solid var(--accent); 
        }
        .li-name { color: var(--text-main); font-weight: 600; font-size: 0.9rem; line-height: 1.3; }
        .li-brand { color: var(--text-muted); font-size: 0.75rem; display: flex; justify-content: space-between; margin-top: 4px; align-items: center;}
        .li-price { color: var(--success-fg); font-family: monospace; font-weight: 700; }

        .detail-pane {
            flex-grow: 1; overflow-y: auto; padding: 0; background: var(--bg-panel); display: block;
        }
        .detail-content { padding: 32px; max-width: 900px; margin: 0 auto; }
        .mobile-back-btn {
            display: none; align-items: center; gap: 8px; color: var(--accent);
            font-size: 0.9rem; font-weight: 600; padding: 12px 16px; background: #1c2128;
            border-bottom: 1px solid var(--border); cursor: pointer; position: sticky; top: 0; z-index: 10;
        }
        .detail-header { margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        .dh-title { font-size: 1.6rem; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 10px; letter-spacing: -0.5px; }
        
        .badge { 
            display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; 
            font-weight: 700; background: #21262d; color: var(--text-muted); 
            border: 1px solid var(--border); margin-right: 6px; margin-bottom: 4px;
        }

        .section-label { 
            font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; 
            margin: 28px 0 12px 0; display: flex; align-items: center; gap: 10px; opacity: 0.8;
        }
        .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .brands-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .brand-box { 
            background: #1c2128; border: 1px solid var(--border); padding: 14px; 
            border-radius: 8px; transition: transform 0.2s, border-color 0.2s;
        }
        .brand-box:hover { border-color: #555; transform: translateY(-1px); }
        .bb-name { color: #fff; font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
        .bb-meta { color: #8b949e; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
        .bb-price { color: var(--success-fg); font-weight: 700; font-family: monospace; font-size: 0.9rem; }
        .brand-note { font-size: 0.75rem; color: #6e7681; margin-top: 10px; font-style: italic; line-height: 1.4; }
        
        .safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .safety-strip {
            background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 6px;
            padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; border-left: 3px solid transparent;
        }
        .ss-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #8b949e; }
        .ss-status { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: #21262d; color: #fff; }
        .ss-body { font-size: 0.85rem; color: #c9d1d9; line-height: 1.3; }

        .strip-safe { border-left-color: var(--success-fg); }
        .strip-safe .ss-status { color: var(--success-fg); background: rgba(46, 160, 67, 0.1); }
        
        .strip-warn { border-left-color: var(--warning); }
        .strip-warn .ss-status { color: var(--warning); background: rgba(210, 153, 34, 0.1); }
        
        .strip-caution { border-left-color: var(--caution); }
        .strip-caution .ss-status { color: var(--caution); background: rgba(219, 109, 40, 0.1); }

        .strip-danger { border-left-color: var(--danger); }
        .strip-danger .ss-status { color: var(--danger); background: rgba(248, 81, 73, 0.1); }

        .app-footer {
            margin-top: 40px; padding-top: 20px; border-top: 1px dashed #30363d;
            font-size: 0.7rem; color: #484f58; text-align: center; line-height: 1.5;
        }
        .app-footer a { color: var(--text-muted); text-decoration: none; border-bottom: 1px dotted #8b949e; }
        .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6e7681; text-align: center; padding: 20px; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; opacity: 0.5; }
        #drugResults.show-detail .detail-pane { visibility: visible; }
        
        @media (max-width: 768px) {
            #drugResults { height: 85vh; flex-direction: column; overflow: hidden; position: relative; }
            .list-pane { 
                width: 100%; 
                flex: 1; 
                max-height: 100%;
                overflow-y: auto; 
                -webkit-overflow-scrolling: touch; 
                border-right: none; 
                transition: transform 0.3s ease-in-out; 
                transform: translateX(0); 
            }
            #drugResults.show-detail .list-pane { transform: translateX(-100%); }
            .detail-pane { 
                display: block !important; visibility: visible !important; position: absolute; top: 0; left: 0;
                width: 100%; height: 100%; z-index: 20; background: var(--bg-panel);
                transition: transform 0.3s ease-in-out, box-shadow 0.3s ease; transform: translateX(100%);
                box-shadow: -10px 0 20px rgba(0, 0, 0, 0.5);
            }
            #drugResults.show-detail .detail-pane { transform: translateX(0); }
            .detail-content { padding: 20px; }
            .safety-grid { grid-template-columns: 1fr; }
            .mobile-back-btn { display: flex; }
        }
    `;
    document.head.appendChild(style);

    // --- 2. API LINK (Replace with your actual Netlify URL) ---
    const netlifyAPI = "https://drugs.drmjp93.workers.dev";

    // --- 3. SECURE SEARCH ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query || query.length < 2) { 
            container.style.display = 'none'; 
            return; 
        }
        
        container.style.display = 'flex';
        container.innerHTML = getEmptyHTML("Searching database securely...");

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`${netlifyAPI}?q=${encodeURIComponent(query)}`);
                const filtered = await response.json();
                renderLayout(filtered);
            } catch (err) {
                console.error("DATA LOAD ERROR", err);
                container.innerHTML = getEmptyHTML("Error connecting to secure database.");
            }
        }, 300);
    });

    // --- 4. RENDER FUNCTIONS ---
    function renderLayout(drugs) {
        container.innerHTML = '';
        container.classList.remove('show-detail');
        if (drugs.length === 0) {
            container.innerHTML = getEmptyHTML("No medicines found.");
            return;
        }

        const listPane = document.createElement('div');
        listPane.className = 'list-pane';
        const hint = document.createElement('div');
        hint.className = 'mobile-hint';
        hint.innerHTML = 'Tap a medicine to view details →';
        listPane.appendChild(hint);

        const detailPane = document.createElement('div');
        detailPane.className = 'detail-pane';

        drugs.forEach((drug, index) => {
            const item = document.createElement('div');
            const isDesktop = window.innerWidth > 768;
            item.className = `list-item ${isDesktop && index === 0 ? 'active' : ''}`;
            const price = drug["FIRST PRICE"] ? `(INR ${drug["FIRST PRICE"]})` : '';
            
            item.innerHTML = `
                <div class="li-name">${drug.Active_Content}</div>
                <div class="li-brand">
                    <span>${drug["FIRST BRAND"] || 'Generic'}</span>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="li-price">${price}</span>
                        <span class="li-chevron">›</span>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                renderDetails(drug, detailPane);
                if (window.innerWidth <= 768) {
                    container.classList.add('show-detail');
                    detailPane.scrollTop = 0;
                }
            });
            listPane.appendChild(item);
        });

        container.appendChild(listPane);
        container.appendChild(detailPane);

        if (drugs.length > 0) { renderDetails(drugs[0], detailPane); }
    }

    function renderDetails(drug, pane) {
        const getCategoryHTML = (catString) => {
            if (!catString) return '<span class="badge" style="color:#58a6ff; border-color:#58a6ff;">Rx</span>';
            return catString.split('/').map((cat, i) => {
                const text = cat.trim();
                const color = i === 0 ? '#58a6ff' : '#8b949e'; 
                const border = i === 0 ? '#58a6ff' : '#ffffff'; 
                return `<span class="badge" style="color:${color}; border-color:${border};">${text}</span>`;
            }).join('');
        };

        const getRiskClass = (status, note) => {
            const s = (status || '').toUpperCase();
            const n = (note || '').toLowerCase();
            
            if (s.includes('AVOID') || s.includes('UNSAFE') || s.includes('STRICT') || n.includes('contraindicated')) return 'strip-danger';
            if (s === 'SAFE' || s === 'NO CHANGE' || n.includes('no adjustment')) return 'strip-safe';
            if (s.includes('CAUTION') || n.includes('monitor') || n.includes('precaution')) return 'strip-caution';
            if (s.includes('ADJUST') || s.includes('REDUCE') || n.includes('adjust') || n.includes('limit')) return 'strip-warn';
            return 'strip-safe';
        };

        const safetyStrip = (label, status, note) => {
            const isMissing = !status && !note;
            const displayStatus = isMissing ? 'NOT ENTERED' : status;
            const displayText = isMissing ? 'Safety data not yet added.' : (note || 'No specific adjustments.');
            const css = isMissing ? 'strip-warn' : getRiskClass(status, note);
            return `
                <div class="safety-strip ${css}">
                    <div class="ss-header">
                        <span>${label}</span>
                        <span class="ss-status">${displayStatus}</span>
                    </div>
                    <div class="ss-body">${displayText}</div>
                </div>`;
        };

        pane.innerHTML = `
            <div class="mobile-back-btn" id="btnBack">← Back to List</div>
            <div class="detail-content">
                <div class="detail-header">
                    <div class="dh-title">${drug.Active_Content}</div>
                    <div style="display:flex; flex-wrap:wrap; align-items:center;">
                        ${getCategoryHTML(drug.Category)}
                        ${drug.Max_Dose_Adult ? `<span class="badge" style="color:#3fb950; border-color:#3fb950;">Max Dose: ${drug.Max_Dose_Adult}</span>` : ''}
                    </div>
                </div>
                <div class="section-label">Available Brands</div>
                <div class="brands-grid">
                    ${drug["FIRST BRAND"] ? `
                    <div class="brand-box">
                        <div class="bb-name">${drug["FIRST BRAND"]}</div>
                        <div class="bb-meta">
                            <span>${drug["FIRST MFG"] || ''}</span>
                            <span class="bb-price">${drug["FIRST PRICE"] ? '(INR '+drug["FIRST PRICE"]+')' : ''}</span>
                        </div>
                    </div>` : ''}
                    ${drug["SECOND BRAND"] && drug["SECOND BRAND"] !== '-' ? `
                    <div class="brand-box">
                        <div class="bb-name">${drug["SECOND BRAND"]}</div>
                        <div class="bb-meta">
                            <span>${drug["SECOND MFG"] || ''}</span>
                            <span class="bb-price">${drug["SECOND PRICE"] ? '(INR '+drug["SECOND PRICE"]+')' : ''}</span>
                        </div>
                    </div>` : ''}
                </div>
                <div class="brand-note">Note: Brands for reference only. Consult your pharmacist for alternative.</div>
                <div class="section-label">Safety Profile</div>
                <div class="safety-grid">
                    ${safetyStrip('Renal', drug.Renal_Class, drug.Renal_Note)}
                    ${safetyStrip('Hepatic', drug.Hepatic_Class, drug.Hepatic_Note)}
                    ${safetyStrip('Pregnancy', drug.Pregnancy_Class, drug.Pregnancy_Note)}
                    ${safetyStrip('Lactation', drug.Lactation_Class, drug.Lactation_Note)}
                </div>
                ${drug.Max_Dose_Notes ? `<div style="margin-top:20px; padding:12px; border:1px dashed #30363d; border-radius:6px; font-size:0.85rem; color:#8b949e;"><strong>Dosing Note:</strong> ${drug.Max_Dose_Notes}</div>` : ''}
                <div class="app-footer">Compiled manually. Errors are possible. Report errors / Become co-editor : Mail on: <br> <a href="mailto:support@drmjp93.in">support@drmjp93.in</a>.</div>
            </div>`;

        setTimeout(() => {
            const btn = document.getElementById('btnBack');
            if(btn) btn.addEventListener('click', () => container.classList.remove('show-detail'));
        }, 0);
    }

    function getEmptyHTML(msg) {
        return `<div class="empty-state"><div class="empty-icon">💊</div><div>${msg}</div></div>`;
    }
});
