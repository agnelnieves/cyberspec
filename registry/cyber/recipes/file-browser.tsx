import { useState } from "react"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { Tree } from "@/registry/cyber/ui/tree"
import "./recipe-layout.css"

const folders = [
  { value: "routes", label: "routes", files: [
    { name: "ferry.json", content: '{\n  "dock": "Glasswater",\n  "first_departure": "05:40"\n}' },
    { name: "footbridge.json", content: '{\n  "crossing": "South span",\n  "clearance_m": 12\n}' },
  ] },
  { value: "shifts", label: "shifts", files: [
    { name: "night.json", content: '{\n  "lead": "Ilya Brandt",\n  "handoff": "05:15"\n}' },
    { name: "day.json", content: '{\n  "lead": "Mara Voss",\n  "handoff": "17:15"\n}' },
  ] },
]
const tree = folders.map(folder => ({
  value: folder.value, label: folder.label,
  children: folder.files.map(file => ({ value: file.name, label: file.name })),
}))
const files = folders.flatMap(folder => folder.files)

export default function FileBrowser() {
  const [selection, setSelection] = useState(files[0].name)
  const file = files.find(entry => entry.name === selection)
  const folder = folders.find(entry => entry.value === selection)

  return (
    <div className="sink-stack">
      <Tree label="Station files" items={tree} defaultExpanded={["routes"]} value={selection}
        onValueChange={next => { if (next) setSelection(next) }} />
      {file ? <CodeBlock language="json" filename={file.name} label={`Contents of ${file.name}`}
        code={file.content} numbers={false} /> :
        <p className="sink-note">{folder?.label} contains {folder?.files.length} files. Open a file to inspect its contents.</p>}
    </div>
  )
}
