import { PasswordInput } from "@/registry/cyber/ui/password-input"

export default function PasswordInputDemo() {
  return (
    <>
      <PasswordInput label="Passphrase" defaultValue="lowtide-0417-ghost" hint="Unlocks the deck. Never leaves it." autoComplete="off" required />
      <PasswordInput
        label="Relay key"
        defaultValue="7Hq2-vX9p"
        defaultVisible
        error="Key rejected by the Glasswater relay."
        autoComplete="off"
      />
      <PasswordInput label="Vault phrase" defaultValue="sealed" autoComplete="off" disabled />
    </>
  )
}
