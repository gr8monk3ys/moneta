# Product Requirements Document: Duolingo-Style Finance Learning App

## Executive summary
Financial literacy remains uneven globally and within major markets, even as financial decisions (credit, investing, retirement, scams, digital banking) become more complex and increasingly self-serve.

This PRD specifies a mobile-first learning product—**"Duolingo for finance"**—for iOS and Android that builds durable money skills through short daily practice, adaptive review, and credible assessments, while staying clearly on the "financial education" side of regulatory boundaries (not personalized advice).

- **North Star Outcome:** measurable improvement in finance proficiency (knowledge + applied decision skill) earned through consistent daily learning, tracked as **Mastered Skills per Active Learner per Week** and validated via pre/post assessments.
- **Primary user value:** "I can make confident financial decisions without drowning in jargon or misinformation, in 5–10 minutes/day."
- **Primary business value:** repeatable engagement (habit), conversion to premium, and B2B licensing opportunities (financial institutions, employers, schools).

## Assumptions and scope boundaries
This PRD intentionally treats unknowns (exact pricing, launch geos, brand name, unit economics) as assumptions and proposes ranges and decision gates.

### Initial release assumptions
- **Geography:** US + English-first (en-US) at launch; localization begins in v2.
- **Domain:** personal finance + investing fundamentals first; advanced trading/professional finance later.
- **Compliance posture:** educational content and simulations only (no personalized recommendations, no security-specific buy/sell prompts, no brokerage linkage by default).

## Target users and personas

### Target segments
1. **Novices (MVP priority):** first-time budgeters, students, early-career workers, new-to-US users, debt recovery users.
2. **Intermediate planners (MVP → v1):** emergency funds, credit products, retirement setup, first-time investing.
3. **Advanced learners (v1 → v2):** tax optimization, portfolio construction, statement literacy, market mechanics.

### Personas
| Persona | Goals | Pain points | Learning habits |
|---|---|---|---|
| Overwhelmed Starter | Build basic money system | Jargon, shame, uncertainty | 5–8 min/day, guided path |
| Credit Rebuilder | Improve credit and reduce debt cost | Conflicting advice, fear of mistakes | 10-min bursts 3–4x/week |
| Planner Parent | Build resilience and retirement plan | Time scarcity, decision fatigue | Night routines, offline preference |
| Beginner Investor | Learn safe investing fundamentals | Misinformation, overconfidence | Quizzes, streaks, simulations |
| Optimizer | Go deeper on tax and allocation strategy | Needs credibility and depth | 15–20 min focused sessions |
| Skeptical Professional | Structured refresher + validation | Low tolerance for fluff | Weekend deep dives, analytics |

## Competitive landscape and differentiation

### Competitor set (high-level)
- Gamified literacy apps (e.g., Zogo, Fingo)
- Investing apps with education features (e.g., Acorns, Greenlight)
- Content platforms (e.g., Finimize, Coursera, Udemy)
- Simulation-only platforms (e.g., stock market simulators)

### Differentiation opportunities
1. **Finance CEFR-style proficiency framework** with levels and can-do descriptors.
2. **Practice-heavy pedagogy** using retrieval practice + spaced repetition.
3. **Adaptive learning engine** tuned to mastery and difficulty boundaries.
4. **Trust and compliance as product features** (citations, disclaimers, errata pipeline).
5. **Outcomes instrumentation** based on observable decision competencies.

## Product vision and learning system

### Vision
Make financial competence as accessible and habit-forming as daily language practice—5–10 minutes/day that compounds into real-world decision skill.

### Learning loop
- Retrieval practice (testing effect)
- Spaced/distributed practice
- Adaptive difficulty + immediate feedback
- Microlearning delivery with clear objectives

### Core learning objects
- **Skill:** atomic competency (e.g., APR vs APY)
- **Lesson:** 3–7 minute unit mapped to 1–2 skills
- **Item:** question/scenario/calculation/explanation prompt
- **Review queue:** algorithmic spaced-repetition schedule

### Adaptive engine (MVP)
- Per-skill mastery probability (0–1)
- Spaced repetition scheduler (SM-2 or half-life)
- Item selection balancing due review, new learning, and challenge content

## Curriculum and finance proficiency levels

### Core domains
- Money fundamentals
- Credit and debt
- Saving and safety
- Investing basics
- Retirement
- Taxes basics
- Housing fundamentals
- Advanced tracks

### Finance levels (F1–F6)
- **F1 Foundations:** basic budget, interest, safe banking behavior
- **F2 Everyday Decisions:** paystub basics, APR/APY, credit score drivers
- **F3 Planning & Stability:** emergency planning, debt payoff, insurance basics
- **F4 Long-Term Wealth:** diversification, funds, retirement account basics, fees
- **F5 Advanced Personal Finance:** tax/retirement tradeoffs, mortgage mechanics, scam detection
- **F6 Analyst Mode:** statements, macro context, investment thesis reasoning (education only)

### Assessments
- Placement test (5–7 min)
- Unit checks
- Level exams (15–25 min)
- App-branded milestone certificates (non-professional credential)

## Product requirements

### MVP feature set (learn → practice → review → progress)

#### Learning & practice
- Micro-lessons (3–7 min)
- Practice item formats: MCQ, numeric input, scenario decisions, matching, ordering
- Explanatory feedback
- Spaced review queue

#### Motivation
- Daily goals (5/10/15 min)
- Streaks and streak repair (premium)
- XP, badges, quests

#### Progress
- Skill mastery map
- Weekly learning report
- Placement and periodic checkups
- Level certificates

#### Social (v1)
- Friend graph
- Weekly leagues
- Group challenges

#### Platform reliability
- Offline cache and sync queue
- Push notifications
- Background sync

