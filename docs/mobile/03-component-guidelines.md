# Shared Component Guidelines

Date: 2026-07-28

## Purpose

This document defines the standards for creating, maintaining, and reusing UI components in the mobile application.

The goals are:

- Maximize component reusability.
- Maintain a consistent user interface.
- Reduce duplicated code.
- Make components predictable for both developers and AI agents.
- Keep business logic separate from presentation.

This document complements the Design System. The Design System defines **how components should look**, while this document defines **how components should be built and organized**.

---

# Design Principles

## Single Responsibility

Every component should have one clear responsibility.

Good

```
Button
```

```
Input
```

```
Avatar
```

Bad

```
LoginCard
```

that contains:

- title
- inputs
- API calls
- loading
- navigation
- validation

If a component performs multiple unrelated tasks, it should be split.

---

## Reusable First

Before creating a new component, ask:

> Can an existing component solve this problem?

Priority:

```
Reuse Existing Component
        ↓
Extend Existing Component
        ↓
Create New Component
```

Do not create duplicate components with slightly different styling.

---

## Composition over Configuration

Prefer composing smaller components instead of creating one component with dozens of props.

Good

```
<Card>

    <CardHeader />

    <CardBody />

    <CardFooter />

</Card>
```

Avoid

```
<Card
    hasHeader
    hasFooter
    bordered
    elevated
    loading
    compact
    rounded
    ...
/>
```

Large configuration APIs become difficult to maintain.

---

## UI Only

Reusable components should contain presentation logic only.

Business logic belongs elsewhere.

Good

```
Button

↓

onPress()
```

Bad

```
Button

↓

call API

↓

navigate

↓

show toast
```

---

# Component Categories

The project uses four categories of components.

```
Foundation
        ↓
Layout
        ↓
Common
        ↓
Feature
```

---

# Foundation Components

Foundation components are the smallest building blocks.

Examples:

```
Button

Input

Text

Icon

Avatar

Badge

Chip

Divider

Spinner

Skeleton
```

These components should never depend on feature-specific logic.

---

# Layout Components

Layout components define page structure.

Examples

```
AppHeader

AppFooter

Drawer

ProfileMenu

SectionHeader

ScreenContainer

AuthScreen
```

These components organize content but do not know anything about backend data.

---

# Common Components

Common components are reusable across multiple features.

Examples

```
NewsCard

TournamentCard

PlayerCard

EmptyState

ErrorBox

SuccessBox

ImagePlaceholder

Pagination
```

These components may receive data through props but should remain independent from API implementations.

---

# Feature Components

Feature components belong to a specific feature.

Examples

```
LoginForm

RegisterForm

NewsSection

ScheduleSection

RankedSection
```

Feature components may fetch data, manage local state and combine multiple common components.

They should not be reused outside their feature unless they become generic enough.

---

# Folder Structure

Current structure:

```
src/

components/

    Button.jsx        ← foundation components live at the root
    Input.jsx

    layout/           ← AppHeader, AppFooter, AppDrawer, ProfileMenu
    icons/            ← BrandIcons
    auth/             ← AuthScreen, FormError, FormSuccess, TextLink
    home/             ← SectionHeader, SectionState, RemoteImage, *Section

theme/
    tokens.js         ← colors, iconSize, shadow
```

New feature folders (`tournament/`, `profile/`, `player/`) follow the same pattern: one folder per feature, foundation components stay at the root of `components/`.

Keep components close to their feature unless they are shared.

---

# Naming Convention

Component names should describe what they represent.

Good

```
Button

Input

PlayerCard

TournamentCard

NewsCard

AppHeader
```

Avoid names based on appearance.

Bad

```
BlueButton

BigCard

RoundedInput
```

Appearance should be controlled through props.

---

# File Naming

One component per file.

Good

```
Button.jsx

Input.jsx

Avatar.jsx
```

Avoid

```
components.jsx
```

or

```
ui.jsx
```

---

# Component API

A component API should remain small and predictable.

Example:

