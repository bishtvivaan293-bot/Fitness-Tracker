/* FitTrack workout management (Stage 4)
   Uses window.FT from core.js. All saving, searching, sorting and validation
   live in core.js (FT.Tracker). This file only connects the page to them. */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;

  var FT = root.FT, FitTrack = root.FitTrack;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-IN'); };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var CUSTOM = '0'; // select value for "Other (type your own)"

  var tracker = new FT.Tracker();         // the linked list lives inside this
  var editingId = null;                   // null = adding, a number = updating that workout
  var caloriesAuto = true;                // true while the calories box follows the estimate

  /* ---------- Small helpers ---------- */

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : '–';
  }
  function typeFromSelect() {
    var opt = parseInt($('exercise').value, 10);
    return FT.WORKOUT_TYPES.filter(function (w) { return w.option === opt; })[0] || null;
  }
  function showError(msg) { $('formError').textContent = msg || ''; }
  // Empty box -> fallback value. Otherwise a number (NaN if it is not a number).
  function numberOrDefault(text, fallback) { return text.trim() === '' ? fallback : Number(text); }

  /* ---------- Form ---------- */

  function fillExerciseList() {
    var sel = $('exercise');
    FT.WORKOUT_TYPES.forEach(function (w) {
      var o = document.createElement('option');
      o.value = String(w.option); o.textContent = w.name; sel.appendChild(o);
    });
    var other = document.createElement('option');
    other.value = CUSTOM; other.textContent = 'Other (type your own)'; sel.appendChild(other);
  }

  // The calories box follows the estimate until the person types their own number.
  function refreshCalories() {
    var type = typeFromSelect(), minutes = numberOrDefault($('duration').value, NaN);
    var hint = $('calHint');
    $('customField').hidden = !!type;
    hint.textContent = '';
    if (!type) {
      if (caloriesAuto) $('calories').value = '';
      hint.textContent = 'Required for your own exercise.';
      return;
    }
    if (caloriesAuto) {
      $('calories').value = minutes > 0 ? FT.estimateWorkoutCalories(type.option, minutes) : '';
      hint.textContent = 'Estimated from exercise and duration. Type a number to use your own.';
    } else {
      hint.appendChild(document.createTextNode('Using your own number. '));
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'link-btn'; b.textContent = 'Use the estimate';
      b.addEventListener('click', function () { caloriesAuto = true; refreshCalories(); });
      hint.appendChild(b);
    }
  }

  function resetForm() {
    editingId = null; caloriesAuto = true;
    $('workoutForm').reset();
    $('exercise').value = '1';
    $('date').value = FT.todayISO();
    $('date').max = FT.todayISO();
    $('formTitle').textContent = 'Add a workout';
    $('submitBtn').textContent = 'Add workout';
    $('cancelEditBtn').hidden = true;
    $('editBadge').hidden = true;
    $('formCard').classList.remove('editing');
    showError('');
    refreshCalories();
    highlightEditingRow();
  }

  function startEdit(id) {
    var w = tracker.find(id);
    if (!w) return;
    editingId = id; caloriesAuto = false;
    var type = FT.WORKOUT_TYPES.filter(function (t) { return t.name === w.name; })[0];
    $('exercise').value = type ? String(type.option) : CUSTOM;
    $('customName').value = type ? '' : w.name;
    $('duration').value = w.duration;
    $('reps').value = w.reps || '';
    $('calories').value = w.calories;
    $('date').value = w.date;
    $('formTitle').textContent = 'Update workout #' + w.id;
    $('submitBtn').textContent = 'Save changes';
    $('cancelEditBtn').hidden = false;
    $('editBadge').hidden = false;
    $('formCard').classList.add('editing');
    showError('');
    refreshCalories();
    highlightEditingRow();
    $('formCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('duration').focus();
  }

  // Read the form into the shape that core.js expects.
  function readForm() {
    var type = typeFromSelect(), duration = numberOrDefault($('duration').value, NaN);
    var calText = $('calories').value;
    var calories = numberOrDefault(calText, NaN);
    if (calText.trim() === '' && type) calories = FT.estimateWorkoutCalories(type.option, duration);
    return {
      option: type ? type.option : 0,
      name: type ? type.name : $('customName').value,
      duration: duration,
      reps: numberOrDefault($('reps').value, 0),
      calories: calories,
      date: $('date').value
    };
  }

  function onSubmit(e) {
    e.preventDefault();
    var f = readForm(), result;
    if (isNaN(f.calories) && !typeFromSelect()) { showError('Enter the calories for your own exercise.'); return; }
    if (editingId === null) {
      result = tracker.add(f.option, f.duration, f.date, { name: f.name, reps: f.reps, calories: f.calories });
    } else {
      result = tracker.update(editingId, f);
    }
    if (!result.ok) { showError(result.error); return; }
    var wasEditing = editingId !== null;
    applySort();                // keep the table in the chosen order
    resetForm();
    render();
    FitTrack.toast(wasEditing ? 'Workout updated.' : 'Workout added.', 'ok');
  }

  /* ---------- Table ---------- */

  function applySort() {
    var parts = $('sort').value.split('-');
    tracker.sortBy(parts[0], parts[1] === 'desc');
  }

  function cell(text, cls) {
    var td = document.createElement('td');
    td.textContent = text;
    if (cls) td.className = cls;
    return td;
  }

  function actionButton(label, cls, id, action, aria) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-sm ' + cls; b.textContent = label;
    b.setAttribute('data-action', action); b.setAttribute('data-id', id);
    b.setAttribute('aria-label', aria);
    return b;
  }

  function highlightEditingRow() {
    var rows = $('workoutBody').children;
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('editing', +rows[i].getAttribute('data-id') === editingId);
    }
  }

  function render() {
    var all = tracker.all();
    var shown = tracker.search($('search').value);
    var body = $('workoutBody');
    body.innerHTML = '';

    shown.forEach(function (w) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-id', w.id);
      tr.appendChild(cell('#' + w.id));
      tr.appendChild(cell(formatDate(w.date), 'num'));
      tr.appendChild(cell(w.name));
      tr.appendChild(cell(w.duration + ' min', 'num'));
      tr.appendChild(cell(w.reps ? w.reps : '–', 'num'));
      tr.appendChild(cell(fmt(w.calories) + ' kcal', 'num'));
      var td = document.createElement('td'), box = document.createElement('div');
      box.className = 'row-actions';
      box.appendChild(actionButton('Edit', 'btn-ghost', w.id, 'edit', 'Edit workout ' + w.id + ', ' + w.name));
      box.appendChild(actionButton('Delete', 'btn-danger', w.id, 'delete', 'Delete workout ' + w.id + ', ' + w.name));
      td.appendChild(box); tr.appendChild(td);
      body.appendChild(tr);
    });

    $('tableWrap').hidden = shown.length === 0;
    $('emptyAll').hidden = all.length !== 0;
    $('emptySearch').hidden = !(all.length > 0 && shown.length === 0);

    var minutes = 0, kcal = 0;
    shown.forEach(function (w) { minutes += w.duration; kcal += w.calories; });
    $('summary').textContent = all.length === 0
      ? 'Nothing logged yet.'
      : 'Showing ' + shown.length + ' of ' + all.length + (all.length === 1 ? ' workout' : ' workouts') +
        ' · ' + formatMinutes(minutes) + ' · ' + fmt(kcal) + ' kcal';
    highlightEditingRow();
  }
  function formatMinutes(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }

  function onTableClick(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var id = +btn.getAttribute('data-id');
    if (btn.getAttribute('data-action') === 'edit') { startEdit(id); return; }
    var w = tracker.find(id);
    if (!w || !root.confirm('Delete workout #' + id + ' (' + w.name + ', ' + w.duration + ' min)?')) return;
    var result = tracker.remove(id);
    if (!result.ok) { FitTrack.toast(result.error, 'err'); return; }
    if (editingId === id) resetForm();
    render();
    FitTrack.toast('Workout deleted.');
  }

  function onUndo() {
    var result = tracker.undoLast();
    if (!result.ok) { FitTrack.toast(result.error, 'err'); return; }
    if (editingId === result.workout.id) resetForm();
    render();
    FitTrack.toast('Removed ' + result.workout.name + ' (#' + result.workout.id + ').');
  }

  /* ---------- Start up ---------- */

  function bind() {
    $('workoutForm').addEventListener('submit', onSubmit);
    $('cancelEditBtn').addEventListener('click', function () { resetForm(); render(); });
    $('exercise').addEventListener('change', refreshCalories);
    $('duration').addEventListener('input', refreshCalories);
    $('calories').addEventListener('input', function () { caloriesAuto = false; refreshCalories(); });
    $('search').addEventListener('input', render);
    $('clearSearch').addEventListener('click', function () { $('search').value = ''; render(); $('search').focus(); });
    $('sort').addEventListener('change', function () { applySort(); render(); });
    $('workoutBody').addEventListener('click', onTableClick);
    $('undoBtn').addEventListener('click', onUndo);

    // Back button: the page may come back from the browser cache with the old date.
    root.addEventListener('pageshow', function (e) { if (e.persisted && editingId === null) $('date').value = FT.todayISO(); });
    // Another tab changed the saved workouts: reload them (keeps this tab's undo history).
    root.addEventListener('storage', function (e) {
      if (e.key !== FT.KEYS.workouts) return;
      tracker.load(); applySort(); render();
      if (editingId !== null && !tracker.find(editingId)) resetForm();
    });
  }

  function init() {
    fillExerciseList();
    bind();
    resetForm();
    applySort(); // the sort box starts on "Order added", so match the saved list to it
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
