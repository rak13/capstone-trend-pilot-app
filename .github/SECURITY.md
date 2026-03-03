# Security Policy

## Supported Versions

Only the latest deployed version of ineedq (at [ineedq.com](https://ineedq.com)) is
actively maintained and receives security updates.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, report it privately to **Rakib Ahsan**.
Provide as much detail as possible, including:

- A description of the vulnerability and its potential impact.
- Steps to reproduce or a proof-of-concept (if safe to share).
- Any suggested mitigations you are aware of.

You will receive an acknowledgement within **48 hours** and a status update
within **7 days**.

## Scope

The following are in scope:

- Authentication and authorisation flaws (JWT, LinkedIn OAuth).
- API endpoints at `ineedq.com/api/*`.
- Data exposure or injection vulnerabilities (XSS, SQLi, SSRF, etc.).
- Infrastructure misconfigurations affecting `ineedq.com`.

## Out of Scope

- Vulnerabilities in third-party services (OpenAI, LinkedIn, AWS) — report those
  to the respective vendors.
- Issues that require physical access to infrastructure.
- Social engineering attacks.

## Responsible Disclosure

This project follows a responsible disclosure policy. Please allow adequate time
for a fix to be deployed before any public disclosure.
