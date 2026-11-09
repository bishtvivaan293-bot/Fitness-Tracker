/* FitTrack core engine (Stage 1)
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
  function Workout(id, name, duration, calories, date) {
    this.id = id; this.name = name; this.duration = duration;
    this.calories = calories; this.date = date || ''; this.next = null;
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
  // Bubble sort by duration. Swaps the data, not the links, like the C++ code.
  WorkoutList.prototype.bubbleSortByDuration = function () {
    var swaps = 0, swapped;
    if (!this.head || !this.head.next) return swaps;
    do {
      swapped = false;
      for (var p = this.head; p && p.next; p = p.next) {
        if (p.duration > p.next.duration) {
          ['id', 'name', 'duration', 'calories', 'date'].forEach(function (k) {
            var t = p[k]; p[k] = p.next[k]; p.next[k] = t;
          });
          swapped = true; swaps++;
        }
      }
    } while (swapped);
    return swaps;
  };
  WorkoutList.prototype.toArray = function () {
    var out = [];
    for (var p = this.head; p; p = p.next)
      out.push({ id: p.id, name: p.name, duration: p.duration, calories: p.calories, date: p.date });
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
      var node = new Workout(r.id, r.name, r.duration, r.calories, r.date);
      if (!self.list.head) self.list.head = node; else tail.next = node;
      tail = node;
    });
  };
  Tracker.prototype.save = function () { return Store.set(KEYS.workouts, this.list.toArray()); };

  Tracker.prototype.add = function (option, minutes, date) {
    var type = WORKOUT_TYPES.filter(function (w) { return w.option === option; })[0];
    if (!type) return { ok: false, error: 'Invalid workout choice.' };
    if (!(minutes > 0) || Math.floor(minutes) !== minutes) return { ok: false, error: 'Duration must be a positive whole number.' };
    var id = this.list.nextID();
    var node = new Workout(id, type.name, minutes, estimateWorkoutCalories(option, minutes), date || todayISO());
    this.list.addToTail(node);
    this.undoStack.push(id);
    this.queue.enqueue(id);
    this.save();
    return { ok: true, workout: this.find(id) };
  };
  Tracker.prototype.find = function (id) {
    var p = this.list.findByID(id);
    return p ? { id: p.id, name: p.name, duration: p.duration, calories: p.calories, date: p.date } : null;
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
    todayISO: todayISO,
    getProfile: function () { return Store.get(KEYS.profile, null); },
    saveProfile: function (p) { return Store.set(KEYS.profile, p); }
  };
  root.FT = FT;
  if (typeof module !== 'undefined' && module.exports) module.exports = FT;
})(typeof window !== 'undefined' ? window : globalThis);
