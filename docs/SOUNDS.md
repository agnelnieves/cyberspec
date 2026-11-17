# Interface sounds

Enable **Interface sounds** in the header on any test route. The choice is
remembered in local storage, including on `/preview/<component>` routes.

The recorded samples are bundled but are not covered by CyberSpec's MIT code
license. See [third-party notices](../THIRD_PARTY_NOTICES.md) for their sources
and separate licensing requirements before reusing or redistributing them.

## Recordings in this pass

| Interaction | Recording | Where to try it |
| --- | --- | --- |
| Shared mouse hover | Exactly one tick from `ticking.mp3` | Any enabled button or other pressable, including menu rows, submenu triggers, repeating and Stepper keys |
| Selection, navigation and text entry | The same single recorded tick | Menu items, options, tabs, radio choices, tree rows, calendar dates, carousel/pagination, typing and deletion |
| Small popup opening / closing | The same single recorded tick | Menus, submenus, select lists, popovers, tooltips and informational toasts |
| Agent-driven changes | The same single recorded tick | `/daemon`; also the explicit `glitch` voice, which has no automatic trigger |
| Continuous adjustment | Eight consecutive ticks from `ticking.mp3` | Drag in `/preview/resizable` and `/preview/slider`; focus Frame and scroll in `/preview/stepper` |
| Decrement / minus / down | One instance of the earlier repeated sound in `moving-slider-to-left.wav` | Zoom minus and Floor down in `/preview/button-group`; Stepper minus; `/grid` zoom out |
| Increment / plus / up | The distinct final sound in `moving-slider-to-left.wav` | Zoom plus and Floor up in `/preview/button-group`; Stepper plus; `/grid` zoom in; Raise in `/augments` |
| On / checked / pressed | The first sound in `ES_User Interface, Beep, Button Interaction, Confirm, Small, Bright, Futuristic, Scifi, Variations 02 - Epidemic Sound.mp3` | `/preview/checkbox`, `/preview/switch`, `/preview/toggle`, `/preview/menu` |
| Off / unchecked / released | The last sound in the same Variations 02 recording | The same controls; also password visibility in `/preview/password-input` |
| Modal opening | The cue starting near 7.4 seconds in `ES_User Interface, Motion, Hitech GUI, Scifi, Interact, Digital, Glitch 01 - Epidemic Sound.mp3`, compressed to the movement's duration | `/preview/dialog`, `/preview/alert-dialog`, `/preview/drawer`, `/preview/command-palette` |
| Modal closing | The same cue compressed to the shorter exit duration and reversed | Close buttons, Escape and supported backdrop dismissal on those surfaces |
| Button press and confirmation | The cue near second 2 in `ES_User Interface, Alert, Futuristic Technology, UI Confirm Tone, Bright 02 - Epidemic Sound.mp3` | Ordinary and primary buttons in `/preview/button`; ButtonGroup reset/readout keys |

The directional samples are not used on sliders. The original recordings in
Downloads remain unchanged. The WAV contains two earlier bursts, followed by
the distinct final burst. `registry/cyber/lib/sound-samples.ts` contains the
extracted samples as PCM16 data, decoded into reusable Web Audio buffers.
`scripts/registry.mjs` includes every `lib/*.ts` file in the `cyber` item, so
downstream installs carry the same recordings without a public-directory
convention, asset fetch, or dependency on this site's host.

The slices, in source seconds, are hover `0.037–0.1068125`, continuous ticking
`0.037–0.595520833`, decrement `0.045–0.135`, and increment `0.364–0.459`.
In the Variations 02 recording, on uses `0.004–1.12` and off uses `2.910–3.92`.
Both retain their decay tails. The middle sound is discarded entirely.
The modal source slice is `7.390–8.900` in the Motion recording. Pitch-preserving
`atempo` stages produce short variants; each closing variant is then reversed
exactly in the audio engine. Playback stays at the original pitch. The button press
slice is `1.808–2.590` in the UI Confirm Tone recording: the cue near second
2 starts a little earlier, so its attack is retained.
The extraction retains pitch, converts to mono PCM16 at 48 kHz,
normalizes headroom and adds 0.5 ms edge fades. Regenerate with `ffmpeg`
installed:

```sh
python3 scripts/sound-samples.py /path/to/ticking.mp3 /path/to/moving-slider-to-left.wav /path/to/on-off.mp3 /path/to/motion.mp3 /path/to/press.mp3
```

