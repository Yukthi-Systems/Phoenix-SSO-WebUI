# @rjyspl/phoenix-sso-react

React SDK for adding SSO to any app by installing and importing — no need to hand-roll the popup/`postMessage` handshake against your SSO service yourself. Works with any SSO service that speaks this package's popup/redirect + `postMessage` protocol (see [Wire protocol](#wire-protocol) below).

Two ways to use it, depending on whether your app already has its own session/token system:

- **Framework-free primitives** — for apps that mint and own their own session (their own JWTs, their own refresh logic). Use just the popup/redirect handshake and SSO logout call; you keep everything else.
- **`<SSOProvider>` + hooks/components** — for apps that don't want to build any auth state machine at all. The provider owns "am I authenticated" for you, backed by a live check against the SSO service.

## Install

Published to the public npm registry under the `@rjyspl` scope — no auth needed to install:

```bash
npm install @rjyspl/phoenix-sso-react
```

## Framework-free primitives

If your app already has its own auth context, token storage, and refresh logic, you likely only need these — no `<SSOProvider>`, no new state machine:

```ts
import { openLoginPopup, redirectToLogin, ssoLogout, PopupBlockedError } from '@rjyspl/phoenix-sso-react';

async function loginWithSso() {
  try {
    // Opens the popup, resolves once the SSO service posts back success.
    await openLoginPopup('https://sso.example.com', 'my-app');
  } catch (err) {
    if (err instanceof PopupBlockedError) {
      // Fall back to a full-page redirect instead of a popup. The SSO
      // service redirects back to `returnTo` (default: current URL) once
      // login completes — detect that on your side (e.g. a query param you
      // add to returnTo) and skip straight to the backend exchange below.
      redirectToLogin('https://sso.example.com', 'my-app');
      return; // page is navigating away
    }
    throw err;
  }

  // Your own backend exchanges the now-set SSO cookie for your app's token.
  await myApi.post('/auth/login', {}, { withCredentials: true });
}

async function logout() {
  await myApi.post('/auth/logout'); // your own backend session
  await ssoLogout('https://sso.example.com'); // invalidates the SSO session
}
```

`checkSilentAuth(ssoUrl, appId)` is also available if you want to silently check for an existing SSO session (via a hidden iframe) without a popup — resolves with the session payload, rejects if there's no active session.

To query the SSO session directly (no iframe), use `validateSession` and `getUserInfo`:

```ts
import { validateSession, getUserInfo } from '@rjyspl/phoenix-sso-react';

const session = await validateSession('https://sso.example.com');
if (session) {
  // signed in — session.email, session.organization_name, ...
  const profile = await getUserInfo('https://sso.example.com'); // fresh from the DB
}
```

Both resolve `null` when there's no active session, and throw if the SSO service can't be reached — so a network blip doesn't look like a sign-out.

## `<SSOProvider>` + hooks (for apps with no auth system of their own)

```tsx
import { SSOProvider, SignedIn, SignedOut, SignInButton, useSSOAuth } from '@rjyspl/phoenix-sso-react';

function App() {
  return (
    <SSOProvider
      ssoUrl="https://sso.example.com"
      appId="my-app"
      onAuthenticated={() => {
        // Optional: exchange the SSO session for your own app's tokens
        // against your own backend, if you have one.
        return myApi.post('/auth/login', {}, { withCredentials: true });
      }}
      onSignOut={() => {
        myApi.post('/auth/logout');
      }}
    >
      <SignedOut>
        <SignInButton>Sign in with SSO</SignInButton>
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </SSOProvider>
  );
}
```

A blocked popup during `signIn()` falls back to a full-page redirect automatically — no extra handling needed. On the way back, the provider's normal mount-time silent check picks up the new session, so nothing special has to happen at the return URL.

### Protecting a route

`ProtectedRoute` is router-agnostic — pass your own router's redirect element as `fallback`:

```tsx
import { ProtectedRoute } from '@rjyspl/phoenix-sso-react';
import { Navigate } from 'react-router-dom';

<ProtectedRoute fallback={<Navigate to="/login" replace />}>
  <Dashboard />
</ProtectedRoute>
```

