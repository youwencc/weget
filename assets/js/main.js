/* 陈工工作室 · 全站脚本（无依赖）
   功能：案例列表筛选（含 URL 参数 ?cat=slug，支持静态页面） */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var filters = document.querySelector("[data-filters]");
    var grid = document.querySelector("[data-works-grid]");
    if (!filters || !grid) return;

    var chips = Array.prototype.slice.call(filters.querySelectorAll("[data-cat]"));
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-cat-card]"));
    var count = filters.querySelector("[data-count]");
    var total = cards.length;

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    function apply(cat, updateUrl) {
      var shown = 0;
      cards.forEach(function (card) {
        var ok = cat === "all" || card.getAttribute("data-cat-card") === cat;
        card.hidden = !ok;
        if (ok) shown++;
      });
      chips.forEach(function (chip) {
        chip.classList.toggle("is-active", chip.getAttribute("data-cat") === cat);
        chip.setAttribute("aria-pressed", chip.getAttribute("data-cat") === cat ? "true" : "false");
      });
      if (count) {
        count.textContent = cat === "all"
          ? "共 " + pad(total) + " 个案例"
          : pad(shown) + " 个案例";
      }
      if (updateUrl) {
        var url = new URL(window.location.href);
        if (cat === "all") url.searchParams.delete("cat");
        else url.searchParams.set("cat", cat);
        window.history.replaceState({}, "", url.toString());
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        e.preventDefault();
        apply(chip.getAttribute("data-cat"), true);
      });
    });

    // 初始：读 URL ?cat=（静态/动态页通用，无 cat 时显示全部）
    var initial = "all";
    try {
      var q = new URL(window.location.href).searchParams.get("cat");
      if (q) initial = q;
    } catch (err) { /* ignore */ }
    apply(initial, false);
  });
})();
