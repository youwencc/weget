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
})();
