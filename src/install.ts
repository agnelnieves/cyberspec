// A copied prompt must work outside this browser, including when copied from
// localhost or a deployment preview. Always share the public registry.
const siteUrl = "https://www.cyberspec.dev"
const repositoryUrl = "https://github.com/agnelnieves/cyberspec"
const installCommands = `bunx --bun shadcn@latest registry add '@cyberspec=${siteUrl}/r/{name}.json'
bunx --bun shadcn@latest add @cyberspec/cyber @cyberspec/button`

const installationPrompt = `Install CyberSpec in this project: a cyberpunk component kit for React, built on UI SDK.

Read ${siteUrl}/llms.txt and ${siteUrl}/r/registry.json first. The source and usage examples are at ${repositoryUrl}.

Inspect the project's framework, package manager, React version, components.json, aliases, and global stylesheet. CyberSpec requires React and React DOM 19 or newer; TypeScript projects need @types/react 19.2.10 or newer. If the project is incompatible, explain what needs to change before migrating it.

Configure the @cyberspec registry as ${siteUrl}/r/{name}.json and install the components needed for my request. Start with the foundation and a working button. For Bun:

${installCommands}

Use the equivalent runner for the project's existing package manager. If shadcn is not configured, set it up for the existing framework and aliases. Preserve existing configuration and components. Keep the UI SDK dependency versions declared by the registry items; consult node_modules/@ui-sdk/react/docs/llms.txt for their APIs.

Use the installed components and their real props instead of recreating their appearance. Wrap the relevant interface in the installed Cyber component using the project's configured UI alias. Keep the supplied stylesheet imports and load the configured global CSS. CyberSpec uses plain CSS and needs no additional UI SDK provider. In a React Server Components app, use a "use client" boundary for the interactive interface.

Keep interface sounds opt-in and respect the FX and reduced-motion settings. Check the installed third-party notices before using bundled recordings; the MIT license covers CyberSpec's original code. Run the project's typecheck and production build, verify a rendered component, and summarize the changes and any remaining compatibility issues.`

export { installationPrompt, installCommands, repositoryUrl }
