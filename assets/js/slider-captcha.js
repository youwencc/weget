/* 陈工工作室 · 联系页滑块验证（无依赖）
   ------------------------------------------------------------
   坐标语义（务必与服务端 cg_captcha_verify 保持一致，别再混用）：
     x0  = 拼图块起点left（服务端固定 0）
     x1  = 目标缺口的 left（拼图块 left 拖到 ≈x1 即对准）
     cur = 拼图块当前的 left（绝对位置，px）
     drag= 提交给服务端的「拖动距离」= cur - x0
   服务端校验的是 |drag - (x1 - x0)| <= tol，等价于 |cur - x1| <= tol。
   挑战无状态签名 token，10 分钟有效；拖过 ≠ 提交通过，服务端仍会二次验签。
   ------------------------------------------------------------ */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var cap = document.getElementById("sliderCap");
    if (!cap) return;

    var form  = cap.closest("form");
    var track = cap.querySelector(".sc-track");
    var piece = cap.querySelector(".sc-piece");
    var gap   = cap.querySelector(".sc-gap");
    var fill  = cap.querySelector(".sc-fill");
    var tip   = cap.querySelector(".sc-tip");
    var refreshBtn = cap.querySelector(".sc-refresh");
    var tokenInput = document.getElementById("sliderToken");
    var dragInput  = document.getElementById("sliderDrag");
    if (!form || !track || !piece || !gap || !fill || !tip) return;

    /* 兜底：pointer 事件不可用时（老浏览器）退回 mouse/touch */
    var supportsPointer = typeof window.PointerEvent === "function";

    var S = {
      token: "", x0: 0, x1: 160, w: 320, pw: 52, tol: 6,
      cur: 0, startX: 0, baseX: 0, dragging: false, solved: false,
      loading: false, animating: false
    };

    function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
    function clampX(x) {
      return Math.max(0, Math.min(S.w - S.pw, x));
    }

    function setTip(text, cls) {
      tip.textContent = text;
      tip.classList.remove("ok", "err");
      if (cls) tip.classList.add(cls);
    }

    /* 移动拼图块。默认带动画（吸附/回弹用）；
       拖拽过程中 .is-drag 已关闭 transition，键盘/重置用 is-jump 关闭。 */
    function setPiece(x) {
      x = clampX(x);
      S.cur = x;
      piece.style.left = x + "px";
      fill.style.width = x + "px";
    }

    /* 不带动画地归位（初始化、敲击方向键逐格微调） */
    function jumpPiece(x) {
      piece.classList.add("is-jump");
      setPiece(x);
      void piece.offsetWidth;                 // 强制回流，让本次位移立即生效
      piece.classList.remove("is-jump");
    }

    function clearResult() {
      S.solved = false;
      cap.classList.remove("is-ok", "is-err");
      if (tokenInput) tokenInput.value = "";
      if (dragInput) dragInput.value = "";
    }

    function applyChallenge(d) {
      S.token = (d && d.token) || "";
      S.x0 = num(d && d.x0, 0);
      S.x1 = num(d && d.x1, 160);
      S.w  = num(d && d.w, 320);          // 唯一坐标基准：以服务端签发的宽度为准
      S.pw = num(d && d.pw, 52);
      S.tol = num(d && d.tol, 6);
      clearResult();
      S.animating = false;
      // 关键：让轨道的 clientWidth 精确等于挑战宽度。
      // 两边坐标基准必须完全一致，否则「看起来对准了」而服务端按另一套坐标判定会失败。
      // border-box 下 clientWidth = width - 左右边框，故要补回边框宽度。
      var cs = window.getComputedStyle ? window.getComputedStyle(track) : null;
      var bw = cs
        ? (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0)
        : 0;
      track.style.width = (S.w + bw) + "px";
      piece.style.width = S.pw + "px";
      gap.style.width = S.pw + "px";
      gap.style.left = S.x1 + "px";
      jumpPiece(S.x0);
      setTip("按住左侧滑块，拖到右侧拼图缺口位置放开");
    }

    function loadChallenge() {
      if (S.loading) return;
      S.loading = true;
      setTip("验证加载中…");
      var api = cap.getAttribute("data-api") || "captcha.php";
      var w = Math.round(track.clientWidth) || 320;
      if (w > 420) { w = 420; }
      if (w < 220) { w = 220; }         // 轨道 CSS 有 min-width:220px，正常不会走到这里
      fetch(api + "?act=new&w=" + w, { credentials: "omit", cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) { applyChallenge(d); }
          else { setTip("验证图获取失败，请点右侧按钮重试", "err"); }
        })
        .catch(function () { setTip("验证图获取失败，请检查网络后重试", "err"); })
        .then(function () { S.loading = false; });
    }

    /* 松手判定：先做一次「磁吸」——接近就吸附到位，手感更好也更易对准 */
    function settle() {
      var off = Math.abs(S.cur - S.x1);
      S.animating = true;
      if (off <= S.tol * 3) {
        setPiece(S.x1);                        // 接近就吸附到目标位，手感更顺
      }
      setTimeout(function () {
        S.animating = false;
        check();
      }, off <= S.tol * 3 ? 300 : 60);
    }

    function check() {
      if (Math.abs(S.cur - S.x1) <= S.tol) {          // ← 绝对位置 vs 绝对目标位，语义一致
        S.solved = true;
        cap.classList.remove("is-err");
        cap.classList.add("is-ok");
        setTip("验证通过，可以提交了", "ok");
        if (tokenInput) tokenInput.value = S.token;
        if (dragInput) dragInput.value = String(Math.round(S.cur - S.x0));  // ← 提交「距离」
      } else {
        clearResult();
        cap.classList.add("is-err");
        setTip("没对准，再试一次", "err");
        setTimeout(function () {
          cap.classList.remove("is-err");
          if (!S.dragging) { setPiece(S.x0); }
          if (S.solved === false) { setTip("按住左侧滑块，拖到右侧拼图缺口位置放开"); }
        }, 520);
      }
    }

    /* ---------- 拖拽：鼠标 / 触摸 / 手写笔 ---------- */
    function clientX(ev) {
      if (typeof ev.clientX === "number") return ev.clientX;
      var t = ev.touches && ev.touches[0];
      if (t) return t.clientX;
      var c = ev.changedTouches && ev.changedTouches[0];
      return c ? c.clientX : 0;
    }

    function onDown(ev) {
      if (S.solved || S.animating || S.loading) return;
      S.dragging = true;
      S.startX = clientX(ev);
      S.baseX = S.cur;
      piece.classList.add("is-drag");
      cap.classList.remove("is-ok", "is-err");
      if (tokenInput) tokenInput.value = "";
      if (dragInput) dragInput.value = "";
      if (ev.pointerId !== undefined && piece.setPointerCapture) {
        try { piece.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      if (ev.cancelable) { ev.preventDefault(); }
    }

    function onMove(ev) {
      if (!S.dragging) return;
      setPiece(S.baseX + (clientX(ev) - S.startX));
      if (ev.cancelable) { ev.preventDefault(); }
    }

    function onUp() {
      if (!S.dragging) return;
      S.dragging = false;
      piece.classList.remove("is-drag");
      settle();
    }

    // 除了绑在拼图块上，window 也兜底监听：指针捕获失败或快速划出块外也不会掉帧丢失事件
    if (supportsPointer) {
      piece.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      piece.addEventListener("lostpointercapture", onUp);
    } else {
      piece.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      piece.addEventListener("touchstart", onDown, { passive: false });
      piece.addEventListener("touchmove", onMove, { passive: false });
      piece.addEventListener("touchend", onUp);
      piece.addEventListener("touchcancel", onUp);
    }
    window.addEventListener("blur", onUp);

    /* ---------- 键盘操作（无障碍）：方向键微调，回车/空格确认 ---------- */
    piece.setAttribute("tabindex", "0");
    piece.setAttribute("role", "slider");
    piece.setAttribute("aria-label", "拖动滑块完成验证");
    piece.addEventListener("keydown", function (ev) {
      if (S.solved || S.animating) return;
      var step = 0;
      if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") step = -1;
      else if (ev.key === "ArrowRight" || ev.key === "ArrowUp") step = 1;
      else if (ev.key === "PageUp") step = 10;
      else if (ev.key === "PageDown") step = -10;
      else if (ev.key === "Home") { jumpPiece(S.x0); ev.preventDefault(); return; }
      else if (ev.key === "End") { jumpPiece(S.w - S.pw); ev.preventDefault(); return; }
      else if (ev.key === "Enter" || ev.key === " ") { settle(); ev.preventDefault(); return; }
      else return;
      jumpPiece(S.cur + step);
      ev.preventDefault();
    });

    /* ---------- 换一张 ---------- */
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        if (S.loading) return;
        loadChallenge();
      });
    }

    /* ---------- 提交闸门：未通过验证一律拦截 ---------- */
    form.addEventListener("submit", function (ev) {
      if (S.solved) return;
      ev.preventDefault();
      cap.classList.add("is-err");
      setTip("请先拖动上面的滑块完成验证", "err");
      if (track.scrollIntoView) {
        track.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      piece.focus();
    });

    /* ---------- 初始化：按实际渲染宽度取挑战 ---------- */
    if (track.clientWidth > 0) {
      loadChallenge();
    } else {
      // 字体/布局未就绪时稍等一拍，避免拿到 0 宽度
      setTimeout(loadChallenge, 120);
    }
  });
})();
