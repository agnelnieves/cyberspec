import "./recipe-layout.css"
import { useState } from "react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Barcode } from "@/registry/cyber/ui/micro"
import { OtpInput } from "@/registry/cyber/ui/otp-input"

export default function AccessPass() {
  const [code, setCode] = useState("")
  const [issued, setIssued] = useState(false)
  const [error, setError] = useState("")

  return (
    <form className="sink-stack" onSubmit={(event) => {
      event.preventDefault()
      if (issued) {
        setIssued(false)
        setCode("")
      } else if (code === "0427") {
        setIssued(true)
      } else {
        setError("That code did not match. Try 0427.")
      }
    }}>
      <div className="sink-between"><strong>Studio day pass</strong><Badge tone={issued ? "ok" : "mute"} status>{issued ? "Issued" : "Pending"}</Badge></div>
      <div style={{ borderBlock: "1px dashed var(--cy-line-ctl)", paddingBlock: 12 }}>
        <Barcode value={issued ? "STUDIO-0427" : "GUEST"} size={32} unit={2} />
      </div>
      <OtpInput label="Demo pass code" length={4} pattern="digits" value={code} disabled={issued} error={error}
        hint="Use the studio's sample code, 0427." onValueChange={(next) => {
          setCode(next)
          setError("")
        }} />
      <div className="sink-row"><Button type="submit" size="sm" disabled={code.length < 4}>{issued ? "Reset pass" : "Issue pass"}</Button><span role="status" className="sink-note">{issued ? "Ready for check-in." : ""}</span></div>
    </form>
  )
}
