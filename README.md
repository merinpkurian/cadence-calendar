# Cadence — Team Calendar

Cadence is a modern, lightweight team calendar web application built for the frontend take-home interview assignment. It features an interactive week view, collision-aware event layout, drag-to-reschedule, vertical resize, optimistic UI updates with resilient rollback against an intentionally unreliable backend, and complete account settings.

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8
- **Routing**: React Router v7
- **Styling**: Vanilla CSS Design Tokens (Strict 1:1 match to Figma design foundations)
- **Typography**: Inter (Google Fonts)
- **Icons**: Lucide React
- **Dependencies**: Zero heavy external calendar or drag-and-drop libraries; all interactions are implemented with native browser pointer events and custom algorithms.

---

## ✨ Features

### 1. Authentication & Session Management
- **Registration**: Full name, email, password with real-time strength meter, and optional avatar image upload ($\le 300\text{ KB}$, PNG/JPEG/WebP/GIF with instant local preview).
- **Login**: Email & password authentication with show/hide password toggle and persistent session choice (*"Stay logged in for 30 days"*).
- **Rotating Refresh Token Mutex**: Handles rotating refresh tokens using an in-flight Promise queue in `api.ts`, preventing duplicate `/auth/refresh` requests and session invalidation.
- **Protected Routing**: `ProtectedRoute` and `PublicOnlyRoute` prevent unauthorized access to `/calendar` and `/settings` and redirect to `/login`.
- **Profile Menu & Logout**: User profile popover in both the sidebar and header showing name, email, Settings link, and Logout. Logout completely wipes tokens from `localStorage` and `sessionStorage` and prevents browser back-navigation.

### 2. Calendar Week View
- **Interactive Grid**: 7-day Monday–Sunday columns from 8:00 AM to 8:00 PM (12 visible hours).
- **Current Time Bar**: Red indicator bar marking the exact local time on today's column with auto-scrolling on load.
- **Overlap Collision Layout**: Custom interval clustering and column-packing algorithm (`calendarLayout.ts`) that arranges overlapping events side-by-side without visual occlusion.
- **Mini Calendar**: Interactive month picker sidebar allowing date selection and week navigation.
- **Week Navigation**: Previous/Next week arrows and a *"Today"* quick-jump button.

### 3. Event Management (CRUD)
- **Create Event**: Click on any empty time slot or the `+ Create` button to open the Create Event modal with pre-filled date and start time. Supports title, date, start/end times (15-min intervals), 5-color palette, location, description, and visual guests/repeat toggles.
- **Event Details Popover**: Click any event to view formatted time, location, description, attendees, and a visual *"Join call"* button.
- **Edit Event**: Edit all event attributes with live validation.
- **Delete Event**: Accessible delete button in both edit modal and details popover with confirmation state.

### 4. Drag-to-Reschedule & Vertical Resize
- **2D Drag Interaction**: Smooth pointer drag across days and times with 15-minute vertical snapping.
- **Visual Feedback**: Real-time time range preview badge inside the card while moving.
- **Click vs. Drag Disambiguation**: Accurate threshold detection (<5px triggers details click; $\ge$5px enters drag mode).
- **Vertical Resize**: Bottom resize handle with `ns-resize` cursor, clamping to a 15-minute minimum duration and preventing invalid calendar bounds.

### 5. Optimistic UI, Rollback & Race-Condition Protection
- **The Challenge**: The backend's `PATCH /events/:id` endpoint is intentionally unreliable (300–900ms simulated latency and ~8% failure rate).
- **Optimistic State**: 0ms UI delay — the event card immediately moves to the target slot/duration before the network response arrives.
- **Per-Event Mutation Versioning**: Each event maintains an incremental version ID (`mutationVersions`). Each in-flight PATCH captures its mutation version.
- **Race-Condition Protection**: If a user moves an event rapidly (e.g., 10:00 $\rightarrow$ 11:00 $\rightarrow$ 12:00), older PATCH responses or failures cannot overwrite or rollback newer mutations.
- **Safe Rollback**: If the latest PATCH fails, the event is safely rolled back to its baseline state, accompanied by an informative toast (*"Couldn't update the event. Your previous time has been restored."*), without reloading the page.

