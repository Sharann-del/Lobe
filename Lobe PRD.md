# LOBE — Full Project Build Guide
> A Notion superset. A personal OS for thought. Built with Next.js 14 + Supabase + TypeScript.
> Generated phase by phase for Cursor Pro.

---

## HOW TO USE THIS DOCUMENT WITH CURSOR

### The Golden Rules
1. **Never paste the whole file into Cursor.** Feed it phase by phase, one task at a time.
2. **Start every Cursor session** by saying: *"I'm building Lobe — a Notion-superset second brain app. Here is my full context: [paste the top-level stack + design system section]. Now let's work on Phase X, Task Y."*
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
      /page.tsx               ← workspace home
      /[pageId]
        /page.tsx             ← page view
      /settings
        /page.tsx
  /api
    /...
/components
  /ui                         ← design system primitives
  /editor                     ← block editor
  /sidebar                    ← sidebar + nav
  /views                      ← calendar, kanban, table, etc.
  /blocks                     ← individual block types
  /mind                       ← mind view component
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

## Task 1.2 — Page/Document Schema
```
Prompt to Cursor:
"Create Supabase migration /supabase/migrations/003_pages.sql:

Tables:
- pages: 
    id uuid PK
    workspace_id FK
    parent_id FK (self-referential, nullable — null = root page)
    created_by FK profiles
    title text default 'Untitled'
    icon text (emoji or null)
    icon_type text (emoji|image|lucide)
    cover_url text
    content jsonb (BlockNote/Tiptap JSON)
    is_deleted boolean default false
    deleted_at timestamptz
    is_archived boolean default false
    is_published boolean default false
    published_slug text unique
    sort_order float8 (for ordering siblings)
    depth int generated (computed from parent chain)
    word_count int
    created_at, updated_at

- page_properties:
    id, page_id FK, key, value_type (text|number|date|boolean|select|multi_select|
    relation|url|email|phone|person|file|checkbox|formula|rollup|created_time|
    last_edited_time|created_by|last_edited_by), value jsonb, created_at

- property_schemas:
    id, workspace_id, name, type (same enum as value_type), 
    options jsonb (for select/multi_select: [{id, name, color}]),
    icon, description

RLS:
- Pages inherit workspace membership permissions
- Deleted pages only visible to owner/admin for restore
- Published pages are publicly readable

Indexes:
- pages(workspace_id, parent_id) 
- pages(workspace_id, is_deleted)
- Full-text search index on pages(title, content)

Functions:
- get_page_tree(workspace_id) — recursive CTE returning full tree with depth
- soft_delete_page(page_id) — marks page + all children deleted
- restore_page(page_id)"
```

## Task 1.3 — Sidebar Component
```
Prompt to Cursor:
"Build the main application sidebar /components/sidebar/.

Structure:
- SidebarRoot.tsx — wrapper, handles collapsed/expanded state (240px / 52px)
- SidebarHeader.tsx — workspace switcher dropdown (shows workspace icon + name, 
  click to switch/create workspace), collapse toggle button
- SidebarSection.tsx — collapsible section with label
- SidebarItem.tsx — single nav item: icon, label, indent level, hover actions 
  (add child, options menu, drag handle)
- SidebarPageTree.tsx — recursive tree of pages, supports infinite nesting
- SidebarFavorites.tsx — pinned/starred pages section
- SidebarPrivate.tsx — private pages (visible only to creator)
- SidebarShared.tsx — shared with me section  
- SidebarTrash.tsx — trash section at bottom
- SidebarSearch.tsx — search trigger item at top
- SidebarSettings.tsx — settings link at bottom
- SidebarNewPage.tsx — + New Page button at bottom

Behaviors:
- Drag to reorder pages within same parent
- Drag to nest (drag over a page = make it child)
- Right-click context menu on page: rename, add sub-page, duplicate, move to, 
  copy link, add to favorites, archive, delete
- Keyboard: ArrowUp/Down to navigate, Enter to open, F2 to rename
- Collapse/expand tree nodes, remember state in localStorage
- Hover on item reveals drag handle on left, action buttons on right (⋯ and +)
- Page icon click = open emoji/icon picker
- Inline rename on double-click or F2

State: usePageTreeStore (zustand) — manages tree, optimistic updates
Realtime: subscribe to pages changes via Supabase Realtime

Design: matches the Cursor sidebar in the screenshots — dark bg, thin items,
no heavy borders between items, subtle hover bg, icons at 16px."
```

