# Mobile Development Workflow

Date: 2026-07-28

## Purpose

This document defines the standard workflow for developing new screens in the mobile application.

The primary goals are:

- Keep the mobile application consistent.
- Prevent UI from diverging from the Web FE.
- Reduce duplicated components.
- Ensure Backend, Web FE and Mobile evolve together.
- Provide a predictable workflow for both developers and AI agents.

Every new screen should follow this workflow unless there is a documented exception.

---

# Development Philosophy

Mobile is **not** the source of truth.

The source of truth is:

```
Backend
        ↓
Web FE
        ↓
Mobile
```

Meaning:

- Backend defines the data model.
- Web FE defines the business flow and UI.
- Mobile adapts the UI for smaller screens.

Mobile should never invent business logic or API behavior.

---

# Standard Workflow

Every new feature should follow the following order.

```
Backend API
        ↓
Web FE
        ↓
Technical Design
        ↓
Shared Components
        ↓
UI Implementation
        ↓
API Integration
        ↓
Loading / Empty / Error
        ↓
Testing
        ↓
Merge
```

Skipping steps usually leads to duplicated work or inconsistent UI.

---

# Step 1 — Backend First

Do not start implementing a screen before the required backend APIs are available.

Before writing any UI, verify:

- endpoint exists
- request format
- response format
- authentication
- pagination
- validation rules
- possible error responses

If the backend API is still changing, postpone the implementation whenever possible.

---

# Step 2 — Review the Web FE

The Web FE is the visual reference.

Study:

- page layout
- navigation flow
- components
- empty state
- loading state
- error handling
- user interactions

The mobile application should preserve the same user experience while adapting the layout for smaller screens.

Allowed adaptations include:

- converting multi-column layouts into a single column
- reducing spacing
- replacing hover interactions with touch interactions

The mobile application should not redesign the interface.

---

# Step 3 — Write a Technical Design Document

Every feature should have a design document before implementation.

A design document should describe:

- purpose
- scope
- routes
- API endpoints
- components
- data flow
- loading states
- empty states
- error states
- known risks
- validation steps

Design documents live in `docs/superpowers/specs/` and are named `YYYY-MM-DD-<topic>-design.md`. Existing examples: the auth screens, the app layout and the home screen.

Implementation should begin only after the design has been reviewed.

---

# Step 4 — Identify Shared Components

Before creating a new component, check whether an existing component already solves the problem.

Priority order:

```
Existing Component
        ↓
Extend Existing Component
        ↓
Create New Shared Component
```

Avoid creating screen-specific components unless they cannot reasonably be reused.

Examples of shared components include:

- Button
- Input
- Card
- Avatar
- SectionHeader
- Loading
- Skeleton
- ErrorBox
- SuccessBox

---

# Step 5 — Implement the UI

Build the screen using the Design System.

Requirements:

- use design tokens
- use shared components
- avoid duplicated code
- avoid hardcoded values
- keep the component hierarchy simple

Do not connect APIs yet.

The first implementation should focus entirely on layout.

---

# Step 6 — Connect the Backend

After the UI is complete, integrate the backend.

API requests should always go through the API layer.

```
src/api/
```

Never perform HTTP requests directly inside reusable UI components.

Responsibilities should be separated:

```
Screen
        ↓
API Layer
        ↓
Axios Client
        ↓
Backend
```

This makes testing and maintenance significantly easier.

---

# Step 7 — Handle Every UI State

Every screen should explicitly handle all possible states.

Minimum required states:

```
Loading
```

```
Success
```

```
Empty
```

```
Error
```

If only one section fails to load, the rest of the screen should continue working.

Example:

```
Home

Banner
✓

News
Error

Tournament
✓

Ranking
✓
```

Avoid blocking the entire screen because of one failed request.

---

# Step 8 — Validation

Forms should validate input before calling the backend.

Validation should happen:

- while typing (after a field becomes touched)
- before submission

Validation messages should be consistent across the entire application.

Business validation belongs to the backend.

UI validation exists only to improve user experience.

---

# Step 9 — Testing

Every completed screen should be tested manually.

Minimum checklist:

- navigation
- loading
- success
- empty state
- error state
- image fallback
- responsive layout
- authentication
- API integration

Whenever possible, test using real backend data instead of mocked responses.

---

# Step 10 — Code Review

Before merging, verify:

- follows Design System
- no duplicated components
- no hardcoded colors
- no hardcoded spacing
- reusable logic extracted
- API layer respected
- error handling completed
- loading state completed
- empty state completed

---

# Folder Responsibilities

Every layer has a single responsibility.

```
app/
```

Contains screens only.

---

```
components/
```

Reusable UI components.

No business logic.

---

```
api/
```

Communication with backend.

---

```
theme/
```

Design tokens (`tokens.js`). Colors, icon sizes, shadows.

---

```
hooks/
```

Reusable business logic. Does not exist yet — create it when a second screen needs the same data-loading logic, not before.

---

```
utils/
```

Pure helper functions. Currently: `apiError`, `auth`, `date`, `pagination`, `storage`, `validators`.

---

```
constants/
```

Static application data. Currently: `auth`, `config`, `leaderboard`, `profile`, `registration`, `tournament`.

---

```
store/
```

Global state via Zustand. Currently: `authStore`.

---

# API Rules

Always:

```
Screen
        ↓
API
        ↓
Axios
```

Never:

```
Screen
        ↓
fetch(...)
```

API functions should return processed data whenever possible.

Complex response parsing should stay inside the API layer.

---

# Component Rules

A component should have one responsibility.

Bad example:

```
LoginScreen

300 lines
```

Better:

```
LoginScreen

↓

LoginForm

↓

Input

↓

Button

↓

ErrorBox
```

Smaller components are easier to reuse and test.

---

# State Management

State should remain as local as possible.

Preferred order:

```
Local State
        ↓
Custom Hook
        ↓
Global Store
```

Avoid placing temporary UI state into global stores.

---

# Error Handling

Handle errors as close to the source as possible.

For example:

```
NewsSection

↓

News Error
```

instead of

```
Home

↓

Entire Screen Error
```

Localized failures produce a much better user experience.

---

# Future-Proofing

Every implementation should consider future expansion.

Examples include:

- ~~Dark Mode~~ — **shipped 2026-07-29** for the `(app)` group. Use role tokens (`bg-surface`, `text-content`), never `bg-white` / `text-slate-*`. See [01, Part 9](01-design-system.md).
- Tablet Layout
- Additional Roles
- Localization
- Accessibility

Even if these features are not implemented today, the architecture should not prevent them.

---

# Definition of Done

A screen is considered complete only if:

- Backend API is connected.
- UI matches the Web FE.
- Design System is respected.
- Shared components are reused.
- Loading state exists.
- Empty state exists.
- Error state exists.
- Navigation works correctly.
- Images have fallback behavior.
- Documentation is completed.
- Manual testing has passed.

Implementation alone is **not** considered complete.