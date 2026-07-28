# API Integration Guidelines

Date: 2026-07-28

## Purpose

This document defines the standard approach for integrating Backend APIs into the mobile application.

The goals are:

- Keep networking consistent across the project.
- Separate UI from data access.
- Make APIs easier to maintain.
- Simplify future backend changes.
- Provide predictable patterns for developers and AI agents.

Every API integration should follow this document.

---

# Architecture

The mobile application follows a layered architecture.

```
Screen
        ↓
Feature Component
        ↓
API Layer
        ↓
Axios Client
        ↓
Backend
```

Responsibilities are separated across each layer.

The UI should never communicate with the backend directly.

---

# Responsibilities

## Screen

Responsible for:

- screen layout
- navigation
- local UI state
- rendering components

A screen should not know:

- endpoint URLs
- request headers
- authentication details
- response parsing

---

## Feature Component

Responsible for:

- loading data
- handling loading state
- handling empty state
- handling error state
- rendering reusable components

Feature components may call the API layer.

---

## API Layer

Responsible for:

- endpoint URLs
- request construction
- response parsing
- pagination parsing
- response transformation

Every backend endpoint should have a dedicated API function.

Example

```
authApi.js

newsApi.js

playerApi.js

publicTournamentApi.js
```

---

## Axios Client

Responsible for:

- base URL
- authentication token
- request interceptors
- response interceptors
- timeout
- refresh token (future)

Business logic must never be implemented here.

### What the current client already does

`src/api/axiosClient.js` is configured and should not need changes for a normal feature:

- **Base URL** — `${EXPO_PUBLIC_API_URL}/api/v1`, built in `src/constants/config.js`. The env var must be the machine's LAN IP, never `localhost`.
- **Token** — a request interceptor reads `useAuthStore.getState().token` and attaches `Authorization: Bearer …`. Screens never touch headers.
- **Timeout** — 15 seconds, because mobile networks stall. Do not override it per request.
- **401** — the response interceptor clears the session; the guard in `app/(app)/_layout.jsx` then redirects to Login. Unlike the web client it does **not** change the URL itself. Requests to `/auth/me` are skipped because `hydrateAuth` handles them.
- **Errors** — every rejection is re-wrapped as a real `Error` whose `message` is the backend message (falling back to `"Có lỗi xảy ra. Vui lòng thử lại."`), carrying `.code` and `.response`. So a screen can display `error.message` directly.

### The API function pattern

Every API module follows the same shape as the web frontend:

```js
import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/** GET /news — published posts, paged */
export const listPublishedPosts = (params) =>
  axiosClient
    .get("/news", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/** GET /news/{slug} — post detail */
export const getPostBySlug = (slug) =>
  axiosClient.get(`/news/${slug}`).then((res) => getApiData(res));
```

`getApiData` unwraps the backend envelope; `parsePagedResponse` normalises `content` / `page` / `size` / `totalElements` / `totalPages`. Do not re-implement either one inside a screen.

---

# Folder Structure

```
src/

api/

    authApi.js

    newsApi.js

    playerApi.js

    tournamentApi.js

    ownerApi.js

    managerApi.js

    staffApi.js
```

Each file should contain functions related to a single backend domain.

Avoid creating a single large API file.

---

# API Function Naming

Function names should describe the action.

Good

```
login()

register()

forgotPassword()

resetPassword()

listPublishedPosts()

listPublicTournaments()

getTournament()

updateProfile()
```

Avoid

```
fetch()

load()

call()

request()

api1()
```

Function names should clearly describe what they do.

---

# One Function Per Endpoint

Each backend endpoint should have one corresponding API function.

Example

```
GET /news

↓

listPublishedPosts()
```

```
POST /auth/login

↓

login()
```

This creates a predictable mapping between backend and mobile.

---

# Response Parsing

Response parsing belongs inside the API layer.

Wrong

```
Screen

↓

response.data.content
```

Correct

```
API

↓

parsePagedResponse()

↓

Screen receives clean data
```

The UI should consume processed data rather than raw backend responses.

---

# Pagination

