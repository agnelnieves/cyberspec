import http.server
import json
import pathlib
import sys
import time
import urllib.parse

output = pathlib.Path(sys.argv[1])
probe = b"""
(() => {
  const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
  function report() {
    const main = document.querySelector('main');
    if (!main) return;
    const front = document.querySelector('.site-housing');
    const inner = document.querySelector('[data-site-scroll]');
    const frame = document.querySelector('.site-outline.narrow');
    const viewport = window.visualViewport;
    const sample = { scrollY, innerHeight, innerWidth, devicePixelRatio, hash:location.hash,
      ua:navigator.userAgent, innerScroll:inner?.scrollTop,
      viewport: viewport && [viewport.width, viewport.height, viewport.offsetTop, viewport.pageTop],
      screen: [screen.width, screen.height], housing:rect(front), outline:rect(frame),
      panel:rect(document.querySelector('#try-controls')), main:rect(main) };
    fetch('/__sim/metrics', {method:'POST', body:JSON.stringify(sample)}).catch(()=>{});
  }
  setInterval(report, 500);
})();
"""

class Server(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        route = urllib.parse.urlsplit(self.path).path
        if route == "/__sim/probe.js":
            data, mime = probe, "text/javascript"
        elif route == "/" or (not pathlib.Path(route).suffix and not pathlib.Path("dist", route.lstrip("/")).is_file()):
            html = pathlib.Path("dist/index.html").read_bytes()
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