### The `useSSOAuth()` hook

```tsx
const { status, error, signIn, signOut } = useSSOAuth();
// status: 'checking' | 'authenticated' | 'unauthenticated'
```

- `signIn()` — opens the SSO login popup (falling back to a redirect if blocked), resolves once authenticated (after your `onAuthenticated` callback resolves).
- `signOut()` — runs your `onSignOut` callback, invalidates the SSO service's session, and clears local status. Resolves even if the SSO logout request itself fails (local state is always reset — check console warnings for failures).

## What this package does and doesn't do

**Does:** the SSO handshake — popup window management with an automatic full-page-redirect fallback when popups are blocked, the silent (iframe) session check, SSO-side logout, `postMessage`/origin validation against `ssoUrl`.

**Doesn't:** mint, store, or refresh your app's own tokens. Every app's backend contract for that is different, so it's handled through `onAuthenticated`/`onSignOut` callbacks (or left entirely to your own code, for the framework-free primitives) instead of being baked into the package.

## Wire protocol

This package is a client. Any SSO service can work with it as long as it implements this contract — nothing here is tied to a particular backend.

**Popup / redirect login** — the package navigates a popup (or, on the blocked-popup fallback, the whole page) to:

```
GET {ssoUrl}/login?mode=popup&app={appId}&origin={encoded current origin}      # popup mode
GET {ssoUrl}/login?app={appId}&redirect_uri={encoded return URL}               # redirect mode (no "mode" param)
```

