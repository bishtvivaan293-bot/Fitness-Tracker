/* FitTrack core engine (Stage 1, extended in Stage 4)
   Stage 4 added: reps on each workout, Tracker.update(), Tracker.search(),
   Tracker.sortBy() and shared input checking. Nothing from Stage 1 was removed.
   JavaScript version of the logic in your C++ files:
   main.cpp, recommendation_module.cpp, weekly_schedule_module.cpp.
   No page code here. Pages call window.FT. */
(function (root) {
  'use strict';

  /* ---------- Storage (replaces workouts.txt file handling) ---------- */
  var KEYS = { profile: 'fittrack.profile', workouts: 'fittrack.workouts' };
  var memory = {}; // fallback if the browser blocks localStorage

  var Store = {
    get: function (key, fallback) {
      try {
        var raw = root.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return key in memory ? memory[key] : fallback;
      }
    },
    set: function (key, value) {
      try { root.localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { memory[key] = value; return false; }
    },
    remove: function (key) {
      try { root.localStorage.removeItem(key); } catch (e) {}
      delete memory[key];
    }
  };

  /* ---------- Formulas (same numbers as the C++ code) ---------- */

  // main.cpp calculateBMI(): bmi = weight / (height * height), height in METRES
  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
  function calculateBMI(height, weight) {
    if (!(height > 0) || !(weight > 0))
      return { ok: false, error: 'Height and weight must be greater than zero.' };
    var bmi = weight / (height * height);
    return { ok: true, bmi: bmi, category: bmiCategory(bmi) };
  }

  // main.cpp dailyCalories(): maintain = weight * 33, Bulk +300, Cut -300
  function goalFromChoice(choice) { return choice === 1 ? 'Bulk' : choice === 2 ? 'Cut' : 'Maintain'; }
  function dailyCalories(weight, goal) {
    if (!(weight > 0)) return { ok: false, error: 'Please enter a valid weight first.' };
    var maintain = weight * 33;
    var target = goal === 'Bulk' ? maintain + 300 : goal === 'Cut' ? maintain - 300 : maintain;
    return { ok: true, maintain: maintain, target: target, goal: goal };
  }

  // main.cpp estimateCalories(): calories per minute for each workout option
  var WORKOUT_TYPES = [
    { option: 1, name: 'Running',  perMin: 10 },
    { option: 2, name: 'Cycling',  perMin: 8 },
    { option: 3, name: 'Walking',  perMin: 4 },
    { option: 4, name: 'Pushups',  perMin: 7 },
    { option: 5, name: 'Pullups',  perMin: 8 },
    { option: 6, name: 'Squats',   perMin: 6 },
    { option: 7, name: 'Crunches', perMin: 5 }
  ];
  function estimateWorkoutCalories(option, minutes) {
    var t = WORKOUT_TYPES.filter(function (w) { return w.option === option; })[0];
    return t ? minutes * t.perMin : 0;
  }

  // recommendation_module.cpp estimateCalories(): (MET * 3.5 * weight / 200) * minutes
  var MET = { 1: 3.5, 2: 6.0, 3: 5.0 }; // walking, jogging, cycling; anything else = 4.0
  function estimateCaloriesMET(exercise, weight, minutes) {
    var met = MET[exercise] !== undefined ? MET[exercise] : 4.0;
    return (met * 3.5 * weight / 200.0) * minutes;
  }

  // recommendation_module.cpp: integer division, so Math.floor
  function planTimes(durationChoice) {
    var total = durationChoice * 10;
    var warmup = Math.floor(total / 4), cooldown = Math.floor(total / 4);
    return { total: total, warmup: warmup, cooldown: cooldown, main: total - warmup - cooldown };
  }

  // weekly_schedule_module.cpp: one # per 5 minutes, rounded up
  function graphBars(minutes) { return Math.floor((minutes + 4) / 5); }

  /* ---------- Data structures ---------- */

  // Linked list node (struct Workout). "date" is new on the web version.
  function Workout(id, name, duration, calories, date, reps) {
    this.id = id; this.name = name; this.duration = duration;
    this.calories = calories; this.date = date || '';
    this.reps = reps || 0; // Stage 4: repetitions (0 = not recorded)
    this.next = null;
  }

  function WorkoutList() { this.head = null; }
  WorkoutList.prototype.isEmpty = function () { return this.head === null; };
  WorkoutList.prototype.nextID = function () { // largest id + 1
    var largest = 0;
    for (var p = this.head; p; p = p.next) if (p.id > largest) largest = p.id;
    return largest + 1;
  };
  WorkoutList.prototype.addToTail = function (node) {
    if (!this.head) { this.head = node; return; }
    var tail = this.head;
    while (tail.next) tail = tail.next;
    tail.next = node;
  };
  WorkoutList.prototype.findByID = function (id) { // linear search
    for (var p = this.head; p; p = p.next) if (p.id === id) return p;
    return null;
  };
  WorkoutList.prototype.deleteByID = function (id) {
    var cur = this.head, prev = null;
    while (cur && cur.id !== id) { prev = cur; cur = cur.next; }
    if (!cur) return false;
    if (!prev) this.head = cur.next; else prev.next = cur.next;
    return true;
  };
  // Bubble sort. Swaps the data, not the links, like the C++ code.
  // key: 'id', 'duration', 'calories' ... ; descending: true for biggest first.
  // Uses "greater than" (not "greater or equal"), so equal items keep their order.
  WorkoutList.prototype.bubbleSortBy = function (key, descending) {
    var swaps = 0, swapped;
    if (!this.head || !this.head.next) return swaps;
    do {
      swapped = false;
      for (var p = this.head; p && p.next; p = p.next) {
        var outOfOrder = descending ? p[key] < p.next[key] : p[key] > p.next[key];
        if (outOfOrder) {
          ['id', 'name', 'duration', 'calories', 'date', 'reps'].forEach(function (k) {
            var t = p[k]; p[k] = p.next[k]; p.next[k] = t;
          });
          swapped = true; swaps++;
        }
      }
    } while (swapped);
    return swaps;
  };
  // Stage 1 name kept so older code keeps working.
  WorkoutList.prototype.bubbleSortByDuration = function () { return this.bubbleSortBy('duration', false); };
  WorkoutList.prototype.toArray = function () {
    var out = [];
    for (var p = this.head; p; p = p.next)
      out.push({ id: p.id, name: p.name, duration: p.duration, calories: p.calories, date: p.date, reps: p.reps });
    return out;
  };
  WorkoutList.prototype.size = function () { return this.toArray().length; };

  // Stack (LIFO) used for undo
  function Stack() { this.items = []; }
  Stack.prototype.push = function (x) { this.items.push(x); };
  Stack.prototype.pop = function () { return this.items.pop(); };
  Stack.prototype.isEmpty = function () { return this.items.length === 0; };
  Stack.prototype.size = function () { return this.items.length; };

  // Queue (FIFO) used for processing workouts
  function Queue() { this.items = []; }
  Queue.prototype.enqueue = function (x) { this.items.push(x); };
  Queue.prototype.dequeue = function () { return this.items.shift(); };
  Queue.prototype.front = function () { return this.items[0]; };
  Queue.prototype.isEmpty = function () { return this.items.length === 0; };
  Queue.prototype.size = function () { return this.items.length; };

  /* ---------- Tracker (class FitnessTracker, workout part) ---------- */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  // Stage 4: one place that checks workout input, used by add() and update().
  function isValidISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return false;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
  }
  function isWhole(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function checkWorkoutFields(f) {
    var name = String(f.name === undefined || f.name === null ? '' : f.name).replace(/\s+/g, ' ').trim();
    if (!name) return { ok: false, error: 'Enter an exercise name.' };
    if (name.length > 40) return { ok: false, error: 'Exercise name must be 40 characters or fewer.' };
    if (!isWhole(f.duration) || f.duration < 1 || f.duration > 600)
      return { ok: false, error: 'Duration must be a whole number from 1 to 600 minutes.' };
    if (!isWhole(f.reps) || f.reps < 0 || f.reps > 10000)
      return { ok: false, error: 'Repetitions must be a whole number from 0 to 10000.' };
    if (typeof f.calories !== 'number' || !isFinite(f.calories) || f.calories < 0 || f.calories > 10000)
      return { ok: false, error: 'Calories must be a number from 0 to 10000.' };
    if (!isValidISO(f.date)) return { ok: false, error: 'Choose a valid date.' };
    if (f.date > todayISO()) return { ok: false, error: 'The date cannot be in the future.' };
    return { ok: true, values: { name: name, duration: f.duration, reps: f.reps, calories: f.calories, date: f.date } };
  }

  function Tracker() {
    this.list = new WorkoutList();
    this.undoStack = new Stack();   // session only, like the C++ program
    this.queue = new Queue();       // session only, like the C++ program
    this.load();
  }
  Tracker.prototype.load = function () { // loadWorkouts()
    var self = this, data = Store.get(KEYS.workouts, []);
    self.list.head = null;
    if (!Array.isArray(data)) return;
    var tail = null;
    data.forEach(function (r) {
      if (!r || typeof r.id !== 'number' || typeof r.name !== 'string' ||
          typeof r.duration !== 'number' || typeof r.calories !== 'number') return;
      var node = new Workout(r.id, r.name, r.duration, r.calories, r.date, typeof r.reps === 'number' ? r.reps : 0);
      if (!self.list.head) self.list.head = node; else tail.next = node;
      tail = node;
    });
  };
  Tracker.prototype.save = function () { return Store.set(KEYS.workouts, this.list.toArray()); };

  // add(option, minutes, date, extra)
  //   option : 1-7 for a built-in exercise (see WORKOUT_TYPES), or 0 for a custom exercise
  //   extra  : optional { name, reps, calories }. name is needed for option 0.
  //            If calories is left out, built-in exercises use the estimate.
  Tracker.prototype.add = function (option, minutes, date, extra) {
    extra = extra || {};
    var type = WORKOUT_TYPES.filter(function (w) { return w.option === option; })[0];
    if (!type && !extra.name) return { ok: false, error: 'Invalid workout choice.' };
    var calories = extra.calories;
    if (calories === undefined || calories === null) {
      if (!type) return { ok: false, error: 'Enter the calories for a custom exercise.' };
      calories = estimateWorkoutCalories(option, minutes);
    }
    var check = checkWorkoutFields({
      name: type ? type.name : extra.name, duration: minutes,
      reps: extra.reps === undefined ? 0 : extra.reps, calories: calories, date: date || todayISO()
    });
    if (!check.ok) return check;
    var v = check.values, id = this.list.nextID();
    this.list.addToTail(new Workout(id, v.name, v.duration, v.calories, v.date, v.reps));
    this.undoStack.push(id);
    this.queue.enqueue(id);
    this.save();
    return { ok: true, workout: this.find(id) };
  };
  // Stage 4: change an existing workout. fields = { name, duration, reps, calories, date }
  Tracker.prototype.update = function (id, fields) {
    var node = this.list.findByID(id);
    if (!node) return { ok: false, error: 'Workout ID not found.' };
    var check = checkWorkoutFields(fields);
    if (!check.ok) return check;
    var v = check.values;
    node.name = v.name; node.duration = v.duration; node.reps = v.reps;
    node.calories = v.calories; node.date = v.date;
    this.save();
    return { ok: true, workout: this.find(id) };
  };
  // Stage 4: linear search. "#3" or "3" finds ID 3. Anything else matches the
  // exercise name or the date (for example "run" or "2026-11").
  Tracker.prototype.search = function (text) {
    var q = String(text || '').trim().toLowerCase();
    var all = this.list.toArray();
    if (!q) return all;
    var idMatch = /^#?(\d+)$/.exec(q);
    return all.filter(function (w) {
      if (idMatch) return w.id === +idMatch[1];
      return w.name.toLowerCase().indexOf(q) !== -1 || (w.date || '').indexOf(q) !== -1;
    });
  };
  // Stage 4: sort the saved list by 'id', 'duration' or 'calories' (bubble sort).
  Tracker.prototype.sortBy = function (key, descending) {
    if (['id', 'duration', 'calories'].indexOf(key) === -1) return { ok: false, error: 'Cannot sort by ' + key + '.' };
    var swaps = this.list.bubbleSortBy(key, !!descending);
    if (swaps) this.save();
    return { ok: true, swaps: swaps };
  };
  Tracker.prototype.find = function (id) {
    var p = this.list.findByID(id);
    return p ? { id: p.id, name: p.name, duration: p.duration, calories: p.calories, date: p.date, reps: p.reps } : null;
  };
  Tracker.prototype.remove = function (id) {
    if (this.list.isEmpty()) return { ok: false, error: 'No workout records to delete.' };
    if (!this.list.deleteByID(id)) return { ok: false, error: 'Workout ID not found.' };
    this.save();
    return { ok: true };
  };
  Tracker.prototype.sortByDuration = function () {
    if (!this.list.head || !this.list.head.next) return { ok: false, error: 'Not enough workouts to sort.' };
    var swaps = this.list.bubbleSortByDuration();
    this.save();
    return { ok: true, swaps: swaps };
  };
  Tracker.prototype.undoLast = function () { // Stack: pop the newest id
    if (this.undoStack.isEmpty()) return { ok: false, error: 'Undo history is empty for this session.' };
    var id = this.undoStack.pop();
    var w = this.find(id);
    if (!w) return { ok: false, error: 'That workout is no longer in the list.' };
    this.list.deleteByID(id);
    this.save();
    return { ok: true, workout: w };
  };
  Tracker.prototype.processNext = function () { // Queue: oldest id that still exists
    while (!this.queue.isEmpty() && !this.list.findByID(this.queue.front())) this.queue.dequeue();
    if (this.queue.isEmpty()) return { ok: false, error: 'Workout queue is empty for this session.' };
    return { ok: true, workout: this.find(this.queue.dequeue()) };
  };
  Tracker.prototype.all = function () { return this.list.toArray(); };

  /* ---------- Public API ---------- */
  var FT = {
    KEYS: KEYS, Store: Store,
    calculateBMI: calculateBMI, bmiCategory: bmiCategory,
    dailyCalories: dailyCalories, goalFromChoice: goalFromChoice,
    WORKOUT_TYPES: WORKOUT_TYPES, estimateWorkoutCalories: estimateWorkoutCalories,
    estimateCaloriesMET: estimateCaloriesMET, planTimes: planTimes, graphBars: graphBars,
    Workout: Workout, WorkoutList: WorkoutList, Stack: Stack, Queue: Queue, Tracker: Tracker,
    todayISO: todayISO, isValidISO: isValidISO, checkWorkoutFields: checkWorkoutFields,
    getProfile: function () { return Store.get(KEYS.profile, null); },
    saveProfile: function (p) { return Store.set(KEYS.profile, p); }
  };
  root.FT = FT;
  if (typeof module !== 'undefined' && module.exports) module.exports = FT;
})(typeof window !== 'undefined' ? window : globalThis);
