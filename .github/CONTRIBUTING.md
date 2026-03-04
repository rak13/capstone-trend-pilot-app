# Contributing

This is a **proprietary project** owned by Rakib Ahsan. This repository is
publicly visible, but the source code may **not** be used, copied, modified,
or distributed without explicit written permission. See [LICENSE](../LICENSE).

---

## Bug Reports & Feature Requests

**GitHub Issues is the only supported channel** for bug reports and feature
requests. Please do not contact the author directly for these — open an issue
instead so it can be tracked properly.

- [Report a bug](.github/../ISSUE_TEMPLATE/bug_report.md) — use the Bug Report template
- [Request a feature](.github/../ISSUE_TEMPLATE/feature_request.md) — use the Feature Request template

> **Security vulnerabilities** must not be reported publicly. See
> [SECURITY.md](SECURITY.md) for the private disclosure process.

---

## Code Contributions

**Code contributions are not open to the public.**

Any involvement in development (pull requests, code review, branch access)
requires explicit written permission from the author. If you have been granted
access, the following guidelines apply.

### Branching

- `main` — production-ready code only. Do not push directly.
- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`

### Pull Requests

- Open a PR against `main` with a clear title and description.
- Reference any related issue number in the PR body.
- All PRs require review and approval from Rakib Ahsan before merging.

### Commit Messages

Use the imperative mood and keep the subject line under 72 characters:

```
Add engagement prediction for tier-3 accounts
Fix 413 error by increasing Nginx body size limit
```

### Code Style

- **Frontend**: follow existing ESLint + Prettier config; run `npm run lint` before committing.
- **Backend**: follow PEP 8; run `ruff check .` before committing.

### Confidentiality

All code, data, and internal discussions are confidential. Do not share anything
outside of authorised team members without written permission from Rakib Ahsan.
