/* =========================================================
   后台管理辅助 JS（删除二次确认等）
   ========================================================= */
(function(){
  /* 所有带 data-confirm 属性的链接/按钮/表单点击时二次确认 */
  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-confirm]');
    if(!el) return;
    if(!window.confirm(el.dataset.confirm || '确定执行此操作？')){
      e.preventDefault();
      e.stopPropagation();
    }
  });

  /* 表单提交前确认（带 data-confirm 的 form） */
  document.addEventListener('submit', function(e){
    const f = e.target;
    if(f.matches('form[data-confirm]') && !window.confirm(f.dataset.confirm || '确定提交？')){
      e.preventDefault();
    }
  }, true);

  /* ---------- 动态行编辑（站点设置的菜单 / 页脚链接等两输入框列表） ----------
     结构：<div class="row-list"> 行… </div> + <template data-row-tpl> 空行模板
     ＋ <button data-add-row="模板选择器"> 添加行；行内 .row-del 删除该行。
     禁用 JS 时已有行照常提交，只是不能增删。 */
  document.addEventListener('click', function(e){
    const add = e.target.closest('[data-add-row]');
    if(add){
      const tpl = document.querySelector(add.dataset.addRow);
      const list = document.querySelector(add.dataset.addList || add.dataset.addRow + '-list');
      if(tpl && list){
        list.append(tpl.content.cloneNode(true));
        const rows = list.querySelectorAll('.row-pair');
        const row = rows[rows.length - 1];
        if(row){ const first = row.querySelector('input'); if(first) first.focus(); }
      }
      return;
    }
    const del = e.target.closest('[data-del-row]');
    if(del){
      const row = del.closest('.row-pair');
      if(row) row.remove();
    }
  });
})();
