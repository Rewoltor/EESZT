# Project Design System Instructions

> [!IMPORTANT]
> **STRICT ADHERENCE REQUIRED**
> All styling changes must follow the centralized design system defined in this project.

## 1. Centralized Tokens
All design tokens (colors, spacing, typography, shadows, border-radius) are located in:
`src/theme/tokens.css`

**DO NOT** define new colors or hardcode hex values in component files or `index.css`.
**ALWAYS** use the CSS variables defined in `tokens.css`.

- ✅ `color: var(--color-text-primary);`
- ❌ `color: #111827;`

## 2. Modifying the Design
If the user requests a change to the color palette, font, or general look-and-feel:
1.  **Edit `src/theme/tokens.css` FIRST.**
2.  Do NOT modify individual components unless the change is specific to that component's layout (not its theme).

## 3. Dark Mode
Dark mode is handled via the `[data-theme='dark']` selector in `tokens.css`.
- Ensure all new variables have a corresponding override in the dark theme block if they differ between modes.

## 4. Component Styling
- Use the utility classes defined in `src/index.css` (e.g., `.btn`, `.card`) where possible.
- If creating new components, rely on `var(...)` for all aesthetic properties.
