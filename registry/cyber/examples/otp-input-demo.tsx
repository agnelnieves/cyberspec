import { OtpInput } from "@/registry/cyber/ui/otp-input"

export default function OtpInputDemo() {
  return (
    <>
      <OtpInput label="Access code" pattern="alphanumeric" defaultValue="7K4" hint="Six characters, sent to your deck by the Vanta relay." />
      <OtpInput label="Vault pin" length={4} defaultValue="0417" error="Pin expired. Request a new one." />
    </>
  )
}
