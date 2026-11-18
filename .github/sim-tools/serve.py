import http.server
import json
import pathlib
import sys
import time
import urllib.parse

output = pathlib.Path(sys.argv[1])
clip_style = b"""
<style id="sim-frame-clip">
  @keyframes sim-frame-clip {
    from { clip-path: inset(var(--clip-top) 0 calc(100% - var(--clip-end)) 0); }
    to { clip-path: inset(calc(var(--clip-top) + var(--clip-range)) 0 calc(100% - var(--clip-end) - var(--clip-range)) 0); }
  }
  [data-site-scroll][data-motion="essential"] {
    animation: sim-frame-clip auto linear both;
    animation-timeline: scroll(root block);
  }
</style>
"""
probe = b"""
(() => {
  const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
  function attachClip(inner, bezel) {
    // Measure only when layout changes. The root scroll timeline drives every swipe.
    const measure = () => {
      const root = document.scrollingElement;
      const contentStart = inner.getBoundingClientRect().top + scrollY;
      const aperture = bezel.getBoundingClientRect();
      const edge = parseFloat(getComputedStyle(bezel).borderTopWidth);
      inner.style.setProperty('--clip-top', (aperture.top + edge - contentStart) + 'px');
      inner.style.setProperty('--clip-end', (aperture.bottom - edge - contentStart) + 'px');
      inner.style.setProperty('--clip-range', (root.scrollHeight - root.clientHeight) + 'px');
    };
    inner.dataset.motion = 'essential';
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [inner, bezel, document.documentElement]) observer.observe(el);
    window.visualViewport?.addEventListener('resize', measure);
  }
  function report() {
    const main = document.querySelector('main');
    if (!main) return;
    const front = document.querySelector('.site-housing');
    const inner = document.querySelector('[data-site-scroll]');
    const frame = document.querySelector('.site-outline.narrow');
    const clip = document.querySelector('#sim-frame-clip') && inner && frame;
    if (clip && !inner.dataset.motion) attachClip(inner, frame.parentElement);
    const viewport = window.visualViewport;
    const sample = { scrollY, innerHeight, innerWidth, devicePixelRatio, hash:location.hash,
      ua:navigator.userAgent, innerScroll:inner?.scrollTop,
      viewport: viewport && [viewport.width, viewport.height, viewport.offsetTop, viewport.pageTop],
      screen: [screen.width, screen.height], housing:rect(front), outline:rect(frame),
      panel:rect(document.querySelector('#try-controls')), main:rect(main) };
    if (clip) sample.testClip = getComputedStyle(inner).clipPath;
    fetch('/__sim/metrics', {method:'POST', body:JSON.stringify(sample)}).catch(()=>{});
  }
  setInterval(report, 500);
})();
"""

class Server(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        route = url.path
        if route == "/__sim/probe.js":
            data, mime = probe, "text/javascript"
        elif route == "/" or (not pathlib.Path(route).suffix and not pathlib.Path("dist", route.lstrip("/")).is_file()):
            html = pathlib.Path("dist/index.html").read_bytes()
            if urllib.parse.parse_qs(url.query).get("frame-test") == ["clip"]:
                html = html.replace(b"</head>", clip_style + b"</head>")
            data = html.replace(b"</body>", b'<script src="/__sim/probe.js"></script></body>')
            mime = "text/html; charset=utf-8"
        else:
            return super().do_GET()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != "/__sim/metrics":
            return self.send_error(404)
        length = int(self.headers.get("Content-Length", "0"))
        if length > 20000:
            return self.send_error(413)
        metric = json.loads(self.rfile.read(length))
        metric["hostTime"] = time.time()
        with open(output / "metrics.jsonl", "a") as out:
            out.write(json.dumps(metric) + "\n")
        self.send_response(204)
        self.end_headers()

def handler(*args, **kwargs):
    return Server(*args, directory="dist", **kwargs)

http.server.ThreadingHTTPServer(("127.0.0.1", 5743), handler).serve_forever()
