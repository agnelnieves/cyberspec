# Rehearsal: CyberSpec component reel

Gold: Stage Show `ruled-bento`, with the five-tile hierarchy and single leading interaction from Resend's `06-resend-look-baseline`. This version uses the real CyberSpec registry components throughout. It preserves their cut frames, fonts, controls, and native state transitions.

Beats: established deck → switch on → drag signal gain → add a relay → commit → latency/console/signal payoff → explicit Reset → matching opening state. The export duration and sound cue positions are measured from the final renderer manifest, not estimated from authored waits.

## Captured

- 1080 × 1350 export composition; 390px responsive webpage.
- Opening, configuration, commit, payoff, reset, and next-loop state contact sheets.
- Reduced-motion completed poster at 1080 and 390, with all hero buttons inside the frame.
- Native Chrome playback, offscreen pause, hidden-tab pause, restart, reduced-motion toggle and restoration.
- A feed-size downscale of the actual portrait artwork, separate from the responsive webpage check.
- Production build and TypeScript typecheck.

## Layout and motion evidence

Both hero-only gates print `rehearsal passed` with zero never-intentional layout findings. Their overall motion scan remains **inconclusive**, because screenshot sampling missed a few display frames (wide: seven 33ms gaps; phone: two 33ms gaps). These are not reported as a full motion pass.

The separate native-clock check recorded one 4-second sample at 16.7ms median / 16.8ms maximum. A second sample had one 166.6ms scheduling outlier. Both lifecycle and button-containment checks passed. See `output/social/final-hero-native.json` for the measurements.

Whole-grid heuristic findings remain documented: the two hexagonal buttons are treated as individual floating panels, and the SignalGraph's endpoint square/glow is treated as a field outline outside its column. A fresh reviewer inspected the poster and contact sheet and found these to be intentional native component geometry, not clipping/alignment defects. No detector was weakened and no component was hidden or marked to suppress those findings. The user's request to use the real library components governs their appearance.

The first still exposed a real integration issue: Stage Show's unlayered prose reset reverted the library's native buttons. A scoped integration rule now returns native elements to the CyberSpec cascade layers. The initial panel footer overflow was fixed by giving the hero sufficient height and tightening its content layout. The former flex-wrapped toggle row is now a grid.

The independent review requested larger essential text at phone-feed size. Hero control tokens and console text were enlarged; console lines were shortened. Button/status footprints remain stable across their labels. Decorative metadata is intentionally subordinate.

## Export verification

The recorder warms through a complete story before capturing the next cycle. A startup layout restart is not accepted as a completed loop. Completion requires the payoff and explicit loop-end marks. The repeated endpoint is excluded from the MP4, and endpoint PNGs are retained for seam comparison.

Audio is mixed offline from the actual embedded PCM samples. The adjustment cue begins on the first changed slider value and ends at the drag's end marker. The sound mix preserves the engine's relative gains, uses one common mastering gain, and leaves silence around the loop boundary. Final duration, encoding, peak, and seam results are recorded alongside the export.

Final verified export: **356 frames / 11.866667 seconds, 1080 × 1350, 30fps, H.264 / yuv420p**. The source seam images have **zero differing pixels**. The AAC stereo track is 48kHz, with measured true peak **−3.2 dBTP**; adding audio preserves the encoded video packets exactly. The slider sound runs from **2.566667 to 3.366667 seconds**, with a short release. Other cues occur at 1.466667, 4.066667, 4.9, and 10.266667 seconds.

The final encoded-frame review caught a real drag defect: Act's cursor path is eased, while its progress callback is raw. The scene now derives the slider value from the cursor's measured x-position on the rail. The replacement export was checked at intermediate drag frames and the endpoints remain identical. Capture warms through a complete **painted** cycle, allowing native observer/layout work to settle before the exported cycle begins.

## Limits

- The full catalog is represented by twelve imported component exports; this is not a frame containing every catalog entry.
- No physical phone, X upload/transcode, Safari, or Firefox test was performed.
- Audio verification covers source selection, event timing, peak measurements, and encoding; no listening judgment is claimed.
- The production page and the Resend reference were not edited or deployed.
