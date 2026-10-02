# OmniGuard Security Platform: Master Roadmap

## Goal Description
The current project, **Secure Form AI**, started as a prototype Next.js application that safely processes job application links, heuristically extracts requirements, and performs mock security checks on URLs. 

To transform this into a **"big project that can be used in every security field in real life,"** we are evolving it into a centralized, AI-driven **Omni-Security Analysis Platform**. This platform will not only analyze application forms but act as a universal scanner for URLs, Codebases, Infrastructure, and Identity, utilizing real threat intelligence and AI.

## Completed Work

### Phase 1: Real Threat Intelligence (Web & Network Security) - COMPLETED
- Integrated **Google Safe Browsing API** and **VirusTotal API** for real-time URL reputation and malware analysis.
- Graceful fallbacks implemented if API keys are missing.

### Phase 2: AI-Powered Analysis (AppSec & OSINT) - COMPLETED
- Replaced basic heuristic scraping with powerful Generative AI (`@google/genai`) to understand context.
- Implemented deep context security analysis using Gemini to detect:
  - Suspicious data collection practices (e.g., asking for SSN or passwords on unsecured forms).
  - Social engineering tactics (urgency, spoofing).
  - Data privacy policy violations.

---

## Upcoming Phases

### Phase 3: Code & Infrastructure Security (SAST & CloudSec) - COMPLETED
Expand the platform to accept not just forms, but GitHub repositories and API endpoints.
- **`src/lib/code-scanner.ts`**
  - Accept Git repository URLs.
  - Clone/fetch contents and run static analysis (identifying hardcoded secrets, vulnerable dependencies using OSV - Open Source Vulnerabilities API).
- **`src/lib/infra-scanner.ts`**
  - Accept IP addresses or domains.
  - Perform open port discovery and basic header analysis (CORS, CSP, HSTS).

### Phase 4: Enterprise Architecture - COMPLETED
A real-life security project cannot rely on JSON files.
- **Database Integration**: Migrated from local `fs` JSON storage (`data/*.json`) to a robust database like PostgreSQL (using Prisma ORM). `prisma/schema.prisma` created.
- **Authentication**: Added NextAuth.js for user accounts, API key management, and role-based access control (RBAC). Setup in `src/app/api/auth/[...nextauth]/route.ts`.
- **Real-time Logging**: Upgraded the Security Logs structure. (Ready for SSE/WebSocket integrations).