### Prioritization (MVP → v1)
- **Must:** micro-lessons/practice engine, spaced repetition, onboarding + placement, mastery dashboard, streak and reminders
- **Should:** offline cache, leaderboards, certificates
- **Could:** enhanced adaptive difficulty, AI coach (v2)

## UX/UI requirements

### Information architecture
- **Home:** continue path + due reviews + streak
- **Learn:** curriculum path + tracks
- **Review:** today’s due queue
- **Progress:** mastery + level status + certificates
- **Profile:** reminders, privacy, subscription

### Accessibility
- iOS VoiceOver and Android TalkBack support for core task completion
- WCAG 2.2-aligned patterns (contrast, focus, target size)
- Scalable typography and clear semantic labels

### Content style
- Plain language defaults
- Glossary popovers for technical terms
- Readability target roughly grade 8–10 for F1–F3

## Platform requirements

### iOS
- iOS 16+
- iPhone first, iPad responsive
- APNs for notifications
- StoreKit subscriptions
- App Privacy label compliance

### Android
- Android 10+ (API 29+)
- Phone first; tablets/Chromebooks best effort in v1
- FCM notifications, WorkManager sync
- Play Billing subscriptions
- Data Safety form and account deletion compliance

## Technical architecture and integrations

### High-level components
- iOS/Android clients
- API gateway
- Auth service
- Content service/CMS
- Learning engine (mastery + scheduling)
- Profile/progress service
- Billing + entitlement service
- Event pipeline + data warehouse

### Integrations
- Auth: email magic link + Apple/Google SSO + guest mode
- Payments: StoreKit + Play Billing (Stripe for enterprise/web later)
- Analytics: product + crash/performance tools
- Feature flags/experimentation platform
- Notifications: APNs/FCM with user controls

## Data privacy, security, and compliance
- Data minimization by design
- User rights handling (including deletion requests)
- Accurate app-store privacy disclosures
- Encryption in transit and at rest for sensitive data
- Rate limiting and anti-abuse controls
- Audit logs and content errata mechanism

### Education-not-advice boundary
- No security-specific buy/sell/hold recommendations
- Scenario reasoning and generalized education only
- Prominent disclaimers in onboarding and market-related modules
- AI tutor (v2) strictly guardrailed and non-advisory

## Roadmap and launch plan

### MVP (Release 0, ~12–14 weeks)
- Onboarding + goals + placement
- 4 core domains, 60–100 lessons, 400–700 items
- Spaced review + streak + reminders
- Progress dashboard
- Basic subscription scaffolding
- Limited offline cache

**MVP gates**
- D7 retention ≥ 18%
- Activation ≥ 35%
- ≥ 25% of actives with at least 3 learning days/week 1
- +10–15% pilot pre/post learning delta (F1)

### v1 (months 4–6)
- Leaderboards/challenges
- Certificates and level checkpoints
- Tax + retirement basics
- Improved adaptive sequencing
- Full unit offline download
- Hardened experimentation stack

### v2 (months 7–12)
- Advanced tracks + simulators
- Guardrailed AI tutor (optional premium)
- Localization expansion
- Optional B2B dashboards/co-branding

## KPI framework
- **Engagement:** DAU/MAU, lessons/week, streak health, review completion
- **Retention:** D1/D7/D30, cohort churn, winback
- **Monetization:** paywall funnel, conversion, ARPPU/LTV
- **Learning outcomes:** mastery velocity, assessment deltas, error heatmaps
- **Quality:** crash-free rate, startup latency, API/content defect rates

## Monetization model

### Recommended approach
Freemium with premium subscription:
- **Free:** core F1 path + limited reviews + basic progress
- **Pro:** unlimited lessons/reviews, offline downloads, advanced tracks, certificates/exams, streak repair, deeper analytics
- **Plus (v2):** AI tutor + advanced exam features

### Initial pricing hypothesis
- $9.99/month
- $59.99/year
- Optional $14.99/month Plus tier (v2)

### Optional secondary revenue
- Limited free-tier ads (careful trust tradeoff)
- One-off exam fees (v2)
- B2B seat licensing

## Content operations
- Objective-first curriculum design per skill
- Structured draft → SME review → editorial → release workflow
- Numeric verification for example calculations
- Primary-source citation posture
- Fast corrections and learner notification for material errata

## Staffing and budget (12–18 months)
- Team: product, design, mobile/backend/data engineering, QA, curriculum/content, SMEs, legal/compliance, support/marketing
- Estimated 12-month budget: **~$2.5M–$5.5M**
- Estimated 18-month budget: **~$4.0M–$8.0M**

## Risks and mitigations
1. **Regulatory drift into advice** → strict policy guardrails + review gates
2. **Misinformation/trust erosion** → citations + SME review + errata pipeline
3. **Privacy non-compliance** → data inventory, deletion SLAs, disclosure audits
4. **Gamification over-learning** → mastery-oriented rewards and rapid-guess detection
5. **Store/policy complexity** → compliance checklist and early policy review

## Sample user flows

### Onboarding + placement
1. Welcome + value proposition + disclaimer
2. Goal selection (5/10/15 min) and motivation chooser
3. Placement test
4. Level placement and recommended path
5. Auto-start first lesson

### Daily session
1. Home with reviews + new lesson recommendation
2. Review queue
3. New lesson
4. Rewards + progress feedback
5. Reminder opt-in prompt

### Progress + certification
1. Mastery map and level ring
2. Checkpoint exam eligibility
3. Results + remediation
4. Certificate shelf and share flow

---

This PRD defines an evidence-based, compliance-conscious blueprint for building a finance learning app with sustainable habit loops and measurable learning outcomes.