The engine retains gesture unlocking, the remembered on/off preference,
master gain, limiting and duplicate suppression. The shared single tick and
directional steps use gain `0.42`; the continuous adjustment loop uses `0.195`.
All tick paths are 9.5 dB louder than their previous levels (`0.14` and `0.065`),
preserving their relative balance. A continuous sound runs only
while accepted movements arrive, with a short inactivity cutoff. Release,
cancellation, losing focus, unmounting and muting stop it. Holding still or
reaching a bound does not keep ticking. Muting stops current playback as well
as preventing new sounds. Discrete keyboard and track adjustments on sliders,
and keyboard resize/collapse actions, play one complete recorded tick. A
synchronous commit therefore cannot cut the tick short. Stepper supports the
same continuous ticking for SDK scrub events, although the current demo does
not expose a scrub handle.

Directional controls declare their action explicitly and play only after an
accepted change. `ButtonGroup` keys use `action: "increment" | "decrement"`;
returning `false` from `onPress` rejects the change and stops a held repeat.
`data-sfx="none"` suppresses automatic click sounds without suppressing hover.
Use `data-sfx-hover="none"` when hover itself should be silent.

Keyboard navigation uses the same tick when focus or the highlighted option
actually moves in menus, selects, comboboxes, tabs, radio and toggle groups,
trees, calendars, toolbars and carousels. Arrow keys, Home/End, PageUp/Down
and supported typeahead follow the component's behavior. Tree expansion and closed-select
typeahead also tick when their state changes. Unchanged boundaries, canceled
navigation and ordinary text-caret movement stay silent. Existing control or
popup feedback takes precedence so one key does not produce a second tick.

Modal content uses `modal-open` / `modal-close` once per actual transition,
including newly mounted portal content. Dialogs, alert dialogs, drawers and
the dialog-based command palette share the source cue. Timings follow the
measured visual movement:

| Surface | Opening sound | Closing sound |
| --- | --- | --- |
| Dialog / alert dialog / command palette | 280 ms | 150 ms |
| Side drawer | 350 ms | 240 ms |
| Bottom / top drawer | 350 ms | 180 ms |
| Reduced motion or FX off | 150 ms | 150 ms |

Dialogs animate for 280/150 ms. The drawer spring formally settles around
490–500 ms, but most opening travel finishes around 290–310 ms; side drawers
leave the viewport around 240 ms and bottom drawers around 170 ms. The audio
therefore follows visible travel rather than the spring's long final settle.
The old 1.51-second playback is no longer used.

Each modal owns its active cue. Reversing direction, starting a drawer drag,
or muting fades the previous cue out promptly. Ordinary modal trigger/close
buttons use the transition cue without a second, longer generic button
recording underneath it; explicit confirmation sounds still apply.

Small popups and informational toasts use the single tick for both `open`
and `close`, replacing the original pop and falling tone. Menu rows tick on
hover, and submenus tick when they open. Ordinary and primary buttons share
the `press` recording. Semantic voice names remain available, so future
recordings can replace an individual interaction without changing its callers.
Voices using the same recording are coalesced within 25 ms; choosing a menu
item and closing its popup together produces one tick.

## Four sounds left to choose

These outcome voices retain their original synthesized sounds while their
recordings remain undecided. The routes are relative to the running site.

| Voice | Current sound | Trigger / test location |
| --- | --- | --- |
| `success` | Two-note rising chime | Success toast, successful copy, Daemon Commit route or Undo agent; `/preview/toast`, `/preview/code-block`, `/daemon` |
| `warning` | Two repeated triangle-wave beeps | Warning toast or a Daemon warning; `/preview/toast`, `/daemon` |
| `error` | Two falling square tones with noise | Error toast; `/preview/toast` |
| `deny` | Low falling square-wave refusal | Refused actions, disabled focusable controls, failed copy, blocked Daemon action |

## Focused checks

With `bun run dev` running at port 5720:

```sh
bun run typecheck
bun scripts/sound-check.mjs
bun run build
```

The browser check instruments real Web Audio buffer starts/stops while driving
the UI. It checks sample identity, hover on controls that suppress automatic
click sounds, pointer and keyboard directions, held repeats, disabled/bounded
controls, menu hover/submenus, typing, voice mappings and continuous-sound
cleanup. Listening remains the final check for
the desired tone and volume. Modal checks also compare effective audio spans
with desktop/mobile motion, reversed sample identity and interruption cleanup.