Paged endpoints should always use the shared pagination helper.

Example

```
parsePagedResponse()
```

Avoid duplicating pagination parsing across multiple screens.

---

# Authentication

Authenticated requests should automatically include the access token.

Screens should never manually attach authorization headers.

Wrong

```
headers.Authorization = ...
```

Correct

```
axiosClient

↓

Bearer Token
```

Authentication should remain transparent to the UI.

---

# Public Endpoints

Even if an endpoint is considered public, always follow backend behavior.

If the backend requires authentication, the mobile application should respect that requirement.

Do not implement client-side workarounds.

---

# Error Handling

Every API function should throw meaningful errors.

Example

```
Backend

↓

API Layer

↓

throw Error(message)

↓

Screen

↓

display error
```

Avoid returning mixed values such as:

```
null

false

{}

[]
```

to indicate failure.

Errors should be explicit.

---

# Loading

The API layer should never manage loading indicators.

Loading belongs to the UI.

Example

```
NewsSection

↓

loading = true

↓

await listPublishedPosts()

↓

loading = false
```

---

# Empty State

An empty response is not an error.

Example

```
[]
```

should display

```
No data available
```

rather than

```
Something went wrong
```

The API layer should distinguish between:

- successful empty data
- failed requests

---

# API Models

The UI should consume only the fields it actually needs.

Example

Backend

```
Tournament

id

name

description

createdAt

updatedAt

owner

...

```

Screen

```
id

name

thumbnailUrl

startAt

status
```

Avoid exposing unnecessary backend fields throughout the application.

---

# Data Transformation

Transform backend data inside the API layer whenever possible.

Example

Backend

```
publishedAt
```

↓

API

```
Date object
```

↓

UI

```
fmtDateShort()
```

The screen should focus on presentation rather than data conversion.

---

# Image Handling

Image URLs may be:

- null
- empty
- invalid

Every image should provide a fallback.

Example

```
thumbnailUrl

↓

fallback image
```

Never assume backend images always exist.

---

# File Upload

File uploads should be implemented inside dedicated API functions.

Screens should not manually construct multipart requests.

Example

```
uploadAvatar()
```

instead of

```
axios.post(... FormData ...)
```

inside a screen.

---

# Retry Strategy

The application should not automatically retry every request.

Retry only when appropriate.

Examples:

- temporary network failure
- user-initiated retry

Avoid infinite retry loops.

---

# Timeout

Timeout configuration belongs inside the Axios client.

Individual screens should never define their own timeout values.

---

# Caching

At the current stage, mobile does not implement API caching.

Every screen requests fresh data.

Future caching strategies should be implemented in a dedicated data layer rather than individual screens.

---

# Logging

Development builds may log API requests.

Production builds should avoid unnecessary console output.

Never log:

- access tokens
- refresh tokens
- passwords
- OTP codes

Sensitive information must never appear in logs.

---

# Offline Handling

The current version does not support offline mode.

If the device is offline:

- show an appropriate error message
- allow the user to retry

Do not cache partial responses unless offline support is officially introduced.

---

# API Review Checklist

Before integrating a new endpoint, verify:

- Backend endpoint exists.
- Request method is correct.
- Authentication requirements are known.
- API function has been created.
- Response parsing is completed.
- Pagination is handled.
- Errors are handled.
- Empty state is handled.
- Image fallback is implemented.
- No networking code exists inside reusable UI components.

---

# Future Improvements

The architecture is designed to support future enhancements without major refactoring.

Potential future additions include:

- Refresh Token
- Request Cancellation
- Offline Mode
- Response Caching
- Infinite Scrolling
- Background Synchronization
- API Versioning

These features should be implemented within the networking layer, not inside screens.

---

# Definition of Done

An API integration is considered complete only if:

- The endpoint is wrapped by the API layer.
- The screen never performs HTTP requests directly.
- Authentication is handled automatically.
- Response parsing is completed.
- Loading state is implemented.
- Empty state is implemented.
- Error state is implemented.
- Image fallback is supported.
- Manual testing with the real backend has passed.

Connecting an endpoint alone is **not** considered complete.