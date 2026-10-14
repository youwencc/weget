/* =========================================================
   模型详情页逻辑
   数据来源：model.php 输出的 #page-data（cats + model）
   ========================================================= */
(function(){
  const D    = getPageData();
  const CATS = D.cats  || {};
  const m    = D.model;
  const view = document.getElementById('detailView');
  if(!m || !view) return;

  const c = CATS[m.cat] || { label: m.cat, color: 'var(--text-3)' };

  const specRows = (m.specs||[]).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const devRows  = (m.devices||[]).map(d=>`
    <tr>
      <td>${esc(d[0])}</td>
      <td class="mono">${esc(d[1])}</td>
      <td>${esc(d[2])}</td>
      <td><span class="pill pill-blue">${esc(d[3])}</span></td>
      <td>${esc(d[4])}</td>
      <td>${starsHtml(d[5])}</td>
    </tr>`).join('');
  /* 可下载文件为纯展示清单，下载动作统一走「下载模型」按钮 → 渠道选择弹窗 */
  const fileRows = (m.files||[]).map(f=>`
    <div class="file-row">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>
      </svg>
      <span class="file-name">${esc(f.name)}</span>
      <span class="file-size">${esc(f.size)}</span>
    </div>`).join('');
  const benchRows = (m.bench||[]).map(([label, val])=>`
    <div class="bench">
      <span class="bench-label">${esc(label)}</span>
      <span class="bar"><i style="width:${Math.min(Number(val)||0,100)}%"></i></span>
      <span class="bench-val">${esc(val)}</span>
    </div>`).join('');

  /* ===== 下载地址（官方 / 网盘）；无链接的行显示"暂无"状态 ===== */
  const dlRows = (m.downloads||[]).map(d=>{
    if(d.type === 'netdisk'){
      const open = d.url
        ? `<a class="dl-open" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer nofollow">打开网盘 →</a>`
        : `<span class="dl-none">暂无链接 · 可在后台补充</span>`;
      return `
      <div class="dl-row${d.url ? '' : ' empty'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19a4.5 4.5 0 1 0-.9-8.9 6 6 0 0 0-11.5 1.6A3.8 3.8 0 0 0 6 19.4h11.5z"/>
        </svg>
        <span class="dl-name">${esc(d.label)}</span>
        <span class="dl-badge netdisk">网盘</span>
        ${d.pwd ? `<span class="dl-pwd">提取码 <code>${esc(d.pwd)}</code><button class="dl-copy" type="button" data-copy="${esc(d.pwd)}">复制</button></span>` : ''}
        ${open}
      </div>`;
    }
    return `
      <a class="dl-row" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer nofollow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>
        </svg>
        <span class="dl-name">${esc(d.label)}</span>
        <span class="dl-badge official">官方</span>
        <span class="dl-open">前往下载 →</span>
      </a>`;
  }).join('');
  const dlAvail = (m.downloads||[]).filter(d=>d.url).length;

  view.innerHTML = `
    <button class="back" id="backBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      返回模型列表
    </button>

    <div class="detail-hero" style="--c:${esc(c.color)}">
      <div class="hero-icon">${catIcon(m.cat)}</div>
      <div class="hero-main">
        <h1>${esc(m.name)} <span class="hero-badge">${esc(c.label)}</span></h1>
        <div class="hero-sub"><b>${esc(m.author)}</b> · 更新于 ${esc(m.updated)} · 协议 ${esc(m.license)}</div>
        <div class="hero-tags">${(m.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>

    <div class="stat-strip">
      <div class="stat"><span>累计下载</span><b>${fmt(m.dl)}</b></div>
      <div class="stat"><span>模型参数量</span><b>${esc(m.params)}</b></div>
      <div class="stat"><span>文件大小</span><b>${esc(m.size)}</b></div>
      <div class="stat"><span>社区点赞</span><b>${fmt(m.likes)}</b></div>
    </div>

    <div class="tabs">
      <button class="tab active" data-p="overview">模型介绍</button>
      <button class="tab" data-p="specs">参数规格</button>
      <button class="tab" data-p="devices">适用机型</button>
      <button class="tab" data-p="files">文件下载</button>
    </div>

    <div class="panel" id="panel-overview">
      <h4>模型简介</h4>
      <p class="body-text">${esc(m.desc)}</p>
      <h4>核心亮点</h4>
      <ul class="highlight-list">${(m.highlights||[]).map(h=>`<li>${esc(h)}</li>`).join('')}</ul>
      <h4>性能指标</h4>
      <div class="bench-grid">${benchRows}</div>
    </div>

    <div class="panel" id="panel-specs" hidden>
      <h4>参数规格表</h4>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>参数项</th><th>规格说明</th></tr></thead>
          <tbody>${specRows}</tbody>
        </table>
      </div>
    </div>

    <div class="panel" id="panel-devices" hidden>
      <h4>适用机型与硬件需求</h4>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>设备</th><th>架构</th><th>显存要求</th><th>推荐精度</th><th>参考速度</th><th>推荐度</th></tr></thead>
          <tbody>${devRows}</tbody>
        </table>
      </div>
      <p class="body-text" style="margin-top:14px;font-size:12.5px;color:var(--text-3)">
        * 速度数据基于官方参考实现，实际表现受批次大小、驱动版本与量化方案影响。
      </p>
    </div>

    <div class="panel" id="panel-files" hidden>
      <div class="dl-cta">
        <div class="dl-cta-info">
          <b>下载 ${esc(m.name)}</b>
          <span>文件大小 ${esc(m.size)} · 已收录 ${dlAvail} 个可用下载渠道，点击按钮选择渠道后前往下载</span>
        </div>
        <button class="btn btn-primary" id="mainDownload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>
          </svg>
          下载模型
        </button>
      </div>
      <h4>可下载文件</h4>
      <div class="file-list">${fileRows}</div>
      <p class="body-text" style="margin-top:16px;font-size:12.5px;color:var(--text-3)">
        * 请遵循模型原始开源协议使用，下载即表示同意相关条款。
      </p>
    </div>

    <div class="modal-mask" id="dlModal" aria-hidden="true">
      <div class="modal-box" role="dialog" aria-modal="true" aria-label="选择下载渠道">
        <div class="modal-head">
          <div class="modal-title">
            <h3>选择下载渠道</h3>
            <span>${esc(m.name)} · ${esc(m.size)}</span>
          </div>
          <button class="modal-close" id="dlModalClose" type="button" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${dlRows ? `<div class="dl-list">${dlRows}</div>` : `<div class="empty">暂未收录该模型的下载地址，可在后台补充</div>`}
          <p class="modal-tip">* 网盘链接为社区转存，打开后请配合提取码使用；下载与使用请遵循模型原始开源协议。</p>
        </div>
      </div>
    </div>
  `;

  /* ===== Tabs 切换 ===== */
  view.querySelectorAll('.tab').forEach(tab=>{
    tab.onclick = ()=>{
      view.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      view.querySelectorAll('.panel').forEach(p=>p.hidden = true);
      tab.classList.add('active');
      view.querySelector('#panel-' + tab.dataset.p).hidden = false;
    };
  });

  /* ===== 按钮 ===== */
  document.getElementById('backBtn').onclick = ()=>{ location.href = homeUrl(); };

  /* 下载模型：弹出渠道选择弹窗，由用户选择渠道后再前往对应下载页，不直接跳转第三方 */
  const dlModal = document.getElementById('dlModal');
  const setModal = open=>{
    dlModal.classList.toggle('open', open);
    dlModal.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  document.getElementById('mainDownload').onclick = ()=>{
    setModal(true);
    toast(`请选择 ${m.name} 的下载渠道`);
  };
  document.getElementById('dlModalClose').onclick = ()=> setModal(false);
  dlModal.addEventListener('click', e=>{ if(e.target === dlModal) setModal(false); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') setModal(false); });
  /* 弹窗内点选渠道（新窗口打开下载页）后自动收起弹窗 */
  dlModal.querySelectorAll('a[target="_blank"]').forEach(a=>{
    a.addEventListener('click', ()=> setModal(false));
  });

  /* 提取码复制 */
  view.querySelectorAll('.dl-copy').forEach(btn=>{
    btn.onclick = ()=> copyText(btn.dataset.copy, '提取码已复制：' + btn.dataset.copy);
  });
})();
