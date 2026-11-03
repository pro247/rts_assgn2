/* Microwave Oven Simulator - RTS 521 Assignment 2 - logic (model / view / controller) */
const $ = s => document.querySelector(s);

// states: WAITING, ENABLED, DISABLED, COOK, DONE, ALARM
const M = { state: 'WAITING', door: false, power: 600, rem: 0, buf: '', end: 0, doneEnd: 0, alarmEnd: 0, msg: '', msgUntil: 0 };
const now = () => performance.now();
const say = (t, ms = 2500) => { M.msg = t; M.msgUntil = now() + ms };
const busy = () => ['COOK', 'DONE', 'ALARM'].includes(M.state);
const idle = () => { M.state = M.door ? 'DISABLED' : (M.rem > 0 ? 'ENABLED' : 'WAITING') };
const MAX = 359999000;
const E = {
    power(w) { if (busy()) return; M.power = w; say(w == 300 ? 'Half power (300 W)' : 'Full power (600 W)') },
    add(s) { if (busy()) return; M.buf = ''; M.rem = Math.min(M.rem + s * 1000, MAX); idle(); say('Time set') },
    digit(d) { // keypad works like a real oven: digits fill mm:ss from the right
        if (busy()) return; M.buf = (M.buf + d).slice(-4);
        M.rem = Math.min(((+M.buf.slice(0, -2) || 0) * 60 + (+M.buf.slice(-2))) * 1000, MAX); idle(); say('Time set')
    },
    clear() { if (busy()) return; M.buf = ''; M.rem = 0; idle(); say('Time cleared') },
    start() {
        if (busy()) return;
        if (M.door) return say('Door is open. Cannot start.');
        if (M.rem <= 0) return say('Set cooking time first');
        const f = [$('#ft').checked && 'Turntable fault', $('#fe').checked && 'Emitter fault'].filter(Boolean);
        if (f.length) { M.state = 'ALARM'; M.alarmEnd = now() + 3000; say('ALARM: ' + f.join(' + '), 3000); return }
        M.buf = ''; M.msgUntil = 0; M.state = 'COOK'; M.end = now() + M.rem; // end timestamp avoids tick drift
    },
    stop() {
        if (M.state == 'COOK') { M.rem = Math.max(0, M.end - now()); M.state = 'ENABLED'; say('Stopped. Press Stop again to clear time', 3500) }
        else if (M.state == 'DONE') { buzz(false); M.rem = 0; idle() }
        else if (M.state != 'ALARM') { M.buf = ''; M.rem = 0; idle(); say('Time cleared') }
    },
    door() {
        const cooking = M.state == 'COOK';
        if (cooking) M.rem = Math.max(0, M.end - now());
        if (M.state == 'DONE') { buzz(false); M.rem = 0 }
        M.door = !M.door; idle();
        say(cooking ? 'Food container door now opened' : 'Food container door now ' + (M.door ? 'opened' : 'closed'), 3000);
    }
};
function tick() {
    const n = now();
    if (M.state == 'COOK') { M.rem = M.end - n; if (M.rem <= 0) { M.rem = 0; M.state = 'DONE'; M.doneEnd = n + 5000; buzz(true) } }
    else if (M.state == 'DONE' && n >= M.doneEnd) { buzz(false); idle() }
    else if (M.state == 'ALARM' && n >= M.alarmEnd) { M.state = 'DISABLED'; say('Not ready', 60000) }
    render(n);
}
// ---- View ----
const fmt = ms => { const s = Math.ceil(ms / 1000); return [s / 3600 | 0, (s / 60 | 0) % 60, s % 60].map(x => String(x).padStart(2, '0')).join(':') };
const NAMES = { WAITING: 'Waiting', ENABLED: 'Ready', DISABLED: 'Disabled', COOK: 'Cooking', DONE: 'Done', ALARM: 'Alarm' };
function render(n) {
    const cook = M.state == 'COOK', done = M.state == 'DONE';
    const base = { WAITING: new Date().toLocaleTimeString([], { hour12: false }), ENABLED: 'Ready to cook', DISABLED: 'Not ready', COOK: 'Cooking at ' + M.power + ' W', DONE: 'Cooking complete', ALARM: M.msg };
    $('#time').textContent = fmt(M.rem);
    $('#msg').textContent = (n < M.msgUntil && !done) ? M.msg : base[M.state];
    $('#dwrap').classList.toggle('open', M.door);
    $('#int').classList.toggle('cook', cook); $('#dwrap').classList.toggle('cook', cook);
    $('#int').classList.toggle('light', ['DISABLED', 'COOK', 'DONE', 'ALARM'].includes(M.state)); // light per Fig 5.17
    $('#status').textContent = 'State: ' + NAMES[M.state] + ' | Door: ' + (M.door ? 'OPEN' : 'CLOSED') + ' | Power: ' + M.power + 'W';
    $('#start').disabled = M.door || busy();
}
// ---- Buzzer (5 s, beeping) ----
let ac, osc, bt;
function buzz(on) {
    if (on) {
        ac = ac || new AudioContext(); osc = ac.createOscillator(); const g = ac.createGain();
        osc.type = 'square'; osc.frequency.value = 880; g.gain.value = .06; osc.connect(g).connect(ac.destination); osc.start();
        let loud = false; bt = setInterval(() => { g.gain.value = loud ? .06 : 0; loud = !loud }, 250);
    } else { clearInterval(bt); try { osc && osc.stop() } catch (e) { } osc = null }
}
// ---- Controller ----
document.addEventListener('click', () => { ac = ac || new AudioContext(); ac.resume() }, { once: true });
document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => E.add(+b.dataset.add));
document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => E.power(+b.dataset.p));
document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => E.digit(b.dataset.d));
document.querySelectorAll('.keys button:not([data-d],[data-add],[data-p],[id])').forEach(b => b.style.visibility = 'hidden');
$('#clr').onclick = E.clear; $('#start').onclick = E.start; $('#stop').onclick = E.stop; $('#dbtn').onclick = E.door;
setInterval(tick, 100); tick();