### 6. Settings → Account
- **Profile Details**: Real-time display of authenticated user's actual name, email, avatar, and join date. Supports updating full name, email, and uploading a replacement avatar with instant local preview and $\le 300\text{ KB}$ validation.
- **Change Password**: Current password verification, new password with strength indicator, confirmation matching, and password visibility toggles.
- **Sign Out Other Sessions**: Clean iOS-style visual toggle matching Figma.
- **Static Tabs**: Security and Notifications tabs present as per Figma with helpful out-of-scope feedback notices.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cadence-calendar

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
VITE_API_BASE_URL=https://interview-task-01-be.vercel.app
```

> **Note**: `.env` and `.env.local` are explicitly ignored by `.gitignore`.

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
# Run TypeScript type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Linting

```bash
# Run ESLint validation
npm run lint
```

---

## 📁 Project Structure

```
cadence-calendar/
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarEventCard/       # Drag & resize event card
│   │   │   ├── CalendarHeader/          # Search, navigation, avatar menu
│   │   │   ├── CalendarSidebar/         # Logo, Create, MiniCalendar, Profile menu
│   │   │   ├── CurrentTimeIndicator/    # Dynamic red current-time bar
│   │   │   ├── MiniCalendar/            # Interactive month picker
│   │   │   └── WeekGrid/                # 7-day columns and time grid
│   │   ├── common/
│   │   │   ├── Button/                  # Primary, secondary, danger buttons
│   │   │   ├── Input/                   # Inputs with password show/hide
│   │   │   └── Modal/                   # Accessible dialog modal
│   │   ├── events/
│   │   │   ├── EventDetailsPopover/     # Event inspection popover
│   │   │   └── EventModal/              # Create and Edit event dialog
│   │   └── layout/
│   │       ├── AuthSplitLayout/         # Split auth screen with gradient
│   │       └── ProtectedRoute/          # Route guards
│   ├── contexts/
│   │   ├── AuthContext.tsx              # User state, token refresh, login/logout
│   │   └── ToastContext.tsx             # Floating notification system
│   ├── pages/
│   │   ├── Calendar/                    # Main calendar orchestration & optimistic mutation
│   │   ├── Login/                       # Authentication screen
│   │   ├── Register/                    # Registration & avatar upload screen
│   │   └── Settings/                    # Profile and password management
│   ├── services/
│   │   ├── api.ts                       # Token storage, refresh mutex queue, fetch client
│   │   ├── authService.ts               # Login, register, logout
│   │   ├── eventService.ts              # GET, POST, PATCH, DELETE events
│   │   └── profileService.ts            # GET/PATCH profile, change-password
│   ├── styles/
│   │   ├── reset.css                    # CSS baseline
│   │   └── tokens.css                   # Exact Figma color, spacing, radius tokens
│   ├── types/                           # TypeScript models for events, auth, calendar
│   └── utils/
│       ├── calendarLayout.ts            # Overlap clustering, reschedule/resize calculations
│       ├── date.ts                      # Centralized date and timezone utilities
│       └── validation.ts                # Email, password strength, avatar validation
├── index.html                           # Inter font links and application root
├── package.json
└── tsconfig.json
```

---

## 🧪 Verification & QA Highlights

1. **Clean Code & Linting**: `npm run lint` passes with 0 errors and 0 warnings.
2. **Type Safety & Build**: `npm run build` completes in $\approx 5\text{s}$ with 0 TypeScript compilation errors.
3. **No Stale Mutations**: Dragging and resizing rapidly produces consistent state without race-condition corruption.
4. **Security**: Sensitive tokens are properly handled; `.env` is never committed; no raw backend errors are exposed to users.
