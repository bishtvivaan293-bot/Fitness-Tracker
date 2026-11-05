/* FitTrack shared layout: builds the sidebar and top bar on every page.
   To add a page later, set ready:true below. Pages not ready show a "Soon" badge. */
(function () {
  var PAGES = [
    { id: 'home',      file: 'index.html',      label: 'Home',                 ready: true,  icon: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
    { id: 'dashboard', file: 'dashboard.html',  label: 'Dashboard',            ready: true , icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z' },
    { id: 'calculator',file: 'calculator.html', label: 'BMI and calories',     ready: true, icon: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h2M14 12h2M8 16h2M14 16h2' },
    { id: 'workouts',  file: 'workouts.html',   label: 'Workouts',             ready: false, icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { id: 'recommend', file: 'recommend.html',  label: 'Recommendations',      ready: false, icon: 'M12 2l3 7 7 .8-5.3 4.7 1.6 7.5L12 18l-6.3 4 1.6-7.5L2 9.8 9 9z' },
    { id: 'schedule',  file: 'schedule.html',   label: 'Weekly schedule',      ready: false, icon: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4' },
    { id: 'analytics', file: 'analytics.html',  label: 'Analytics',            ready: false, icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
    { id: 'about',     file: 'about.html',      label: 'About project',        ready: false, icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01' }
  ];

  function icon(d) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  function toast(msg, type) {
    var box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function build() {
    var body = document.body;
    var current = body.dataset.page || 'home';
    var nav = PAGES.map(function (p) {
      return '<a class="nav-link' + (p.id === current ? ' active' : '') + '" href="' + p.file + '"' +
        (p.id === current ? ' aria-current="page"' : '') + '>' + icon(p.icon) + '<span>' + p.label + '</span>' +
        (p.ready ? '' : '<span class="soon">Soon</span>') + '</a>';
    }).join('');

    var shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML =
      '<aside class="sidebar" id="sidebar" aria-label="Main navigation">' +
        '<a class="brand" href="index.html"><span class="logo">F</span>FitTrack</a>' +
        '<nav class="nav">' + nav + '</nav>' +
        '<p class="side-note">Your data stays in this browser. Nothing is sent anywhere.</p>' +
      '</aside><div class="scrim" id="scrim"></div>' +
      '<div class="content"><header class="topbar">' +
        '<button class="menu-btn" id="menuBtn" aria-label="Open menu">' + icon('M4 6h16M4 12h16M4 18h16') + '</button>' +
        '<div><div class="page-title">' + (body.dataset.title || 'FitTrack') + '</div>' +
        '<div class="page-sub">' + (body.dataset.sub || '') + '</div></div>' +
        '<div class="avatar" title="Local profile">FT</div></header></div>';

    var content = shell.querySelector('.content');
    document.querySelectorAll('body > main, body > footer').forEach(function (el) { content.appendChild(el); });
    body.insertBefore(shell, body.firstChild);

    var sidebar = shell.querySelector('#sidebar'), scrim = shell.querySelector('#scrim');
    function setMenu(open) { sidebar.classList.toggle('open', open); scrim.classList.toggle('show', open); }
    shell.querySelector('#menuBtn').addEventListener('click', function () { setMenu(!sidebar.classList.contains('open')); });
    scrim.addEventListener('click', function () { setMenu(false); });

    // Links to pages that are not built yet show a friendly message instead of a broken page.
    document.querySelectorAll('a[href]').forEach(function (a) {
      var file = (a.getAttribute('href') || '').split('#')[0];
      var page = PAGES.filter(function (p) { return p.file === file; })[0];
      if (page && !page.ready) {
        a.addEventListener('click', function (e) { e.preventDefault(); toast(page.label + ' arrives in a later build stage.'); });
      }
    });
  }

  window.FitTrack = { toast: toast, pages: PAGES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
