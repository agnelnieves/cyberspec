import type { Connect, Plugin } from "vite"
import { siteUrl } from "../src/install"
import { getSitePage, sitePages, type SitePage } from "../src/site-pages"
import { renderHead } from "../src/site-metadata"
import { renderMarkdown, renderPageBody } from "./site-documents"

const canonicalPages = sitePages.filter(page => page.path === page.canonicalPath)

function sectionIndex(title: string, pages: SitePage[]) {
  const links = pages.map(page => `- [${page.heading}](${siteUrl}${page.markdownPath}): ${page.description}`)
  return `# CyberSpec ${title}\n\n${links.join("\n")}\n`
}

const discoveryFiles: Record<string, () => string> = {
  "/robots.txt": () => `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  "/sitemap.xml": () => {
    const urls = canonicalPages.map(page => `  <url><loc>${siteUrl}${page.path}</loc></url>`)
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`
  },
  "/components/llms.txt": () => sectionIndex("components", canonicalPages.filter(page => page.kind === "component")),
  "/examples/llms.txt": () => sectionIndex("example screens", canonicalPages.filter(page => page.kind === "screen")),
  "/sink/llms.txt": () => sectionIndex("kitchen sink", canonicalPages.filter(page => page.kind === "recipe")),
  "/llms-full.txt": () => canonicalPages.map(renderMarkdown).join("\n---\n\n"),
}

function htmlPath(page: SitePage) {
  return page.path === "/" ? "/index.html" : `${page.path}.html`
}

function renderHtml(template: string, page: SitePage) {
  return template
    .replace("<!--cyberspec:head-->", () => renderHead(page))
    .replace('<div id="root"></div>', () => `<div id="root">${renderPageBody(page)}</div>`)
}

// Dev generates documents on request. Preview uses the same URLs but serves
// the actual build artifacts, including on case-sensitive filesystems.
function pageRequests(dev: boolean): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next()
    const url = new URL(req.url || "/", "http://localhost")
    const path = url.pathname.replace(/\/+$/, "") || "/"
    if (path.endsWith(".html")) {
      const page = getSitePage(path === "/index.html" ? "/" : path.slice(0, -5))
      if (page) {
        res.writeHead(308, { Location: page.path + url.search })
        return res.end()
      }
    }
    if (dev && Object.hasOwn(discoveryFiles, path)) {
      res.setHeader("Content-Type", path.endsWith(".xml") ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8")
      return res.end(req.method === "HEAD" ? undefined : discoveryFiles[path]())
    }
    if (/\.md$/i.test(path)) {
      const base = path.slice(0, -3)
      const page = getSitePage(base === "/index" ? "/" : base)
      if (!page) return next()
      res.setHeader("Content-Type", "text/markdown; charset=utf-8")
      res.setHeader("Link", `<${siteUrl}${page.canonicalPath}>; rel="canonical"`)
      if (dev) return res.end(req.method === "HEAD" ? undefined : renderMarkdown(page))
      req.url = page.markdownPath + url.search
    } else {
      const page = getSitePage(path)
      if (page) req.url = (dev ? "/index.html" : htmlPath(page)) + url.search
    }
    next()
  }
}

export function siteOutput(): Plugin {
  return {
    name: "cyberspec-pages",
    enforce: "post",
    configureServer(server) {
      server.middlewares.use(pageRequests(true))
    },
    configurePreviewServer(server) {
      server.middlewares.use(pageRequests(false))
    },
    transformIndexHtml(html, context) {
      if (!context.server || context.path !== "/index.html") return
      const url = new URL(context.originalUrl ?? "/", "http://localhost")
      const page = getSitePage(url.pathname === "/index.html" ? "/" : url.pathname)
      if (page) return renderHtml(html, page)
    },
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const index = bundle["index.html"]
        if (index?.type !== "asset" || typeof index.source !== "string") this.error("Missing built HTML template")
        const template = index.source
        const emit = (path: string, source: string) => {
          this.emitFile({ type: "asset", fileName: path.slice(1), source })
        }
        for (const page of sitePages) {
          const html = renderHtml(template, page)
          if (page.path === "/") index.source = html
          else emit(htmlPath(page), html)
          emit(page.markdownPath, renderMarkdown(page))
        }
        for (const [path, render] of Object.entries(discoveryFiles)) emit(path, render())
      },
    },
  }
}