```
<Button

    variant

    disabled

    loading

    onPress

/>
```

Avoid exposing unnecessary props.

If a component requires too many props, reconsider its design.

---

# Variants

Visual differences should be represented by variants.

Example

```
Primary

Secondary

Outline

Ghost

Danger
```

Avoid creating separate components for each style.

Good

```
<Button variant="ghost" />
```

Bad

```
GhostButton
```

---

# Props

Props should describe behavior, not appearance.

Good

```
disabled

loading

selected

error
```

Avoid

```
red

blue

big

small
```

Appearance belongs to the Design System.

---

# State Handling

Reusable components should support common UI states.

Typical states include:

```
Default

Pressed

Disabled

Loading

Error
```

A component should gracefully transition between these states.

---

# Styling

Every component must use Design Tokens.

Do not hardcode:

- colors
- spacing
- radius
- typography

Good

```
className="bg-navy-700"
```

Bad

```
backgroundColor: "#123456"
```

When React Native requires a real color value instead of a class — `placeholderTextColor`, lucide icon `color`, `ActivityIndicator` — import it from the token file rather than typing a hex literal.

Good

```jsx
import { colors, iconSize } from "../theme/tokens";

<ChevronLeft size={iconSize.lg} color={colors.brand} />
```

Bad

```jsx
<ChevronLeft size={24} color="#1a2a4a" />
```

The full token reference is in [01-design-system.md](01-design-system.md).

---

# Business Logic

Business logic should not exist inside reusable UI components.

Wrong

```
Input

↓

validate email

↓

call backend
```

Correct

```
Screen

↓

validation

↓

Input
```

---

# API Calls

Reusable components should never call backend APIs directly.

Wrong

```
NewsCard

↓

fetch news
```

Correct

```
NewsSection

↓

fetch

↓

NewsCard
```

---

# Navigation

Reusable components should not navigate automatically.

Wrong

```
Card

↓

router.push(...)
```

Correct

```
Screen

↓

<Card

    onPress={...}

/>
```

Navigation belongs to the screen.

---

# Loading Components

Loading components should mimic the final layout.

Good

```
NewsCard

↓

NewsSkeleton
```

Avoid

```
Full screen spinner
```

unless the entire screen depends on a single request.

---

# Empty State Components

Prefer a shared EmptyState component.

Example

```
No News

No Tournament

No Player
```

Only the message changes.

---

# Error Components

Prefer a shared ErrorBox component.

Allow custom:

- title
- message
- retry action

Do not build a new error UI for every screen.

---

# Image Components

Every image component should support:

- loading
- fallback
- resize mode

Never assume an image URL is always valid.

---

# Form Components

Forms should reuse the same controls.

Examples

```
Input

PasswordInput

Checkbox

Button

FormError

FormSuccess
```

Validation belongs to the form, not the input.

---

# Accessibility

Interactive components should:

- support screen readers
- have touch targets of at least 44x44
- expose accessibility labels when necessary

Avoid using:

```
<Text onPress>
```

Prefer:

```
Pressable

TouchableOpacity
```

---

# Performance

Avoid unnecessary re-renders.

Prefer:

- React.memo
- useMemo
- useCallback

only when profiling shows they are beneficial.

Do not optimize prematurely.

---

# Testing

Reusable components should be tested with:

- different variants
- disabled state
- loading state
- error state
- long text
- missing images

A component is not complete if only the default state has been verified.

---

# When to Create a New Component

Create a new shared component only if at least one of the following is true:

- It is used by multiple screens.
- It represents a reusable UI pattern.
- It significantly reduces duplicated code.
- It improves consistency across the application.

Otherwise, keep the implementation inside the feature.

---

# Component Review Checklist

Before merging a new component, verify:

- Single responsibility.
- Reusable design.
- No business logic.
- No API calls.
- No navigation.
- Uses Design Tokens.
- Supports required UI states.
- Accessible.
- Properly named.
- Located in the correct folder.
- No duplicated functionality.

A component should be reusable by another screen without modification.