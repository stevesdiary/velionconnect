# VelionConnect — Mobile App UI Design Prompt

> **For:** Claude (design generation)
> **Deliverable:** High-fidelity UI design for the **VelionConnect mobile app** (iOS-first, works for Android too).
> **Aesthetic:** Apple design language (iOS Human Interface Guidelines) — clean, calm, deferential to content, generous whitespace, soft depth, crisp typography, subtle motion.
> **Type:** Google Fonts only (see Typography).

Design **every screen listed in Part 5**, in **both light and dark mode**, at **iPhone 15 / 16 dimensions (393 × 852 pt)**. Use a consistent design system throughout (Part 2–4). Treat this document as the source of truth.

---

## Part 1 — Product brief

**VelionConnect** is an AI-powered **omnichannel customer engagement platform** — "the operating system for customer conversations." Support and social teams use it to:

- Receive and reply to customer messages from **WhatsApp, Instagram, Facebook, and LinkedIn** in one unified inbox.
- Get **AI reply suggestions**, one-tap **translation**, **brand-voice** rewriting, and conversation **summaries**.
- Manage **contacts** (one customer identity across channels).
- **Compose, schedule, and publish** social posts with a media library and a content calendar.
- Track **analytics** and receive **real-time notifications**.

**Primary user on mobile:** a support agent or social manager, often on the go, triaging conversations and firing off replies quickly. Mobile prioritizes the **Inbox** and **Conversation** experience; publishing and analytics are secondary but present.

**Market:** Nigeria-first, global-ready. Reflect this subtly — customer names, currencies (₦), and languages (English, Yoruba, Igbo, Hausa, French) can appear in sample data.

**Brand personality:** competent, modern, trustworthy, quietly premium. Not playful, not enterprise-stuffy.

---

## Part 2 — Design system foundations

### 2.1 Design principles (Apple HIG)

- **Clarity:** legible text, precise icons, unmistakable affordances. Content over chrome.
- **Deference:** the UI recedes; conversations and content are the stars. Lots of white space, light dividers, translucent bars.
- **Depth:** soft, realistic layering — sheets slide over, cards lift gently, blurred navigation bars over scrolling content.
- **Consistency:** one type scale, one spacing scale, one set of components everywhere.

### 2.2 Color

Use **iOS-style semantic neutrals** plus a single brand accent and per-channel colors.

**Brand accent (interactive / primary):**

- Indigo `#5B5BD6` (primary), pressed `#4A4AC4`, tint bg `#EEEEFB`
- Use for primary buttons, active tab, links, selection, unread badges, send button.

**Channel colors (for channel dots, filters, icons):**

- WhatsApp `#25D366`
- Instagram — gradient `#F58529 → #DD2A7B → #8134AF` (use a single `#DD2A7B` where a solid is needed)
- Facebook `#1877F2`
- LinkedIn `#0A66C2`

**Light mode neutrals:**

- Background (grouped) `#F2F2F7`
- Surface / card `#FFFFFF`
- Primary text `#1C1C1E`
- Secondary text `#6C6C70`
- Tertiary text / placeholder `#AEAEB2`
- Separator `#E5E5EA` (hairline, 0.5–1pt)

**Dark mode neutrals:**

- Background `#000000`
- Surface / card `#1C1C1E` (elevated `#2C2C2E`)
- Primary text `#F5F5F7`
- Secondary text `#98989F`
- Separator `#38383A`

**Semantic:**

- Success `#34C759`, Warning `#FF9F0A`, Danger `#FF3B30`, Info `#5B5BD6`.
- Status pills: Open = green tint, Pending = amber tint, Resolved = gray tint.

### 2.3 Typography (Google Fonts)

Apple ships **SF Pro**, which is not on Google Fonts. Use **Inter** — the closest Google-Fonts match — as the system typeface, styled the Apple way (tight tracking on large sizes, generous line height on body). Use **Instrument Serif** sparingly for large empty-state / marketing headlines to add warmth.

- **Primary UI + body:** `Inter` (weights 400/500/600/700). Enable tabular figures for counts, timestamps, metrics.
- **Expressive display (optional, empty states, onboarding hero):** `Instrument Serif` (regular).

**Type scale (pt / line-height / weight / tracking):**

| Token       | Size / LH | Weight  | Use                                          |
| ----------- | --------- | ------- | -------------------------------------------- |
| Large Title | 34 / 41   | 700     | Screen title on scroll-top (Inbox, Contacts) |
| Title 1     | 28 / 34   | 700     | Section hero                                 |
| Title 2     | 22 / 28   | 600     | Sheet titles, card headers                   |
| Headline    | 17 / 22   | 600     | List row primary, nav title                  |
| Body        | 17 / 24   | 400     | Message text, paragraphs                     |
| Callout     | 16 / 21   | 400     | Secondary content                            |
| Subhead     | 15 / 20   | 400/500 | List row secondary                           |
| Footnote    | 13 / 18   | 400     | Timestamps, metadata                         |
| Caption     | 12 / 16   | 500     | Badges, labels, tab bar                      |

