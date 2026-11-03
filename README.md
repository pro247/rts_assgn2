# rts_assgn2
# Microwave Oven Simulator

RTS 521 Real-Time Systems, Assignment 2 (MUBAS). A browser-based simulation of a simplified microwave oven, written in plain HTML, CSS and JavaScript (no libraries, no build step).

**Author:** Doreen Providence Abel (BECE/21/SS/001)  **Due:** 3 November 2026

## Run it
Open `index.html` in any modern browser (Chrome, Edge, Firefox). Nothing to install. Click anywhere once so the browser allows the buzzer sound.

## Project structure
```
microwave-simulator/
├── index.html            Page structure: oven body, door, control panel
├── css/
│   └── style.css         Look and layout: body, door, light, resizing
├── js/
│   └── script.js         Logic: state machine (model), render (view), events (controller)
├── docs/
│   ├── REPORT.md         Design report
│   └── screenshots/      Put your screenshots here
└── README.md             This file
```

## Controls
| Control | Action |
|---|---|
| Half Power (300W) / Full Power (600W) | Select power level (default 600W) |
| +10s, +1m, +10m | Add to the cooking time (presses accumulate) |
| Keypad 0-9 | Type the time like a real oven: 1, 2, 3, 0 gives 12:30 (mm:ss) |
| Clear Time | Reset the time to 00:00:00 |
| Start | Begin cooking (only with the door closed and time set) |
| Stop | First press stops cooking and keeps the time; second press clears it |
| Open/Close Door | Toggle the door; opening during cooking stops it |
| Fault simulation | Tick turntable or emitter fault, then press Start to see the alarm |

## Behaviour (from the assignment )
- The screen shows the cooking time as hh:mm:ss and counts down while cooking.
- At zero the oven stops, the buzzer sounds for 5 seconds and the screen shows "Cooking complete".
- The oven never runs with the door open. Messages "Food container door now opened/closed" are shown on the screen.
- Interior light: on when the door is open and while cooking; off when ready or idle with the door closed.
- Visual states: door closed (dark smoked glass with mesh dots), door open (swings out, lit interior), cooking (dim amber light, turning plate), standing by.
- The oven scales as one piece to any window size; on narrow screens the door stacks above the controls.

## How the code is organised
- **Model:** the object `M` holds the state (`WAITING`, `ENABLED`, `DISABLED`, `COOK`, `DONE`, `ALARM`), the door, power and remaining time. The `E` object has one function per event.
- **View:** `render()` is the only function that updates the screen.
- **Controller:** button handlers call `E.*`, and `tick()` runs every 100 ms.
- **Timing:** cooking stores an end timestamp and recomputes the remaining time each tick, so the countdown does not drift.

## Design decisions
- Start is blocked if the time is zero or the door is open.
- Keypad digits set the time; the + buttons add to it.
- After an alarm the oven stays "Not ready" until the door is cycled.
- In the waiting state the message line shows the clock time (Fig 5.17).
