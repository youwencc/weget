/* =========================================================
   AI 客户端列表页逻辑（分类侧栏 / 客户端卡片 / 站内搜索）
   数据来源：ai-client.php 输出的 #page-data（cats + clients）
   卡片点击进入客户端详情页（client/<id>.html），不再外跳官网
   ========================================================= */
(function(){
  const D = getPageData();
  const CATS    = D.cats    || {};   // { key: {label, icon} }
  const CLIENTS = D.clients || [];
  const ALL_LABEL = D.allLabel || '全部客户端';

  let navCat   = 'all';
  let navQuery = '';

  const navSide     = document.getElementById('navSide');
  const siteGrid    = document.getElementById('siteGrid');
  const navCount    = document.getElementById('navCount');
  const navCatTitle = document.getElementById('navCatTitle');
  const searchInput = document.getElementById('navSearchInput');

  /* ===== 左侧分类栏（首项固定为"全部客户端"） ===== */
  function renderNavSide(){
    const entries = [['all', { label: ALL_LABEL, icon: 'all' }], ...Object.entries(CATS)];
    navSide.innerHTML = `<div class="side-title">分类导航</div>` + entries.map(([k,v])=>{
      const count = k === 'all' ? CLIENTS.length : CLIENTS.filter(c=>c.cat === k).length;
      return `<button class="side-item ${k===navCat?'on':''}" data-cat="${esc(k)}">
        ${catIcon(v.icon || k)}
        <span>${esc(v.label)}</span>
        <em>${count}</em>
      </button>`;
    }).join('');

    navSide.querySelectorAll('.side-item').forEach(btn=>{
      btn.onclick = ()=>{
        navCat = btn.dataset.cat;
        renderNavSide();
        renderClientGrid();
      };
    });
  }

  /* ===== 客户端卡片（站内跳详情） ===== */
  function renderClientGrid(){
    const q = navQuery.trim().toLowerCase();
    const list = CLIENTS.filter(c=>{
      const catOk = navCat === 'all' || c.cat === navCat;
      const qOk = !q
        || c.name.toLowerCase().includes(q)
        || c.platform.toLowerCase().includes(q)
        || (c.license||'').toLowerCase().includes(q)
        || (c.short||'').toLowerCase().includes(q)
        || (c.tags||[]).some(t=>String(t).toLowerCase().includes(q));
      return catOk && qOk;
    });

    const catLabel = navCat === 'all' ? ALL_LABEL : (CATS[navCat] ? CATS[navCat].label : navCat);
    navCatTitle.textContent = catLabel;
    navCount.textContent = `共 ${list.length} 个客户端`;

    if(!list.length){
      siteGrid.innerHTML = `<div class="empty">没有找到匹配的客户端，换个关键词试试</div>`;
      return;
    }

    siteGrid.innerHTML = list.map(c=>{
      const dl = c.downloads || [];
      const hasNetdisk = dl.some(d=>d.type === 'netdisk' && d.url);
      const netdiskTag = hasNetdisk ? '<em class="hot-tag">网盘</em>' : '';
      return `
      <a class="site-card" href="${esc(clientDetailUrl(c.id))}">
        <div class="site-top">
          <span class="site-logo" style="--lc:var(--accent)">${esc((c.name||'?')[0])}</span>
          <div class="site-id">
            <span class="site-name">${esc(c.name)}${netdiskTag}</span>
            <span class="site-domain">${esc(c.platform)} · ${esc(c.version)}</span>
          </div>
          <svg class="site-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <p class="site-desc">${esc(c.short)}</p>
        <div class="site-tags">${(c.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      </a>`;
    }).join('');
  }

  if(searchInput){
    searchInput.addEventListener('input', e=>{
      navQuery = e.target.value;
      renderClientGrid();
    });
  }

  renderNavSide();
  renderClientGrid();
})();
