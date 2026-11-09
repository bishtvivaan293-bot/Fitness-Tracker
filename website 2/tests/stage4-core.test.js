/* Run with:  node tests/stage4-core.test.js
   Tests the Stage 4 workout logic in js/core.js and the dashboard helpers. No browser needed. */
const assert = require('assert');
const store = {};
global.window = undefined;
// Fake localStorage so Tracker can save in Node
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const FT = require('../js/core.js');
const D = require('../js/dashboard.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const fresh = () => { Object.keys(store).forEach(k => delete store[k]); return new FT.Tracker(); };
const today = FT.todayISO();

t('add built-in workout estimates calories and stores reps', () => {
  const tr = fresh(); const r = tr.add(1, 30, today, { reps: 0 });
  assert(r.ok); assert.strictEqual(r.workout.calories, 300); assert.strictEqual(r.workout.name, 'Running');
});
t('old 3-argument add still works (dashboard sample loader)', () => {
  const tr = fresh(); assert(tr.add(4, 15, today).ok); assert.strictEqual(tr.all()[0].reps, 0);
});
t('add custom exercise needs calories', () => {
  const tr = fresh();
  assert(!tr.add(0, 20, today, { name: 'Yoga' }).ok);
  const r = tr.add(0, 20, today, { name: '  Yoga  ', calories: 90, reps: 5 });
  assert(r.ok); assert.strictEqual(r.workout.name, 'Yoga');
});
t('validation rejects bad input', () => {
  const tr = fresh();
  assert(!tr.add(1, 0, today).ok, 'zero minutes');
  assert(!tr.add(1, 2.5, today).ok, 'decimal minutes');
  assert(!tr.add(1, 601, today).ok, 'too long');
  assert(!tr.add(1, 20, '2026-02-31').ok, 'impossible date');
  assert(!tr.add(1, 20, '2999-01-01').ok, 'future date');
  assert(!tr.add(1, 20, today, { reps: -1 }).ok, 'negative reps');
  assert(!tr.add(1, 20, today, { calories: -5 }).ok, 'negative calories');
  assert(!tr.add(9, 20, today).ok, 'unknown option');
  assert.strictEqual(tr.all().length, 0);
});
t('update changes every field and saves', () => {
  const tr = fresh(); tr.add(1, 30, today);
  const r = tr.update(1, { name: 'Jogging', duration: 40, reps: 3, calories: 350, date: today });
  assert(r.ok); assert.deepStrictEqual(r.workout, { id: 1, name: 'Jogging', duration: 40, calories: 350, date: today, reps: 3 });
  assert.strictEqual(new FT.Tracker().all()[0].name, 'Jogging', 'persisted');
});
t('update rejects unknown id and bad data without changing anything', () => {
  const tr = fresh(); tr.add(1, 30, today);
  assert(!tr.update(99, { name: 'x', duration: 5, reps: 0, calories: 1, date: today }).ok);
  assert(!tr.update(1, { name: '', duration: 5, reps: 0, calories: 1, date: today }).ok);
  assert.strictEqual(tr.find(1).name, 'Running');
});
t('delete removes head, middle and tail', () => {
  const tr = fresh(); [1, 2, 3, 4].forEach(o => tr.add(o, 10 * o, today));
  assert(tr.remove(1).ok); assert(tr.remove(3).ok); assert(tr.remove(4).ok);
  assert.deepStrictEqual(tr.all().map(w => w.id), [2]);
  assert(!tr.remove(99).ok);
});
t('search by name, date, and #id', () => {
  const tr = fresh(); tr.add(1, 30, '2026-11-02'); tr.add(2, 20, '2026-10-30'); tr.add(1, 10, '2026-11-05');
  assert.strictEqual(tr.search('run').length, 2);
  assert.strictEqual(tr.search('RUNNING').length, 2, 'case-insensitive');
  assert.strictEqual(tr.search('2026-11').length, 2);
  assert.deepStrictEqual(tr.search('#2').map(w => w.id), [2]);
  assert.deepStrictEqual(tr.search('3').map(w => w.id), [3], 'plain number = id only');
  assert.strictEqual(tr.search('').length, 3);
  assert.strictEqual(tr.search('zzz').length, 0);
});
t('sort by duration and calories, both directions', () => {
  const tr = fresh(); tr.add(1, 30, today); tr.add(3, 60, today); tr.add(2, 10, today); // cal 300, 240, 80
  tr.sortBy('duration', false); assert.deepStrictEqual(tr.all().map(w => w.duration), [10, 30, 60]);
  tr.sortBy('duration', true);  assert.deepStrictEqual(tr.all().map(w => w.duration), [60, 30, 10]);
  tr.sortBy('calories', false); assert.deepStrictEqual(tr.all().map(w => w.calories), [80, 240, 300]);
  tr.sortBy('calories', true);  assert.deepStrictEqual(tr.all().map(w => w.calories), [300, 240, 80]);
  tr.sortBy('id', false);       assert.deepStrictEqual(tr.all().map(w => w.id), [1, 2, 3]);
  assert(!tr.sortBy('name').ok);
});
t('sort keeps all fields together (data swapped as a whole)', () => {
  const tr = fresh(); tr.add(1, 30, today, { reps: 7 }); tr.add(3, 5, today, { reps: 9 });
  tr.sortBy('duration', false);
  assert.deepStrictEqual(tr.all()[0], { id: 2, name: 'Walking', duration: 5, calories: 20, date: today, reps: 9 });
});
t('old sortByDuration still works', () => {
  const tr = fresh(); tr.add(1, 30, today); tr.add(1, 5, today);
  assert(tr.sortByDuration().ok); assert.strictEqual(tr.all()[0].duration, 5);
});
t('undo (stack) and processNext (queue) still work', () => {
  const tr = fresh(); tr.add(1, 10, today); tr.add(2, 20, today);
  assert.strictEqual(tr.processNext().workout.id, 1);
  assert.strictEqual(tr.undoLast().workout.id, 2);
  assert.strictEqual(tr.all().length, 1);
});
t('Stage 3 records without reps load with reps = 0', () => {
  fresh(); store['fittrack.workouts'] = JSON.stringify([{ id: 1, name: 'Running', duration: 30, calories: 300, date: today }]);
  const tr = new FT.Tracker(); assert.strictEqual(tr.all()[0].reps, 0);
  tr.add(2, 10, today); assert.strictEqual(tr.all().length, 2);
});
t('dashboard weekStats uses real records (Mon-Sun buckets)', () => {
  const tr = fresh(); tr.add(1, 30, '2026-11-02'); tr.add(2, 45, '2026-11-02'); tr.add(3, 20, '2026-11-08'); tr.add(1, 99, '2026-10-30');
  const ws = D.weekStats(tr.all(), D.parseISO('2026-11-02'));
  assert.deepStrictEqual(ws.minutes, [75, 0, 0, 0, 0, 0, 20]);
  assert.deepStrictEqual(ws.calories, [300 + 360, 0, 0, 0, 0, 0, 80]);
  assert.strictEqual(ws.count, 3);
  assert.strictEqual(D.totals(tr.all()).minutes, 194);
});
console.log('\nAll ' + n + ' tests passed.');
