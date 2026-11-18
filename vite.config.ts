import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { siteOutput } from "./scripts/site-output"

export default defineConfig({
  appType: "mpa",
  plugins: [react(), siteOutput()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  server: { host: "127.0.0.1" },
})
