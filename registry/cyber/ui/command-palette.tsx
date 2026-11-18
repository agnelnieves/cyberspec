import * as React from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemIcon,
  CommandItemText,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  CommandStatus,
  type CommandActionDetails,
  type CommandData,
} from "@ui-sdk/react/command"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogShortcut,
  DialogTitle,
  DialogTrigger,
  createDialogController,
} from "@ui-sdk/react/dialog"
import { Terminal } from "lucide-react"
import type { ButtonTone } from "@/registry/cyber/ui/button"
import "@/registry/cyber/ui/cyber/button.css"
import "@/registry/cyber/ui/cyber/dialog.css"
import "@/registry/cyber/ui/cyber/command-palette.css"

type PaletteCommand = {
  value: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  keywords?: string[]
  disabled?: boolean
  confirm?: string
}
type PaletteGroup = { label: string; commands: PaletteCommand[] }

const isGroup = (entry: PaletteCommand | PaletteGroup): entry is PaletteGroup => "commands" in entry

// A shell prompt over the page: a key (and Ctrl or Cmd+K) opens it, typing
// after the ">" narrows the commands, and Enter runs the lit one and closes
// it. The foot counts what's left, which is also what a screen reader hears.
//
// - `commands` are flat, or grouped as `{ label, commands }`. A command's
//   `shortcut` ("mod+shift+s") runs it while the palette is open, and
//   `confirm` is a sentence saying what it does, for one an agent must ask a
//   person about first.
// - `onAction` gets the value of the command that ran. Return a Promise to
//   keep the palette open, with the command pending, until it settles.
// - `trigger` labels the key and `title` names the palette. `shortcut` opens
//   it from anywhere on the page; pass null for none.
// - Everything else goes to the SDK's Dialog: `open`, `onOpenChange`,
//   `controller`.
function CommandPalette({
  trigger = "Commands",
  triggerIcon = <Terminal aria-hidden />,
  triggerTone = "secondary",
  title = "Command palette",
  placeholder = "Run a command",
  empty = "No such command.",
  shortcut = "mod+k",
  commands,
  rankResults = false,
  onAction,
  code = "CS-07 // SHELL",
  controller,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  trigger?: React.ReactNode
  triggerIcon?: React.ReactNode
  triggerTone?: ButtonTone
  title?: string
  placeholder?: string
  empty?: string
  shortcut?: string | null
  commands: (PaletteCommand | PaletteGroup)[]
  /** Keep the opening groups, then rank matches across every group as the user types. */
  rankResults?: boolean
  onAction?: (value: string, details: CommandActionDetails) => unknown
  code?: string
}) {
  // Closing goes through a controller, so the dialog can stay uncontrolled
  // and still be shut by a command running.
  const [own] = React.useState(() => createDialogController())
  const dialog = controller ?? own

  const list = React.useMemo(() => {
    const byValue = new Map<string, { command: PaletteCommand; group?: string }>()
    const item = (command: PaletteCommand, group?: string) => {
      byValue.set(command.value, { command, group })
      const { value, label, keywords, disabled, shortcut } = command
      return { value, label, keywords, disabled, shortcut }
    }
    const grouped = commands.map((entry) =>
      isGroup(entry)
        ? { type: "group" as const, label: entry.label, items: entry.commands.map((command) => item(command, entry.label)) }
        : item(entry),
    )
    const flat = grouped.flatMap((entry) => "items" in entry ? entry.items : [entry])
    return { grouped, flat, byValue }
  }, [commands])

  const row = (command: PaletteCommand, group?: string) => (
    <CommandItem
      key={command.value}
      value={command.value}
      label={command.label}
      keywords={command.keywords}
      disabled={command.disabled}
      shortcut={command.shortcut}
      data-kit="popup-item"
      data-agent-confirm={command.confirm}
    >
      <CommandItemIcon data-kit="command-palette-icon">{command.icon}</CommandItemIcon>
      <CommandItemText data-kit="command-palette-text">
        {(text) =>
          text.segments.map((segment, index) =>
            segment.match ? (
              <mark key={index} data-kit="command-palette-match">
                {segment.text}
              </mark>
            ) : (
              segment.text
            ),
          )
        }
      </CommandItemText>
      {group && <span data-kit="popup-shortcut">{group}</span>}
      {command.shortcut && <CommandShortcut data-kit="popup-shortcut" />}
    </CommandItem>
  )

  const renderEntry = (entry: CommandData[number], index: number, showGroup: boolean): React.ReactNode => {
    if (typeof entry !== "string" && "type" in entry) {
      if (entry.type === "separator") return <CommandSeparator key={index} data-kit="popup-separator" />
      return (
        <React.Fragment key={entry.label}>
          {index > 0 && <CommandSeparator data-kit="popup-separator" />}
          <CommandGroup data-kit="command-palette-group">
            <CommandGroupLabel data-kit="popup-label">{entry.label}</CommandGroupLabel>
            {entry.items.map((child, i) => renderEntry(child, i, false))}
          </CommandGroup>
        </React.Fragment>
      )
    }
    const found = list.byValue.get(typeof entry === "string" ? entry : entry.value)
    return found && row(found.command, showGroup ? found.group : undefined)
  }

  return (
    <Dialog controller={dialog} {...props}>
      <DialogTrigger
        data-kit="button"
        data-frame="notch br"
        data-press-flash=""
        data-tone={triggerTone}
        shortcut={shortcut ?? undefined}
      >
        {triggerIcon}
        {trigger}
        {shortcut && <DialogShortcut data-kit="command-palette-kbd" />}
      </DialogTrigger>
      <DialogBackdrop data-kit="backdrop" />
      <DialogContent data-kit="command-palette">
        <span data-micro aria-hidden>
          {code}
        </span>
        <div data-kit="command-palette-surface" data-frame="tr bl">
          <DialogTitle data-sr-only>{title}</DialogTitle>
          <Command
            data-kit="command-palette-command"
            items={rankResults ? list.flat : undefined}
            emptyItems={rankResults ? list.grouped : undefined}
            onAction={(value, details) => {
              const result = onAction?.(value, details)
              if (result instanceof Promise) return result.then(() => void dialog.close())
              dialog.close()
            }}
          >
            {/* Arrow keys keep focus in the input. The prompt line shows
                which field is receiving keystrokes. */}
            <div data-kit="command-palette-prompt">
              <span data-kit="command-palette-glyph" aria-hidden>
                &gt;
              </span>
              <CommandInput aria-label={title} placeholder={placeholder} spellCheck={false} data-focus-quiet="" />
              <DialogClose data-kit="command-palette-key">
                Esc<span data-sr-only> — Close palette</span>
              </DialogClose>
            </div>
            <CommandEmpty data-kit="command-palette-empty">
              <div data-kit="popup-empty">{empty}</div>
            </CommandEmpty>
            <CommandList data-kit="command-palette-list">
              {({ items }) => (rankResults ? items : list.grouped).map((entry, i) => renderEntry(entry, i, rankResults))}
            </CommandList>
            <div data-kit="command-palette-foot">
              <CommandStatus data-kit="command-palette-status">
                {(state) =>
                  state.count > 0 && (
                    <>
                      <span data-kit="value">{String(state.count).padStart(2, "0")}</span>{" "}
                      {state.count === 1 ? "command" : "commands"}
                    </>
                  )
                }
              </CommandStatus>
              <span data-kit="command-palette-hints" aria-hidden>
                <kbd data-kit="command-palette-key">↑↓</kbd> Move
                <kbd data-kit="command-palette-key">↵</kbd> Run
              </span>
            </div>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { CommandPalette }
export type { PaletteCommand, PaletteGroup }
