/* ============================================================
 * site-models.js — 模型库首页（models.php）筛选与搜索
 * 页面为服务端渲染：本脚本只做分类筛选 / 关键词过滤 / 计数与空态，
 * 禁用 JS 时全部模型卡片照常展示。所有模块都对缺失元素做了守卫。
 * ============================================================ */
(() => {
  'use strict';

  const chips = [...document.querySelectorAll('#model-chips .chip')];
  const grid = document.getElementById('model-grid');
  const search = document.getElementById('model-search');
  const countHint = document.getElementById('count-hint');
  const empty = document.getElementById('model-empty');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('.card')];
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
    if (countHint) countHint.textContent = `共 ${visible} 个模型`;
    if (empty) empty.hidden = visible > 0;
  }

  chips.forEach(chip => chip.addEventListener('click', () => {
    activeCat = chip.dataset.cat || 'all';
    chips.forEach(c => c.classList.toggle('on', c === chip));
    apply();
  }));

  if (search) {
    search.addEventListener('input', () => {
      query = search.value;
      apply();
    });
  }
})();