Large titles use **-0.4pt** tracking; captions/labels use **+0.2pt**.

### 2.4 Spacing, grid, radius, elevation

- **Spacing scale (pt):** 2, 4, 8, 12, 16, 20, 24, 32, 40. Default screen side margin **16pt**.
- **Corner radius:** cards/sheets **16**, buttons/inputs **12**, chips/pills **full (999)**, avatars **full**, message bubbles **20** (with a 6pt "tail" corner on the sender side).
- **Elevation:** avoid heavy shadows. Cards: `y 1, blur 3, rgba(0,0,0,0.06)` in light; rely on surface contrast in dark. Floating action button and sheets get a slightly stronger, still soft shadow.
- **Hit targets:** minimum 44 × 44 pt.

### 2.5 Iconography & imagery

- **Icons:** SF Symbols-style **line icons**, 1.5–2pt stroke, rounded joins. Consistent optical size (~22pt in bars, 17pt inline).
- **Avatars:** circular. When no photo, a solid tint circle with the contact's initial. Channel of origin shown as a small circular **channel dot** overlapping the avatar's bottom-right.
- **Illustrations:** minimal, line-based, monochrome-with-accent for empty states.

### 2.6 Motion

- iOS-native feel: **spring** transitions, 250–350ms. Sheets slide up with rubber-band. Tab changes cross-fade. New message bubbles animate in from the bottom with a slight scale. Pull-to-refresh uses a subtle custom spinner. Respect reduced-motion.

---

## Part 3 — Global components

Design a small component sheet for these, then reuse them across screens:

- **Navigation bar (top):** translucent/blurred over content. Large-title variant (collapses to inline title on scroll) and standard inline variant with back chevron + optional trailing action.
- **Tab bar (bottom):** translucent, 5 items max, SF-style icons + 12pt caption labels, active in brand indigo. Center or standard layout (see Part 4).
- **List row:** avatar/leading icon, 2 lines of text (Headline + Subhead), trailing metadata (timestamp) and accessory (chevron, unread badge, star). Swipe actions (leading/trailing).
- **Segmented control:** iOS pill segmented control for status tabs (Open / Pending / Resolved).
- **Buttons:** Primary (filled indigo, 12 radius, 50pt tall), Secondary (tinted), Tertiary (text-only), Destructive (red). Disabled = reduced opacity.
- **Text field & search field:** rounded 12, filled subtle gray, inline leading icon; search field is the iOS rounded style with a magnifier and Cancel affordance.
- **Chips / tags:** full-radius pills, colored per label (custom hex) or channel.
- **Badges:** unread count (indigo circle, white tabular number), notification dot.
- **Bottom sheet / action sheet:** rounded-top surface with a grabber handle; used for filters, composer options, brand-voice picker, translate language picker, confirmations.
- **Toast / inline banner:** transient success/error at top under the nav bar.
- **Avatar + channel dot**, **Skeleton loaders** (shimmer) for lists and threads, **Empty state** (icon + Instrument-Serif headline + one-line subtext + optional button).

---

## Part 4 — Navigation architecture

**Bottom tab bar (5 tabs):**

1. **Inbox** (chat-bubbles icon) — default
2. **Contacts** (people icon)
3. **Publish** (square-and-pencil icon)
4. **Insights** (chart icon) — analytics
5. **Settings** (gear icon)

A **Notifications** bell lives in the top-right of the Inbox nav bar (with a dot when unread) rather than a tab. An **active-workspace switcher** sits in the top-left of the Inbox large-title header (org/workspace name with a chevron → opens a switcher sheet).

Conversations open as a **pushed full-screen** from Inbox. Composer, filters, and pickers open as **bottom sheets**.

---

## Part 5 — Screens (design each one)

For every screen, design the **default state** plus the noted **empty / loading / error** states, in **light and dark**.

### FLOW A — Onboarding & Auth

**A1. Splash / Welcome**

- Centered VelionConnect wordmark/logo, a one-line tagline in Instrument Serif ("The operating system for customer conversations"), a soft indigo gradient or blurred orbs background.
- Buttons: **Get started** (primary) → Register, **Log in** (tertiary).

**A2. Log in**

- Inline nav title "Log in", back chevron.
- Email field, Password field (with show/hide), **Log in** primary button.
- "Email me a magic link instead" tertiary link; "Create an account" at bottom.
- States: inline error banner on wrong credentials; button loading spinner.

**A3. Register**

- Fields: Full name, Email, Password (with strength hint text). **Create account** primary.
- Fine print about terms. Link back to Log in.

**A4. Magic link — request & sent**

