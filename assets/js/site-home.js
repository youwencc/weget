/* ============================================================
 * site-home.js — 新前台首页专属脚本：软件筛选
 * 分类按钮 / 关键词搜索 / 平台下拉 / 重置 / 「/」聚焦搜索。
 * 仅在存在 #software-grid 的页面生效（详情页自动跳过）。
 * ============================================================ */
(() => {
  'use strict';

  const grid = document.getElementById('software-grid');
  if (!grid) return;
  const software = [...grid.querySelectorAll('.software')];
  const categories = [...document.querySelectorAll('.category')];
  const search = document.getElementById('software-search');
  const platform = document.getElementById('platform-filter');
  const countEl = document.getElementById('collection-count');
  const statusEl = document.getElementById('search-status');
  const emptyState = document.getElementById('empty-state');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!software.length || !search || !platform) return;

  let activeCategory = 'all';

  const setCount = (n, label) => {
    if (!countEl) return;
    countEl.textContent = String(n).padStart(2, '0');
    countEl.setAttribute('aria-label', label);
  };
  setCount(software.length, `共 ${software.length} 款软件`);
  const allSup = document.querySelector('.category[data-category="all"] sup');
  if (allSup) allSup.textContent = String(software.length).padStart(2, '0');

  function filterSoftware() {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    software.forEach(article => {
      const haystack = `${article.dataset.keywords} ${article.dataset.platforms} ${$('.software-description', article).textContent} ${$('.detail-category', article).textContent} ${$('h3', article).textContent}`.toLocaleLowerCase();
      const matches = (activeCategory === 'all' || article.dataset.category === activeCategory)
        && (platform.value === 'all' || article.dataset.platforms.split(' ').includes(platform.value))
        && terms.every(term => haystack.includes(term));
      article.hidden = !matches;
      article.classList.remove('filter-enter');
      if (matches) {
        count++;
        article.classList.add('is-visible');
        if (!reducedMotion) {
          void article.offsetWidth;
          article.classList.add('filter-enter');
        }
      }
    });
    if (emptyState) emptyState.hidden = count !== 0;
    if (statusEl) statusEl.textContent = `找到 ${count} 款软件，共收录 ${software.length} 款。`;
    setCount(count, `当前显示 ${count} 款软件`);
  }

  categories.forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    categories.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterSoftware();
  }));
  search.addEventListener('input', filterSoftware);
  platform.addEventListener('change', filterSoftware);
  document.getElementById('reset-filters')?.addEventListener('click', () => {
    search.value = '';
    platform.value = 'all';
    activeCategory = 'all';
    categories.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.category === 'all')));
    filterSoftware();
    search.focus({ preventScroll: true });
  });

  /* 「/」快速聚焦搜索框 */
  document.addEventListener('keydown', event => {
    if (event.key !== '/') return;
    const editable = event.target.closest('input, textarea, select, [contenteditable="true"]');
    if (editable || document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    search.focus();
  });
})();
