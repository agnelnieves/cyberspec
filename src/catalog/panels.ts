// Every panel on the catalog page, in order. `name` is the registry item and
// the example file (registry/cyber/examples/<name>-demo.tsx); `uses` lists
// the ui-sdk modules the component is built on ("slider" is
// @ui-sdk/react/slider, "core/observe" is @ui-sdk/core/observe), and an
// empty list marks one that's markup and style only.
type PanelSpec = {
  name: string
  title: string
  uses: string[]
  wide?: boolean
  group: "Actions" | "Fields" | "Choices" | "Pickers" | "Navigation" | "Overlays" | "Layout" | "Data" | "HUD"
}

const panels: PanelSpec[] = [
  // Actions
  { name: "button", title: "Button", uses: ["button"], wide: true, group: "Actions" },
  { name: "button-group", title: "Button group", uses: ["button"], group: "Actions" },
  { name: "toggle", title: "Toggle", uses: ["toggle"], group: "Actions" },
  { name: "toggle-group", title: "Toggle group", uses: ["toggle"], group: "Actions" },
  { name: "toolbar", title: "Toolbar", uses: ["toolbar", "toggle"], wide: true, group: "Actions" },
  { name: "pagination", title: "Pagination", uses: ["pagination"], wide: true, group: "Actions" },
  { name: "key-hint", title: "Key hint", uses: [], group: "Actions" },
  { name: "breadcrumb", title: "Breadcrumb", uses: [], group: "Actions" },

  // Fields
  { name: "text-field", title: "Text field", uses: ["input", "field"], group: "Fields" },
  { name: "textarea", title: "Textarea", uses: ["textarea", "field"], group: "Fields" },
  { name: "password-input", title: "Password input", uses: ["password-input", "field"], group: "Fields" },
  { name: "otp-input", title: "OTP input", uses: ["otp-input", "field"], wide: true, group: "Fields" },
  { name: "stepper", title: "Number stepper", uses: ["number-input", "field"], group: "Fields" },
  { name: "fieldset", title: "Fieldset", uses: ["field"], wide: true, group: "Fields" },

  // Choices
  { name: "switch", title: "Switch", uses: ["switch"], group: "Choices" },
  { name: "checkbox", title: "Checkbox", uses: ["checkbox"], group: "Choices" },
  { name: "radio-group", title: "Radio group", uses: ["radio", "field"], group: "Choices" },
  { name: "segmented-control", title: "Segmented control", uses: ["segmented-control"], wide: true, group: "Choices" },
  { name: "slider", title: "Slider", uses: ["slider", "field"], wide: true, group: "Choices" },
  { name: "rating", title: "Rating", uses: ["rating"], group: "Choices" },
  { name: "choice-list", title: "Choice list", uses: ["radio"], wide: true, group: "Choices" },

  // Pickers
  { name: "select", title: "Select", uses: ["select", "field"], group: "Pickers" },
  { name: "combobox", title: "Combobox", uses: ["combobox"], group: "Pickers" },
  { name: "item-list", title: "Item list", uses: ["listbox"], wide: true, group: "Pickers" },
  { name: "command-palette", title: "Command palette", uses: ["command", "dialog"], group: "Pickers" },
  { name: "tree", title: "Tree", uses: ["tree"], group: "Pickers" },
  { name: "calendar", title: "Calendar", uses: ["calendar"], wide: true, group: "Pickers" },
  { name: "date-picker", title: "Date picker", uses: ["date-picker", "field"], group: "Pickers" },

  // Navigation
  { name: "tabs", title: "Tabs", uses: ["tabs"], wide: true, group: "Navigation" },
  { name: "side-tabs", title: "Side tabs", uses: ["tabs"], wide: true, group: "Navigation" },
  { name: "menu", title: "Menu", uses: ["menu"], group: "Navigation" },
  { name: "context-menu", title: "Context menu", uses: ["menu"], group: "Navigation" },
  { name: "menubar", title: "Menubar", uses: ["menubar", "menu"], wide: true, group: "Navigation" },
  { name: "navbar", title: "Navbar", uses: [], wide: true, group: "Navigation" },

  // Overlays
  { name: "dialog", title: "Dialog", uses: ["dialog"], group: "Overlays" },
  { name: "alert-dialog", title: "Alert dialog", uses: ["alert-dialog"], group: "Overlays" },
  { name: "drawer", title: "Drawer", uses: ["drawer"], group: "Overlays" },
  { name: "popover", title: "Popover", uses: ["popover"], group: "Overlays" },
  { name: "tooltip", title: "Tooltip", uses: ["tooltip"], group: "Overlays" },
  { name: "hover-card", title: "Hover card", uses: ["hover-card"], group: "Overlays" },
  { name: "toast", title: "Toast", uses: ["toast"], group: "Overlays" },

  // Layout
  { name: "panel", title: "Panel", uses: [], wide: true, group: "Layout" },
  { name: "card", title: "Card", uses: [], group: "Layout" },
  { name: "accordion", title: "Accordion", uses: ["accordion"], wide: true, group: "Layout" },
  { name: "collapsible", title: "Collapsible", uses: ["collapsible"], group: "Layout" },
  { name: "resizable", title: "Resizable", uses: ["resizable"], wide: true, group: "Layout" },
  { name: "scroll-area", title: "Scroll area", uses: ["scroll-area"], group: "Layout" },
  { name: "separator", title: "Separator", uses: ["separator"], group: "Layout" },
  { name: "carousel", title: "Carousel", uses: ["carousel"], wide: true, group: "Layout" },

  // Data
  { name: "alert", title: "Alert", uses: [], wide: true, group: "Data" },
  { name: "badge", title: "Badge", uses: [], group: "Data" },
  { name: "avatar", title: "Avatar", uses: ["avatar"], group: "Data" },
  { name: "progress", title: "Progress", uses: ["progress"], group: "Data" },
  { name: "meter", title: "Meter", uses: ["meter"], group: "Data" },
  { name: "skeleton", title: "Skeleton", uses: [], group: "Data" },
  { name: "data-table", title: "Data table", uses: ["checkbox", "menu"], wide: true, group: "Data" },
  { name: "feed", title: "Feed", uses: ["timeline"], group: "Data" },
  { name: "code-block", title: "Code block", uses: ["button"], wide: true, group: "Data" },

  // HUD
  { name: "glitch-text", title: "Glitch text", uses: [], wide: true, group: "HUD" },
  { name: "readout", title: "Readout", uses: [], group: "HUD" },
  { name: "hex-stat", title: "Hex stat", uses: ["button"], wide: true, group: "HUD" },
  { name: "item-slot", title: "Item slot", uses: ["button"], wide: true, group: "HUD" },
  { name: "signal-graph", title: "Signal graph", uses: [], group: "HUD" },
  { name: "loader", title: "Loader", uses: ["progress"], group: "HUD" },
  { name: "holo-card", title: "Holo card", uses: [], group: "HUD" },
  { name: "reticle", title: "Reticle", uses: [], group: "HUD" },
  { name: "micro", title: "Micro-print", uses: [], group: "HUD" },
  { name: "terminal", title: "Terminal", uses: ["scroll-area"], wide: true, group: "HUD" },
  { name: "map", title: "Map", uses: ["core", "radio", "button", "toggle"], wide: true, group: "HUD" },
]

export { panels }
export type { PanelSpec }