## Task 1.4 — Command Palette
```
Prompt to Cursor:
"Build a command palette /components/command/CommandPalette.tsx.

Trigger: Cmd+K (or Ctrl+K)

Sections:
- Recent pages
- Quick actions: New Page, New Database, Search, Go to Settings
- Page navigation (fuzzy search across all page titles)
- Block type insertion (when cursor in editor)
- Settings shortcuts

Features:
- Fuzzy search with Fuse.js
- Keyboard navigation (arrows + enter)
- Groups with labels
- Icons per item
- Breadcrumb path for pages (e.g. 'Projects > Q4 > Task List')
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
  Props: pageId, initialContent, editable (boolean), onUpdate callback
  Features: 
    - Auto-save on change (debounced 500ms) → upsert to pages.content
    - Optimistic saves with conflict detection
    - Offline queue (save to localStorage, sync on reconnect)
    - Word count tracking → update pages.word_count

- EditorToolbar.tsx — floating toolbar on text selection
  Options: Bold, Italic, Underline, Strikethrough, Code, 
  Link, Color picker (text + highlight), Comment

- BlockMenu.tsx — the '/' slash command menu
  All block types listed below

- EditorTitle.tsx — the page title input above the editor
  - Auto-resize textarea
  - Font: JUST Sans or Instrument Serif, large (2.5rem)
  - Updates pages.title on change (debounced)
  - Emoji/icon picker on click of icon beside title
  - Cover image add button (appears on hover)

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
16. Page Link ([[page]]) — inline page reference, shows page icon + title,
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
      Loom, Miro, Notion (read-only), Google Docs/Sheets/Slides (view)
    - Input URL → detect platform → render iframe or oEmbed
    - Resize handle for iframe height

23. Table (Simple)
    - Grid of cells, add/remove rows/columns
    - Cell types: text, number, checkbox
    - NOT the full database table (that's Phase 4)
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
    - A block whose content is synced across pages
    - Create: 'Create synced copy' → generates sync_block record in DB
    - Other pages: 'Copy synced block' using block ID
    - Visual: subtle green border/badge to indicate sync

28. Button Block
    - Label, icon (optional), action type:
      - Open URL
      - Create new page (from template)
      - Toggle visibility of block below
    - Style options: outline, filled, ghost

29. Previewed Link Section (like the screenshot showing 'Authentication', 'Storage' cards)
    - Drag any page into this block
    - Displays as card: icon, title, description (from page meta), 
      'Explore' and 'About' style buttons
    - Multiple can be arranged in a grid (2-3 columns)

30. Breadcrumb Block  
    - Auto shows: Workspace > Parent Page > Current Page
    - Clickable links
    - Can be placed anywhere in document

31. Table of Contents Block
    - Auto-generated from H1/H2/H3 in current page
    - Click to jump, highlights current section while scrolling"
```

---

# PHASE 3 — VIEWS SYSTEM

## Task 3.1 — Views Architecture
```
Prompt to Cursor:
"Design the views system. A 'View' in our app is a saved configuration for how to display 
a collection of pages/database entries.

Create /lib/types/views.ts with TypeScript types for:
- ViewType: 'table' | 'kanban' | 'calendar' | 'timeline' | 'list' | 'card' | 
             'year' | 'month' | 'week' | '2day' | 'day' | 'location' | 
             'graph_vbar' | 'graph_hbar' | 'graph_line' | 'graph_donut' | 'mind'
- ViewConfig: filter rules, sort rules, groupBy, visibleProperties, layout options
- FilterRule: property, operator, value
- SortRule: property, direction

Create Supabase migration /supabase/migrations/004_views.sql:
- views table: id, page_id (the database page this view belongs to), name, type, 
  config jsonb, is_default, sort_order, created_by, created_at

Create /components/views/ViewSwitcher.tsx:
- Tabs at top of a database page to switch between views
- + Add View button → dropdown of view types with icons
- Right-click view tab → rename, duplicate, delete
- Drag tabs to reorder

Create /components/views/ViewFilters.tsx:
- Filter bar below view tabs
- Add filter → property picker → operator → value
- Multiple filters with AND/OR
- Active filters shown as dismissable chips
- Sort button → add sort rules

Create /components/views/ViewBase.tsx:
- Wrapper that routes to correct view component based on ViewType
- Passes filtered+sorted data down"
```

## Task 3.2 — Table View
```
Prompt to Cursor:
"Build the Table view /components/views/TableView.tsx.

Features:
- Rows = database entries (pages with properties)
- Columns = page properties
- Column header: property name + type icon, click to sort, right-click to edit/hide/delete
- Drag column headers to reorder
- Resize columns by dragging border
- + Add Property button at the end of header row
- Row: page title (always first, with page icon), then property values
- Click row title → open page in side peek or full page
- Hover row → row actions appear: open, duplicate, delete
- Inline edit all property values in cells
- Multi-select rows (checkbox column on left) → bulk actions bar
- Frozen first column (title) on horizontal scroll
- + New Row button at bottom
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
- relation: linked page chips
- formula: computed value (read-only with formula indicator)
- rollup: aggregated value
- created_time/last_edited_time: formatted timestamp, read-only"
```

## Task 3.3 — Kanban View
```
Prompt to Cursor:
"Build the Kanban view /components/views/KanbanView.tsx.

Features:
- Columns = values of the group-by property (default: Status select property)
- Each column has: header (property value name + color), count badge, + Add button, 
  card list, column options menu
- Cards = database entries
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

## Task 3.4 — Calendar Views
```
Prompt to Cursor:
"Build the Calendar views in /components/views/calendar/.

Shared:
- CalendarBase.tsx — navigation header (prev/next, today button, date range label),
  view type switcher (Year/Month/Week/2Day/Day)
- Event rendering component — shows page icon + title, colored by a color property
- Click empty slot → create new entry with that date prefilled
- Click event → open page
- Drag event to reschedule
- Resize event (end time) by dragging bottom edge

Year View:
- 12 months in a grid
- Each month: mini calendar
- Dots on days that have events
- Click day → zoom to Day view

Month View:
- Full month grid, 7 columns
- Events shown as bars or dots depending on density
- Multi-day events span across days
- +N more → expand row

Week View:
- 7 day columns, hourly rows
- Events positioned by start/end time
- All-day events at top
- Current time indicator line
- Hour labels on left

2 Day View:
- Same as week but only 2 columns (today + tomorrow)
- Useful for focused planning

Day View:
- Single column, full day
- 15-minute slots
- Similar to Google Calendar day view

