import "@fontsource/rajdhani/500.css"
import "@fontsource/rajdhani/600.css"
import "@fontsource/rajdhani/700.css"
import "@fontsource-variable/jetbrains-mono"
import "@/registry/cyber/ui/cyber/skin.css"
import { createRoot } from "react-dom/client"
import { installCyber } from "@/registry/cyber/lib/install"
import RuledBento from "./gold"
import { Reel } from "./reel"
import "./reel.css"

installCyber()
createRoot(document.getElementById("root")!).render(new URLSearchParams(location.search).has("gold") ? <RuledBento /> : <Reel />)
