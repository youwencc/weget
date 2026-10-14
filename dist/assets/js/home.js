/* =========================================================
   首页逻辑（排行榜 / 分类筛选 / 模型卡片 / 顶部搜索过滤）
   数据来源：index.php 输出的 #page-data（cats + models）
   ========================================================= */
(function(){
  const D     = getPageData();
  const CATS  = D.cats   || {};
  const MODELS= D.models || [];

  let activeCat = 'all';
  let query     = '';

  const rankGrid  = document.getElementById('rankGrid');
  const modelGrid = document.getElementById('modelGrid');
  const chipsEl   = document.getElementById('chips');
  const countHint = document.getElementById('countHint');
  const searchEl  = document.getElementById('siteSearch');

  /* ===== 热门排行榜（按下载量取前 10） ===== */
  function renderRank(){
    const top  = [...MODELS].sort((a,b)=>b.dl-a.dl).slice(0,10);
    const half = Math.ceil(top.length/2);
    const cols = [top.slice(0,half), top.slice(half)];

    rankGrid.innerHTML = cols.map((col, ci)=>{
      const offset = ci * half;
      return `<div class="rank-col">` + col.map((m,i)=>{
        const idx = offset + i;
        const c = CATS[m.cat] || { label: m.cat, color: 'var(--text-3)' };
        const topCls = idx===0?'top1':idx===1?'top2':idx===2?'top3':'';
        const trendCls = m.trend >= 0 ? 'up' : 'down';
        const sign = m.trend >= 0 ? '+' : '−';
        return `
          <a class="rank-item" href="${esc(modelUrl(m.id))}">
            <span class="rank-no ${topCls}">${idx+1}</span>
            <span class="rank-icon" style="color:${esc(c.color)}">${catIcon(m.cat)}</span>
            <span class="rank-info">
              <span class="rank-name">${esc(m.name)}</span>
              <span class="rank-meta">${esc(m.author)} · ${esc(c.label)}</span>
            </span>
            <span class="rank-num">
              <span class="rank-dl">${fmt(m.dl)}</span>
              <span class="rank-trend ${trendCls}">${sign}${Math.abs(Number(m.trend)||0).toFixed(1)}%</span>
            </span>
          </a>`;
      }).join('') + `</div>`;
    }).join('');
  }

  /* ===== 分类筛选条 ===== */
  function renderChips(){
    const items = [['all','全部模型'], ...Object.entries(CATS).map(([k,v])=>[k,v.label])];
    chipsEl.innerHTML = items.map(([k,label])=>
      `<button class="chip ${k===activeCat?'on':''}" data-cat="${esc(k)}">${esc(label)}</button>`
    ).join('');
    chipsEl.querySelectorAll('.chip').forEach(btn=>{
      btn.onclick = ()=>{
        activeCat = btn.dataset.cat;
        renderChips();
        renderGrid();
      };
    });
  }

  /* ===== 模型卡片列表 ===== */
  function renderGrid(){
    const q = query.trim().toLowerCase();
    const list = MODELS.filter(m=>{
      const catOk = activeCat === 'all' || m.cat === activeCat;
      const qOk = !q
        || m.name.toLowerCase().includes(q)
        || (m.author||'').toLowerCase().includes(q)
        || (m.short||'').toLowerCase().includes(q)
        || (m.tags||[]).some(t=>String(t).toLowerCase().includes(q));
      return catOk && qOk;
    });

    countHint.textContent = `共 ${list.length} 个模型`;

    if(!list.length){
      modelGrid.innerHTML = `<div class="empty" style="grid-column:1/-1">没有找到匹配的模型，换个关键词试试</div>`;
      return;
    }

    modelGrid.innerHTML = list.map(m=>{
      const c = CATS[m.cat] || { label: m.cat, color: 'var(--text-3)' };
      return `
        <a class="card" href="${esc(modelUrl(m.id))}">
          <div class="card-top">
            <span class="card-icon" style="--c:${esc(c.color)}">${catIcon(m.cat)}</span>
            <span class="card-cat">${esc(c.label)}</span>
            <span class="card-dl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>
              </svg>
              ${fmt(m.dl)}
            </span>
          </div>
          <h3>${esc(m.name)}</h3>
          <div class="card-author">${esc(m.author)}</div>
          <p class="card-desc">${esc(m.short)}</p>
          <div class="card-tags">${(m.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="card-foot">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              ${esc(m.size)}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/>
              </svg>
              ${fmt(m.likes)}
            </span>
            <span class="go">查看详情 →</span>
          </div>
        </a>`;
    }).join('');
  }

  /* ===== 顶部搜索框（本页过滤模型） ===== */
  if(searchEl){
    searchEl.addEventListener('input', e=>{
      query = e.target.value;
      renderGrid();
    });
  }

  renderRank();
  renderChips();
  renderGrid();
})();
