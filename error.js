/* ═══════════════════════════════════════════════════════════════
   Error pages — theme toggle (matches main site behaviour)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;
  var btn  = document.getElementById('theme-btn');

  /* Load saved or system preference */
  var saved  = localStorage.getItem('theme');
  var system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var theme  = saved || system;
  root.setAttribute('data-theme', theme);

  if (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
})();