Both forms may additionally carry `theme={dark|light}` and/or `theme_color={hex color}` (see [`SSOAppearance`](#types) below) if the caller passed them — an SSO service isn't required to honor these, but should ignore them harmlessly if it doesn't.

- **Popup mode** (`mode=popup` present): after authentication, `window.opener.postMessage(...)` back to the popup's opener, targeting the exact `origin` query param value:
  ```ts
  { type: 'SSO_AUTH_SUCCESS' }
  { type: 'SSO_AUTH_FAILED', message?: string }
  ```
- **Redirect mode** (`redirect_uri` present, no `mode`): after authentication, `window.location.href = redirect_uri`. No `postMessage` involved.

**Silent auth** — loaded in a hidden iframe to check for an existing session without a popup:

```
GET {ssoUrl}/silent-auth?app={appId}&origin={encoded current origin}
```

Should silently check the session and `postMessage` back to the parent, targeting `origin`:

```ts
{ type: 'SSO_AUTH_SUCCESS', payload?: unknown }
{ type: 'SSO_AUTH_FAILED', message?: string }
{ type: 'SSO_SESSION_EXPIRED', message?: string }
```

**Logout:**

```
DELETE {ssoUrl}/auth/logout   (credentials: 'include')
```

Should invalidate the session and respond with a 2xx status.

**Session / user info** (used by `validateSession` / `getUserInfo`):

```
GET {ssoUrl}/auth/session   (credentials: 'include')   → SSOSession JSON
GET {ssoUrl}/user/my-info   (credentials: 'include')   → SSOUserInfo JSON
```

Should respond 2xx with JSON when the session is active, and 401 when there's no active session. Since these are direct `fetch` calls (not an iframe), the SSO service must allow your app's origin via CORS with credentials, and the SSO cookie must be sent to it (same-site, or `SameSite=None`).

**Security requirement:** the package only ever accepts a `postMessage` whose `event.origin` exactly matches `ssoUrl`'s origin. Your SSO service must validate the `origin` query param it receives just as strictly before trusting it as a `postMessage` target — never post back to an unvalidated origin.

## API Reference

Every exported member, in full. `ssoUrl` throughout is the base URL of the hosted SSO service (e.g. `https://sso.example.com`), and `appId` is whatever identifier your app registers with it (e.g. `"chat"`).

### `<SSOProvider>`

The state-managing provider for the hooks/components tier. Wrap your app (or the part of it that needs auth) once.

```tsx
<SSOProvider
  ssoUrl="https://sso.example.com"
  appId="my-app"
  silentAuthTimeoutMs={5000}
  skipInitialCheck={false}
  theme="dark"
  themeColor="#4f46e5"
  onAuthenticated={() => myApi.post('/auth/login', {}, { withCredentials: true })}
  onSignOut={() => myApi.post('/auth/logout')}
>
  {children}
</SSOProvider>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `ssoUrl` | `string` | yes | Base URL of the SSO service. |
| `appId` | `string` | yes | Identifier for this app, sent to the SSO service. |
| `children` | `ReactNode` | yes | — |
| `onAuthenticated` | `() => void \| Promise<void>` | no | Runs after the SSO handshake succeeds (popup sign-in or the mount-time silent check). `status` only becomes `'authenticated'` once this resolves. Typically where you exchange the SSO session for your own app's token. |
| `onSignOut` | `() => void \| Promise<void>` | no | Runs when `signOut()` is called, before the SSO session is invalidated and before local status resets. Typically your own backend logout call plus any local cleanup (query cache, sockets, etc). If it throws, the error is logged (`console.warn`) but sign-out still proceeds. |
| `silentAuthTimeoutMs` | `number` | no | Timeout for the mount-time silent (iframe) session check. Default `5000`. |
| `skipInitialCheck` | `boolean` | no | Skip the automatic silent check on mount. Default `false`. If `true`, `status` starts as `'unauthenticated'` instead of `'checking'`. |
| `theme` | `'dark' \| 'light'` | no | Forces the SSO UI's initial color theme (e.g. to match your app's current theme) instead of the visitor's saved preference/OS setting. Passed through to `signIn()`'s popup and redirect-fallback. Only takes effect if the SSO service supports it. |
| `themeColor` | `string` | no | Brand color (hex, e.g. `"#4f46e5"`) applied to the SSO UI's primary accent/buttons. Passed through the same way as `theme`. Only takes effect if the SSO service supports it. |

### `useSSOAuth()`

Consumes the auth state. Throws if called outside an `<SSOProvider>`.

```tsx
const { status, error, signIn, signOut } = useSSOAuth();
```

Returns an `SSOAuthContextValue`:

| Field | Type | Description |
| --- | --- | --- |
| `status` | `SSOStatus` | `'checking'` \| `'authenticated'` \| `'unauthenticated'`. |
| `error` | `string \| null` | The last `signIn()` failure message, if any. Cleared on the next `signIn()`/`signOut()` call. |
| `signIn` | `() => Promise<void>` | Opens the SSO login popup. On a blocked popup, falls back to a full-page redirect automatically (the promise then never resolves, since the page is navigating away). Resolves once `onAuthenticated` has completed and `status` is `'authenticated'`. Rejects (and sets `error`) on any other failure — wrong credentials, user closed the popup, etc. |
| `signOut` | `() => Promise<void>` | Runs `onSignOut`, invalidates the SSO service's session, resets `status` to `'unauthenticated'`. Always resolves — a failed SSO logout request is logged, not thrown, since local state should still clear either way. |

### `<SignInButton>`

A `<button>` that calls `signIn()` on click. Renders inside an `<SSOProvider>`.

```tsx
<SignInButton>Sign in with SSO</SignInButton>
<SignInButton className="my-button-class" onClick={trackEvent} />
```

Props: `SignInButtonProps` = every native `<button>` prop except `type` (fixed to `"button"`), plus optional `children` (default: `"Sign in"`). Your own `onClick`, if provided, runs before `signIn()` is triggered.

### `<SignedIn>` / `<SignedOut>`

Conditionally render children based on `status`.

```tsx
<SignedIn>{/* rendered only when status === 'authenticated' */}</SignedIn>
<SignedOut>{/* rendered only when status === 'unauthenticated' */}</SignedOut>
```

Both take a single prop: `children: ReactNode`. Neither renders anything while `status === 'checking'`.

### `<ProtectedRoute>`

Gates children behind auth status. Deliberately router-agnostic — no assumption about React Router, TanStack Router, or anything else.

```tsx
import { Navigate } from 'react-router-dom';

<ProtectedRoute
  fallback={<Navigate to="/login" replace />}
  loading={<Spinner />}
>
  <Dashboard />
</ProtectedRoute>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes | Rendered when `status === 'authenticated'`. |
| `fallback` | `ReactNode` | yes | Rendered when `status === 'unauthenticated'`. Pass your own router's redirect element, a login prompt, etc. |
| `loading` | `ReactNode` | no | Rendered while `status === 'checking'`. Default: `null`. |

---

### `openLoginPopup(ssoUrl, appId, options?)`

Opens the SSO login popup and waits for the result.

```ts
import { openLoginPopup, PopupBlockedError } from '@rjyspl/phoenix-sso-react';

try {
  await openLoginPopup('https://sso.example.com', 'my-app', {
    width: 480,
    height: 620,
    theme: 'dark',
    themeColor: '#4f46e5',
  });
  // popup succeeded — SSO cookie is now set
} catch (err) {
  if (err instanceof PopupBlockedError) { /* see redirectToLogin below */ }
  // otherwise: user closed the popup, or SSO auth failed (wrong credentials, etc)
}
```

- **Returns:** `Promise<void>` — resolves once the SSO service posts back `SSO_AUTH_SUCCESS`.
- **Rejects with:**
  - `PopupBlockedError` — the browser blocked `window.open()`.
  - `Error('Login popup was closed before completing authentication.')` — the user closed it.
  - `Error(<message from the SSO service>)` — the SSO service posted back `SSO_AUTH_FAILED`.
- **`options.width`** / **`options.height`** — popup dimensions in pixels. Default `480×620`.
- **`options.theme`** / **`options.themeColor`** — see [`SSOAppearance`](#types) below.

Only one popup can be in flight at a time — calling this again cancels any previous attempt.

### `cancelLoginPopup()`

Cancels any in-flight popup and removes its listeners/timers. `() => void`. Rarely needed directly — `<SSOProvider>` and the redirect fallback call it internally.

### `PopupBlockedError`

```ts
class PopupBlockedError extends Error {}
```

Thrown specifically (and only) when the popup was blocked — use `instanceof` to branch on this case distinctly from "user closed it" or "auth failed," rather than matching on `.message` text.

### `checkSilentAuth(ssoUrl, appId, timeoutMs?)`

Checks for an existing SSO session via a hidden iframe, without opening a popup. This is what `<SSOProvider>` runs on mount.

```ts
import { checkSilentAuth } from '@rjyspl/phoenix-sso-react';

try {
  const payload = await checkSilentAuth('https://sso.example.com', 'my-app', 5000);
  // an SSO session already exists
} catch {
  // no active session (or the check timed out)
}
```

- **Returns:** `Promise<unknown>` — resolves with whatever payload the SSO service's silent-auth page sends back (session info, or `null`).
- **Rejects** on no active session, an explicit session-expired signal, or timeout (default `5000`ms).

### `cancelSilentAuth()`

Cancels any in-flight silent check and removes the hidden iframe/listeners/timer. `() => void`.

### `ssoLogout(ssoUrl)`

Calls the SSO service's own logout endpoint to invalidate its session cookie.

```ts
import { ssoLogout } from '@rjyspl/phoenix-sso-react';

await ssoLogout('https://sso.example.com');
```

- **Returns:** `Promise<void>`.
- **Throws** on a non-2xx response or network failure — same as the axios-based call this typically replaces, so an existing `try/catch` around your old logout call keeps working unchanged.

### `validateSession(ssoUrl)`

Checks the SSO session cookie directly against the SSO service (`GET {ssoUrl}/auth/session`) — no iframe.

```ts
import { validateSession } from '@rjyspl/phoenix-sso-react';

const session = await validateSession('https://sso.example.com');
if (session) {
  console.log(session.email, session.organization_name);
}
```

- **Returns:** `Promise<SSOSession | null>` — the session details, or `null` if there's no active session (401, including a session still waiting on 2FA).
- **Throws** on network failure or any other non-2xx status — treat that as "couldn't check", not "signed out".

### `getUserInfo(ssoUrl)`

Fetches the signed-in user's profile fresh from the SSO service's database (`GET {ssoUrl}/user/my-info`), rather than the cached session.

```ts
import { getUserInfo } from '@rjyspl/phoenix-sso-react';

const profile = await getUserInfo('https://sso.example.com');
if (profile) {
  console.log(profile.first_name, profile.primary_phone, profile.is_app_2fa_enabled);
}
```

- **Returns:** `Promise<SSOUserInfo | null>` — the profile, or `null` if there's no active session.
- **Throws** on network failure or any other non-2xx status.

### `redirectToLogin(ssoUrl, appId, options?)`

Navigates the whole page to the SSO login screen instead of opening a popup — the fallback for `PopupBlockedError`.

```ts
import { redirectToLogin } from '@rjyspl/phoenix-sso-react';

redirectToLogin('https://sso.example.com', 'my-app', {
  returnTo: `${window.location.origin}/login?sso_redirect=1`,
});
```

- **Returns:** `void` — the browser navigates away; there's nothing to await.
- **`options.returnTo`** — where the SSO service sends the browser back after login. Defaults to `window.location.href`.
- **`options.theme`** / **`options.themeColor`** — see [`SSOAppearance`](#types) below.
- On the way back, there's no popup and no `postMessage` — you need your own signal for "I just came back from an SSO redirect" (e.g. a query param you add to `returnTo`, as above) so you know to skip straight to your backend token exchange instead of trying to sign in again. If you're using `<SSOProvider>` instead of the raw primitives, you don't need to do any of this — the provider's mount-time silent check picks up the new session automatically.

### `buildLoginRedirectUrl(ssoUrl, appId, returnTo, appearance?)`

The pure URL-builder `redirectToLogin` uses internally, exposed in case you want to construct the URL yourself (e.g. for a plain `<a href>` instead of a JS-triggered navigation).

```ts
buildLoginRedirectUrl('https://sso.example.com', 'my-app', 'https://my-app.com/login')
// => 'https://sso.example.com/login?app=my-app&redirect_uri=https%3A%2F%2Fmy-app.com%2Flogin'

buildLoginRedirectUrl('https://sso.example.com', 'my-app', 'https://my-app.com/login', { theme: 'dark' })
// => '...&redirect_uri=...&theme=dark'
```

- **Returns:** `string`.

---

### Types

| Type | Shape |
| --- | --- |
| `SSOStatus` | `'checking' \| 'authenticated' \| 'unauthenticated'` |
| `SSOAppearance` | `{ theme?: 'dark' \| 'light'; themeColor?: string }` — optional visual hints passed through to the SSO service; honoring them is up to the SSO service. |
| `SSOConfig` | `SSOAppearance & { ssoUrl: string; appId: string; silentAuthTimeoutMs?: number }` |
| `SSOAuthContextValue` | See `useSSOAuth()` above. |
| `SsoMessageType` | `'SSO_AUTH_SUCCESS' \| 'SSO_AUTH_FAILED' \| 'SSO_SESSION_EXPIRED' \| 'SSO_LOGOUT'` — the wire protocol's `postMessage` types. |
| `SsoMessage` | `{ type: SsoMessageType; message?: string; payload?: unknown }` |
| `SSOSession` | `{ message: string; email: string; first_name: string; last_name: string \| null; organization_id: string; organization_name: string }` — `validateSession()` result. |
| `SSOUserInfo` | `{ email: string; domain_name: string; first_name: string; last_name: string \| null; employee_id: string \| null; primary_phone: string; secondary_email: string \| null; is_app_2fa_enabled: boolean; is_sms_2fa_enabled: boolean; is_email_2fa_enabled: boolean }` — `getUserInfo()` result. |
| `OpenLoginPopupOptions` | `SSOAppearance & { width?: number; height?: number }` |
| `RedirectToLoginOptions` | `SSOAppearance & { returnTo?: string }` |
| `SignInButtonProps` | Native `<button>` props (minus `type`) plus `{ children?: ReactNode }`. |
| `ProtectedRouteProps` | `{ children: ReactNode; fallback: ReactNode; loading?: ReactNode }` |
| `SSOProviderProps` | `SSOConfig & { children: ReactNode; onAuthenticated?; onSignOut?; skipInitialCheck?: boolean }` |

## License

GPL-3.0-only
