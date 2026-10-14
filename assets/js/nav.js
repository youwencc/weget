/* =========================================================
   AI 导航页逻辑（分类侧栏 / 站点卡片 / 站内搜索）
   数据来源：ai-nav.php 输出的 #page-data（cats + sites）
   ========================================================= */
(function(){
  const D = getPageData();
  const CATS  = D.cats  || {};   // { key: {label, icon} }
  const SITES = D.sites || [];
  const ALL_LABEL = D.allLabel || '全部网站';

  let navCat  = 'all';
  let navQuery = '';

  const navSide    = document.getElementById('navSide');
  const siteGrid   = document.getElementById('siteGrid');
  const navCount   = document.getElementById('navCount');
  const navCatTitle= document.getElementById('navCatTitle');
  const searchInput= document.getElementById('navSearchInput');

  /* ===== 左侧分类栏（首项固定为"全部网站"） ===== */
  function renderNavSide(){
    const entries = [['all', { label: ALL_LABEL, icon: 'all' }], ...Object.entries(CATS)];
    navSide.innerHTML = `<div class="side-title">分类导航</div>` + entries.map(([k,v])=>{
      const count = k === 'all' ? SITES.length : SITES.filter(s=>s.cat === k).length;
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
        renderNavSites();
      };
    });
  }

  /* ===== 站点卡片 ===== */
  function renderNavSites(){
    const q = navQuery.trim().toLowerCase();
    const list = SITES.filter(s=>{
      const catOk = navCat === 'all' || s.cat === navCat;
      const qOk = !q
        || s.name.toLowerCase().includes(q)
        || s.domain.toLowerCase().includes(q)
        || (s.desc||'').toLowerCase().includes(q)
        || (s.tags||[]).some(t=>String(t).toLowerCase().includes(q));
      return catOk && qOk;
    });

    const catLabel = navCat === 'all' ? ALL_LABEL : (CATS[navCat] ? CATS[navCat].label : navCat);
    navCatTitle.textContent = catLabel;
    navCount.textContent = `共 ${list.length} 个站点`;

    if(!list.length){
      siteGrid.innerHTML = `<div class="empty">没有找到匹配的网站，换个关键词试试</div>`;
      return;
    }

    siteGrid.innerHTML = list.map(s=>`
      <a class="site-card" href="https://${esc(s.domain)}" target="_blank" rel="noopener noreferrer">
        <div class="site-top">
          <span class="site-logo" style="--lc:${esc(s.color)}">${esc((s.name||'?')[0])}</span>
          <div class="site-id">
            <span class="site-name">${esc(s.name)}${Number(s.hot) ? '<em class="hot-tag">热门</em>' : ''}</span>
            <span class="site-domain">${esc(s.domain)}</span>
          </div>
          <svg class="site-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </div>
        <p class="site-desc">${esc(s.desc)}</p>
        <div class="site-tags">${(s.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      </a>
    `).join('');
  }

  if(searchInput){
    searchInput.addEventListener('input', e=>{
      navQuery = e.target.value;
      renderNavSites();
    });
  }

  renderNavSide();
  renderNavSites();
})();
