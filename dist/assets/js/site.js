/* ============================================================
 * site.js — 电脑小百科 新前台公共脚本（首页与软件详情页共用）
 * 提示气泡 / 复制 / 移动端菜单 / 弹窗与灯箱 / 详情弹窗 /
 * 推荐表单 / 图片容错 / 导航高亮 / hash 直达。
 * 首页筛选逻辑在 site-home.js。所有模块都对缺失元素做了守卫。
 * ============================================================ */
(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brand = document.body.dataset.brand || '本站';

  const software = $$('.software');
  const softwareDialog = $('#software-dialog');
  const screenshotDialog = $('#screenshot-dialog');
  const recommendDialog = $('#recommend-dialog');
  const supportsDialog = screenshotDialog ? typeof screenshotDialog.showModal === 'function' : typeof HTMLDialogElement === 'function';
  let activeSoftware = '';
  let gallery = [];
  let galleryIndex = 0;
  let toastTimer;

  /* ---------- 提示气泡 ---------- */
  function notify(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
    const openDialog = $$('dialog[open]').pop();
    if (openDialog) {
      let status = $('.dialog-status', openDialog);
      if (!status) {
        status = document.createElement('p');
        status.className = 'dialog-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        $('.dialog-body', openDialog)?.append(status);
      }
      status.textContent = message;
    }
  }

  async function copyText(text, tip) {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard fallback');
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('aria-label', '待复制的内容');
      area.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
      const activeElement = document.activeElement;
      const parent = $$('dialog[open]').pop() || document.body;
      parent.append(area);
      area.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      area.remove();
      activeElement?.focus({ preventScroll: true });
      if (!copied) {
        notify('浏览器限制了复制，请手动选择并复制内容。');
        return false;
      }
    }
    notify(tip || '已复制，可以分享给朋友了。');
    return true;
  }

  /* ---------- 移动端菜单 ---------- */
  const menuToggle = $('.menu-toggle');
  const mainNav = $('#main-nav');
  function closeMenu() {
    if (!mainNav || !menuToggle) return;
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '打开导航菜单');
  }
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
      mainNav.classList.toggle('is-open', expanded);
      menuToggle.setAttribute('aria-expanded', String(expanded));
      menuToggle.setAttribute('aria-label', expanded ? '关闭导航菜单' : '打开导航菜单');
    });
    $$('a', mainNav).forEach(link => link.addEventListener('click', closeMenu));
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });

  /* ---------- 弹窗基础 ---------- */
  function syncScrollLock() {
    document.body.classList.toggle('dialog-open', Boolean($('dialog[open]')));
  }
  let fallbackOpener;
  function showDialog(dialog) {
    if (!dialog || dialog.hasAttribute('open')) return;
    if (supportsDialog) dialog.showModal();
    else {
      fallbackOpener = document.activeElement;
      dialog.setAttribute('open', '');
      dialog.style.cssText = 'position:fixed;inset:8vh 0 auto;z-index:60';
      $('[data-close]', dialog).focus();
    }
    syncScrollLock();
  }
  function closeDialog(dialog) {
    if (supportsDialog) dialog.close();
    else {
      dialog.removeAttribute('open');
      syncScrollLock();
      fallbackOpener?.focus({ preventScroll: true });
    }
  }
  $$('dialog').forEach(dialog => {
    $('[data-close]', dialog)?.addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('close', syncScrollLock);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
    });
  });

  /* ---------- 软件详情弹窗（克隆卡片内嵌内容；原 details 保持可爬取、无 JS 可用） ---------- */
  function openSoftware(id) {
    const article = software.find(item => item.id === id);
    if (!article) return;
    activeSoftware = id;
    if (!supportsDialog) {
      const details = $('.software-details', article);
      if (!details) return;
      details.open = true;
      details.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    const content = $('.details-content', article)?.cloneNode(true);
    if (!content) return;
    const title = $('[data-detail-title]', content);
    if (title) title.id = 'detail-dialog-title';
    $$('img', content).forEach(img => { img.loading = 'eager'; });
    $('#software-dialog-body').replaceChildren(content);
    showDialog(softwareDialog);
    softwareDialog.scrollTop = 0;
  }
  $$('[data-open]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    openSoftware(link.dataset.open);
  }));
  $$('[data-detail-summary]').forEach(summary => summary.addEventListener('click', event => {
    if (!supportsDialog) return;
    event.preventDefault();
    openSoftware(summary.dataset.detailSummary);
  }));
  $('#share-software')?.addEventListener('click', () => {
    const url = new URL(location.href);
    url.hash = activeSoftware;
    copyText(url.href);
  });

  /* ---------- 截图灯箱 ---------- */
  function updateGallery() {
    const shot = gallery[galleryIndex];
    if (!shot) return;
    $('#lightbox-image').hidden = false;
    $('#lightbox-image').src = shot.src;
    $('#lightbox-image').alt = shot.alt;
    $('#screenshot-title').textContent = shot.alt;
    $('#shot-caption').textContent = `${galleryIndex + 1} / ${gallery.length} · 按 Esc 关闭${gallery.length > 1 ? '，左右键切换' : ''}`;
    $('#previous-shot').hidden = gallery.length < 2;
    $('#next-shot').hidden = gallery.length < 2;
  }
  function moveGallery(direction) {
    if (gallery.length < 2) return;
    galleryIndex = (galleryIndex + direction + gallery.length) % gallery.length;
    updateGallery();
  }
  $('#previous-shot')?.addEventListener('click', () => moveGallery(-1));
  $('#next-shot')?.addEventListener('click', () => moveGallery(1));

  /* ---------- 全局点击委托：复制 / 打开弹窗 / 放大截图 ---------- */
  document.addEventListener('click', event => {
    const copy = event.target.closest('[data-copy]');
    if (copy) copyText(copy.dataset.copy, copy.dataset.copyTip || undefined);
    const opener = event.target.closest('[data-dialog-open]');
    if (opener) {
      const target = $(opener.dataset.dialogOpen);
      if (target) showDialog(target);
    }
    const zoom = event.target.closest('[data-zoom]');
    if (zoom) {
      const scope = zoom.closest('.details-content') || document;
      const images = $$('.detail-screenshot img', scope);
      gallery = images.map(img => ({ src: img.src, alt: img.alt }));
      galleryIndex = Math.max(0, images.indexOf($('img', zoom)));
      if (!supportsDialog) {
        if (gallery[galleryIndex]) window.open(gallery[galleryIndex].src, '_blank', 'noopener,noreferrer');
        return;
      }
      updateGallery();
      showDialog(screenshotDialog);
    }
  });

  /* ---------- Tabs 切换（模型 / 客户端详情页共用） ---------- */
  $$('.tabs').forEach(tabs => {
    const panels = $$('.panel', tabs.parentElement);
    if (!panels.length) return;
    $$('.tab', tabs).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', tabs).forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => { p.hidden = p.id !== `panel-${tab.dataset.p}`; });
    }));
  });

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', event => {
    const editable = event.target.closest('input, textarea, select, [contenteditable="true"]');
    if (screenshotDialog?.open && !editable) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveGallery(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveGallery(1); }
    }
    if (event.key === 'Escape') {
      closeMenu();
      const openDialog = $$('dialog[open]').pop();
      if (!supportsDialog && openDialog) closeDialog(openDialog);
    }
  });

  /* ---------- 推荐表单（纯本地生成，不发送） ---------- */
  const recommendForm = $('#recommend-form');
  const recommendResult = $('#recommend-result');
  $$('[data-recommend]').forEach(button => button.addEventListener('click', () => {
    closeMenu();
    if (recommendDialog) showDialog(recommendDialog);
  }));
  if (recommendForm && recommendResult) {
    const urlInput = $('#recommend-url');
    urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));
    $('#recommend-name').addEventListener('input', event => event.target.setCustomValidity(''));
    recommendForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#recommend-name').value.trim();
      if (!name) {
        $('#recommend-name').setCustomValidity('请填写软件名称。');
        $('#recommend-name').reportValidity();
        return;
      }
      let url;
      try {
        url = new URL(urlInput.value.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        urlInput.setCustomValidity('请填写以 https:// 或 http:// 开头的官方网站地址。');
        urlInput.reportValidity();
        return;
      }
      const reason = $('#recommend-reason').value.trim() || '暂未填写';
      $('#recommend-output').value = `给${brand}的一份软件推荐\n\n软件名称：${name}\n官方网站：${url.href}\n推荐理由：${reason}\n\n此内容在浏览器本地生成，尚未发送。`;
      recommendForm.hidden = true;
      recommendResult.hidden = false;
      $('#recommend-status').textContent = '已生成。可复制分享，或保存为本地文本文件。';
      $('#recommend-output').focus();
    });
    $('#edit-recommendation').addEventListener('click', () => {
      recommendForm.hidden = false;
      recommendResult.hidden = true;
      $('#recommend-status').textContent = '';
      $('#recommend-name').focus();
    });
    $('#copy-recommendation').addEventListener('click', () => copyText($('#recommend-output').value));
    $('#save-recommendation').addEventListener('click', () => {
      const blob = new Blob(['﻿', $('#recommend-output').value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'software-recommendation.txt';
      recommendDialog.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      notify('推荐内容已保存为文本文件。');
    });
  }

  /* ---------- 图片容错：失败时不得遮挡软件名、介绍与官方下载链接 ---------- */
  function handleImageFailure(image) {
    if (!(image instanceof HTMLImageElement)) return;
    const preview = image.closest('.software-preview');
    if (preview && !$('.image-unavailable', preview)) {
      image.hidden = true;
      const fallback = document.createElement('span');
      fallback.className = 'image-unavailable';
      fallback.style.cssText = 'text-align:center;color:#7e8a6c;font-size:12px;padding:20px';
      fallback.textContent = '截图暂时无法加载，点击查看软件介绍';
      preview.prepend(fallback);
    }
    const zoom = image.closest('.zoom-trigger');
    if (zoom && !$('.image-unavailable', zoom)) {
      image.hidden = true;
      const fallback = document.createElement('span');
      fallback.className = 'image-unavailable';
      fallback.style.cssText = 'color:#6b7362;font-size:12px;padding:30px 10px';
      fallback.textContent = '截图暂时无法加载，可通过下方来源链接查看。';
      zoom.append(fallback);
      zoom.disabled = true;
    }
    if (image.id === 'lightbox-image') {
      image.hidden = true;
      $('#shot-caption').textContent = '截图暂时无法加载，请通过软件官网查看。';
    }
  }
  document.addEventListener('error', event => handleImageFailure(event.target), true);
  $$('img[src]').forEach(image => {
    if (image.complete && image.naturalWidth === 0) handleImageFailure(image);
  });

  /* ---------- 导航高亮 + 卡片入场动画 ---------- */
  if ('IntersectionObserver' in window && mainNav) {
    const sections = [$('.hero'), ...['software', 'about', 'faq'].map(id => document.getElementById(id))].filter(Boolean);
    const navigationObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const sectionId = entry.target.classList.contains('hero') ? 'software' : entry.target.id;
        $$('a', mainNav).forEach(link => {
          if (link.hash === `#${sectionId}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-12% 0px -65% 0px', threshold: 0 });
    sections.forEach(section => navigationObserver.observe(section));
    if (!reducedMotion && software.length) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: .08 });
      software.forEach((article, index) => {
        article.classList.add('reveal-ready');
        article.style.transitionDelay = `${(index % 3) * 60}ms`;
        revealObserver.observe(article);
      });
    }
  }

  /* ---------- hash 直达（/software/xxx.html#slug 或 #privacy） ---------- */
  function openFromHash() {
    const hash = location.hash.slice(1);
    const article = software.find(item => item.id === hash || `${item.id}-details` === hash);
    if (article) openSoftware(article.id);
    if (hash === 'privacy') {
      const privacy = $('#privacy');
      if (privacy) privacy.open = true;
    }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  /* ---------- 版权年 ---------- */
  const yearEl = $('#copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