Reminder Events:
- Schema: store reminder events with date, start_time, end_time, checked (boolean)
- A special lightweight event type (not a full database page, just a calendar entry)
- Checked off = strikethrough in calendar
- Created via quick-add form in calendar (not the full editor)"
```

## Task 3.5 — Timeline View
```
Prompt to Cursor:
"Build the Timeline (Gantt) view /components/views/TimelineView.tsx.

Features:
- Horizontal time axis (days/weeks/months — zoom levels)
- Rows = database entries grouped optionally
- Bars = duration from date property A to date property B (configurable)
- Drag bar to move
- Drag bar ends to resize (change dates)
- Today line
- Zoom controls: Day | Week | Month | Quarter | Year
- Group rows by a property
- Collapse groups
- Labels on bars (entry title)
- Color bars by a select property
- Dependencies (draw lines between bars — A must finish before B starts)
  - Create dependency by dragging from one bar's end to another
  - Store in page_dependencies table"
```

## Task 3.6 — List & Card Views
```
Prompt to Cursor:
"Build List and Card views.

List View /components/views/ListView.tsx:
- Simplified linear list of entries
- Title + configurable secondary line (subtitle from a property)
- Page icon on left
- Date on right
- Status indicator dot
- Click to open
- Sortable, groupable
- Compact / Comfortable density toggle

Card View (Gallery) /components/views/CardView.tsx:
- Grid of cards (configurable: 2, 3, 4, 5 columns)
- Card: cover image (from cover_url or first image in content), icon, title, 
  up to 3 property badges below
- Hover: slight elevation, actions appear
- No cover → shows colored placeholder with icon
- Card size: small / medium / large toggle
- Fit image / crop image option per view"
```

## Task 3.7 — Graph Views
```
Prompt to Cursor:
"Build the Graph views using Recharts in /components/views/graphs/.

Install: recharts

All graphs:
- Pull data from current database view (filtered/sorted)
- X axis or segments = a property (configurable)  
- Y axis or values = a numeric or count property (configurable)
- Color = a select property (uses our 9 semantic colors)
- Legend
- Tooltip on hover
- Download as PNG button

VerticalBarChart.tsx — vertical bars
HorizontalBarChart.tsx — horizontal bars  
LineChart.tsx — line over time (X must be date property)
DonutChart.tsx — proportions (like Notion chart view)

Configuration panel:
- Source property (X/segments)
- Value property (Y/size)
- Color property
- Aggregation: count | sum | avg | min | max
- Show labels on bars/segments toggle
- Show grid lines toggle
- Aspect ratio"
```

## Task 3.8 — Location View
```
Prompt to Cursor:
"Build the Location view /components/views/LocationView.tsx.

Features:
- Map view using Mapbox GL JS (or Leaflet as fallback)
- Each database entry with a location property is a pin on the map
- Pin: page icon or custom marker, click = popup with title + quick properties
- Cluster nearby pins at low zoom
- Side panel: list of entries, click to highlight pin, link to open page
- Filter/search entries → hide non-matching pins
- + Add pin at location → creates new entry with location prefilled
- Location property stores: address string + {lat, lng} + place_name
- Geocoding: use Mapbox Geocoding API or Google Maps API to convert address to coords

Location property type:
- Input: text search → autocomplete suggestions → select → stores lat/lng + label
- Display in table: 'City, Country' format
- Display in card: map thumbnail"
```

---

# PHASE 4 — DATABASE SYSTEM (NOTION-STYLE PAGES AS DATABASES)

## Task 4.1 — Database Page Type
```
Prompt to Cursor:
"A 'Database' in our app is a special page type where child pages are database entries.
Any page can become a database. The views defined above display the entries of a database.

