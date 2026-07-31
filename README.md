# V3 SSO WebUI

The hosted login UI for Yukthi's Single Sign-On service. Any platform that
needs authentication redirects users here (or opens it in a popup) for
login, MFA/OTP verification, password reset, and session management —
this repo is the frontend for that flow.

Built with React 19, Vite, Tailwind CSS, and Jotai.

## Pages

- **Login** — primary sign-in
- **MFA Verification** / **Verify OTP** — second-factor challenges
- **Forgot Password** — password reset entry point
- **Session Check** / **Session Expired** — session state handling
- **Silent Auth** — background re-authentication (iframe-based)
- **Logout**, **Unauthorized**, **Error**, **Success** — supporting states

## Getting started

Requires Node.js 22+.

```bash
npm install
npm run dev
```

The dev server runs on the port Vite assigns (see terminal output).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Configuration

Runtime config is read from `window._env_` (injected at container start by
`env.sh`) with a fallback to Vite's `import.meta.env`. There are no built-in
defaults — every variable below is required, and the app will fail to start
if one is missing. Copy `.env.example` to `.env` and fill in your own values.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL for the SSO API |
| `VITE_SSO_URL` | Base URL of this SSO service |
| `VITE_FORGOT_PASSWORD_URL` | Where "Forgot password" links out to |

## Deployment

Ships as a Docker image (see `Dockerfile`) — a multi-stage build that
compiles the app, then serves the static `dist/` output via `serve`.
`env.sh` writes `dist/env-config.js` from environment variables at
container startup so a single image can be reused across environments.
CI builds and pushes the image on every push to `main` and on tags (see
`.github/workflows/`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose changes, and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

This project handles authentication and session data for every platform
that integrates with it. See [SECURITY.md](SECURITY.md) for how to report
vulnerabilities responsibly — please don't file security issues as public
GitHub issues.

## License

[GPL-3.0-only](LICENSE)
