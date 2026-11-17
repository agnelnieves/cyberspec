import { Avatar, AvatarStack } from "@/registry/cyber/ui/avatar"

// A portrait drawn here rather than fetched: a greyscale bust, which the
// avatar prints in the theme's two tones once it loads.
const portrait =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#161616"/>
      <path d="M0 64 6 51l18-7h16l18 7 6 13z" fill="#5c5c5c"/>
      <path d="M25 36h14v9l-7 5-7-5z" fill="#8f8f8f"/>
      <path d="m20 17 12-8 12 8 1 14-7 9H26l-7-9z" fill="#dcdcdc"/>
      <path d="M17 20 32 5l15 15-1 7-6-10H24l-6 10z" fill="#2e2e2e"/>
      <path d="M21 24h22v6H21z" fill="#fff"/>
      <path d="M21 24h22v2H21z" fill="#4a4a4a"/>
    </svg>`,
  )

export default function AvatarDemo() {
  return (
    <>
      <Avatar name="Sable Quinn" src={portrait} size="lg" status="online" />
      <Avatar name="Mara Voss" size="lg" shape="hex" status="busy" />
      <Avatar name="Ilya Brandt" status="away" />
      <Avatar name="Juno Okafor" shape="hex" status="offline" />
      <Avatar name="Dex Marlowe" size="sm" />
      <AvatarStack label="Crew on this job" max={4}>
        <Avatar name="Mara Voss" />
        <Avatar name="Ren Aoki" />
        <Avatar name="Dex Marlowe" />
        <Avatar name="Juno Okafor" />
        <Avatar name="Ilya Brandt" />
        <Avatar name="Sable Quinn" />
      </AvatarStack>
    </>
  )
}
