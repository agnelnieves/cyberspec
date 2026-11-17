import * as React from "react"
import { Tabs as SdkTabs, TabsIndicator, TabsList, TabsPanel, TabsTab, TabsTabIcon } from "@ui-sdk/react/tabs"
import "@/registry/cyber/ui/cyber/tabs.css"

type TabSpec = {
  value: string
  label: string
  icon?: React.ReactNode
  /** A word in a yellow flag after the label, like "New". It's read as part of the tab's name. */
  flag?: string
  disabled?: boolean
  content: React.ReactNode
}

// The navigation along the top of a screen: a row of sections, one open.
//
// - `variant="bar"` is a segmented rule: the open tab reads in the signal
//   color and a bar slides along the rule to it, with a counter at the end
//   of the row that steps to its number. When the row is too narrow for its
//   tabs it scrolls sideways.
// - `variant="key"` makes each tab a cut key that stays lit while it's open,
//   with the tick in its raised corner on. Keys wrap instead of scrolling.
//
// `label` names the row for assistive technology. A panel tears in when its
// tab is chosen, but not the one that's open as the page loads.
function Tabs({
  label,
  tabs,
  variant = "bar",
  ...props
}: Omit<React.ComponentProps<typeof SdkTabs>, "children"> & {
  label: string
  tabs: TabSpec[]
  variant?: "bar" | "key"
}) {
  return (
    <SdkTabs data-kit="tabs" data-variant={variant} {...props}>
      <div data-kit="tabs-bar">
        <TabsList data-kit="tabs-list" aria-label={label}>
          {tabs.map((tab) => (
            <TabsTab
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              data-kit="tabs-tab"
              data-frame={variant === "key" ? "notch br" : undefined}
              data-press-flash=""
            >
              {tab.icon != null && <TabsTabIcon data-kit="tabs-icon">{tab.icon}</TabsTabIcon>}
              {tab.label}
              {tab.flag && <span data-kit="tabs-flag">{tab.flag}</span>}
            </TabsTab>
          ))}
          {variant === "bar" && <TabsIndicator data-kit="tabs-indicator" />}
        </TabsList>
        {/* "02 / 03", counted by the stylesheet from the tabs themselves. */}
        {variant === "bar" && <span data-kit="tabs-count" data-micro aria-hidden />}
      </div>
      {tabs.map((tab) => (
        <TabsPanel key={tab.value} value={tab.value} data-kit="tabs-panel">
          {tab.content}
        </TabsPanel>
      ))}
    </SdkTabs>
  )
}

export { Tabs }
export type { TabSpec }
