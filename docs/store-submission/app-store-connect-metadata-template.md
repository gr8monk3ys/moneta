# App Store Connect Metadata Template

Use this file as the working draft for App Store Connect listing details and reviewer notes.
It reflects the product state in this repo as of March 11, 2026 and should still be reviewed by legal/compliance before submission.

## App information

- App name: `Moneta`
- Subtitle: `Finance lessons for real life`
- Alternate subtitle options:
  - `Build money confidence daily`
  - `Learn money skills in minutes`
- Primary language: `en-US`
- Bundle ID: `com.moneta.app`
- SKU: `<unique internal identifier>`

## Description (long)

Recommended App Store description:

> Moneta helps people build money confidence with short, practical finance lessons they can finish in about 5 minutes.
>
> Start with a placement check, follow a guided learning path, and come back for daily reviews that help key concepts stick. Moneta is designed for real-life financial decisions, from budgeting and credit to saving, investing, retirement, and long-term planning.
>
> What you can do in Moneta:
> - Learn through a structured curriculum that spans 6 levels of financial skill
> - Complete bite-size lessons built for busy schedules
> - Reinforce what you learn with daily review sessions
> - Track streaks, progress, and concept mastery over time
> - Export or delete your account data directly in the app
>
> Moneta includes a free learning path and Moneta Pro for learners who want more depth. Pro unlocks advanced tracks, expanded review access, and premium learning features.
>
> This app is for education only and does not provide personalized financial advice or investment recommendations.
>
> Privacy matters. Moneta does not sell your personal data, and key privacy controls are available in-app.

Positioning notes:

- Keep the first 2 lines benefit-led: confidence, short lessons, real-life decisions.
- Use concrete structure instead of hype: guided path, daily reviews, progress.
- Avoid promising features not fully shipped in this repo, such as AI tutoring, offline downloads, or deep analytics.

## Promotional text (optional)

- Recommended: `Build money confidence with 5-minute lessons, daily review, and a guided path from budgeting basics to long-term wealth concepts.`

## Keywords

- Recommended: `personal finance,budgeting,credit,saving,investing,retirement,money,financial literacy`
- If Apple keyword length becomes tight, remove `money` first.

## Support + policy URLs

- Support URL: `<https://...>`
- Marketing URL: `<https://...>`
- Privacy Policy URL: `<https://...>`
- Terms of Service URL: `<https://...>`

Launch note:

- Do not submit with placeholder domains.
- Ensure the Privacy Policy URL matches the final published version of [`privacy-policy.md`](../compliance/privacy-policy.md).
- Ensure the Terms URL matches the final published version of [`subscription-terms.md`](../compliance/subscription-terms.md).

## In-app purchases

- Subscription group: `Moneta Pro`
- Products:
  - `moneta.pro.monthly`
  - `moneta.pro.yearly`

Recommended display copy:

- `Moneta Pro Monthly`
- `Unlock advanced finance tracks, expanded reviews, and premium learning features. Auto-renews monthly until canceled.`
- `Moneta Pro Yearly`
- `Unlock advanced finance tracks, expanded reviews, and premium learning features. Auto-renews yearly until canceled.`

Ensure the final in-app purchase copy clearly states:

- renewal period
- auto-renewal
- how to cancel
- what paid access unlocks

## Reviewer notes

Use the following as the baseline reviewer note:

- Backend base URL: `<https://...>`
- Test account email: `<...>`
- Test account password: `<...>`
- Notes:
  - Moneta is a finance education app with short lessons, review sessions, and subscription-gated advanced content.
  - After sign-in, the `Home` tab shows progress, streak, daily reviews, and the next recommended lesson.
  - The `Learn` tab shows the curriculum path across levels `F1` to `F6`.
  - Locked premium lessons can be triggered from the `Learn` tab when the test account is on the free plan.
  - To test purchases, use App Store sandbox / TestFlight subscription flows.
  - Account export and account deletion are available in `Profile`.
  - Privacy, Terms, Subscription Terms, and deletion/legal links are available from the app.

Recommended review steps:

1. Sign in with the review account.
2. Open `Home` and confirm the app loads progress and the next lesson.
3. Open `Learn` and verify premium lessons are gated for free users.
4. Complete a lesson or review flow.
5. Open `Profile` and verify export/deletion flows are present.
6. If needed, use sandbox billing to validate the Pro unlock flow.

## App Privacy (nutrition label)

Fill based on `docs/store-submission/app-store-privacy-nutrition-label-worksheet.md`.

## Age rating

- Recommended target audience: `13+`
- Rationale: personal-finance education product, account-based experience, not intended for children.
- Does the app contain:
  - unrestricted web access? `No`
  - user-generated content? `No`
  - gambling? `No`

## Export compliance (encryption)

Recommended working answer:

- Moneta appears to use standard encryption for authentication and HTTPS transport only.
- This commonly falls under Apple's exempt-encryption flow, but legal/release management should confirm the final answer before submission.

## Remaining external launch items

These still need non-repo ownership before submission:

- real support / marketing / policy URLs
- final bundle ID / SKU
- final pricing by storefront
- legal review of privacy and subscription terms
- review credentials tied to a production-like backend
