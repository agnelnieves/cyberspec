import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { preview } from "vite"
import { siteUrl } from "../src/install"
import { sitePages } from "../src/site-pages"

function decodeHtml(value: string) {
  return value.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")
}

// Run with Bun after the production build. No browser or external network is needed.
const server = await preview({ logLevel: "error", preview: { host: "127.0.0.1", port: 0 } })
try {
  const address = server.httpServer.address()
  assert(address && typeof address === "object")
  const origin = `http://127.0.0.1:${address.port}`
  const get = (path: string, method = "GET") => fetch(origin + path, { method })

  async function resource(path: string, type: RegExp) {
    const check = (response: Response) => {
      assert.equal(response.status, 200, path)
      assert.match(response.headers.get("content-type") ?? "", type, path)
    }
    const [response, head] = await Promise.all([get(path), get(path, "HEAD")])
    check(response)
    check(head)
    assert.equal(await head.text(), "", path)
    return response
  }

  const sitemap = await (await resource("/sitemap.xml", /xml/i)).text()
  const sitemapUrls = Array.from(sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g), match => match[1])
  const expectedUrls = new Set(sitePages.map(page => siteUrl + page.canonicalPath))
  assert.deepEqual(sitemapUrls.sort(), [...expectedUrls].sort(), "sitemap canonical URLs")
  const robots = await (await resource("/robots.txt", /text\/plain/i)).text()
  assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "robots.txt sitemap")
  const guide = await (await resource("/llms.txt", /text\/(?:plain|markdown)/i)).text()
  for (const link of ["/index.md", "/components.md", "/examples.md", "/components/llms.txt", "/examples/llms.txt", "/llms-full.txt"]) {
    assert(guide.includes(link), `Missing ${link} in llms.txt`)
  }
  const components = await (await resource("/components/llms.txt", /text\/(?:plain|markdown)/i)).text()
  const examples = await (await resource("/examples/llms.txt", /text\/(?:plain|markdown)/i)).text()
  const full = await (await resource("/llms-full.txt", /text\/(?:plain|markdown)/i)).text()

  for (const page of sitePages) {
    const canonical = siteUrl + page.canonicalPath
    const html = await resource(page.path, /text\/html/i)
    const metadata = { title: "", heading: "", description: "", canonical: "", alternate: "" }
    const parser = new HTMLRewriter()
      .on("title", { text(chunk) { metadata.title += chunk.text } })
      .on("h1", { text(chunk) { metadata.heading += chunk.text } })
      .on("meta[name=description]", { element(el) { metadata.description = el.getAttribute("content") ?? "" } })
      .on('link[rel="canonical"]', { element(el) { metadata.canonical = el.getAttribute("href") ?? "" } })
      .on('link[rel="alternate"][type="text/markdown"]', { element(el) { metadata.alternate = el.getAttribute("href") ?? "" } })
    await parser.transform(html).text()
    assert.equal(decodeHtml(metadata.title), page.title, page.path)
    assert.equal(decodeHtml(metadata.description), page.description, page.path)
    assert.equal(decodeHtml(metadata.heading.trim()), page.heading, page.path)
    assert.equal(metadata.canonical, canonical, page.path)
    assert.equal(new URL(metadata.alternate, siteUrl).href, siteUrl + page.markdownPath, page.path)
    if (page.path === page.canonicalPath) {
      if (page.kind === "component") assert(components.includes(page.markdownPath), page.markdownPath)
      if (page.kind === "screen") assert(examples.includes(page.markdownPath), page.markdownPath)
      assert(full.includes(page.description), `Missing ${page.path} description in llms-full.txt`)
    }

    const disk = await readFile(join("dist", page.markdownPath), "utf8")
    const markdown = await resource(page.markdownPath, /^text\/markdown\b/i)
    assert.equal(await markdown.text(), disk, page.markdownPath)
    assert(disk.startsWith(`# ${page.heading}\n\n${page.description}\n`), page.markdownPath)
    assert(markdown.headers.get("link")?.includes(`<${canonical}>; rel="canonical"`), page.markdownPath)
    const uppercase = page.markdownPath.replace(/\.md$/, ".MD")
    assert.equal(await (await resource(uppercase, /^text\/markdown\b/i)).text(), disk, uppercase)
  }

  const head = await get("/components.MD?from=agent", "HEAD")
  assert.equal(head.status, 200)
  assert.match(head.headers.get("content-type") ?? "", /^text\/markdown\b/i)
  assert.equal(await head.text(), "")
  for (const [path, filename] of [["/.MD", "index.md"], ["/components/sidebar/button/.mD", "components/sidebar/button.md"]]) {
    assert.equal(await (await resource(path, /^text\/markdown\b/i)).text(), await readFile(join("dist", filename), "utf8"), path)
  }
  for (const path of ["/unlisted-page", "/components/sidebar/unlisted-page", "/components/sidebar/unlisted-page.md", "/preview/unlisted-page.MD"]) {
    assert.equal((await get(path)).status, 404, path)
  }
  await resource("/favicon.svg", /image\/svg/i)
  await resource("/examples/archive.webp", /image\/webp/i)
  const item = await (await resource("/r/button.json", /application\/json/i)).json()
  assert.equal(item.name, "button")
  console.log(`Checked HTML and both Markdown extensions for ${sitePages.length} routes, discovery files, assets, and missing routes.`)
} finally {
  await server.close()
}
