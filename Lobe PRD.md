# LOBE — Full Project Build Guide
> A personal knowledge OS. Built with Next.js 14 + Supabase + TypeScript.
> Generated phase by phase for Cursor Pro.

---

## HOW TO USE THIS DOCUMENT WITH CURSOR

### The Golden Rules
1. **Never paste the whole file into Cursor.** Feed it phase by phase, one task at a time.
2. **Start every Cursor session** by saying: *"I'm building Lobe — a personal knowledge OS and second brain for the web. Here is my full context: [paste the top-level stack + design system section]. Now let's work on Phase X, Task Y."*
3. **After each task**, ask Cursor: *"Does this conflict with anything we already built? Check imports, type definitions, and Supabase schema."*
4. **Use Cursor's Plan Mode** for any task involving 3+ files. Let it draft `feature-prd.md` first (like in the screenshots you sent), then approve before it codes.
5. **Use `.cursorrules`** — a file at project root that tells Cursor your conventions at all times. The content for this file is at the end of this document.
6. **Commit after every completed task.** One task = one git commit. Treat your git log as your undo history.
7. For database schema tasks, always tell Cursor: *"Output the full SQL migration file, not just the diff."*

---

## DESIGN SYSTEM (Paste this into every new Cursor session)

### Philosophy
Clean, professional, editorial-minimal. Inspired by Linear, Supabase, and Cursor's own UI. No color gradients. No rounded pill buttons. No playful illustrations. Think: tools built for people who think seriously.

### Typography
```
Display / Headings: "Instrument Serif" or "JUST Sans" — fallback: Georgia, serif
Body / UI: "DM Sans" — fallback: system-ui, sans-serif
Mono: "Geist Mono" or "JetBrains Mono"
```

### Color Tokens
```css
:root {
  /* Base */
  --bg-0: #0a0a0a;       /* deepest background */
  --bg-1: #111111;       /* sidebar / panel bg */
  --bg-2: #1a1a1a;       /* card / block bg */
  --bg-3: #222222;       /* hover states */
  --bg-4: #2a2a2a;       /* active / selected */

  /* Borders */
  --border-subtle: #1f1f1f;
  --border-default: #2e2e2e;
  --border-strong: #3d3d3d;

  /* Text */
  --text-primary: #f0f0f0;
  --text-secondary: #888888;
  --text-tertiary: #555555;
  --text-placeholder: #3a3a3a;

  /* Accent (one per theme) */
  --accent: #e8e8e8;
  --accent-muted: #333333;

  /* Semantic colors */
  --color-red: #e05252;
  --color-orange: #e07842;
  --color-yellow: #d4a847;
  --color-green: #52a869;
  --color-teal: #3d9e8c;
  --color-blue: #4a7ce0;
  --color-purple: #8b5cf6;
  --color-pink: #d45c8a;
  --color-gray: #666666;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);

  /* Transitions */
  --transition-fast: 80ms ease;
  --transition-default: 150ms ease;
}
```

### Component Rules
- Borders: `1px solid var(--border-default)` — no double borders, no thick outlines
- Buttons: flat bg, no shadow, hover = `--bg-3`, active = `--bg-4`
- Inputs: `bg: --bg-2`, border, no shadow, focused = `--border-strong`
- Icons: Lucide React, 16px for inline, 18px for sidebar, 20px for toolbar
- Corner radius: `--radius-sm` for buttons/inputs, `--radius-md` for cards/panels
- No gradients anywhere except optional very subtle `linear-gradient(180deg, --bg-1, --bg-0)` for sidebar
- Font weights: 400 body, 500 labels, 600 headings, never 700+ except display titles

---

## STACK

```
Framework:       Next.js 14 (App Router)
Language:        TypeScript (strict mode)
Styling:         Tailwind CSS v3 + CSS variables (no Tailwind colors used directly)
UI primitives:   Radix UI (unstyled) + custom components
Icons:           Lucide React
Rich text:       BlockNote or Tiptap with custom extensions
Database:        Supabase (PostgreSQL)
Auth:            Supabase Auth
Realtime:        Supabase Realtime channels
Storage:         Supabase Storage
State:           Zustand (global) + React Query / TanStack Query (server state)
Drag & Drop:     @dnd-kit/core
Dates:           date-fns
Search:          Fuse.js (local) + Supabase full-text search
Animations:      Framer Motion (minimal, purposeful)
Deploy:          Vercel
```

---

## PROJECT STRUCTURE

```
/app
  /(auth)
    /login
    /signup
    /onboarding
  /(workspace)
    /[workspaceSlug]
      /page.tsx               ← workspace home (defaults to Space view)
      /[sectionId]
        /page.tsx             ← section / article view
      /settings
        /page.tsx
  /api
    /...
/components
  /ui                         ← design system primitives
  /editor                     ← block editor
  /nav                        ← sidebar + workspace view bar
  /workspace-views            ← Space, Time, Mind, Tree, Focus, Atlas, Pulse
  /section-views              ← Grid, Board, Stream, Gallery, Chart, Map, Timetable
  /blocks                     ← individual block types
  /mind                       ← Mind workspace view
  /modals
  /command                    ← command palette
/lib
  /supabase
  /hooks
  /utils
  /store                      ← zustand stores
  /types
/supabase
  /migrations                 ← all .sql migration files
```

---

# PHASE 0 — PROJECT BOOTSTRAP

## Task 0.1 — Init Next.js + Tooling
```
Prompt to Cursor:
"Create a new Next.js 14 app with TypeScript (strict), Tailwind CSS, ESLint, Prettier.
Install: @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query lucide-react
framer-motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover
@radix-ui/react-tooltip @radix-ui/react-context-menu @dnd-kit/core @dnd-kit/sortable
@dnd-kit/utilities date-fns fuse.js clsx tailwind-merge.

Set up the folder structure as specified in my project PRD.
Create a /lib/utils.ts with a cn() helper using clsx and tailwind-merge.
Create a global CSS file at /app/globals.css with the full design system CSS variables.
Set up Tailwind to use CSS variable-based colors only (no hardcoded Tailwind color classes).
Output the full tailwind.config.ts."
```

## Task 0.2 — Design System Components
```
Prompt to Cursor:
"Build the base UI component library in /components/ui/.
Components needed (all unstyled with Radix, styled with our CSS variables):
- Button (variants: default, ghost, destructive, outline; sizes: sm, md, lg)
- Input
- Textarea
- Badge (with color prop matching our 9 semantic colors)
- Tooltip
- Dropdown Menu
- Context Menu
- Dialog / Modal
- Popover
- Separator/Divider
- Avatar
- Kbd (keyboard shortcut display)
- Spinner / Loader
- ScrollArea

Rules:
- No Tailwind color classes. Only var(--...) CSS variables.
- All components must accept className prop.
- Dark theme only for now.
- Export everything from /components/ui/index.ts"
```

## Task 0.3 — Supabase Setup
```
Prompt to Cursor:
"Set up Supabase client in /lib/supabase/.
Create:
- client.ts (browser client using createBrowserClient from @supabase/ssr)
- server.ts (server client using createServerClient)
- middleware.ts at project root for session refresh
- /lib/types/database.types.ts with the full Database type (leave tables empty for now, we'll fill as we build)

Set up environment variables schema in /lib/env.ts with zod validation for:
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

## Task 0.4 — Auth System
```
Prompt to Cursor:
"Build the full auth flow:

Supabase migration (create file /supabase/migrations/001_auth_profiles.sql):
- profiles table: id (uuid, FK to auth.users), email, full_name, avatar_url, 
  username (unique), created_at, updated_at
- RLS: users can only read/write their own profile
- Trigger: auto-create profile on auth.users insert

Pages:
- /app/(auth)/login/page.tsx — email+password + magic link toggle
- /app/(auth)/signup/page.tsx — email, password, full_name
- /app/(auth)/onboarding/page.tsx — set username, workspace name, choose theme

Components:
- /components/auth/AuthForm.tsx
- /components/auth/OnboardingFlow.tsx (multi-step)

Hooks:
- /lib/hooks/useUser.ts — returns current user + profile
- /lib/hooks/useAuth.ts — login, signup, logout, resetPassword

Design: dark background, centered card, thin border, DM Sans, minimal."
```

---

# PHASE 1 — WORKSPACE + SIDEBAR

## Task 1.1 — Workspace Schema
```
Prompt to Cursor:
"Create Supabase migration /supabase/migrations/002_workspaces.sql:

Tables:
- workspaces: id, slug (unique), name, icon (emoji string), icon_type (emoji|image),
  cover_url, description, owner_id (FK profiles), plan (free|pro), 
  created_at, updated_at
- workspace_members: id, workspace_id, user_id, role (owner|admin|editor|viewer|commenter),
  joined_at
- workspace_invites: id, workspace_id, email, role, token (unique), expires_at, 
  created_by, used_at

RLS:
- workspace visible to members only
- owner can do all
- admin can manage members
- editor can read/write pages
- viewer can read only

