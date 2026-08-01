# Security Policy

This project is a Single Sign-On (SSO) web UI — it handles authentication,
MFA/OTP verification, and session data for every platform that integrates
with it. We take security reports seriously and appreciate responsible
disclosure.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** Public
issues are visible to everyone immediately, including anyone who might
exploit the report before a fix ships.

Instead, report privately using **[GitHub's private vulnerability reporting](https://github.com/Yukthi-Systems/Phoenix-SSO-WebUI/security/advisories/new)**
(Security tab → "Report a vulnerability" on this repo). This opens a
confidential thread with maintainers only.

If the issue is in the backend this UI talks to rather than in this repo's
code, report it against [Phoenix-SSO-API](https://github.com/Yukthi-Systems/Phoenix-SSO-API/security/advisories/new)
instead. If you're unsure where it belongs, report it here first and we'll
route it to the right place.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or a minimal repro is ideal)
- The affected version/commit

## What to expect

- We'll acknowledge your report as soon as we can.
- We'll investigate and keep you updated as we work on a fix.
- Once a fix is released, we'll coordinate disclosure with you and credit you
  (unless you'd prefer to stay anonymous).

## Scope

In scope: authentication/session handling, MFA/OTP bypass, token/cookie
handling, open redirects, XSS, CSRF, access control issues, and anything
else that could compromise a user's session or account across any platform
that relies on this SSO service.

Out of scope: issues requiring physical access to a user's device, social
engineering, and vulnerabilities in third-party dependencies that should be
reported upstream (though letting us know is still appreciated so we can
track and update).
