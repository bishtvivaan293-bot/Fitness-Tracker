/* FitTrack dashboard (Stage 3, small refresh additions in Stage 4)
   Reads the profile and workouts saved by core.js (window.FT) and draws the dashboard.
   The calculation helpers at the top have no DOM code, so they can be tested in Node. */
(function (root) {
  'use strict';

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- Pure helpers ---------- */

  // "2026-11-03" -> local Date (avoids the timezone shift of new Date("2026-11-03"))
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function toISO(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  // Monday of the week that contains date d
  function weekStartOf(d) {
    var s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    return s;
  }
  function addDays(d, n) { var r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() + n); return r; }

  function totals(workouts) {
    var t = { count: workouts.length, minutes: 0, calories: 0 };
    workouts.forEach(function (w) { t.minutes += w.duration; t.calories += w.calories; });
    return t;
  }

  // Minutes, calories and count for each day Monday..Sunday of the week starting at weekStart
  function weekStats(workouts, weekStart) {
    var out = { minutes: [0, 0, 0, 0, 0, 0, 0], calories: [0, 0, 0, 0, 0, 0, 0], count: 0 };
    var startISO = toISO(weekStart), endISO = toISO(addDays(weekStart, 6));
    workouts.forEach(function (w) {
      var d = parseISO(w.date);
      if (!d) return;
      var iso = toISO(d);
      if (iso < startISO || iso > endISO) return;
      var i = (d.getDay() + 6) % 7;
      out.minutes[i] += w.duration;
      out.calories[i] += w.calories;
      out.count++;
    });
    return out;
  }

  function formatDuration(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }
  function rangeLabel(weekStart) {
    var end = addDays(weekStart, 6);
    return weekStart.getDate() + ' ' + MONTHS[weekStart.getMonth()] + ' – ' + end.getDate() + ' ' + MONTHS[end.getMonth()] + ' ' + end.getFullYear();
  }

  var api = {
    parseISO: parseISO, toISO: toISO, weekStartOf: weekStartOf, addDays: addDays,
    totals: totals, weekStats: weekStats, formatDuration: formatDuration, rangeLabel: rangeLabel
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return; // Node test: stop before touching the page

  /* ---------- Page code ---------- */
  var FT = root.FT, FitTrack = root.FitTrack;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-IN'); };
  var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };

  var state = { weekStart: weekStartOf(new Date()), workouts: [], minutesChart: null, caloriesChart: null };
  var thisWeek = weekStartOf(new Date());

  function loadWorkouts() { state.workouts = new FT.Tracker().all(); }

  function renderWelcome() {
    var p = FT.getProfile() || {};
    $('welcomeTitle').textContent = p.name ? 'Welcome back, ' + p.name : 'Welcome to FitTrack';
    $('goalBadge').textContent = p.goal || 'Not set';
    $('todayText').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function renderSummary() {
    var p = FT.getProfile() || {};
    var bmi = p.height && p.weight ? FT.calculateBMI(p.height, p.weight) : null;
    if (bmi && bmi.ok) {
      $('bmiVal').textContent = bmi.bmi.toFixed(1);
      $('bmiHint').textContent = bmi.category;
    } else {
      $('bmiVal').textContent = '–';
      $('bmiHint').innerHTML = '<a href="calculator.html">Enter height and weight</a>';
    }
    var cal = p.weight ? FT.dailyCalories(p.weight, p.goal || 'Maintain') : null;
    if (cal && cal.ok) {
      $('calVal').textContent = fmt(cal.target) + ' kcal';
      $('calHint').textContent = 'Goal: ' + cal.goal + '. Maintenance ' + fmt(cal.maintain) + ' kcal.';
    } else {
      $('calVal').textContent = '–';
      $('calHint').innerHTML = '<a href="calculator.html">Set up in the calculator</a>';
    }
    var t = totals(state.workouts);
    $('totalWorkouts').textContent = t.count;
    $('totalDuration').textContent = formatDuration(t.minutes);
    $('workoutsHint').textContent = t.count ? 'Logged all time' : 'None logged yet';
    $('durationHint').textContent = t.count ? fmt(t.calories) + ' kcal burned in total' : 'Time adds up as you log';
  }

  function chartOptions(unit) {
    var muted = css('--muted'), line = css('--line');
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function (c) { return ' ' + fmt(c.parsed.y) + ' ' + unit; } } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: muted } },
        y: { beginAtZero: true, grid: { color: line }, ticks: { color: muted, precision: 0 },
             title: { display: true, text: unit, color: muted } }
      }
    };
  }

  function renderCharts() {
    var s = weekStats(state.workouts, state.weekStart);
    $('weekRange').textContent = rangeLabel(state.weekStart);
    $('nextWeek').disabled = +state.weekStart >= +thisWeek;
    $('minSub').textContent = s.count ? s.count + (s.count === 1 ? ' workout' : ' workouts') + ' this week' : 'No workouts this week';
    $('calSub').textContent = s.count ? fmt(s.calories.reduce(function (a, b) { return a + b; }, 0)) + ' kcal estimated this week' : 'No workouts this week';

    if (!root.Chart) { // Chart.js did not load (offline). Show a clear message.
      ['minutesChart', 'caloriesChart'].forEach(function (id) {
        if (!$(id)) return; // message already shown on an earlier redraw
        var box = $(id).parentNode;
        box.innerHTML = '<div class="chart-fallback">Charts need an internet connection to load Chart.js. Check your connection and refresh.</div>';
      });
      return;
    }
    var l600 = css('--l600'), l200 = css('--l200'), l500 = css('--l500');
    var barColors = s.minutes.map(function (m) { return m > 0 ? l500 : l200; });
    var minData = { labels: DAYS, datasets: [{ data: s.minutes, backgroundColor: barColors, borderRadius: 8, maxBarThickness: 44 }] };
    var calData = { labels: DAYS, datasets: [{ data: s.calories, borderColor: l600, backgroundColor: 'rgba(139,99,238,.15)',
      fill: true, tension: 0.35, pointBackgroundColor: l600, pointRadius: 4, borderWidth: 3 }] };

    if (state.minutesChart) state.minutesChart.destroy();
    if (state.caloriesChart) state.caloriesChart.destroy();
    state.minutesChart = new root.Chart($('minutesChart'), { type: 'bar', data: minData, options: chartOptions('minutes') });
    state.caloriesChart = new root.Chart($('caloriesChart'), { type: 'line', data: calData, options: chartOptions('kcal') });
  }

  function renderRecent() {
    var list = state.workouts.slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '') || b.id - a.id;
    }).slice(0, 6);
    var body = $('recentBody');
    body.innerHTML = '';
    list.forEach(function (w) {
      var tr = document.createElement('tr');
      var d = parseISO(w.date);
      [d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() : '–', w.name, w.duration + ' min', fmt(w.calories) + ' kcal']
        .forEach(function (txt) { var td = document.createElement('td'); td.textContent = txt; tr.appendChild(td); });
      body.appendChild(tr);
    });
    var has = list.length > 0;
    $('recentTable').hidden = !has;
    $('recentEmpty').hidden = has;
    $('devTools').hidden = !has;
  }

  function renderAll() { renderWelcome(); renderSummary(); renderCharts(); renderRecent(); }

  /* ---------- Actions ---------- */
  function loadSample() {
    var t = new FT.Tracker(), today = new Date();
    // [workout option, minutes, days ago]: option numbers come from core.js WORKOUT_TYPES
    [[1, 30, 0], [4, 15, 1], [2, 45, 2], [3, 40, 4], [6, 20, 5], [1, 25, 7], [5, 15, 8], [7, 20, 9]]
      .forEach(function (r) { t.add(r[0], r[1], toISO(addDays(today, -r[2]))); });
    loadWorkouts(); renderAll();
    FitTrack.toast('Sample workouts added.', 'ok');
  }

  function bind() {
    var form = $('profileForm'), editBtn = $('editProfileBtn');
    function setForm(open) {
      form.hidden = !open; editBtn.setAttribute('aria-expanded', open);
      if (open) {
        var p = FT.getProfile() || {};
        $('pName').value = p.name || ''; $('pGoal').value = p.goal || 'Maintain'; $('pName').focus();
      }
    }
    editBtn.addEventListener('click', function () { setForm(form.hidden); });
    $('cancelProfileBtn').addEventListener('click', function () { setForm(false); editBtn.focus(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = FT.getProfile() || {};
      p.name = $('pName').value.trim(); p.goal = $('pGoal').value;
      if (!p.name) delete p.name;
      FT.saveProfile(p);
      setForm(false); renderWelcome(); renderSummary();
      FitTrack.toast('Profile saved.', 'ok');
    });

    $('prevWeek').addEventListener('click', function () { state.weekStart = addDays(state.weekStart, -7); renderCharts(); });
    $('nextWeek').addEventListener('click', function () {
      if (+state.weekStart < +thisWeek) { state.weekStart = addDays(state.weekStart, 7); renderCharts(); }
    });
    $('loadSample').addEventListener('click', loadSample);
    $('loadSample2').addEventListener('click', loadSample);
    $('clearWorkouts').addEventListener('click', function () {
      if (!root.confirm('Delete all saved workouts? This cannot be undone.')) return;
      FT.Store.remove(FT.KEYS.workouts);
      loadWorkouts(); renderAll();
      FitTrack.toast('All workouts cleared.');
    });
  }

  function init() {
    loadWorkouts(); bind(); renderAll();
    // Stage 4: pick up changes made on the Workouts page.
    // 1) Coming back with the browser Back button can show an old copy of this page.
    root.addEventListener('pageshow', function (e) { if (e.persisted) { loadWorkouts(); renderAll(); } });
    // 2) Another browser tab changed the saved data.
    root.addEventListener('storage', function (e) {
      if (e.key === FT.KEYS.workouts || e.key === FT.KEYS.profile) { loadWorkouts(); renderAll(); }
    });
  }
  // layout.js moves <main> into the shell on DOMContentLoaded; run after it (same event, later listener)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