Update pages table:
- Add is_database boolean default false
- Add database_schema jsonb (stores the property schema for this database's entries)
  Schema format: [{id, name, type, options, icon, description, required, default_value}]

Create DatabaseHeader.tsx — shown at top of any database page:
- Page title (editable)
- View tabs (from ViewSwitcher)
- Filter + Sort + Group by + Properties (show/hide) buttons in a toolbar
- Search within database
- Count of entries
- ⋯ options: export CSV/JSON, duplicate database, template settings

Create PropertyEditor.tsx — manage database schema:
- List of all properties with type icons
- Drag to reorder
- Click to edit: rename, change type, set options (for select), 
  add description, set default value, toggle required
- Delete property (with confirmation: 'this will remove data from all entries')
- Add property: type picker dropdown

Implement database template system:
- Templates: predefined entry structures for this database
- /supabase/migrations/005_templates.sql:
  templates table: id, database_id, name, icon, description, content jsonb, 
  properties jsonb, created_by, is_global
- When creating new entry: show template picker (or default blank)"
```

## Task 4.2 — Property System Deep Dive
```
Prompt to Cursor:
"Implement the full property system for database entries.

For each property type, build:
1. A cell renderer (for table view)
2. A property editor (in page sidebar/header)
3. A filter component
4. A sort handler

PROPERTY IMPLEMENTATIONS:

Select & Multi-Select:
- Options have: id, name, color (from 9 semantic colors)
- Color picker in option editor
- Create new option inline while typing
- Drag to reorder options
- Select: single badge, click = dropdown to change
- Multi: multiple badges, click = dropdown multiselect

Date:
- Stores ISO string, optional time component
- Date picker: calendar UI (build custom, no dependencies)
- End date toggle (creates a date range)
- Time zone selector
- Reminder setting (notification N hours/days before)
- Display formats: 'Mar 21, 2026' | '2026-03-21' | 'relative (3 days ago)'

Person:
- Picker shows workspace members with avatars
- Multi-person support
- Shows avatar + name, click to open member profile

Relation:
- Links to entries in another database
- Configuration: which database to link to, bi-directional toggle
- Picker: search + select entries from target database
- Display: chips showing linked entries, click to open
- Synced rollup support

Rollup:
- Aggregates data from a Relation property
- Config: which relation, which property of related entries, aggregation type
- Aggregations: Count, Count unique, Count all, Percent empty, Percent not empty,
  Sum, Average, Median, Min, Max, Range, Show original, Count per group
- Auto-recalculates when related entries change

Formula:
- Custom formula language (subset of Notion's formula syntax)
- Functions: if(), not(), and(), or(), add(), subtract(), multiply(), divide(),
  mod(), pow(), abs(), ceil(), floor(), round(), sqrt(), log(), exp(),
  length(), slice(), contains(), startsWith(), endsWith(), replace(), 
  replaceAll(), lower(), upper(), trim(), split(), join(),
  toNumber(), toString(), toDate(), now(), today(), 
  dateAdd(), dateBetween(), formatDate(), month(), year(), day(), hour(), minute()
- Formula editor: syntax highlighted, autocomplete property names, live preview
- Stores compiled AST in DB, evaluates client-side for performance

Checkbox: simple boolean toggle

Number:
- Format: Plain | Number with commas | Percent | USD | EUR | INR | 
  Custom prefix/suffix
- Decimal places setting
- Range setting (for progress bar display option)

URL:
- Click = open in new tab
- Shows favicon of linked site (fetch via /api/favicon)
- URL preview on hover

Files & Media:
- Multiple files per property
- Drag to upload → Supabase Storage
- Preview thumbnails for images
- Download / delete per file

Created Time, Last Edited Time, Created By, Last Edited By:
- Auto-populated, read-only
- Displayed formatted

Status:
- Special select: groups options into Not Started, In Progress, Done
- Circular progress animation on cards"
```

---

# PHASE 5 — TIME VIEWS (CALENDAR DEEP + REMINDERS)

## Task 5.1 — Reminder Events System
```
Prompt to Cursor:
"Build the Reminder Events system (distinct from database entries).

Supabase migration /supabase/migrations/006_reminders.sql:
- reminder_events: id, workspace_id, user_id, title, date (date), 
  start_time (time, nullable), end_time (time, nullable), 
  is_checked (boolean default false), color, recurrence_rule jsonb, 
  created_at, updated_at
- recurrence_rules: id, event_id, frequency (daily|weekly|monthly|yearly),
  interval (every N), days_of_week, end_date, count (max occurrences)

Features:
- Reminder events appear in all calendar views as first-class items
- They are NOT database entries — just lightweight calendar events
- Checking off: click checkbox in calendar → is_checked = true → strikethrough appearance
- Quick create: click on any time slot in calendar → minimal popover to create reminder
  (title, time range, color, recurrence)
- Full edit: click on reminder → slide-over panel with all fields
- Drag to reschedule
- Recurring events: RRULE support, 'Edit this / this and following / all' when modifying
- Color coding: 9 semantic colors
- Reminder events show in the left sidebar under a 'Reminders' section too (today's + upcoming)

Build ReminderQuickCreate.tsx, ReminderEditPanel.tsx, ReminderCalendarBlock.tsx"
```

---

# PHASE 6 — MIND VIEW

## Task 6.1 — Mind View Component
```
Prompt to Cursor:
"Build the Mind View /components/mind/MindView.tsx.

Concept: A special full-page view of the user's entire workspace as a linear, 
zoomable flowchart. It shows the brain's organization at a glance.

Layout:
- Top level: main sections (root pages / top-level pages in sidebar)
- Second level: sub-pages
- Third level: sub-sub-pages (and so on, up to depth 5 rendered, then truncated with +N)
- Flow direction: left-to-right OR top-to-bottom (toggle)
- Nodes connected by subtle curved lines (bezier curves)

Node types:
- Workspace node (root): workspace icon + name
- Page node: page icon + title + entry count (if database)
- Database node: slightly different shape (rounded rectangle with top bar)
- Private page: dimmed node with lock icon
- External link page: arrow-out icon

Node interactions:
- Click node → open page
- Double-click node → inline rename
- Hover → shows quick-action buttons: + add child, open, ⋯ options
- Drag to rearrange (updates sort_order)
- Right-click context menu (same as sidebar)

Features:
- Canvas zoom (scroll or pinch) and pan (drag background)
- Mini-map in bottom-right corner
- Search/highlight: type to dim non-matching nodes, highlight matches
- Fit to screen button
- Collapse subtree on node click (toggle)
- Collaboration: show colored cursor + name labels for other online collaborators
  (using Supabase Realtime presence)
- Private sections: dimmed with padlock, other collaborators cannot see content
  (filtered out server-side for non-owners)
- Export as PNG / SVG button

Implementation:
- Use React Flow (install: @xyflow/react) for the canvas + node system
- Custom node components matching our design system
- Load full page tree from usePageTreeStore
- Performance: virtualize — only render nodes in viewport + buffer"
```

---

# PHASE 7 — COLLABORATION & REALTIME

## Task 7.1 — Realtime Presence
```
Prompt to Cursor:
"Implement realtime collaboration infrastructure using Supabase Realtime.

Features:
- Who's online: show avatar bubbles in page header for users currently viewing same page
- Cursor presence: in the editor, show other users' cursors with name labels
- Live content sync: changes broadcast to all viewers of same page in real-time
  (use Supabase Realtime broadcast, not polling)
- Optimistic updates: local changes apply immediately, then synced

/lib/realtime/:
- usePresence(pageId) hook — subscribe to who's on this page
- useBroadcast(channel) hook — send/receive live events
- usePageSync(pageId) hook — sync editor content changes

Page header presence avatars:
- Show up to 5, then +N more
- Tooltip: 'Alex is viewing this page'
- Fade in/out as users join/leave

Editor cursor presence (if using Tiptap):
- Use Tiptap CollaborationCursor extension with Supabase transport
- Each user gets a stable random color from our palette

/supabase/migrations/007_realtime_config.sql:
- Enable Realtime on pages table
- page_views: id, page_id, user_id, session_id, started_at, last_seen_at
  (for analytics: page view counts, active viewers)"
```

## Task 7.2 — Comments System
```
Prompt to Cursor:
"Build the comments system.

/supabase/migrations/008_comments.sql:
- comments: id, workspace_id, page_id, block_id (nullable — inline comment on specific block),
  parent_id (nullable — for threaded replies), content jsonb (rich text),
  author_id FK, resolved_by FK, resolved_at, created_at, updated_at
- comment_reactions: id, comment_id, user_id, emoji, created_at

Features:
- Page-level comments: collapsible thread panel on right side of page
- Inline block comments: hover over any block → comment icon appears → 
  click to open/add comment anchored to that block
- Comment UI: avatar, name, timestamp, rich text content (no block types — just 
  bold/italic/code/link/mention), reply button, resolve button (checkmark), 
  reactions (emoji picker), delete own comment
- Resolved comments: collapsed by default, 'Show resolved' toggle
- Mentions in comments: @user → notification sent
- Comment count badge on page in sidebar

/components/comments/:
- CommentThread.tsx
- CommentItem.tsx  
- CommentComposer.tsx
- InlineCommentMarker.tsx (the anchor shown in editor)"
```

---

# PHASE 8 — SEARCH

## Task 8.1 — Search System
```
Prompt to Cursor:
"Build the search system.

Two-tier approach:
1. Local/fast search: Fuse.js over loaded page titles (instant, available offline)
2. Full-text search: Supabase full-text search (searches page content too)

/supabase/migrations/009_search.sql:
- Add tsvector column to pages for FTS
- Create GIN index
- Trigger to auto-update tsvector on content change
- Function: search_pages(query text, workspace_id uuid, limit int)
  Returns pages ordered by relevance (ts_rank), with highlighted excerpts

/components/command/SearchModal.tsx:
- Triggered via Cmd+K or dedicated search button
- Two panels: results list + preview panel (right side for wide screens)
- Search results: page icon, title, breadcrumb path, last edited, highlighted excerpt
- Filters: by page type, by person, by date range, by tag/property value
- Recent searches history (localStorage)
- Suggested: recently edited pages, starred pages

/lib/hooks/useSearch.ts:
- Debounced query, 200ms
- First shows local results instantly
- Then appends server-side FTS results (deduped)
- Loading states"
```

---

# PHASE 9 — CUSTOMISATION SYSTEM

## Task 9.1 — Page Customization
```
Prompt to Cursor:
"Build the page customization system.

Page Header:
- Cover image: upload, unsplash search (Unsplash API), gradient presets, 
  solid color presets, remove
- Cover position: drag to reposition vertically
- Page icon: emoji picker (emoji-mart), upload image, lucide icon picker, remove
- 'Small text' toggle: reduces body font size to 14px
- 'Full width' toggle: removes max-width constraint
- 'Font family' picker: Default (DM Sans) | Serif (Instrument Serif) | Mono (JetBrains Mono)
- 'Lock page' toggle: makes page read-only even for editors

/components/editor/PageSettings.tsx — slide-over panel or popover with all above

Cover images:
- /supabase/migrations/010_covers.sql:
  page_covers: id, page_id, type (upload|url|gradient|color), value, position_y

Emoji Picker:
- Install emoji-mart, custom themed to match design system
- Tabs: Recently used, Smileys, People, Nature, Food, Travel, Activities, Objects, Symbols, Flags
- Search
- Skin tone selector
- Recent emojis persistence (localStorage)"
```

## Task 9.2 — Workspace Customization
```
Prompt to Cursor:
"Build workspace-level customization.

/app/(workspace)/[workspaceSlug]/settings/page.tsx — Settings page:

Workspace tab:
- Workspace name, icon (emoji/image), description
- Workspace URL slug (editable)
- Delete workspace (with typed confirmation)

Members tab:
- Member list: avatar, name, email, role, joined date
- Invite by email → send invite (Supabase edge function to send email)
- Change member role dropdown
- Remove member button
- Pending invites section

Appearance tab:
- Theme: Dark (default) | Light | System
- Accent color: choose from 9 semantic colors (affects --accent variable)
- Sidebar width: Narrow | Default | Wide
- Content width: Narrow (660px) | Default (720px) | Wide (960px) | Full
- Font scale: 90% | 100% | 110% | 120%
- Reduce motion toggle (for accessibility)

Import/Export tab:
- Import from Notion (JSON export parser)
- Import from Markdown files
- Export workspace: all pages as Markdown ZIP
- Export specific page: Markdown | PDF | HTML

API tab:
- Generate API key for workspace
- Webhook configuration: URL, events to trigger on

Store appearance settings in:
- workspace_settings table (per workspace, per user preferences)"
```

## Task 9.3 — Color Coding System
```
Prompt to Cursor:
"Implement color coding throughout the app.

Anywhere color can be applied:
1. Page background color (subtle tint of semantic color on --bg-0)
2. Page icon color (if using lucide icon)
3. Text color (inline: in editor toolbar color picker)
4. Text highlight/background color (inline)
5. Database select/multi_select option colors
6. Kanban column colors (from select option)
7. Calendar event colors
8. Sidebar item color dot (subtle color dot beside page name)
9. Block background color (callout, column bg)
10. Tag colors

Color system:
- 9 semantic colors: red, orange, yellow, green, teal, blue, purple, pink, gray
- Each has: base, muted (bg), text-on-dark, text-on-light values in CSS vars
- No custom hex input (enforced palette for coherence)
- Color picker component: 3x3 grid of color swatches + 'Default' option

Add to pages table: color text (null = default, else one of 9 color names)
Sidebar item with color: shows small colored left border or dot"
```

---

# PHASE 10 — ADDITIONAL FEATURES

## Task 10.1 — Version History
```
Prompt to Cursor:
"Implement version history for pages.

/supabase/migrations/011_versions.sql:
- page_versions: id, page_id, content jsonb, title, created_by, created_at,
  version_label (nullable — user can name a version), is_auto (bool)
- Triggers: auto-save version every 30 minutes if page has changes
- Max 50 auto-versions retained per page (delete oldest when over limit)
- Named versions: unlimited, never auto-deleted

/components/editor/VersionHistory.tsx:
- Slide-over panel from right
- List of versions: label (or 'Auto-save'), date, created by
- Click version → preview in read-only overlay
- Restore button → replaces current content (saves current as 'Before restore' version)
- Compare versions: side-by-side diff view (highlight added/removed blocks)
- Name this version: button on current or any version"
```

## Task 10.2 — Offline Mode
```
Prompt to Cursor:
"Implement offline support.

Strategy:
- Service Worker (Next.js PWA via next-pwa) for asset caching
- IndexedDB (using Dexie.js) for offline page content cache
- Mutation queue: when offline, queue writes to IndexedDB pending sync queue
- On reconnect: flush sync queue to Supabase in order, handling conflicts

Install: next-pwa dexie

/lib/offline/:
- db.ts — Dexie database schema: pages, pending_mutations
- syncQueue.ts — add to queue, process queue, conflict resolution
- useOnlineStatus.ts — hook returning {isOnline, wasOffline}
- offlineCache.ts — read/write page content to IndexedDB

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
- notifications: id, user_id, type (mention|comment|invite|reminder|page_shared|
  version_restored|member_joined), payload jsonb, is_read bool, 
  page_id (nullable), created_at

Triggers to create notifications:
- @mention in comment or page content → notify mentioned user
- Reply to comment → notify thread participants
- Workspace invite → notify invitee
- Reminder event (scheduled Supabase Edge Function or pg_cron)
- Page shared with you

Notification bell in top right of app:
- Badge count of unread
- Dropdown panel: list of notifications, click to navigate to source
- Mark all as read
- Settings link → notification preferences

Notification preferences per user (in workspace_settings):
- Email notifications: on/off per type
- Push (browser): on/off per type
- In-app: always on"
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
Cmd+P → Quick find page
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
[[ → Open page link picker
Cmd+Shift+D → Duplicate page (in sidebar)
Cmd+Shift+N → New page
F2 → Rename page (in sidebar)

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
- search_pages(query, workspace_id) → page results
- get_page(page_id) → page title + content as markdown
- create_page(parent_id, title, content_markdown) → new page
- update_page(page_id, content_markdown) → updates content
- list_databases(workspace_id) → list of database pages
- query_database(database_id, filters, sorts) → entries with properties
- create_entry(database_id, properties) → new database entry

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
- Daily Note (auto-creates today's note page)
- Reading Time estimator (shows in page header)

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

This is a special database template: 'Timetable'
- Entries: recurring class/event blocks
- Properties: Title, Day of Week (multi_select), Start Time, End Time, 
  Location, Color, Instructor/Host, Notes

A Timetable page has a special Timetable View:
/components/views/TimetableView.tsx:
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
- Connect: GitHub, Linear, Slack, Google Calendar, Notion (import)
- OAuth flows per service
- Manage connected accounts
- Per-integration settings"
```

---

# PHASE 11 — PUBLISHING & SHARING

## Task 11.1 — Page Publishing
```
Prompt to Cursor:
"Build page publishing (public sharing).

Updates to pages table:
- is_published: boolean
- published_slug: unique text (auto-generated from title, editable)
- published_at: timestamptz
- publish_config: jsonb {
    show_toc: bool, 
    allow_comments: bool (public comments),
    password: hashed_password | null,
    custom_domain: null (future),
    seo_title: text,
    seo_description: text,
    og_image_url: text
  }

/app/(public)/p/[slug]/page.tsx:
- Public read-only page renderer
- No auth required
- Password gate if publish_config.password is set
- Shows all blocks in read-only mode
- If allow_comments: show public comment form (with name + email, no account needed)
- SEO: metadata from publish_config, og tags
- 'Made with Lobe' subtle footer badge (can toggle off in settings)

Share button in page header:
- Copy link (internal, for workspace members)
- Publish to web → toggle with settings
- Share with specific workspace member (if not already a member)
- Get embed code (for iframes in external sites)
- Export: Markdown | PDF | HTML"
```

---

# PHASE 12 — PERFORMANCE & POLISH

## Task 12.1 — Performance Optimization
```
Prompt to Cursor:
"Optimize app performance.

1. Page tree lazy loading:
   - Load only top 2 levels initially
   - Load children on expand
   - Prefetch on hover after 300ms delay

2. Editor virtualization:
   - For very long documents (>200 blocks), use windowed rendering
   - Only render blocks in viewport + 50 block buffer

3. Image optimization:
   - Compress on upload (before Supabase Storage)
   - Generate thumbnails server-side (Supabase Edge Function)
   - Use Next.js Image component everywhere

4. Bundle optimization:
   - Dynamic imports for heavy components (editor, charts, maps, mind view)
   - Route-based code splitting
   - Analyze bundle with @next/bundle-analyzer

5. Query optimization:
   - React Query with aggressive caching (staleTime: 60s for page content)
   - Prefetch adjacent pages
   - Suspense boundaries with skeleton UIs

6. Supabase query optimization:
   - Review all queries, add missing indexes
   - Use select() to only fetch needed columns
   - Batch multiple small queries

Create Skeleton components for:
- SidebarSkeleton, PageSkeleton, TableSkeleton, CardSkeleton, CalendarSkeleton"
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
- PageErrorBoundary — catches editor crashes, shows 'Something went wrong' with retry
- SidebarErrorBoundary
- ViewErrorBoundary (for calendar, kanban, etc.)

Toast notification system:
- Install Sonner (install: sonner)
- Toast variants: success, error, warning, info, loading→success
- Used for: save confirmation, copy link, export started, error messages

Loading states:
- Skeleton UIs for every major view (no spinners in content areas)
- Inline spinner only for button actions
- Page transition: subtle fade between routes

Error pages:
- /app/not-found.tsx — clean 404 (page not found or no access)
- /app/error.tsx — 500 error with reset button
- Workspace not found (wrong slug)
- Access denied (not a member)"
```

---

# PHASE 13 — FINAL FEATURES (Notion parity completion)

## Task 13.1 — Linked Databases
```
Prompt to Cursor:
"Implement Linked Database Views — the ability to show a view of a database 
inside another page (not the database's own page).

Block type: Linked Database View
- Insert via slash command: /linked database
- Picker: select which database to link
- Embed a full view (table/kanban/etc.) of that database inline in current page
- Has its own local filter/sort (doesn't affect the original database's views)
- Shows view switcher
- Can create new entries (they go into the original database)
- Shows entry count
- Collapsible

Store: linked_database_blocks table with page_id, source_database_id, view_config"
```

## Task 13.2 — Page Templates Gallery
```
Prompt to Cursor:
"Build the templates gallery.

/supabase/migrations/013_global_templates.sql:
- global_templates: id, name, description, category, icon, 
  content jsonb, database_schema jsonb, preview_url, 
  is_official bool, created_by, use_count, created_at

Template categories:
Personal: Daily Journal, Weekly Review, Reading List, Habit Tracker, 
          Goals Tracker, Travel Planner, Budget Tracker, Recipe Collection
Work: Project Tracker, Meeting Notes, OKR Dashboard, Sprint Board, 
      CRM (lightweight), Content Calendar, Interview Tracker
Learning: Study Notes, Course Tracker, Book Notes (Zettelkasten), Flashcards
Life OS: Lobe Setup (full setup), Annual Review, Decision Log

/components/templates/TemplateGallery.tsx:
- Grid of template cards: preview thumbnail, name, category, use count
- Filter by category
- Click → preview modal showing template structure
- Use Template → creates page(s) from template, navigates there
- Save current page as template (for workspace or global)"
```

## Task 13.3 — Table of Contents & Page Outline
```
Prompt to Cursor:
"Build the Table of Contents / Page Outline panel.

Location: collapsible panel on the right side of the page (when page width allows)
Trigger: click 'Outline' button in page header actions

Features:
- Auto-generated list of H1, H2, H3 headings in document
- Nested structure matching heading hierarchy
- Click to scroll to heading (smooth scroll)
- Highlight currently-in-view heading (IntersectionObserver)
- Collapse H3 under H2, H2 under H1
- If document has no headings: show 'No headings found'
- Sticky positioning while scrolling
- Follows page scroll even in embedded/split views"
```

## Task 13.4 — Quick Capture & Daily Notes
```
Prompt to Cursor:
"Build Quick Capture and Daily Notes.

Quick Capture:
- Global keyboard shortcut: Cmd+Shift+C (customizable)
- Opens small floating window / browser extension popup (web version: modal)
- Text input with formatting (markdown shortcuts work)
- Tags input
- Destination: choose page to append to (default: Inbox page)
- Submit: appends as new block to destination page
- Appears even when app is not focused (if as PWA / installed)

Daily Notes:
- Special page type: auto-generated pages named 'MMM D, YYYY' (e.g. 'Mar 21, 2026')
- Stored under a special 'Daily Notes' database page
- Template: each daily note uses the Daily Note Template (customizable)
- Today's Note shortcut: Cmd+Shift+T
- Creates today's note if it doesn't exist, opens it if it does
- In sidebar: special 'Today' entry under Daily Notes
- Backlinks: shows which pages link TO today's note
- Calendar view of daily notes database shows all entries"
```

## Task 13.5 — Backlinks & Graph View (future addition)
```
Prompt to Cursor:
"Implement backlinks tracking.

/supabase/migrations/014_backlinks.sql:
- page_links: id, source_page_id, target_page_id, block_id, created_at
  (created whenever a page link [[...]] block is inserted)
- Trigger: update page_links on content change (parse for page references)

In page editor footer:
- Backlinks section: 'N pages link to this'
- Click to expand: list of pages with excerpts showing the context of the link
- Click page → open it

Page mentions:
- Also tracked: @mention of a page in text
- Stored same as page_links but with mention_type = 'mention' vs 'link'"
```

---

# CURSOR WORKFLOW GUIDE

## Session Template
Start every Cursor session with:
```
I'm building Lobe — a Notion-superset second brain web app.
Stack: Next.js 14 App Router, TypeScript strict, Tailwind CSS (CSS variables only),
Supabase (Postgres + Auth + Storage + Realtime), Zustand, React Query.

Design: dark theme (#0a0a0a base), DM Sans body, JUST Sans display, no gradients,
thin borders (1px), radius-sm (4px) for inputs/buttons, radius-md (6px) for cards.
CSS variables for all colors — no Tailwind color utility classes.

[PASTE RELEVANT EXISTING CODE/TYPES]

Now let's work on: [SPECIFIC TASK FROM THIS PRD]
```

## File to Create: `.cursorrules`
```
# Project: Lobe (Notion Superset)
# Stack: Next.js 14, TypeScript strict, Tailwind + CSS vars, Supabase, Zustand

## Rules
- TypeScript: strict mode, no `any`, explicit return types on all functions
- No inline styles. Use CSS variables via Tailwind arbitrary values: `bg-[var(--bg-2)]`
- Never use Tailwind color classes (bg-blue-500 etc). Use CSS var classes only.
- All Supabase queries: always handle errors, use .throwOnError() or check .error
- Components: always accept and spread className prop for composability
- Hooks: prefix with 'use', single responsibility, always cleanup subscriptions
- File naming: PascalCase components, camelCase utils, kebab-case routes
- Imports: absolute paths via @/ alias, group: react → next → external → internal → types
- Database: always write SQL migrations, never use Supabase dashboard for schema changes
- Forms: no HTML <form> submit, use controlled state + onClick handlers
- Animations: framer-motion only, duration < 200ms for micro-interactions
- Icons: lucide-react only, size prop (not className for size), default 16px
- Error handling: every async function wrapped in try/catch, errors surfaced to user via toast
- Zustand stores: one file per domain (pagesStore, uiStore, workspaceStore)
- React Query: queryKey arrays follow [resource, id, ...params] pattern
```

## Phase Execution Order
```
Phase 0: Bootstrap → MUST be complete before anything else
Phase 1: Workspace + Sidebar → Core navigation
Phase 2: Block Editor → Core editing experience
Phase 3: Views → Start with Table, then Kanban, then Calendar
Phase 4: Database System → Depends on Views
Phase 5: Time/Calendar → Can parallel with Phase 4
Phase 6: Mind View → Depends on Phase 1 (page tree)
Phase 7: Collaboration → After editor is stable
Phase 8: Search → After Phase 1+2
Phase 9: Customization → After core features stable
Phase 10: Additional Features → Pick by priority
Phase 11: Publishing → After editor complete
Phase 12: Performance → Before public launch
Phase 13: Final Features → Notion parity polish
```

---

# NOTION FEATURE PARITY CHECKLIST

Everything Notion can do that we must match:

## ✅ Core Editor
- [x] All standard block types
- [x] Slash commands
- [x] Drag to reorder blocks
- [x] Nested blocks (indent)
- [x] Block color (text + background)
- [x] Duplicate block
- [x] Turn into (convert block type)
- [x] Comment on block
- [x] Copy block link
- [x] Synced blocks
- [x] Columns (multi-column layout)

## ✅ Pages
- [x] Infinite nesting
- [x] Page icon (emoji/image)
- [x] Cover image
- [x] Page width settings
- [x] Font settings per page
- [x] Page links / backlinks
- [x] Full page vs peek view (side panel)
- [x] Locking pages

## ✅ Database
- [x] All property types
- [x] Inline databases
- [x] Full-page databases
- [x] Linked database views
- [x] All view types (table, board, gallery, list, calendar, timeline)
- [x] Filter, sort, group by
- [x] Hide/show properties per view
- [x] Database templates
- [x] Relations and rollups
- [x] Formula properties

## ✅ Collaboration
- [x] Real-time co-editing
- [x] Page comments and block comments
- [x] @mentions
- [x] Workspace members + roles
- [x] Guest access
- [x] Share page publicly

## ✅ Organization
- [x] Favorites
- [x] Trash + restore
- [x] Archive
- [x] Search (title + content)
- [x] Sidebar page tree
- [x] Version history

## 🆕 WE ADD (beyond Notion)
- [x] Mind View (full-workspace flowchart)
- [x] Reminder Events (lightweight calendar events with checkbox)
- [x] Location property + Location map view
- [x] Timetable view (recurring schedule grid)
- [x] Offline mode with sync queue
- [x] MCP server endpoint (AI agent integration)
- [x] Plugin system
- [x] Graph views (bar, line, donut) built-in
- [x] Daily notes with quick capture
- [x] Custom keyboard shortcut remapping
- [x] 2 Day calendar view
- [x] Year calendar view

---

*End of PRD. Total phases: 13. Total tasks: ~40. Estimated build time with Cursor Pro: 6-10 weeks of focused development.*