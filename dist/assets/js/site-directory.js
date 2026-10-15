/* ============================================================
 * site-directory.js — AI 导航（ai-nav.php）/ AI 客户端（ai-clients.php）
 * 共用的侧栏分类切换与搜索过滤。
 * 页面为服务端渲染：本脚本只做筛选 / 计数 / 标题与空态更新，
 * 禁用 JS 时全部卡片照常展示。所有模块都对缺失元素做了守卫。
 * ============================================================ */
(() => {
  'use strict';

  const view = document.getElementById('directoryView');
  const side = document.getElementById('nav-side');
  const grid = document.getElementById('site-grid');
  const search = document.getElementById('directory-search');
  const title = document.getElementById('nav-cat-title');
  const count = document.getElementById('nav-count');
  if (!view || !grid) return;

  const unit = view.dataset.unit || '站点';       // "站点" / "客户端"
  const cards = [...grid.querySelectorAll('.site-card')];
  const items = [...(side ? side.querySelectorAll('.side-item') : [])];
  let activeCat = 'all';
  let query = '';

  function apply() {
    const q = query.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const catOk = activeCat === 'all' || card.dataset.cat === activeCat;
      const kw = (card.dataset.keywords || '').toLowerCase();
      const qOk = !q || kw.includes(q);
      const show = catOk && qOk;
      card.hidden = !show;
      if (show) visible += 1;
    });
    const current = items.find(item => (item.dataset.cat || 'all') === activeCat);
    if (title && current) title.textContent = current.querySelector('span')?.textContent || current.textContent.trim();
    if (count) count.textContent = `共 ${visible} 个${unit}`;
    grid.querySelectorAll(':scope > .empty').forEach(el => el.remove());
    if (visible === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.style.gridColumn = '1/-1';
      empty.textContent = `没有找到匹配的${unit === '客户端' ? '客户端' : '网站'}，换个关键词试试`;
      grid.append(empty);
    }
  }

  items.forEach(item => item.addEventListener('click', () => {
    activeCat = item.dataset.cat || 'all';
    items.forEach(i => i.classList.toggle('on', i === item));
    apply();
  }));

  if (search) {
    search.addEventListener('input', () => {
      query = search.value;
      apply();
    });
  }

  /* 初始计数（服务端不输出，避免禁 JS 时出现误导性数字） */
  if (count) count.textContent = `共 ${cards.length} 个${unit}`;
})();
