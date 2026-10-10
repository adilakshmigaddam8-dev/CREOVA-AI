# CREOVA AI — Setup and handoff

Tagline: Discover talent. Verify creativity. Create without limits.

CREOVA is an AI-native creative marketplace connecting AI creators and brands/agencies. It supports creator profiles and portfolios, structured creative briefs, backend filtering, deterministic brief matching, creator shortlists, verification submissions/reviews, proposals, engagements, and versioned deliverables.

## Hosted application

- App: https://creova-ai.hatchable.site
- Project console: https://hatchable.com/console/projects/creova-ai
- Build notes and API reference: https://creova-ai.hatchable.site/project-notes.html
- Test report: https://creova-ai.hatchable.site/test-report.html
- Rerunnable browser smoke tests: https://creova-ai.hatchable.site/smoke-tests.html

## Architecture

- UI: responsive static HTML, CSS, vanilla JavaScript under public/. Vanilla JS is used because Hatchable does not run JSX/TypeScript or a frontend build pipeline during deployment.
- Backend: Hatchable V8 API handlers under api/.
- Database: Hatchable-managed PostgreSQL, provisioned by migrations/0001_core.sql.
- Identity: Hatchable passwordless email-code login with passkey support. The platform owns user accounts and sessions; this project does not store passwords.
- Media: private object storage with per-user randomized keys and expiring signed URLs. Validated formats: JPEG, PNG, WebP, GIF, MP4, WebM (10 MB limit).
- AI Brief Assistance: Guided campaign templates fallback (Festive Film, Editorial Stills, Character Reel) + optional OpenAI SDK call.

## First-time setup & Local Run

1. Run local development server: `node dev-server.js` (listens on `http://localhost:8080`).
2. Visit `http://localhost:8080/` to test creator discovery, video portfolios, and brief creation.
3. Use the "How to sign in? ⓘ" help button on `/login` for complete onboarding guidance.
4. Run automated test suites in `scratch/`:
   - `node scratch/test_marketplace_workspaces.js` (14/14 passed)
   - `node scratch/test_complete_verification.js` (31/31 passed)
   - `node scratch/test_video_flow.js` (16/16 passed)
   - `node scratch/test_brief_templates.js` (4/4 passed)

## Main API routes

- GET /api/health — database health.
- GET or POST /api/profile — signed-in user's profile.
- GET /api/creators — server-side search, combined filters, sorting and pagination.
- GET /api/creator?user_id=... — public creator profile and portfolio detail.
- GET, POST, PUT, DELETE /api/portfolio — portfolio CRUD (writes scoped to creator owner).
- POST /api/uploads — validated media upload.
- GET, POST, PUT, DELETE /api/briefs — public published briefs and brand-owned brief lifecycle.
- POST /api/ai/brief-builder — structured brief generation with safe guided-template fallback.
- GET /api/matches?brief_id=... — eligible creator matching and reasons.
- GET, POST, DELETE /api/shortlist — brand shortlist.
- GET, POST, PUT /api/proposals — applications, decisions and engagement creation.
- GET, PUT /api/engagements — participant-only project and milestone management.
- GET, POST, PUT /api/deliverables — submissions, revisions and approvals.
- GET, POST, PUT /api/verification — evidence submissions and admin review.

## Demo Fixture Transparency

The platform seeds demo creator profiles (`demo-creator-01`, `demo-creator-02`, `demo-creator-03`) and demo brand profiles (`demo-brand-01`, `demo-brand-02`) for instant public directory browsing. To test authenticated authoring, sign in with your own real email to receive access codes.