Functions:
- get_user_workspaces(user_id) — returns all workspaces user is member of
- create_workspace_with_owner(name, slug, user_id) — creates workspace + owner membership atomically"
```

## Task 1.2 — Section & Article Schema
```
Prompt to Cursor:
"Create Supabase migration /supabase/migrations/003_sections.sql:

Lobe terminology:
- Section = a container that holds other sections or articles. Has a property schema.
- Article = a leaf-level rich document with properties inherited from its parent section.
- Both are stored in the same 'nodes' table with a type discriminator.

Tables:
- nodes: 
    id uuid PK
    workspace_id FK
    parent_id FK (self-referential, nullable — null = root section)
    type text ('section' | 'article')
    created_by FK profiles
    title text default 'Untitled'
    icon text (emoji or null)
    icon_type text (emoji|image|lucide)
    cover_url text
    content jsonb (block editor JSON — only used for articles)
    schema jsonb (property schema — only used for sections, inherited by child articles)
      Schema format: [{id, name, type, options, icon, description, required, default_value}]
    is_deleted boolean default false
    deleted_at timestamptz
    is_archived boolean default false
    is_published boolean default false
    published_slug text unique
    sort_order float8
    depth int generated (computed from parent chain)
    word_count int
    color text (one of 9 semantic color names, nullable)
    created_at, updated_at

- node_properties:
    id, node_id FK, key, 
    value_type (text|number|date|boolean|select|multi_select|
    relation|url|email|phone|person|file|checkbox|formula|rollup|
    created_time|last_edited_time|created_by|last_edited_by|location),
    value jsonb, created_at

RLS:
- Nodes inherit workspace membership permissions
- Deleted nodes only visible to owner/admin for restore
- Published nodes are publicly readable

Indexes:
- nodes(workspace_id, parent_id)
- nodes(workspace_id, type, is_deleted)
- Full-text search index on nodes(title, content)

Functions:
- get_section_tree(workspace_id) — recursive CTE returning full tree with depth
- get_section_articles(section_id) — returns all direct article children
- soft_delete_node(node_id) — marks node + all children deleted
- restore_node(node_id)
- get_inherited_schema(node_id) — walks up parent chain, merges schemas"
```

## Task 1.3 — Nav Panel + Workspace View Bar
```
Prompt to Cursor:
"Build the main application navigation in /components/nav/.

PART A — Workspace View Bar
This is a horizontal bar pinned to the very top of the app, above everything including the sidebar.
It is the primary way users switch between how they see their entire workspace.

Build /components/nav/WorkspaceViewBar.tsx:
- Fixed at top of the screen, full width, height 40px
- Left side: Lobe wordmark / workspace name
- Center: 7 view pills in a row, the active one highlighted
  [🌐 Space] [🕐 Time] [🧠 Mind] [🌲 Tree] [📋 Focus] [🗺️ Atlas] [📊 Pulse]
- Right side: search icon, notifications, user avatar
- Active view pill: filled background (--bg-3), all others: ghost
- Keyboard shortcuts: Cmd+1 through Cmd+7 to switch views
- Smooth crossfade transition (150ms) when switching views
- Store active workspace view in useWorkspaceViewStore (zustand)
- The view bar is always visible regardless of which workspace view is active

The 7 workspace views:
1. Space   — full-canvas section landscape (default home view)
2. Time    — everything on a scrollable timeline
3. Mind    — knowledge graph of all articles and their connections
4. Tree    — hierarchical outline of all sections + articles (fullscreen)
5. Focus   — Lobe-computed priority list of what matters right now
6. Atlas   — geographic map of all articles with a location property
7. Pulse   — auto-generated metrics dashboard from numeric/status properties

PART B — Side Panel (left sidebar)
Build /components/nav/SidePanel.tsx:
- Sits below the workspace view bar on the left
- Width: 240px expanded / 52px collapsed
- Shows the section tree (sections and articles as nested items)
- SidePanelHeader.tsx — workspace switcher + collapse toggle
- SidePanelSection.tsx — collapsible group with label
- SidePanelItem.tsx — single item: icon, label, indent, hover actions
- SidePanelTree.tsx — recursive tree of sections/articles
- SidePanelPinned.tsx — pinned/starred items
- SidePanelPrivate.tsx — private sections (creator-only)
- SidePanelTrash.tsx — trash at bottom
- SidePanelNewSection.tsx — + New Section button at bottom

Behaviors:
- Drag to reorder within same parent
- Drag to nest (drag over an item = make it a child)
- Right-click context menu: rename, add sub-section, add article, duplicate,
  move to, copy link, pin, archive, delete
- Keyboard: ArrowUp/Down to navigate, Enter to open, F2 to rename
- Collapse/expand, remember in localStorage
- Hover reveals drag handle left, action buttons right (⋯ and +)
- Icon click = emoji/icon picker

State: useSectionTreeStore (zustand) — manages tree, optimistic updates
Realtime: subscribe to nodes changes via Supabase Realtime"
```

## Task 1.4 — Command Palette
```
Prompt to Cursor:
"Build a command palette /components/command/CommandPalette.tsx.

Trigger: Cmd+K (or Ctrl+K)

Sections:
- Recent articles and sections
- Quick actions: New Section, New Article, Search, Go to Settings
- Navigation (fuzzy search across all section + article titles)
- Block type insertion (when cursor is in the editor)
- Settings shortcuts

Features:
- Fuzzy search with Fuse.js
- Keyboard navigation (arrows + enter)
- Groups with labels
- Icons per item
- Breadcrumb path (e.g. 'Work > Projects > Q4')
- Cmd+K opens, Escape closes
- Debounced search, 150ms

Use Radix Dialog for the modal overlay.
Design: floating panel, --bg-1 background, thin border, search input at top,
results list below, selected item has --bg-3 background."
```

---

# PHASE 2 — BLOCK EDITOR (CORE)

## Task 2.1 — Editor Setup
```
Prompt to Cursor:
"Set up BlockNote editor in /components/editor/.

