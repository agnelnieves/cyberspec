import { Resizable } from "@/registry/cyber/ui/resizable"

export default function ResizableDemo() {
  return (
    <>
      <Resizable
        panes={[
          {
            label: "Routes",
            defaultSize: 38,
            minSize: 24,
            content: (
              <ul>
                <li>Glasswater relay</li>
                <li>Cinder Row drop</li>
                <li>The Stacks, level 9</li>
              </ul>
            ),
          },
          {
            label: "Detail",
            minSize: 30,
            content: (
              <p>
                Rooftop mast over the canal. One guard, changes at four. Dex can hold the van on the east side for six minutes.
              </p>
            ),
          },
        ]}
      />
    </>
  )
}