- Request: single email field + "Send magic link".
- Sent: centered checkmark/mail illustration, "Check your inbox", "We sent a link to jane@example.com", Resend tertiary.

**A5. Two-factor verify**

- Title "Enter your code", subtitle "Open your authenticator app".
- **6-digit segmented OTP input** (six boxes), auto-advance, paste support.
- "Verify" primary; error shake on invalid code; "Back to login".

**A6. Two-factor setup** (from Settings → Security)

- Steps: (1) QR code card + "Can't scan? Enter this key" with the secret in a copyable monospace pill; (2) 6-digit confirm input; (3) success state "Two-factor is on" with a green shield.

### FLOW B — Inbox (primary experience)

**B1. Inbox — conversation list**

- **Large-title header** "Inbox". Left: workspace switcher (org · workspace, chevron). Right: **notifications bell** (with dot) and a **filter** icon.
- Under the title: **iOS search field** ("Search conversations, contacts…").
- **Segmented control:** Open · Pending · Resolved.
- **Channel filter row:** horizontally scrollable chips — All, WhatsApp, Instagram, Facebook, LinkedIn (each with its channel color dot). Selected chip filled.
- **Conversation list rows:** avatar + channel dot; line 1 = contact name (Headline), unread names in semibold; line 2 = last-message preview (Subhead, tertiary, truncated); trailing = relative timestamp (Footnote) + **unread count badge** (indigo) and/or star; optional colored **label chips** on a third mini-line.
- **Swipe actions:** trailing = Resolve (green) / More; leading = Star, Mark read.
- **Pull-to-refresh.** Infinite scroll with a skeleton at the bottom while loading more.
- **States:** loading = 6 shimmer rows; empty (per tab) = friendly illustration + "No open conversations" + subtext; error = retry banner.

**B2. Filters sheet**

- Bottom sheet with grabber. Sections: Status, Channel, Assignee (avatars), Starred toggle, Labels (multi-select chips). "Apply" primary + "Reset" tertiary.

**B3. Workspace switcher sheet**

- List of organizations, each expandable to its workspaces; current selection checkmarked. "Manage organizations" row at bottom.

### FLOW C — Conversation

**C1. Conversation thread**

- **Inline nav bar:** back chevron; center = contact name + channel (small channel dot + "WhatsApp"); right = **overflow (•••)** and a **star** toggle.
- Optional **AI summary banner** (dismissible, indigo tint) when a summary exists: "Summary: …".
- **Message thread:** date dividers; **bubbles** — inbound left (surface/gray bubble), outbound right (indigo bubble, white text); rounded 20 with tail; timestamp + delivery status ticks (sent ✓, delivered ✓✓, read ✓✓ in blue) on outbound; reply-to quoted snippet inside a bubble; attachments render as image thumbnails / file chips.
- **Per-message actions (long-press → context menu, Apple style):** Reply, Copy, **Translate**, React.
- **Translate result** renders inline beneath the original in a sub(tinted) block with a "Hide translation" affordance.
- **Composer (bottom, sticky, over blurred bar):**
  - Expanding text field (rounded), leading **+** for attachments (camera, photo, file), trailing **send** button (indigo, enabled when non-empty).
  - **AI suggestion chips** row appears above the field when suggestions arrive (up to 3 tappable chips; tap fills the field). A small sparkle icon.
  - **Brand-voice** button (wand icon) → opens a sheet to rewrite the current draft in a chosen brand voice; shows before/after.
- **States:** loading thread = shimmer bubbles; empty = "No messages yet"; sending = bubble with a spinner; failed = red "!" with tap-to-retry.

**C2. Contact panel (from thread ••• or tapping the header)**

- Slides up as a sheet (or pushes). Shows: large avatar, name, channel identities list (WhatsApp/IG/etc. rows with the platform icon), email, phone (₦ locale aware), timezone, tags (chips), notes (editable), and quick actions (Call, Email, Edit). "Merge contact" row.

### FLOW D — Contacts

**D1. Contacts list**

- Large title "Contacts". Search field. Optional A–Z index rail on the right (iOS style).
- Rows: avatar + name + (email/phone) + channel identity dots. Trailing chevron.
- Empty: "No contacts yet — they appear when customers message you."

**D2. Contact detail**

- Header card: big avatar, name, quick action buttons (Message, Call, Email).
- Sections (grouped inset lists): Contact info, Platform identities, Tags, Notes, Conversations (recent, tappable). Overflow: Merge, Edit, Block.

**D3. Merge contacts sheet**

- "Merge {name} into…" with a searchable contact picker; explanatory caption ("All conversations and identities transfer"); destructive-styled confirm.

### FLOW E — Publish

**E1. Publish home (list + calendar toggle)**

