🚀 CREOVA AI

 ✨ Discover talent. Verify creativity. Create without limits.

🎨 An AI-native creative marketplace connecting AI creators with brands and agencies.**

CREOVA AI is a digital marketplace designed to simplify how brands discover creative talent, evaluate portfolios, define campaign requirements, and manage collaborations from the first brief to final deliverable approval.

Instead of relying on scattered portfolios, unstructured messages, and disconnected project tools, CREOVA brings creator discovery, structured briefs, verification workflows, collaboration management, and content delivery into one unified platform

## Hosted application

- App: https://creova-ai-6jmu.hatchable.site
- Project console: https://hatchable.com/console/projects/creova-ai
- Build notes and API reference: https://creova-ai.hatchable.site/project-notes.html
- Test report: https://creova-ai.hatchable.site/test-report.html
- Rerunnable browser smoke tests: https://creova-ai.hatchable.site/smoke-tests.html

📑 Table of Contents

- 🎯 [The Problem](#-the-problem)
- 💡 [Our Solution](#-our-solution)
- ✨ [What Makes CREOVA Different](#-what-makes-creova-different)
- 🚀 [Core Features](#-core-features)
- 🔄 [How It Works](#-how-it-works)
- 🛠️ [Technology Stack](#-technology-stack)
- 🏗️ [System Architecture](#-system-architecture)
- 🧠 [AI-Assisted Brief Building](#-ai-assisted-brief-building)
- 🛡️ [Verification and Trust](#-verification-and-trust)
- 🔐 [Security and Data Integrity](#-security-and-data-integrity)
- ⚙️ [Getting Started](#-getting-started)
- 🧪 [Testing and Quality Assurance](#-testing-and-quality-assurance)
- 🔌 [API Reference](#-api-reference)
- 🎬 [Demo and Evaluation Guide](#-demo-and-evaluation-guide)
- ⚠️ [Current Limitations](#-current-limitations)
- 🗺️ [Future Roadmap](#-future-roadmap)
- 🌍 [Project Impact](#-project-impact)

---

 🎯 The Problem

The growth of AI-generated content has created new opportunities for brands, agencies, and independent creators. However, finding the right creative partner and managing collaborations remains fragmented.

 🚧 Key Challenges

- 🔎 **Difficult discovery:** Finding creators with the right skills, tools, style, formats, and budget can be time-consuming.
- 📝 **Unclear requirements:** Campaign briefs often lack structured deliverables, deadlines, technical specifications, and licensing expectations.
- 🛡️ **Trust gaps:** Brands need meaningful ways to evaluate creator profiles, portfolios, and verification claims.
- 🔄 **Fragmented collaboration:** Proposals, milestones, deliverables, feedback, and revisions are frequently managed across separate tools.
- 📜 **Unclear usage rights:** Commercial-use expectations and content licensing terms may not be discussed early enough.
- ⏳ **Inefficient coordination:** Creators and brands need a clear view of project status and the next action required.

These challenges create unnecessary friction between creative talent and the businesses that need it.

---
 💡 Our Solution

CREOVA AI provides a centralized creative marketplace that connects creator discovery with structured project management.

 🎯 What CREOVA Enables

1. 🔎 Discover creators using combined search filters.
2. 🖼️ Explore creator profiles and portfolio details.
3. 📝 Create structured campaign briefs.
4. 🎯 Identify suitable creators through deterministic brief matching.
5. ⭐ Save creators to shortlists and manage proposals.
6. 🛡️ Review verification claims and supporting evidence.
7. 🤝 Manage engagements, milestones, deliverables, revisions, and approvals.

Creators can present their skills and work, manage portfolio entries, submit verification evidence, respond to collaboration opportunities, and deliver content through a more organized workflow.

**💎 Our core idea:** Make creative collaboration more discoverable, transparent, and accountable.

---
✨ What Makes CREOVA Different?

| 🌟 Capability | 💎 Value |
|---|---|
| 🔎 Structured creator discovery | Reduces manual searching through combined filters and sorting. |
| 🎯 Brief-to-creator matching | Identifies eligible creators using defined criteria and explains matching results. |
| 🛡️ Evidence-based verification | Provides a structured workflow for examining creator claims and evidence. |
| 📜 Licensing-aware briefs | Makes commercial-use expectations part of project planning. |
| 🤝 End-to-end collaboration | Connects proposals, engagements, milestones, deliverables, revisions, and approvals. |
| 🗂️ Versioned delivery | Helps preserve the history of submitted work and requested changes. |
| 👥 Role-based workspaces | Separates creator, brand, and administrator actions. |

CREOVA is designed around the complete collaboration lifecycle rather than treating creator discovery as an isolated directory.

---

🚀 Core Features

🎨 1. Creator Profiles and Portfolios

Creators can build profiles that communicate their creative capabilities and professional identity.

**Profile and portfolio information can include:**

- 🎯 Creative skills and content categories.
- 🧰 Tools and models used in the workflow.
- 🖼️ Portfolio media and project descriptions.
- 🔄 Creative process and workflow information.
- 📐 Supported content formats and languages.
- 💰 Availability and indicative pricing.
- 📜 Visibility settings and licensing information.

The portfolio workflow supports validated image and video uploads, configured storage, and signed media URLs.

**📁 Supported media formats:** JPEG, PNG, WebP, GIF, MP4, and WebM.  
**📦 Configured upload limit:** 10 MB per file.

🔎 2. Advanced Creator Discovery

Brands can explore creators using backend-powered search and filtering.

**Discovery capabilities include:**

- 🔍 Keyword search.
- 🏷️ Combined category, tool, skill, and format filters.
- 💰 Availability and price filtering.
- ↕️ Sorting and pagination.
- 👤 Public creator profile and portfolio views.

The goal is to help brands narrow a large creative talent pool into a relevant shortlist.
📝 3. Structured Creative Briefs

Brands can define campaign requirements using structured project briefs.

Brief information can cover:

- 📌 Campaign title and description.
- 🎨 Content type and creative direction.
- 📦 Deliverables and output formats.
- 💰 Budget and timeline.
- ⚙️ Technical requirements.
- 📜 Commercial-use expectations and licensing terms.
- 🔄 Brief publication and lifecycle status.

Structured briefs help creators understand project expectations before applying or accepting a collaboration.

### 🎯 4. Deterministic Creator Matching

CREOVA includes a matching endpoint that evaluates creator eligibility and compatibility against a brief.

The matching workflow uses defined criteria and weighting instead of presenting arbitrary recommendations as intelligent predictions.

It can return eligible creators together with matching reasons and relevant exclusions.

**💡 Why this matters:** Transparent matching makes results easier to inspect, test, and explain.

⭐ 5. Creator Shortlists

Brands can save relevant creators for later review and planning.

Shortlisting supports a more deliberate selection process before moving into proposals and engagement management.

### 🛡️ 6. Verification and Evidence Review

Creators can submit verification claims with supporting evidence and notes.

The verification workflow distinguishes statuses such as:

- 📝 Self-reported.
- 📤 Evidence submitted.
- ✅ Verified.
- ❌ Rejected.

Authorized administrative reviewers can examine submitted claims and update their review status.

**🔎 Trust principle:** A submitted claim is not automatically proof of authenticity. Verification status should reflect the actual review outcome.

 🤝 7. Proposals and Hiring Decisions

The proposal workflow connects creator interest with brand decision-making.

Depending on the role and workflow state, it supports:

- 📤 Proposal submission.
- 💬 Cover letters and proposed pricing.
- 📅 Delivery estimates and milestones.
- ✅ Brand acceptance or rejection.
- ↩️ Creator withdrawal where permitted.
- 🗂️ Engagement creation following proposal acceptance.

Ownership and role checks restrict actions to the appropriate participants.

 📊 8. Engagement and Milestone Management

After a proposal is accepted, the engagement workflow provides a structured space for project progress.

It supports participant-scoped access, milestone management, project status changes, and audit events.

This gives both sides a clearer view of collaboration progress.

📦 9. Versioned Deliverables and Revisions

Creative work often requires iteration. CREOVA supports a delivery workflow that includes:

- 📤 Deliverable submissions.
- 🗂️ Version tracking.
- 💬 Feedback from the relevant participant.
- 🔄 Revision requests.
- 📝 Updated submissions.
- ✅ Final approval.

This makes the review process more organized than relying exclusively on informal messages.

 👥 10. Role-Based Workspaces

The platform provides separate experiences for:

- 🎨 **Creators:** Profiles, portfolios, verification, and collaboration activities.
- 🏢 **Brands and agencies:** Creator discovery, briefs, shortlists, proposals, and project management.
- 🛡️ **Administrators:** Relevant verification and review operations.

Access to protected resources is controlled through authentication, role checks, and ownership validation.

---

🔄 How It Works

CREOVA follows a connected creative collaboration workflow.

### 🚀 Discover → 📝 Define → 🎯 Match → 🤝 Collaborate → 📦 Deliver

1. 🔎 **Discover:** Browse creator profiles and portfolios.
2. 📝 **Define:** Create a structured brief with deliverables, budget, timeline, and licensing requirements.
3. 🎯 **Match:** Retrieve eligible creators and inspect matching reasons.
4. ⭐ **Shortlist:** Save promising creators for further consideration.
5. 🤝 **Collaborate:** Submit proposals, make hiring decisions, and establish engagements.
6. 📦 **Deliver:** Track milestones, submit creative work, request revisions, and approve final deliverables.

The result is a more structured path from an initial creative requirement to a completed collaboration.

---

 🛠️ Technology Stack

| 🧩 Layer | ⚙️ Technology |
|---|---|
| 🖥️ Frontend | HTML5, CSS3, Vanilla JavaScript |
| 🔧 Backend | Hatchable V8 API handlers |
| 🗄️ Database | Managed PostgreSQL |
| 🔑 Authentication | Passwordless email-code login and passkey support provided by the hosting platform |
| 🖼️ Media storage | Private object storage and expiring signed URLs |
| 🎯 Matching | Deterministic, criteria-based matching |
| 🧠 Brief assistance | Guided templates and a safe fallback workflow |
| ☁️ Hosting | Hatchable |

💡 Why This Architecture?

The frontend uses standard web technologies because the deployment environment does not run a JSX/TypeScript frontend build pipeline. Backend logic is implemented in API handlers, while PostgreSQL provides persistent application data.

This architecture keeps the deployed application lightweight and allows core marketplace operations to be handled through server-side endpoints.

---

🏗️ System Architecture

```text
                    🚀 CREOVA AI
                         |
              🖥️ Responsive Web Interface
                  HTML / CSS / JS
                         |
                   🔌 API Handlers
                         |
          +--------------+--------------+
          |              |              |
      🗄️ PostgreSQL   🖼️ Object       🔑 Authentication
                       Storage
          |              |              |
       Profiles      Portfolio Media   User Sessions
       Briefs        Signed URLs       Access Control
       Proposals
       Engagements
       Deliverables
       Verification
```

📂 Main Application Directories

- `public/` — User interface, styling, browser-side logic, documentation, and test pages.
- `api/` — Server-side handlers for marketplace features.
- `lib/` — Shared backend utilities and validation logic.
- `migrations/` — Database schema and migration scripts.
- `scratch/` — Local test scripts and development checks.

The deployed environment uses Hatchable-managed services. Local development files and hosted configuration may differ, so deployment settings should be checked before running migrations or publishing changes.

---

🧠 AI-Assisted Brief Building

CREOVA includes a guided brief-building workflow intended to help brands turn an initial campaign idea into a more structured project brief.

 ✨ The Workflow Can Suggest

- 📌 Campaign title and content type.
- 📦 Deliverables and formats.
- 🧰 Creative tools and workflow considerations.
- 💰 Indicative budget guidance.
- ⏱️ Duration and licensing notes.

The current safe fallback uses guided templates and rule-based suggestions. The architecture can accommodate an optional OpenAI SDK integration when the necessary provider configuration is available.

**⚠️ Transparency:** The current fallback should not be described as a fully LLM-powered generator. Generated suggestions should be reviewed and edited by the user before publishing a brief.

This keeps the current feature useful without making unsupported claims about external AI inference.

---

 🛡️ Verification and Trust

Trust is particularly important in a marketplace where creators may work with AI-generated images, videos, and other digital media.

CREOVA approaches trust through a structured evidence-review process.

The workflow allows creators to submit claims and supporting evidence, while authorized reviewers can assess the submission and record an outcome.

The platform distinguishes between a claim being submitted and a claim being verified.

**🔎 Important distinction:** Verification workflows support review and transparency. They do not automatically guarantee that all portfolio content is original, that a creator owns every depicted asset, or that every licensing claim is legally valid.

---

🔐 Security and Data Integrity

The application includes several security-oriented implementation measures:

- 🔑 Platform-managed authentication and sessions.
- 👥 Role-based authorization for protected actions.
- 🔒 Ownership checks for creator and brand resources.
- 🤝 Participant-only access to engagement operations.
- ✅ Server-side validation for supported API operations.
- 📁 File-type validation for configured media uploads.
- 🔗 Randomized private-storage keys and expiring signed URLs.
- 🗄️ Database persistence and audit events for relevant operations.

These controls help protect marketplace data and prevent unauthorized actions.

Security is an ongoing responsibility. Production readiness also depends on configuration review, testing, operational monitoring, and validation of deployment-specific controls.

---

⚙️ Getting Started

📋 Prerequisites

Install a compatible Node.js version for the local project and ensure that the required project files and environment configuration are available.

 1️⃣ Run the Local Development Server

From the project root, run:

```bash
node dev-server.js
```

The local application is configured to listen at:

```text
http://localhost:8080
```

 2️⃣ 🌐 Open the Application

Visit:

```text
http://localhost:8080/
```

Explore creator discovery, portfolio content, and the available brief workflow.

 3️⃣ 🔑 Sign In

Open the login page and select the **“How to sign in? ⓘ”** help control for onboarding guidance.

The hosted platform provides passwordless email-code authentication and passkey support. Use an email account you control to test authenticated operations.
 4️⃣ 📘 Explore the Documentation

Open the hosted project notes for the API reference and implementation details:

🔗 https://creova-ai.hatchable.site/project-notes.html

**⚠️ Deployment note:** Hosted database records, authentication, object storage, and secrets are managed by the hosting environment. A local development server does not automatically reproduce the hosted environment's data or configuration.

---

 🧪 Testing and Quality Assurance

The project includes local automated test scripts covering key marketplace workflows.

| 🧪 Test Suite | 📊 Reported Result |
|---|---:|
| Marketplace workspaces | 14/14 passed |
| Complete verification workflow | 31/31 passed |
| Video portfolio flow | 16/16 passed |
| Guided brief templates | 4/4 passed |
| **Total reported checks** | **65/65 passed** |

These results reflect the reported local test-suite results. They should not be interpreted as proof that every feature has been independently tested against the current hosted deployment.

▶️ Run the Test Suites

From the project root:

```bash
node scratch/test_marketplace_workspaces.js
node scratch/test_complete_verification.js
node scratch/test_video_flow.js
node scratch/test_brief_templates.js
```

### 🔍 Browser Smoke Tests

Open the hosted smoke-test page:

🔗 https://creova-ai.hatchable.site/smoke-tests.html

### ✅ Test Coverage Areas

The project test suites are organized around:

- 👥 Creator and brand workspace behavior.
- 🛡️ Verification submissions and reviews.
- 🖼️ Image and video portfolio flows.
- 📝 Guided brief-template behavior.

For a complete evaluation, the hosted authentication flow, role-specific access, proposal acceptance, engagement creation, revision handling, and final deliverable approval should also be exercised using appropriately provisioned accounts.

---

## 🔌 API Reference

The application exposes REST-style endpoints for its core marketplace workflows.

| 🔧 Method | 🔗 Endpoint | 📝 Purpose |
|---|---|---|
| GET | `/api/health` | Database and service health check |
| GET, POST | `/api/profile` | Retrieve or update the signed-in user's profile |
| GET | `/api/creators` | Search, filter, sort, and paginate creators |
| GET | `/api/creator?user_id=...` | Retrieve public creator and portfolio details |
| GET, POST, PUT, DELETE | `/api/portfolio` | Manage creator portfolio entries |
| POST | `/api/uploads` | Validate and upload supported media |
| GET, POST, PUT, DELETE | `/api/briefs` | Manage briefs and their lifecycle |
| POST | `/api/ai/brief-builder` | Generate a structured brief draft using the configured workflow |
| GET | `/api/matches?brief_id=...` | Retrieve eligible creator matches and reasons |
| GET, POST, DELETE | `/api/shortlist` | Manage a brand's creator shortlist |
| GET, POST, PUT | `/api/proposals` | Submit proposals and manage decisions |
| GET, PUT | `/api/engagements` | Access engagements and manage milestones |
| GET, POST, PUT | `/api/deliverables` | Submit, revise, review, and approve deliverables |
| GET, POST, PUT | `/api/verification` | Submit verification evidence and review claims |

Protected operations require the appropriate authentication, role, and ownership permissions. Exact request fields, response shapes, and authorization requirements should be checked against the deployed API implementation and project notes.

---

## 🎬 Demo and Evaluation Guide

For the best evaluation experience, explore CREOVA in the following order.

### 1️⃣ 🔎 Explore the Marketplace

Open the live application and examine creator search, filtering, profiles, and portfolio details.

### 2️⃣ 📝 Inspect a Creative Brief

Review the structured brief fields and see how campaign requirements, deliverables, budget, and licensing expectations are represented.

### 3️⃣ 🎯 Examine Creator Matching

Inspect eligible creator results and their matching reasons to understand how brief requirements connect to discovery.

### 4️⃣ 🛡️ Review Verification

Explore verification statuses and the evidence-review interface where the appropriate permissions are available.

### 5️⃣ 🤝 Follow the Collaboration Workflow

Where suitable test accounts and records are available, evaluate proposals, hiring decisions, engagements, milestones, deliverable submissions, revision requests, and approval.

### 📌 Demo-Data Transparency

The application includes fictional demo creator profiles and demo brand profiles for directory browsing. Illustrative portfolio media should be treated as sample content, not as independently verified creator work.

For authenticated workflows, sign in using an account you control. Administrator-only actions require an appropriately provisioned administrator account.

---

## ⚠️ Current Limitations

CREOVA is an evolving marketplace prototype. The following distinctions are important during evaluation:

- 🧠 The guided brief-builder fallback is rule-based and does not, by itself, establish that live LLM inference is enabled.
- 🛡️ Verification statuses depend on the evidence-review process; they are not automatic guarantees of authenticity or ownership.
- 🖼️ Demo profiles and illustrative portfolio content are intended for evaluation, not as proof of real commercial relationships.
- 🔑 Authentication, role-specific permissions, and complete multi-account collaboration flows should be tested in the hosted environment.
- 🧪 Local test results and hosted test results may differ.
- 🚧 Production use would require further operational, security, licensing, and scalability validation.

These limitations are stated explicitly so that judges can distinguish existing implementation from future development.

---

## 🗺️ Future Roadmap

Potential next steps for CREOVA include:

1. 🧠 **Validated LLM integration:** Enable configurable AI-powered brief generation with structured outputs, error handling, and usage controls.
2. 🎯 **Richer creator matching:** Improve matching explanations and support more detailed format, deadline, licensing, and budget compatibility checks.
3. 🛡️ **Enhanced verification:** Introduce additional evidence types and clearer reviewer guidance.
4. 🔔 **Collaboration notifications:** Strengthen notifications for proposal decisions, milestones, revisions, and approvals.
5. 📊 **Improved analytics:** Add meaningful insights into creator discovery, proposal conversion, delivery progress, and collaboration outcomes.
6. 🔐 **Production hardening:** Expand integration tests, authorization tests, monitoring, and operational safeguards.
7. ♿ **Accessibility and usability:** Continue improving responsive behavior, keyboard navigation, and accessible form feedback.

These are roadmap opportunities rather than claims that every item is already implemented.

---

## 🌍 Project Impact

CREOVA AI aims to make the growing AI-enabled creative economy easier to navigate for both creators and businesses.

By connecting structured discovery, clearer requirements, evidence review, and organized delivery, the platform aims to:

- 🔎 Reduce the effort involved in finding suitable creative talent.
- 🎨 Help creators communicate their capabilities more effectively.
- 📜 Encourage clearer commercial-use and licensing discussions.
- 📊 Improve visibility into collaboration status and revisions.
- 🤝 Make the journey from creative idea to final deliverable more structured.

The platform's long-term value lies in connecting creative talent with the right opportunities while making collaboration easier to understand and manage.

---

## 🏁 Conclusion

**🚀 CREOVA AI is more than a creator directory. It is a foundation for structured creative collaboration.**

By bringing creator portfolios, brief management, explainable matching, verification workflows, proposals, engagements, and versioned deliverables together, CREOVA provides a connected approach to managing brand–creator relationships.

### ✨ Discover talent. Verify creativity. Create without limits.

---

🎨 **Project:** CREOVA AI  
🏆 **Category:** AI-enabled creative marketplace  
🌐 **Live Application:** https://creova-ai-6jmu.hatchable.site 
