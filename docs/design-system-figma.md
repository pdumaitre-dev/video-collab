# Ballet Booster Design System in Figma

The design system is implemented as a live page at `/design-system` and can be captured into Figma via the Figma MCP integration.

## What the page includes

- **Brand** — Tone and intent
- **Color palette** — Surfaces, foreground, accent tokens with hex and usage
- **Surface hierarchy** — Page → panel → card → elevated
- **Typography** — Space Grotesk / Manrope samples (H1–H3, body, caption)
- **Buttons** — Primary, secondary, back variants
- **Borders & radius** — Default, emphasis, control styles
- **Spacing** — Tailwind scale samples

## Capture workflow

1. **Start the dev server:** `npm run dev`
2. **Trigger capture:** Ask the agent to capture the design system to a new Figma file named "Ballet Booster Design System", or use the Figma MCP `generate_figma_design` tool with `outputMode: "newFile"` and `fileName: "Ballet Booster Design System"`.
3. **Open the capture URL:** The tool returns a URL with hash params. Open it in your browser (e.g. `http://localhost:3000/design-system#figmacapture=...`).
4. **Wait for capture:** The page auto-captures when loaded. Poll the tool with the returned `captureId` until status is `completed`.
5. **Open the file:** The response includes a Figma file URL. Open it to view the captured design system.

## Script injection

The root layout injects the Figma capture script (`mcp.figma.com/mcp/html-to-design/capture.js`) in development only. This enables the code-to-canvas capture when you open the page with the capture hash params.