- Large title "Publish". Segmented toggle: **List** · **Calendar**. Right: **+** to compose.
- List: post cards — platform icon + status pill (Draft/Scheduled/Published/Failed), caption preview, media thumbnail, scheduled/published time; actions (Edit, Publish now, Delete).
- Calendar: month grid (built, not a system calendar), days with small colored dots per scheduled post; tap a day → that day's posts.
- Empty: "No posts yet — create your first."

**E2. Post composer**

- Full-screen sheet. **Account selector** (which connected account/platform). **Caption** multiline field with a live **character counter** that reflects the platform limit and turns amber/red near/over.
- AI helpers as a row: **Hashtags** (#) and **Optimize for platform** (wand) — results appear as tappable chips / replace the caption.
- **Media:** add from **camera / library / Media Library**; thumbnails grid with remove; drag to reorder; platform validation hints ("Instagram requires media").
- **Schedule:** date-time picker (iOS wheel) or "Publish now".
- Footer: **Save draft** (secondary) + **Schedule** / **Publish** (primary). Validation errors listed inline.

**E3. Media library**

- Grid of assets (images + video with a play glyph), size/name on long-press; **Upload** button; multi-select mode for picking into a post; delete with confirm.

### FLOW F — Insights (Analytics)

**F1. Insights dashboard**

- Large title "Insights". Date-range chip (Today / 7d / 30d).
- **Stat tiles** (2-up cards): Total conversations, Open, Avg. first response time, Messages sent. Big tabular numbers, tiny trend delta.
- **Charts:** messages by channel (horizontal bars in channel colors), conversations over time (line). Keep charts clean, minimal gridlines, labeled.
- Empty/no-data state per card.

### FLOW G — Notifications

**G1. Notifications**

- Presented as a sheet from the Inbox bell (or a pushed screen). Grouped list: unread section (indigo-tinted rows with a dot) then earlier. Each row: icon by type (new message, new conversation, mention, post published/failed), title, body, timestamp. "Mark all read" in the nav bar. Tapping deep-links to the conversation/post. Empty: "You're all caught up."

### FLOW H — Settings

**H1. Settings home** (grouped inset lists, iOS style)

- Top: profile card (avatar, name, email) → Profile.
- Sections:
  - **Account:** Profile, Security (2FA).
  - **Organization:** Organization, Members, Workspaces, **Channels** (connected accounts), Labels, Brand voice.
  - **App:** Notifications, Appearance (Light/Dark/System), Language.
  - Sign out (destructive, at bottom). App version footnote.

**H2. Channels (connected accounts)**

- List of connected accounts (platform icon, name, status pill Active/Error) with a "Connect" section below for WhatsApp / Instagram / Facebook / LinkedIn, each a row with the brand icon and a **Connect** button. Error accounts show a "Reconnect" affordance.

**H3. Connect channel flow**

- Per platform: an explainer card (what permissions, what it enables) + a primary **Connect with {Platform}** button that begins OAuth (for WhatsApp, a key/token form instead). Success state returns to the Channels list with the new account.

**H4. Members**

- List of members (avatar, name, email, role pill). Tap → change role (sheet: Owner/Admin/Member/Viewer) or remove (destructive). "Invite member" primary → invite sheet (email + role).

**H5. Labels**

- List of labels (color swatch + name) with delete; "New label" → sheet with name field + a **color picker** (row of preset swatches). Live preview chip.

**H6. Brand voice**

- List of brand voices (name, tone, default badge). Create/edit sheet: name, tone, example phrases (add/remove), instructions, "Set as default" toggle.

**H7. Profile**

- Editable: avatar (tap to change), full name, email (read-only or verify), timezone, locale, currency. Save in nav bar.

**H8. Appearance & Language**

- Appearance: segmented Light / Dark / System with live preview.
- Language: list with checkmark (English, Yoruba, Igbo, Hausa, French, …).

---

## Part 6 — Output & deliverables

- Produce a **screen inventory / flow overview** first (a board showing all screens grouped by Flow A–H), then each screen in detail.
- For each screen, show **light and dark** side by side.
- Include a **foundations page**: color tokens (light/dark), type scale specimen (Inter + Instrument Serif), spacing/radius, and the **global component sheet** (Part 3).
- Use realistic sample content: Nigerian and international names, ₦ pricing, WhatsApp/Instagram conversations, Yoruba/English message samples, believable timestamps.
- Keep it unmistakably **Apple**: blurred translucent bars, large titles that collapse, grouped inset lists, bottom sheets with grabbers, hairline separators, restrained shadows, spring motion.
- Ensure **accessibility:** AA contrast in both themes, 44pt hit targets, Dynamic-Type-friendly text, clear focus/selected states.

**Primary hero screens to nail first (highest priority):** B1 Inbox list, C1 Conversation thread (with AI suggestions + translate), E2 Post composer, H1 Settings, A5 Two-factor verify.
