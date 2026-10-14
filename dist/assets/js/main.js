/* =========================================================
   Weget模型库 公共 JS（全站共用工具函数 / 图标 / 链接构造）
   依赖：header.php 输出的 window.APP 链接配置
   ========================================================= */

/* 读取页面内嵌 JSON 数据（由 PHP 或静态构建时输出） */
function getPageData(id){
  id = id || 'page-data';
  const el = document.getElementById(id);
  return el ? JSON.parse(el.textContent) : {};
}

/* HTML 转义（后台录入的数据一律转义后再输出，防 XSS） */
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* 数字缩写：2870000 → 2.87M */
function fmt(n){
  if(n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if(n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return String(n);
}

/* ★★★☆☆ 推荐度渲染 */
function starsHtml(str){
  let out = '';
  for(const ch of String(str)){
    out += ch === '★' ? '<span>★</span>' : '<i>★</i>';
  }
  return `<span class="stars">${out}</span>`;
}

/* Toast 提示 */
function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* 复制文本到剪贴板（含降级方案） */
function copyText(text, tip){
  const done = ()=> toast(tip || ('已复制：' + text));
  const fallback = ()=>{
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (err) {
      toast('复制失败，请手动复制');
    }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fallback);
  } else {
    fallback();
  }
}

/* ===== 跨页面链接构造（APP.links 由 PHP 按 动态/静态 模式注入） ===== */
function homeUrl(){ return window.APP.links.home; }
function navUrl(){ return window.APP.links.nav; }
function clientUrl(){ return window.APP.links.client; }
function modelUrl(id){
  return window.APP.links.model.replace('%s', encodeURIComponent(id));
}
function clientDetailUrl(id){
  return window.APP.links.client_detail.replace('%s', encodeURIComponent(id));
}

/* ===== 分类图标库（模型分类 + 导航分类共用） ===== */
const ICONS = (function(){
  const s = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  return {
    image:  `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.6" cy="9" r="1.8"/><path d="M21 15.5l-4.8-4.8L5 21"/></svg>`,
    video:  `<svg ${s}><rect x="2" y="4.5" width="20" height="15" rx="3"/><path d="M10.2 9.2l5 2.8-5 2.8z" fill="currentColor" stroke="none"/></svg>`,
    audio:  `<svg ${s}><path d="M4 10v4M8 6.5v11M12 3.5v17M16 6.5v11M20 10v4"/></svg>`,
    multi:  `<svg ${s}><circle cx="9.2" cy="9.2" r="5.6"/><circle cx="15" cy="15" r="5.6"/></svg>`,
    llm:    `<svg ${s}><path d="M21 11.5a8 8 0 0 1-8 8H7.5L3 22.5V11.5a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M8.5 10.5h7M8.5 14h4"/></svg>`,
    chat:   `<svg ${s}><path d="M21 11.5a8 8 0 0 1-8 8H7.5L3 22.5V11.5a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/></svg>`,
    code:   `<svg ${s}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
    model:  `<svg ${s} stroke-width="2.4"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>`,
    office: `<svg ${s}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>`,
    all:    `<svg ${s}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>`
  };
})();

/* 按分类 key 取图标，未知分类回退到网格图标 */
function catIcon(key){
  return ICONS[key] || ICONS.all;
}
