import { repositoryUrl, siteUrl } from "./install"
import type { SitePage } from "./site-pages"

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function structuredData(page: SitePage) {
  const url = siteUrl + (page.kind === "preview" ? page.path : page.canonicalPath)
  const website = {
    "@type": "WebSite",
    "@id": siteUrl + "/#website",
    url: siteUrl + "/",
    name: "CyberSpec",
    inLanguage: "en",
  }
  const trail = [{ name: "CyberSpec", item: siteUrl + "/" }]
  if (page.kind === "component" || page.kind === "preview") trail.push({ name: "Components", item: siteUrl + "/components" })
  if (page.kind === "screen") trail.push({ name: "Examples", item: siteUrl + "/examples" })
  if (page.kind === "recipe") trail.push({ name: "Kitchen sink", item: siteUrl + "/sink" })
  if (page.kind !== "home") trail.push({ name: page.heading, item: url })

  const breadcrumbs = trail.length > 1 ? {
    "@type": "BreadcrumbList",
    "@id": url + "#breadcrumbs",
    itemListElement: trail.map((entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry })),
  } : undefined
  const webPage = {
    "@type": ["components", "examples", "sink"].includes(page.kind) ? "CollectionPage" : "WebPage",
    "@id": url + "#webpage",
    url,
    name: page.title,
    description: page.description,
    inLanguage: "en",
    isPartOf: { "@id": website["@id"] },
    breadcrumb: breadcrumbs && { "@id": breadcrumbs["@id"] },
    mainEntity: page.kind === "home" ? {
      "@type": "SoftwareSourceCode",
      name: "CyberSpec",
      codeRepository: repositoryUrl,
      programmingLanguage: "TypeScript",
    } : page.kind === "component" ? {
      "@type": "TechArticle",
      headline: page.heading,
      description: page.description,
      articleSection: page.panel.group,
    } : undefined,
  }
  return { "@context": "https://schema.org", "@graph": breadcrumbs ? [website, webPage, breadcrumbs] : [website, webPage] }
}

function meta(name: string, content: string) {
  const key = name.startsWith("og:") ? "property" : "name"
  return `<meta data-page-head ${key}="${name}" content="${escapeHtml(content)}" />`
}

export function renderHead(page: SitePage) {
  const canonical = siteUrl + page.canonicalPath
  const screen = page.kind === "screen" ? page.example : undefined
  const image = screen ? `${siteUrl}/examples/${screen.route}.webp` : siteUrl + "/og-v4.png"
  const imageAlt = screen
    ? `The ${screen.title} example screen in CyberSpec.`
    : "The CyberSpec headline “Cyberpunk interfaces.” beside a red dotted globe with Reykjavík marked in cyan."
  // JSON-LD is parsed as raw script text. A literal '<' could terminate the element.
  const json = JSON.stringify(structuredData(page)).replaceAll("<", "\\u003c")
  return [
    `<title data-page-head data-page-path="${escapeHtml(page.path)}">${escapeHtml(page.title)}</title>`,
    meta("description", page.description),
    `<link data-page-head rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<link data-page-head rel="alternate" type="text/markdown" href="${escapeHtml(page.markdownPath)}" title="Markdown" />`,
    meta("og:type", page.kind === "component" ? "article" : "website"),
    meta("og:url", canonical),
    meta("og:title", page.title),
    meta("og:description", page.description),
    meta("og:image", image),
    meta("og:image:alt", imageAlt),
    meta("og:image:type", screen ? "image/webp" : "image/png"),
    meta("og:image:width", screen ? "1280" : "1200"),
    meta("og:image:height", screen ? "800" : "630"),
    ...(page.kind === "home" ? [
      meta("og:video", siteUrl + "/og-video-v4.mp4"),
      meta("og:video:secure_url", siteUrl + "/og-video-v4.mp4"),
      meta("og:video:type", "video/mp4"),
      meta("og:video:width", "1200"),
      meta("og:video:height", "630"),
    ] : []),
    meta("twitter:title", page.title),
    meta("twitter:description", page.description),
    meta("twitter:image", image),
    meta("twitter:image:alt", imageAlt),
    `<script data-page-head type="application/ld+json">${json}</script>`,
  ].join("\n    ")
}

export function syncPageHead(page: SitePage) {
  if (document.head.querySelector("title")?.dataset.pagePath === page.path) return
  const template = document.createElement("template")
  template.innerHTML = renderHead(page)
  document.head.querySelectorAll("[data-page-head]").forEach(node => node.remove())
  document.head.append(template.content)
}