Install: @blocknote/core @blocknote/react @blocknote/mantine (we'll override styles)

Create:
- EditorRoot.tsx — main editor wrapper
  Props: articleId, initialContent, editable (boolean), onUpdate callback
  Features: 
    - Auto-save on change (debounced 500ms) → upsert to nodes.content
    - Optimistic saves with conflict detection
    - Offline queue (save to localStorage, sync on reconnect)
    - Word count tracking → update nodes.word_count

- EditorToolbar.tsx — floating toolbar on text selection
  Options: Bold, Italic, Underline, Strikethrough, Code, 
  Link, Color picker (text + highlight), Comment

- BlockMenu.tsx — the '/' slash command menu
  All block types listed below

- EditorTitle.tsx — the article title input above the editor
  - Auto-resize textarea
  - Font: JUST Sans or Instrument Serif, large (2.5rem)
  - Updates nodes.title on change (debounced)
  - Emoji/icon picker on click of icon beside title
  - Cover image add button (appears on hover)
  - Below title: property header strip (inherited section properties, editable inline)

CSS: Override all BlockNote default styles to match our design system.
The editor area should have max-width 720px, centered, generous line-height (1.7),
DM Sans body text, paragraph spacing 0.5rem."
```

## Task 2.2 — Block Types: Text & Lists
```
Prompt to Cursor:
"Implement the following block types as BlockNote custom blocks or Tiptap extensions.
Each block must be insertable via '/' slash command.

TEXT BLOCKS:
1. Paragraph — default, DM Sans, 15px, --text-primary
2. Heading 1 — JUST Sans or Instrument Serif, 2rem, --text-primary, toggle-able 
   (click chevron = collapse content below until next same-level heading)
3. Heading 2 — 1.5rem, toggle-able
4. Heading 3 — 1.25rem, toggle-able
5. Toggle Block — triangle arrow, click to expand/collapse nested content
6. Quote — left border 3px --border-strong, slightly indented, italic
7. Callout — rounded box with emoji icon + text, background --bg-2, 
   customizable border color from our 9 semantic colors
8. Divider — thin 1px --border-default line
9. Code Block — syntax highlighted (Shiki), language selector dropdown, 
   copy button, line numbers

LIST BLOCKS:
10. Bulleted List — custom bullet (square •, not round)
11. Numbered List
12. Todo/Checkbox List — checkbox with checked/unchecked state, 
    checked items get strikethrough + dimmed text
    Sections: todo list can have section labels (bold text row, not a checkbox)

INLINE:
13. Inline Code — monospace, --bg-2 bg, --border-default border, slight padding
14. Link — underline on hover only, opens in new tab, 
    popover to edit/open/copy/unlink
15. Mention (@name) — highlights person from workspace members
16. Article Link ([[title]]) — inline article reference, shows icon + title,
    hover = preview popover"
```

## Task 2.3 — Block Types: Media & Embeds
```
Prompt to Cursor:
"Implement media block types:

17. Image Block
    - Upload from device → Supabase Storage
    - Embed by URL
    - Caption text below
    - Resize handles (drag corners)
    - Alignment: left, center, right, full-width
    - Alt text setting

18. Video Block  
    - Upload (Supabase Storage) or URL embed
    - Supports YouTube, Vimeo (oEmbed)
    - Caption

19. Audio Block
    - Upload (Supabase Storage)
    - Custom minimal player (play/pause, progress bar, time)

20. File Block
    - Upload any file type → Supabase Storage
    - Shows: file type icon, filename, size, download button

21. Web Bookmark
    - Input URL → fetch OG metadata via API route /api/og-fetch
    - Display: large card with title, description, favicon, domain, og image
    - Design: matches the Supabase 'Explore our other products' cards in the screenshot

22. Embed Block  
    - Supported: Figma, CodePen, Google Maps, YouTube, Twitter/X, GitHub Gist,
      Loom, Miro, Google Docs/Sheets/Slides (view)
    - Input URL → detect platform → render iframe or oEmbed
    - Resize handle for iframe height

23. Table (Simple)
    - Grid of cells, add/remove rows/columns
    - Cell types: text, number, checkbox
    - NOT the full section Grid view (that's Phase 5)
    - Sortable columns header click"
```

## Task 2.4 — Block Types: Advanced
```
Prompt to Cursor:
"Implement advanced block types:

24. Math Block (block-level)
    - Input LaTeX → render with KaTeX
    - Toggle edit/preview mode

25. Inline Math
    - $...$ syntax → KaTeX inline render

26. Column Layout Block
    - Drag to create columns (1-4)
    - Each column is a nested block container
    - Drag blocks between columns
    - Resize columns by dragging divider

27. Synced Block
    - A block whose content is synced across articles
    - Create: 'Create synced copy' → generates sync_block record in DB
    - Other articles: 'Link synced block' using block ID
    - Visual: subtle green border/badge to indicate sync

28. Button Block
    - Label, icon (optional), action type:
      - Open URL
      - Create new article (from template)
      - Toggle visibility of block below
    - Style options: outline, filled, ghost

29. Previewed Link Section (like the screenshot showing 'Authentication', 'Storage' cards)
    - Drag any article or section into this block
    - Displays as card: icon, title, description (from article meta),
      'Open' and 'About' style buttons
    - Multiple can be arranged in a grid (2-3 columns)

30. Breadcrumb Block  
    - Auto shows: Workspace > Parent Section > Current Article
    - Clickable links
    - Can be placed anywhere in document

31. Table of Contents Block
    - Auto-generated from H1/H2/H3 in current article
    - Click to jump, highlights current section while scrolling"
```

---

# PHASE 3 — WORKSPACE VIEWS SYSTEM

## Task 3.0 — Workspace Views Architecture
```
Prompt to Cursor:
"Build the workspace-level views system in /components/workspace-views/.

IMPORTANT DISTINCTION:
- Workspace Views = how you see your ENTIRE workspace (all sections + articles)
  These live in /components/workspace-views/
- Section Views = how you see data INSIDE one section
  These live in /components/section-views/

The WorkspaceViewBar (built in Task 1.3) switches between workspace views.
All 7 workspace views receive the same data: the full section/article tree + all properties.
Switching view changes visualisation only — no data is lost or filtered by default.

Create /lib/types/workspace-views.ts:
- WorkspaceViewType: 'space' | 'time' | 'mind' | 'tree' | 'focus' | 'atlas' | 'pulse'
- WorkspaceViewState: per-view persisted UI state (zoom level, pan position, filters, etc.)

Create /components/workspace-views/WorkspaceViewContainer.tsx:
- Reads activeView from useWorkspaceViewStore
- Lazy-loads the correct view component
- Passes workspace data down
- Handles transitions between views (150ms crossfade)
- Global filter bar at top of each view:
  - Filter by section, by property value, by date range, by assignee
  - Filters persist per view in localStorage
  - Clear all filters button

Store: useWorkspaceViewStore (zustand):
- activeView: WorkspaceViewType
- viewStates: Record<WorkspaceViewType, WorkspaceViewState>
- globalFilters: FilterRule[]"
```

## Task 3.1 — Space View
```
Prompt to Cursor:
"Build the Space workspace view /components/workspace-views/SpaceView.tsx.

Concept: The default home view. Your workspace as a zoomable landscape.
Sections are territories. Articles are items within territories.
Activity = brightness. Inactivity = fade.

Implementation: React Flow (@xyflow/react)

Layout:
- Each root section = a large rounded container node
- Sub-sections = smaller container nodes nested inside parent
- Articles = small leaf nodes inside their parent section
- Connections = lines between articles that link to each other
- Sections with many articles appear larger/denser

Node types:
- SectionNode: rounded rect, label at top, shows child count
  Color tint from section's color property
- ArticleNode: small card, icon + title, last-edited indicator
  Warm glow = edited recently, fades to dim if untouched >30 days
- PrivateNode: dimmed + lock icon

Interactions:
- Click article node → open article in editor panel (slides in from right)
- Click section node → zoom into that section
- Double-click section → rename inline
- Drag node → reorder (updates sort_order)
- Right-click → context menu
- Scroll/pinch → zoom
- Drag background → pan
- Mini-map bottom-right
- 'Fit to screen' button
- Collapse section (toggle hides children, shows count badge)

Features:
- Search/highlight: type to dim non-matching nodes
- Color filter: filter by section color
- 'New Section' button floating bottom-right
- Export as PNG"
```

## Task 3.2 — Time View
```
Prompt to Cursor:
"Build the Time workspace view /components/workspace-views/TimeView.tsx.

Concept: Your entire workspace unrolled onto a single timeline.
Every article, every section, every property with a date — all plotted chronologically.
Past on the left, future on the right.

Layout:
- Horizontal timeline axis, infinite scroll left/right
- Zoom levels: Day | Week | Month | Quarter | Year (toggle at top)
- Today line (vertical, highlighted)
- Rows: one row per section (collapsible). Articles plotted as events in their section row.
- Event bar width = duration if start+end date exist, point dot if only one date

What gets plotted:
- Articles with any date property → plotted at that date
- Articles with start+end date → shown as a bar spanning duration
- Reminder events (from Phase 5) → shown in a dedicated top row
- Section creation dates → subtle markers on the section row header

Interactions:
- Click event → open article in side panel
- Drag event → update the date property
- Drag event edge → update end date
- Click empty slot in a section row → create new article at that date
- Hover event → tooltip: title, all date properties, section breadcrumb

Filter bar above timeline:
- Show/hide sections (toggle per section)
- Filter by date property (which date property to use for plotting)
- Show only: articles with dates | all articles (undated shown at left edge)

Design:
- Section rows separated by subtle horizontal lines
- Section label fixed on left side (sticky)
- Today's date column slightly highlighted
- Zoom transitions are smooth (framer-motion layout animation)"
```

## Task 3.3 — Mind View (Workspace)
```
Prompt to Cursor:
"Build the Mind workspace view /components/workspace-views/MindView.tsx.

Concept: Your workspace as a knowledge graph. Articles are nodes.
Connections are edges — formed by article links, @mentions, shared property values,
and co-occurrence in time. Sections are loose visual clusters, not rigid boxes.

Difference from Space View:
- Space shows STRUCTURE (where things live in the hierarchy)
- Mind shows MEANING (how things actually relate to each other)
An article in 'Work > Projects' and one in 'Learning > Books' might be
far apart in Space but directly connected in Mind if one references the other.

Implementation: React Flow with force-directed layout (@xyflow/react + custom layout)

Node types:
- Article node: circle or small rounded rect, icon + title
  Size scales with number of connections (more connected = larger)
  Color from parent section's color
- Section cluster: soft translucent background region, label
  Not a hard boundary — articles can appear outside their cluster if more
  strongly connected to nodes in another cluster

Edge types:
- Article link: solid line (article explicitly links to another)
- Mention: dashed line (article @mentions another article)
- Shared property: dotted line (two articles share same select value or person)
- Temporal: faint line (two articles created/edited within same week)

Interactions:
- Click node → open article in side panel
- Hover node → highlight all direct connections, dim everything else
- Drag to reposition node (manual layout override)
- Click edge → show edge info (why are these connected?)
- Search → highlight matching nodes, dim others
- Zoom + pan (React Flow default)
- Mini-map bottom-right

Controls:
- Edge type toggles (show/hide each connection type)
- Cluster by: section | date created | assignee | tag
- Isolate section: filter to only show one section's articles + their connections
- 'New connection': click drag from one node to another to create an article link"
```

## Task 3.4 — Tree View (Workspace)
```
Prompt to Cursor:
"Build the Tree workspace view /components/workspace-views/TreeView.tsx.

Concept: Your entire workspace as a fullscreen hierarchical outline.
The closest to a traditional file manager but with properties visible alongside the tree.
Think: macOS Finder column view but for your second brain.

Layout:
- Left panel: collapsible section/article tree (same as side panel but fullscreen)
- Right panel: property columns for selected level
  - When a section is selected: shows all articles in that section as rows,
    with their properties as columns (like a spreadsheet)
  - When an article is selected: shows article preview

Tree panel:
- Expand/collapse sections
- Keyboard navigation: arrows, enter to open, tab to indent, shift+tab to dedent
- Drag to reorder and reparent
- Inline rename (F2)
- Color indicators for section colors
- Article count badges on sections
- Right-click context menu

Property columns panel:
- Shows all properties defined on the parent section schema
- Sortable columns (click header)
- Inline edit property values in cells
- + Add Property at end of header row
- Resize columns by dragging border
- Frozen title column on horizontal scroll

Design: two-panel split, resizable divider between them"
```

## Task 3.5 — Focus View
```
Prompt to Cursor:
"Build the Focus workspace view /components/workspace-views/FocusView.tsx.

Concept: Lobe computes what matters right now and shows it as a clean prioritized list.
No manual setup. No dashboard configuration. Just: here is what you should be looking at.

Algorithm (client-side, no ML needed):
Score each article by:
  + 50pts if status property = 'In Progress'
  + 40pts if due date property is today or overdue
  + 30pts if due date is within 7 days
  + 20pts if edited in last 48 hours
  + 10pts if edited in last week
  - 20pts if status = 'Done' or 'Completed'
  - 10pts if archived
Sort by score descending.

Layout:
- Three columns: Today | This Week | Everything Else
- Each column: list of article cards
- Card: section breadcrumb, icon, title, key properties (status, due date, assignee),
  last edited time
- Click card → open article
- Hover → quick-action buttons: mark done, snooze (hide for today), open

Additional panels below the main list:
- Recently edited (last 5 articles, regardless of priority)
- Untouched (articles not edited in >30 days — maybe needs attention or can be archived)
- Upcoming (articles with future dates in the next 30 days)
- Pinned (articles the user has explicitly pinned to Focus)"
```

## Task 3.6 — Atlas View
```
Prompt to Cursor:
"Build the Atlas workspace view /components/workspace-views/AtlasView.tsx.

Concept: Your workspace on a real geographic map.
Every article with a location property becomes a pin.
Navigate your knowledge geographically.

Implementation: Mapbox GL JS or Leaflet

Layout:
- Full-screen map
- Pins = articles with location property
- Pin color = parent section color
- Pin icon = article icon
- Cluster overlapping pins at low zoom (show count badge)
- Left panel: scrollable list of all articles with locations
  Click list item → fly to pin on map + highlight it

Pin interaction:
- Click pin → popup: icon, title, section breadcrumb, key properties, 'Open' button
- Hover cluster → show list of articles in cluster

Filter bar:
- Filter by section (show/hide sections from map)
- Search articles → highlight matching pins, fade others

Creating articles from map:
- Click anywhere on map → 'New article here' prompt
- Pre-fills the location property with the clicked coordinates"
```

## Task 3.7 — Pulse View
```
Prompt to Cursor:
"Build the Pulse workspace view /components/workspace-views/PulseView.tsx.

Concept: Lobe automatically generates a metrics dashboard from your data.
No configuration. It finds every numeric, status, and date property across all sections
and charts them. Your life/work as data.

Auto-generated charts (using Recharts):
- For each section with a status property:
  Donut chart: breakdown of items by status value (color-coded)
- For each section with a number property:
  Line chart: value over time (if articles also have dates)
  OR bar chart: compare values across articles
- For each section with a date property:
  Activity heatmap: like a GitHub contribution graph, articles per day
- Workspace-wide:
  Total articles created per week (bar chart)
  Sections by article count (horizontal bar)
  Most active sections (activity last 30 days)

Layout:
- Responsive grid of chart cards (2-3 columns)
- Each card: chart title, section it comes from, the chart, time range selector
- Cards can be pinned to top
- 'Hide' button per card (persists to localStorage)
- Time range filter at top: Last 7 days | 30 days | 90 days | Year | All time

Each chart:
- Click bar/segment → filter to those articles and open Tree view showing them
- Hover → tooltip with value
- Download as PNG per chart"
```

---

# PHASE 4 — SECTION VIEWS SYSTEM

## Task 4.0 — Section Views Architecture
```
Prompt to Cursor:
"Design the section views system. A Section View is a saved configuration for how
to display the articles inside ONE section.

Create /lib/types/section-views.ts:
- SectionViewType: 'grid' | 'board' | 'stream' | 'gallery' | 
                   'year' | 'month' | 'week' | '2day' | 'day' |
                   'timeline' | 'chart_vbar' | 'chart_hbar' | 
                   'chart_line' | 'chart_donut' | 'map' | 'timetable'
- SectionViewConfig: filter rules, sort rules, groupBy, visibleProperties, layout options
- FilterRule: property, operator, value
- SortRule: property, direction

View name glossary (Lobe names, no borrowed terminology):
- Grid       = what others call Table
- Board      = what others call Kanban
- Stream     = what others call List
- Gallery    = what others call Card/Gallery
- Timeline   = Gantt-style bar chart over time

Create Supabase migration /supabase/migrations/004_section_views.sql:
- section_views table: id, section_id FK, name, type, config jsonb, 
  is_default, sort_order, created_by, created_at

Create /components/section-views/SectionViewSwitcher.tsx:
- Tab bar at top of a section when opened
- + Add View button → dropdown of view types with icons
- Right-click tab → rename, duplicate, delete
- Drag tabs to reorder

Create /components/section-views/SectionViewFilters.tsx:
- Filter bar below tab bar
- Add filter → property picker → operator → value
- Multiple filters with AND/OR
- Active filters shown as dismissable chips

Create /components/section-views/SectionViewBase.tsx:
- Wrapper that routes to correct view component based on SectionViewType
- Passes filtered+sorted article data down"
```

## Task 4.1 — Grid View (Section)
```
Prompt to Cursor:
"Build the Grid section view /components/section-views/GridView.tsx.

Features:
- Rows = articles in the section
- Columns = article properties (from parent section schema)
- Column header: property name + type icon, click to sort, right-click to edit/hide/delete
- Drag column headers to reorder
- Resize columns by dragging border
- + Add Property button at the end of header row
- Row: article title (always first, with icon), then property values
- Click row title → open article in side peek or full view
- Hover row → row actions: open, duplicate, delete
- Inline edit all property values in cells
- Multi-select rows (checkbox column on left) → bulk actions bar
- Frozen first column (title) on horizontal scroll
- + New Article button at bottom
- Row count shown at bottom
- Group by property: collapsible row groups

Property cell renderers:
- text: inline text edit
- number: right-aligned, number format (plain, currency, percent)
- select: colored badge
- multi_select: multiple colored badges
- date: formatted date, click = date picker
- checkbox: toggle checkbox
- person: avatar(s)
- url: clickable link icon
- email/phone: icon + value
- file: attachment count + preview thumbnails
- relation: linked article chips
- formula: computed value (read-only with formula indicator)
- rollup: aggregated value
- created_time/last_edited_time: formatted timestamp, read-only"
```

## Task 4.2 — Board View (Section)
```
Prompt to Cursor:
"Build the Board section view /components/section-views/BoardView.tsx.

Features:
- Columns = values of the group-by property (default: Status select property)
- Each column has: header (property value name + color), count badge, + Add button,
  card list, column options menu
- Cards = articles in the section
- Card shows: title, icon, select badges, assignee avatars, date, checkbox state
- Drag cards between columns (@dnd-kit)
- Drag columns to reorder
- Click card → open in side peek
- Card quick-actions on hover: open, duplicate, delete
- + Add Column button at end (adds new select option)
- Column collapse (toggle to icon only)
- Card display customization: which properties show on card face
- Group by: any select or multi_select or person property
- Hide empty groups toggle
- Sub-group support (second level grouping)
- Swimlane support (horizontal grouping)"
```

## Task 4.3 — Calendar Views (Section)
```
Prompt to Cursor:
"Build the Calendar section views in /components/section-views/calendar/.

Shared:
- CalendarBase.tsx — navigation header (prev/next, today button, date range label),
  view type switcher (Year/Month/Week/2Day/Day)
- Event rendering component — shows article icon + title, colored by a color property
- Click empty slot → create new article with that date prefilled
- Click event → open article
- Drag event to reschedule
- Resize event (end time) by dragging bottom edge

Year View: 12 months in a grid, dots on days that have articles, click day → zoom to Day view
Month View: full month grid, multi-day articles span across days, +N more → expand row
Week View: 7 day columns, hourly rows, all-day articles at top, current time indicator
2 Day View: today + tomorrow columns, focused planning
Day View: single column, 15-minute slots

Reminder Events:
- Lightweight events with date, start_time, end_time, checked (boolean)
- Not a full article — just a quick calendar entry
- Checked off = strikethrough appearance
- Created via quick-add popover on calendar slot"
```

## Task 4.4 — Timeline View (Section)
```
Prompt to Cursor:
"Build the Timeline section view /components/section-views/TimelineView.tsx.

Features:
- Horizontal time axis (days/weeks/months — zoom levels)
- Rows = articles grouped optionally
- Bars = duration from date property A to date property B (configurable)
- Drag bar to move, drag ends to resize (change dates)
- Today line
- Zoom controls: Day | Week | Month | Quarter | Year
- Group rows by a property, collapse groups
- Labels on bars (article title)
- Color bars by a select property
- Dependencies: draw lines between bars (A must finish before B)
  Store in article_dependencies table"
```

## Task 4.5 — Stream & Gallery Views (Section)
```
Prompt to Cursor:
"Build Stream and Gallery section views.

Stream View /components/section-views/StreamView.tsx:
- Linear list of articles
- Title + configurable secondary line (from a property)
- Article icon on left, date on right, status dot
- Click to open, sortable + groupable
- Compact / Comfortable density toggle

Gallery View /components/section-views/GalleryView.tsx:
- Grid of cards (2–5 columns, configurable)
- Card: cover image or colored placeholder, icon, title, up to 3 property badges
- Hover: actions appear, slight highlight
- Card size: small / medium / large
- Fit image / crop image option"
```

## Task 4.6 — Chart Views (Section)
```
Prompt to Cursor:
"Build Chart section views using Recharts in /components/section-views/charts/.

All charts pull data from the current section (filtered/sorted articles).
X axis or segments = a property. Y axis or values = a numeric or count property.
Color = a select property (9 semantic colors). Legend + tooltip on hover.

VerticalBarChart.tsx, HorizontalBarChart.tsx, LineChart.tsx, DonutChart.tsx

Configuration panel:
- Source property (X/segments)
- Value property (Y/size)
- Color property
- Aggregation: count | sum | avg | min | max
- Show labels, show grid lines, aspect ratio toggles
- Download as PNG"
```

## Task 4.7 — Map View (Section)
```
Prompt to Cursor:
"Build the Map section view /components/section-views/MapView.tsx.

Features:
- Map (Mapbox GL JS or Leaflet) showing all articles with a location property
- Pin per article: article icon as marker, section color
- Cluster nearby pins, click cluster → expand
- Side panel: list of articles, click → highlight pin
- Filter → hide non-matching pins
- Click empty map location → create new article at that location prefilled
- Location property: text search autocomplete → stores lat/lng + label"
```

## Task 4.8 — Timetable View (Section)
```
Prompt to Cursor:
"Build the Timetable section view /components/section-views/TimetableView.tsx.

This is a recurring weekly schedule grid — for classes, routines, habits.

Features:
- 7-column grid (Mon–Sun), hourly rows
- Articles with Day of Week + Start Time + End Time properties shown as blocks
- Blocks colored by a color property
- No event-level dates — purely recurring time slots
- Drag to move (updates Day of Week + time)
- Toggle: Show weekends / Hide weekends
- Toggle: Start week on Monday / Sunday
- + New article → opens with day + time prefilled"
```

---

# PHASE 5 — SECTION SCHEMA & PROPERTY SYSTEM

## Task 5.0 — Section Schema System
```
Prompt to Cursor:
"A Section in Lobe is a container whose schema defines the properties all child articles inherit.
This task builds the section schema UI and the property system.

SectionHeader.tsx — shown at top of any section when opened:
- Section title (editable)
- Section view tab bar (from SectionViewSwitcher)
- Filter + Sort + Group by + Properties (show/hide) toolbar
- Search within section
- Article count
- ⋯ options: export CSV/JSON, duplicate section, article templates

PropertyEditor.tsx — manage section schema:
- List of all properties with type icons
- Drag to reorder
- Click to edit: rename, change type, set options (for select),
  add description, set default value, toggle required
- Delete property (confirmation: 'this will remove this data from all articles')
- Add property: type picker dropdown

Article Templates:
- Predefined article structures for a section
- /supabase/migrations/005_article_templates.sql:
  article_templates: id, section_id, name, icon, description,
  content jsonb, created_by, is_global
- When creating new article: template picker (or default blank)"
```

## Task 5.1 — Property System
```
Prompt to Cursor:
"Implement the full property system for articles in Lobe.

For each property type build:
1. A cell renderer (for Grid view)
2. A property editor (in article header)
3. A filter component
4. A sort handler

PROPERTY IMPLEMENTATIONS:

Select & Multi-Select:
- Options: id, name, color (from 9 semantic colors)
- Create new option inline while typing, drag to reorder
- Select: single badge. Multi: multiple badges.

Date:
- Stores ISO string, optional time
- Custom calendar date picker (no external dependency)
- End date toggle (date range), time zone selector
- Reminder: notification N hours/days before
- Display formats: 'Mar 21, 2026' | '2026-03-21' | 'relative'

Person:
- Workspace member picker with avatars, multi-person support

Relation:
- Links articles to articles in another section
- Config: which section to link to, bi-directional toggle
- Picker: search + select articles from target section
- Display: chips showing linked articles

Rollup:
- Aggregates from a Relation property
- Aggregations: Count, Count unique, Sum, Avg, Min, Max, Median,
  Range, Percent empty, Percent not empty, Count per group
- Auto-recalculates when related articles change

Formula:
- Custom formula language
- Functions: if(), not(), and(), or(), add(), subtract(), multiply(),
  divide(), mod(), pow(), abs(), ceil(), floor(), round(), sqrt(),
  length(), slice(), contains(), startsWith(), endsWith(), replace(),
  lower(), upper(), trim(), split(), join(), toNumber(), toString(),
  toDate(), now(), today(), dateAdd(), dateBetween(), formatDate(),
  month(), year(), day(), hour(), minute()
- Syntax-highlighted editor, property name autocomplete, live preview
- Compiled AST stored in DB, evaluates client-side

Checkbox: boolean toggle
Number: Plain | Commas | Percent | USD | EUR | INR | Custom prefix/suffix
URL: favicon fetch, preview on hover
Files & Media: multi-file, Supabase Storage, image thumbnails
Status: special select grouped into Not Started | In Progress | Done
Location: geocoded address storing lat/lng + label
Created Time, Last Edited Time, Created By, Last Edited By: auto, read-only"
```

---

# PHASE 6 — REMINDERS & TIME EVENTS

## Task 6.1 — Reminder Events System
```
Prompt to Cursor:
"Build the Reminder Events system (distinct from articles).

Supabase migration /supabase/migrations/006_reminders.sql:
- reminder_events: id, workspace_id, user_id, title, date (date),
  start_time (time, nullable), end_time (time, nullable),
  is_checked (boolean default false), color, recurrence_rule jsonb,
  created_at, updated_at
- recurrence_rules: id, event_id, frequency (daily|weekly|monthly|yearly),
  interval (every N), days_of_week, end_date, count (max occurrences)

Features:
- Appear in all calendar section views and in the Time workspace view
- NOT articles — lightweight time-anchored entries with no content body
- Checking off: click checkbox → is_checked = true → strikethrough
- Quick create: click any time slot → popover (title, time, color, recurrence)
- Full edit: click reminder → slide-over panel
- Drag to reschedule, recurring events with RRULE support
- 'Edit this / this and following / all' when modifying a recurring event
- Color coding: 9 semantic colors
- Also shown in side panel under a 'Reminders' section (today + upcoming)

Build ReminderQuickCreate.tsx, ReminderEditPanel.tsx, ReminderCalendarBlock.tsx"
```

---

# PHASE 7 — COLLABORATION & REALTIME

## Task 7.1 — Realtime Presence
```
Prompt to Cursor:
"Implement realtime collaboration infrastructure using Supabase Realtime.

Features:
- Who's online: show avatar bubbles in article header for users currently viewing it
- Cursor presence: in the editor, show other users' cursors with name labels
- Live content sync: changes broadcast to all viewers of same article in real-time
  (use Supabase Realtime broadcast, not polling)
- Optimistic updates: local changes apply immediately, then synced

/lib/realtime/:
- usePresence(articleId) hook — subscribe to who's on this article
- useBroadcast(channel) hook — send/receive live events
- useArticleSync(articleId) hook — sync editor content changes

Article header presence avatars:
- Show up to 5, then +N more
- Tooltip: 'Alex is viewing this article'
- Fade in/out as users join/leave

Editor cursor presence:
- Use Tiptap CollaborationCursor extension with Supabase transport
- Each user gets a stable random color from our palette

/supabase/migrations/007_realtime_config.sql:
- Enable Realtime on nodes table
- article_views: id, article_id, user_id, session_id, started_at, last_seen_at"
```

## Task 7.2 — Comments System
```
Prompt to Cursor:
"Build the comments system.

/supabase/migrations/008_comments.sql:
- comments: id, workspace_id, article_id, block_id (nullable — inline comment on block),
  parent_id (nullable — threaded replies), content jsonb (rich text),
  author_id FK, resolved_by FK, resolved_at, created_at, updated_at
- comment_reactions: id, comment_id, user_id, emoji, created_at

Features:
- Article-level comments: collapsible thread panel on right side
- Inline block comments: hover block → comment icon → anchored comment thread
- Comment UI: avatar, name, timestamp, rich text (bold/italic/code/link/mention),
  reply, resolve (checkmark), reactions (emoji picker), delete own
- Resolved: collapsed by default, 'Show resolved' toggle
- @mention in comment → notification sent
- Comment count badge on article in side panel

/components/comments/:
- CommentThread.tsx, CommentItem.tsx, CommentComposer.tsx, InlineCommentMarker.tsx"
```

---

# PHASE 8 — SEARCH

## Task 8.1 — Search System
```
Prompt to Cursor:
"Build the search system.

Two-tier approach:
1. Local/fast: Fuse.js over loaded section/article titles (instant, offline)
2. Full-text: Supabase FTS searches article content too

/supabase/migrations/009_search.sql:
- Add tsvector column to nodes for FTS
- Create GIN index
- Trigger to auto-update tsvector on content change
- Function: search_nodes(query text, workspace_id uuid, limit int)
  Returns nodes ordered by ts_rank with highlighted excerpts

/components/command/SearchModal.tsx:
- Triggered via Cmd+K or search button
- Two panels: results list + preview panel (wide screens)
- Results: icon, title, section breadcrumb path, last edited, excerpt
- Filters: by node type (section|article), by person, by date range, by property value
- Recent searches history (localStorage)
- Suggested: recently edited articles, pinned items

/lib/hooks/useSearch.ts:
- Debounced query 200ms
- Local results first (instant), then server FTS results appended (deduped)"
```

---

# PHASE 9 — CUSTOMISATION SYSTEM

## Task 9.1 — Article Customization
```
Prompt to Cursor:
"Build the article customization system.

Article Header:
- Cover image: upload, Unsplash search, solid color presets, remove
- Cover position: drag to reposition vertically
- Article icon: emoji picker (emoji-mart), upload image, lucide icon picker, remove
- 'Small text' toggle: reduces body font to 14px
- 'Full width' toggle: removes max-width constraint
- 'Font family' picker: Default (DM Sans) | Serif (Instrument Serif) | Mono (JetBrains Mono)
- 'Lock article' toggle: makes read-only even for editors

/components/editor/ArticleSettings.tsx — slide-over panel or popover

Covers:
- /supabase/migrations/010_covers.sql:
  node_covers: id, node_id, type (upload|url|gradient|color), value, position_y

Emoji Picker:
- emoji-mart, themed to design system
- Tabs: Recently used, Smileys, People, Nature, Food, Travel, Activities, Objects, Symbols, Flags
- Search, skin tone selector, localStorage persistence"
```

## Task 9.2 — Workspace Customization
```
Prompt to Cursor:
"Build workspace-level customization.

/app/(workspace)/[workspaceSlug]/settings/page.tsx:

Workspace tab:
- Name, icon (emoji/image), description, URL slug, delete workspace

Members tab:
- Member list: avatar, name, email, role, joined date
- Invite by email, change role, remove, pending invites

Appearance tab:
- Theme: Dark (default) | Light | System
- Accent color: 9 semantic colors (affects --accent variable)
- Side panel width: Narrow | Default | Wide
- Content width: Narrow (660px) | Default (720px) | Wide (960px) | Full
- Font scale: 90% | 100% | 110% | 120%
- Reduce motion toggle

Import/Export tab:
- Import from Markdown files
- Import from CSV (maps columns to section schema properties)
- Export workspace: all articles as Markdown ZIP
- Export specific article: Markdown | PDF | HTML

API tab:
- Generate API key, webhook configuration

Store in workspace_settings table (per workspace, per user preferences)"
```

## Task 9.3 — Color Coding System
```
Prompt to Cursor:
"Implement color coding throughout the app.

Anywhere color can be applied:
1. Section background color (subtle tint of semantic color on --bg-0)
2. Article background color
3. Section/article icon color (if using lucide icon)
4. Text color (inline: editor toolbar)
5. Text highlight color (inline)
6. Select/multi_select option colors
7. Board column colors (from select option)
8. Calendar event colors
9. Side panel item color dot (subtle left border beside item name)
10. Block background color (callout, column)

Color system:
- 9 semantic colors: red, orange, yellow, green, teal, blue, purple, pink, gray
- Each has: base, muted (bg), text variants in CSS vars
- No custom hex input — enforced palette for visual coherence
- Color picker: 3x3 grid of swatches + 'Default' option

Add to nodes table: color text (null = default, else one of 9 color names)"
```

---

# PHASE 10 — ADDITIONAL FEATURES

## Task 10.1 — Version History
```
Prompt to Cursor:
"Implement version history for articles.

/supabase/migrations/011_versions.sql:
- article_versions: id, article_id, content jsonb, title, created_by, created_at,
  version_label (nullable), is_auto (bool)
- Auto-save version every 30 minutes if article has changes
- Max 50 auto-versions per article (delete oldest when over limit)
- Named versions: unlimited, never auto-deleted

/components/editor/VersionHistory.tsx:
- Slide-over panel from right
- List: label (or 'Auto-save'), date, created by
- Click → preview in read-only overlay
- Restore → replaces current content (saves current as 'Before restore')
- Compare: side-by-side diff view (highlight added/removed blocks)
- Name this version button"
```

## Task 10.2 — Offline Mode
```
Prompt to Cursor:
"Implement offline support.

Strategy:
- Service Worker (Next.js PWA via next-pwa) for asset caching
- IndexedDB (using Dexie.js) for offline article content cache
- Mutation queue: when offline, queue writes to IndexedDB pending sync queue
- On reconnect: flush sync queue to Supabase in order, handling conflicts

Install: next-pwa dexie

/lib/offline/:
- db.ts — Dexie database schema: nodes, pending_mutations
- syncQueue.ts — add to queue, process queue, conflict resolution
- useOnlineStatus.ts — hook returning {isOnline, wasOffline}
- offlineCache.ts — read/write article content to IndexedDB

Offline indicator:
- Banner at bottom when offline: '⚠ You're offline. Changes are saved locally.'
- When reconnecting: 'Syncing N changes...' → 'All changes saved'

Conflict resolution:
- Server wins on read-only properties (created_by, etc.)
- Last-write-wins on content (by timestamp)
- Flag to user if conflicts detected: 'Conflict detected — [View diff] [Keep yours] [Keep server version]'"
```

## Task 10.3 — Notifications
```
Prompt to Cursor:
"Build the notification system.

/supabase/migrations/012_notifications.sql:
- notifications: id, user_id, type (mention|comment|invite|reminder|article_shared|
  version_restored|member_joined), payload jsonb, is_read bool,
  article_id (nullable), created_at

Triggers:
- @mention in comment or article content → notify mentioned user
- Reply to comment → notify thread participants
- Workspace invite, article shared with you
- Reminder event (pg_cron scheduled Edge Function)

Notification bell in top right (in WorkspaceViewBar):
- Unread count badge
- Dropdown: list of notifications, click to navigate to source
- Mark all as read, settings link

Notification preferences per user (in workspace_settings):
- Email on/off per type, Push (browser) on/off per type"
```

## Task 10.4 — Keyboard Shortcuts
```
Prompt to Cursor:
"Build the keyboard shortcuts system.

/lib/hooks/useKeyboardShortcuts.ts:
- Global shortcut registry (action name → keys[] → handler)
- Priority system: editor shortcuts override global when editor is focused

Default shortcuts (customizable per user):
Cmd+K → Command palette
Cmd+P → Quick find article or section
Cmd+/ → Toggle sidebar
Cmd+. → Expand/collapse sidebar
Cmd+Shift+L → Toggle light/dark (if light mode implemented)
Cmd+Z / Cmd+Shift+Z → Undo/Redo (editor)
Cmd+B → Bold
Cmd+I → Italic
Cmd+U → Underline
Cmd+Shift+S → Strikethrough
Cmd+E → Inline code
Cmd+Shift+K → Insert link
Cmd+Enter → Submit / confirm
Escape → Close modal / deselect
Cmd+D → Duplicate selected block
Cmd+Delete → Delete selected block
Tab → Indent list item / increase block indent
Shift+Tab → Dedent
/ → Open slash command (in editor)
@ → Open mention picker
[[ → Open article link picker
Cmd+Shift+D → Duplicate article (in side panel)
Cmd+Shift+N → New article
F2 → Rename (in side panel)

/components/settings/ShortcutsSettings.tsx:
- Table of all shortcuts
- Click shortcut → enter new key combo
- Detect conflicts
- Reset to defaults
- Export/import custom shortcuts as JSON

Store in localStorage AND workspace_settings.shortcuts_config jsonb"
```

## Task 10.5 — MCP Integration
```
Prompt to Cursor:
"Build MCP (Model Context Protocol) integration.

This allows AI agents (like Cursor, Claude Desktop, etc.) to interact with the workspace.

/app/api/mcp/route.ts — MCP server endpoint:
Expose tools:
- search_articles(query, workspace_id) → article results
- get_article(article_id) → title + content as markdown
- create_article(parent_section_id, title, content_markdown) → new article
- update_article(article_id, content_markdown) → updates content
- list_sections(workspace_id) → list of all sections with schemas
- query_section(section_id, filters, sorts) → articles with properties
- create_article_with_properties(section_id, properties) → new article

Authentication: API key from workspace settings
Rate limiting: 100 req/min per API key
MCP spec: follow https://spec.modelcontextprotocol.io/

/components/settings/MCPSettings.tsx:
- Show MCP server URL to paste into Cursor/Claude
- API key generation and management
- Usage logs: last N calls, which tools used
- Scope control: which pages/databases are accessible via MCP"
```

## Task 10.6 — Plugins System
```
Prompt to Cursor:
"Design a basic plugin system foundation.

/lib/plugins/:
- registry.ts — plugin registry (name, version, author, description, permissions, entry)
- loader.ts — load plugin JS in sandboxed iframe
- api.ts — plugin API surface (what plugins can access)

Plugin API surface:
- read pages, create pages, add blocks
- register slash commands
- register sidebar items
- register property types
- register context menu items
- subscribe to events

Built-in plugins (ship with app):
- Pomodoro Timer (sidebar widget)
- Word Count (status bar widget)
- Daily Note (auto-creates today's note article)
- Reading Time estimator (shows in article header)

/components/settings/PluginsSettings.tsx:
- Installed plugins list with toggle enable/disable
- Plugin marketplace placeholder (future)
- Upload plugin .js file
- Per-plugin settings"
```

## Task 10.7 — Recurring Timetable
```
Prompt to Cursor:
"Build the recurring events / timetable system.

This is a special section template: 'Timetable'
- Articles: recurring class/event blocks
- Properties: Title, Day of Week (multi_select), Start Time, End Time,
  Location, Color, Instructor/Host, Notes

A Timetable section has the Timetable section view:
/components/section-views/TimetableView.tsx:
- 7-column grid (Mon-Sun)
- Hourly rows
- Events placed by day + time, colored by Color property
- Overlapping events placed side by side
- Week navigator (shift entire week, no event-level dates — just recurring time slots)
- Toggle: Show weekends / Hide weekends
- Toggle: Start week on Monday / Sunday

Recurring reminder events (from Task 5.1) also render here if their 
recurrence_rule matches the displayed week."
```

## Task 10.8 — Embeds & Integrations
```
Prompt to Cursor:
"Build the embeds infrastructure.

/app/api/oembed/route.ts:
- Takes URL param
- Checks against platform list
- Fetches oEmbed data / scrapes OG tags
- Returns: type, title, description, thumbnail, html (for iframe embeds)
- Cache responses in Supabase (oembed_cache table: url, data jsonb, cached_at)

/app/api/og-fetch/route.ts:
- Takes URL
- Returns OG metadata for Web Bookmark block

Supported embed platforms and their handling:
- YouTube / YouTube Shorts: iframe embed
- Vimeo: iframe  
- Figma: iframe with figma.com/embed
- Loom: iframe
- Miro: iframe
- CodePen: iframe
- GitHub Gist: iframe or fetched content
- Twitter/X: oEmbed → Twitter widget
- Spotify track/playlist: iframe
- Google Maps: iframe embed URL
- Google Docs/Sheets/Slides: iframe with /preview
- Linear issue: fetch via Linear API (if user connects Linear) → rich card
- GitHub PR/issue: fetch via GitHub API (if connected) → rich card

/components/settings/IntegrationsSettings.tsx:
- Connect: GitHub, Linear, Slack, Google Calendar
- OAuth flows per service
- Manage connected accounts
- Per-integration settings"
```

---

# PHASE 11 — PUBLISHING & SHARING

## Task 11.1 — Article Publishing
```
Prompt to Cursor:
"Build article publishing (public sharing).

Updates to nodes table:
- is_published: boolean
- published_slug: unique text (auto-generated from title, editable)
- published_at: timestamptz
- publish_config: jsonb {
    show_toc: bool,
    allow_comments: bool,
    password: hashed_password | null,
    seo_title: text,
    seo_description: text,
    og_image_url: text
  }

/app/(public)/p/[slug]/page.tsx:
- Public read-only article renderer, no auth required
- Password gate if publish_config.password is set
- All blocks rendered read-only
- Public comments form if allow_comments (name + email, no account needed)
- SEO metadata, og tags
- 'Made with Lobe' subtle footer badge (toggleable in settings)

Share button in article header:
- Copy internal link (workspace members)
- Publish to web → toggle + settings
- Share with specific workspace member
- Get embed code (iframe for external sites)
- Export: Markdown | PDF | HTML"
```

---

# PHASE 12 — PERFORMANCE & POLISH

## Task 12.1 — Performance Optimization
```
Prompt to Cursor:
"Optimize app performance.

1. Section tree lazy loading:
   - Load only top 2 levels initially
   - Load children on expand
   - Prefetch on hover after 300ms

2. Editor virtualization:
   - For long articles (>200 blocks), windowed rendering
   - Only render blocks in viewport + 50 block buffer

3. Image optimization:
   - Compress on upload (before Supabase Storage)
   - Generate thumbnails server-side (Edge Function)
   - Next.js Image component everywhere

4. Bundle optimization:
   - Dynamic imports for heavy components (editor, charts, maps, workspace views)
   - Route-based code splitting
   - Analyze with @next/bundle-analyzer

5. Query optimization:
   - React Query caching (staleTime: 60s for article content)
   - Prefetch adjacent articles
   - Suspense boundaries with skeleton UIs

6. Supabase query optimization:
   - Review all queries, add missing indexes
   - select() only needed columns
   - Batch small queries

Create Skeleton components:
SidePanelSkeleton, ArticleSkeleton, GridViewSkeleton, GalleryViewSkeleton, CalendarSkeleton
```

## Task 12.2 — Accessibility
```
Prompt to Cursor:
"Implement accessibility improvements.

- All interactive elements: proper aria-labels, roles
- Keyboard navigation: sidebar fully navigable by keyboard, 
  modals trap focus, Escape closes
- Focus visible: custom focus ring (2px solid --accent, offset 2px)
- Skip to content link (visually hidden, shown on focus)
- Screen reader announcements for:
  - Page saves (polite)
  - Errors (assertive)
  - Drag and drop operations
- Color contrast: verify all text meets WCAG AA (4.5:1 for body, 3:1 for large)
- Reduced motion: respect prefers-reduced-motion, disable animations if set
- ARIA live regions for realtime updates (presence, notifications count)
- All images have alt text"
```

## Task 12.3 — Error Handling & Loading States
```
Prompt to Cursor:
"Implement comprehensive error handling.

Error Boundary components:
- ArticleErrorBoundary — catches editor crashes, shows 'Something went wrong' with retry
- SidePanelErrorBoundary
- SectionViewErrorBoundary

Toast notification system:
- Install Sonner (install: sonner)
- Toast variants: success, error, warning, info, loading→success
- Used for: save confirmation, copy link, export started, error messages

Loading states:
- Skeleton UIs for every major view (no spinners in content areas)
- Inline spinner only for button actions
- Page transition: subtle fade between routes

Error pages:
- /app/not-found.tsx — clean 404 (article/section not found or no access)
- /app/error.tsx — 500 error with reset button
- Workspace not found (wrong slug), Access denied (not a member)"
```

---

# PHASE 13 — FINAL FEATURES & POLISH

## Task 13.1 — Linked Section Views
```
Prompt to Cursor:
"Implement Linked Section Views — embed a view of one section inside an article.

Block type: Linked Section View
- Insert via slash command: /linked section
- Picker: select which section to embed
- Embeds a full section view (Grid/Board/etc.) inline in the current article
- Has its own local filter/sort (doesn't affect original section's saved views)
- Shows view tab switcher
- Can create new articles (they go into the original section)
- Shows article count, collapsible

Store: linked_section_blocks table: article_id, source_section_id, view_config"
```

## Task 13.2 — Article Templates Gallery
```
Prompt to Cursor:
"Build the templates gallery.

/supabase/migrations/013_global_templates.sql:
- global_templates: id, name, description, category, icon,
  content jsonb, section_schema jsonb, preview_url,
  is_official bool, created_by, use_count, created_at

Template categories:
Personal: Daily Journal, Weekly Review, Reading List, Habit Tracker,
          Goals Tracker, Travel Planner, Budget Tracker, Recipe Collection
Work: Project Tracker, Meeting Notes, OKR Dashboard, Sprint Board,
      CRM (lightweight), Content Calendar, Interview Tracker
Learning: Study Notes, Course Tracker, Book Notes, Flashcards
Life OS: Lobe Setup (full workspace), Annual Review, Decision Log

/components/templates/TemplateGallery.tsx:
- Grid: preview thumbnail, name, category, use count
- Filter by category
- Click → preview modal
- Use Template → creates section/articles from template
- Save current section as template"
```

## Task 13.3 — Article Outline Panel
```
Prompt to Cursor:
"Build the Article Outline panel.

Location: collapsible panel on right side of article (when width allows)
Trigger: 'Outline' button in article header

Features:
- Auto-generated list of H1/H2/H3 headings
- Nested structure matching heading hierarchy
- Click → smooth scroll to heading
- Highlight currently-in-view heading (IntersectionObserver)
- 'No headings found' state
- Sticky positioning while scrolling"
```

## Task 13.4 — Quick Capture & Daily Notes
```
Prompt to Cursor:
"Build Quick Capture and Daily Notes.

Quick Capture:
- Shortcut: Cmd+Shift+C (customizable)
- Floating modal with text input (markdown shortcuts work)
- Tags input, destination section picker (default: Inbox section)
- Submit: appends as new block to destination article

Daily Notes:
- Auto-generated articles named 'MMM D, YYYY' (e.g. 'Mar 21, 2026')
- Stored under a 'Daily Notes' section
- Each daily note uses a Daily Note Template (customizable)
- Today's Note shortcut: Cmd+Shift+T
- Creates today's note if missing, opens if exists
- 'Today' entry in side panel under Daily Notes
- Backlinks: shows which articles link TO today's note"
```

## Task 13.5 — Backlinks & Connections
```
Prompt to Cursor:
"Implement backlinks tracking.

/supabase/migrations/014_backlinks.sql:
- article_links: id, source_article_id, target_article_id, block_id, created_at
  (created whenever an Article Link [[...]] block is inserted)
- Trigger: update article_links on content change (parse for article references)

In article editor footer:
- Connections section: 'N articles link to this'
- Expand: list of articles with excerpts showing context
- Click article → open it

Article mentions:
- @mention of an article in text tracked separately
- mention_type = 'mention' vs 'link'"
```

---

# CURSOR WORKFLOW GUIDE

## Session Template
Start every Cursor session with:
```
I'm building Lobe — a personal knowledge OS for the web.
Stack: Next.js 14 App Router, TypeScript strict, Tailwind CSS (CSS variables only),
Supabase (Postgres + Auth + Storage + Realtime), Zustand, React Query.

Core terminology:
- Workspace = the top-level container for everything
- Section = a container with a property schema (holds sub-sections or articles)
- Article = a leaf-level rich document that inherits properties from its parent section
- Workspace View = how you see the ENTIRE workspace (Space, Time, Mind, Tree, Focus, Atlas, Pulse)
- Section View = how you see articles INSIDE one section (Grid, Board, Stream, Gallery, etc.)

Design: dark theme (#0a0a0a base), DM Sans body, JUST Sans display, no gradients,
thin borders (1px), radius-sm (4px) for inputs/buttons, radius-md (6px) for cards.
CSS variables for all colors — no Tailwind color utility classes.

[PASTE RELEVANT EXISTING CODE/TYPES]

Now let's work on: [SPECIFIC TASK FROM THIS PRD]
```

## File to Create: `.cursorrules`
```
# Project: Lobe — Personal Knowledge OS
# Stack: Next.js 14, TypeScript strict, Tailwind + CSS vars, Supabase, Zustand

## Terminology (enforce everywhere — no exceptions)
- 'Section' not 'database' or 'page' when referring to containers with schemas
- 'Article' not 'page' or 'entry' when referring to leaf documents
- 'Side panel' not 'sidebar'
- 'Workspace view' for Space/Time/Mind/Tree/Focus/Atlas/Pulse
- 'Section view' for Grid/Board/Stream/Gallery/Timeline/Chart/Map/Timetable
- 'Grid view' not 'table view'
- 'Board view' not 'kanban'
- 'Stream view' not 'list view'
- 'Gallery view' not 'card view'
- 'Article link' not 'page link'
- 'Connections' not 'backlinks' (in UI copy)
- 'Pin' not 'favorite' or 'star'
- Never use the word 'database' in UI-facing strings
- Never use the word 'Notion' anywhere in code comments or UI

## Code rules
- TypeScript: strict mode, no `any`, explicit return types on all functions
- No inline styles. Use CSS variables via Tailwind arbitrary values: `bg-[var(--bg-2)]`
- Never use Tailwind color classes (bg-blue-500 etc). CSS var classes only.
- All Supabase queries: always handle errors, use .throwOnError() or check .error
- Components: always accept and spread className prop
- Hooks: prefix with 'use', single responsibility, always cleanup subscriptions
- File naming: PascalCase components, camelCase utils, kebab-case routes
- Imports: absolute paths via @/ alias, group: react → next → external → internal → types
- Database: always write SQL migrations, never use Supabase dashboard for schema changes
- Forms: no HTML <form> submit, use controlled state + onClick handlers
- Animations: framer-motion only, duration < 200ms for micro-interactions
- Icons: lucide-react only, size prop (not className for size), default 16px
- Error handling: every async function wrapped in try/catch, errors surfaced via toast
- Zustand stores: one file per domain (sectionTreeStore, uiStore, workspaceStore)
- React Query: queryKey arrays follow [resource, id, ...params] pattern
```

## Phase Execution Order
```
Phase 0:  Bootstrap → MUST be complete before anything else
Phase 1:  Workspace + Nav → Core navigation + WorkspaceViewBar
Phase 2:  Block Editor → Core editing experience
Phase 3:  Workspace Views → Space first, then Time, Mind, Tree, Focus, Atlas, Pulse
Phase 4:  Section Views → Grid first, then Board, Calendar, Timeline, Stream, Gallery
Phase 5:  Section Schema + Property System → Depends on Phase 4
Phase 6:  Reminders → Can parallel with Phase 5
Phase 7:  Collaboration → After editor is stable
Phase 8:  Search → After Phase 1+2
Phase 9:  Customization → After core features stable
Phase 10: Additional Features → Version history, offline, shortcuts, MCP, plugins
Phase 11: Publishing → After editor complete
Phase 12: Performance → Before public launch
Phase 13: Final Features → Polish and completeness
```

---

# LOBE FEATURE CHECKLIST

## ✅ Editor
- [x] All block types (text, lists, media, embeds, advanced)
- [x] Slash commands
- [x] Drag to reorder blocks
- [x] Nested blocks (indent/dedent)
- [x] Block color (text + background)
- [x] Duplicate, convert block type
- [x] Comment on block
- [x] Copy block link
- [x] Synced blocks
- [x] Column layout

## ✅ Sections & Articles
- [x] Infinite nesting (sections inside sections)
- [x] Article icon (emoji/image/lucide)
- [x] Cover image
- [x] Per-article width + font settings
- [x] Article links + connection tracking
- [x] Side peek vs full view
- [x] Lock article

## ✅ Property System
- [x] Text, Number, Checkbox, URL, Email, Phone
- [x] Select, Multi-select (colored options)
- [x] Date (with time, range, reminder)
- [x] Person (workspace members)
- [x] Relation (cross-section links)
- [x] Rollup (aggregated from relation)
- [x] Formula (custom expression engine)
- [x] Status (grouped select)
- [x] Location (geocoded)
- [x] Files & Media
- [x] Created/Edited time + by (auto)

## ✅ Section Views (inside one section)
- [x] Grid (spreadsheet layout)
- [x] Board (status columns)
- [x] Stream (linear list)
- [x] Gallery (card grid)
- [x] Calendar: Year / Month / Week / 2 Day / Day
- [x] Timeline (Gantt with dependencies)
- [x] Charts: Vertical bar / Horizontal bar / Line / Donut
- [x] Map (geographic pins)
- [x] Timetable (recurring weekly schedule)

## ✅ Workspace Views (entire workspace)
- [x] Space (zoomable section landscape)
- [x] Time (full workspace timeline)
- [x] Mind (knowledge graph)
- [x] Tree (hierarchical outline + properties)
- [x] Focus (Lobe-computed priority list)
- [x] Atlas (geographic map of all articles)
- [x] Pulse (auto-generated metrics dashboard)

## ✅ Collaboration
- [x] Real-time co-editing
- [x] Article + block comments
- [x] @mentions
- [x] Workspace members + roles
- [x] Guest access
- [x] Publish article publicly

## ✅ Organization
- [x] Pin (starred items)
- [x] Trash + restore
- [x] Archive
- [x] Search (title + full-text content)
- [x] Version history
- [x] Color coding (sections, articles, blocks)

## ✅ Power Features
- [x] Reminder events (lightweight time-anchored entries)
- [x] Offline mode with sync queue
- [x] MCP server endpoint (AI agent integration)
- [x] Plugin system
- [x] Daily notes with quick capture
- [x] Custom keyboard shortcut remapping
- [x] Linked section views (embed section inside article)
- [x] Article templates gallery

---

*End of PRD. Total phases: 13. Total tasks: ~45. Estimated build time with Cursor Pro: 6-10 weeks of focused development.*