# CyberSpec launch post

Been building CyberSpec: a cyberpunk component kit for React.

Cut corners, snappy motion, and interface sounds. These are the real components in action.

Built on UI SDK. Sound on 🔊

https://www.cyberspec.dev

## Posting order

I would introduce Specwall first, then post CyberSpec the next day. Specwall establishes the gallery and its range; CyberSpec gets a separate post focused on your own kit. This is an editorial recommendation, not an algorithm or reach prediction.

Before cross-linking, update Specwall's CyberSpec entry: its local metadata still says “In progress” and “no public install,” and is missing the live website/install links. CyberSpec is a theme featured in Specwall, not a product built with Specwall.

## Files

- `cyberspec-loop-with-sound.mp4`: upload this version to X.
- `cyberspec-loop.mp4`: silent master.
- `cyberspec-loop-poster.png`: settled result frame.
- `cyberspec-loop.json`: exact frame count and choreography timestamps.

The video uses actual registry components: Panel, Switch, Checkbox, Slider, Stepper, Button, Badge, Readout, HexStatGroup, HexStat, Terminal, and SignalGraph. It is a representative showcase; the full component catalog is on the site.

## Reproduce

From the CyberSpec project, run `bun run dev`, then:

```sh
bun scripts/render-social.mjs
bun scripts/mix-social-audio.mjs
```

The renderer uses installed Chrome and ffmpeg. Preview the responsive scene at http://127.0.0.1:5720/social.html. The Resend reference and production site are unchanged.
