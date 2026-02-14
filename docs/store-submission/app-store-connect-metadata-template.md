# App Store Connect Metadata Template (Draft)

Use this template to prepare App Store listing details and reviewer notes.

## App information

- App name: `Moneta`
- Subtitle: `<e.g., Learn personal finance fast>`
- Primary language: `<en-US>`
- Bundle ID: `<set in Expo/EAS>`
- SKU: `<unique internal identifier>`

## Description (long)

`<draft marketing description>`

Suggested structure:

- What it is: “Learn personal finance in 5 minutes a day”
- Who it is for: beginners to advanced
- What you do: lessons, daily reviews, progress
- Subscription: what Pro unlocks
- Privacy: “We don’t sell your data”
- Disclaimer: “Educational only, not financial advice”

## Promotional text (optional)

`<short seasonal/feature text>`

## Keywords

`<comma separated>`

Examples:

- finance, budgeting, investing, retirement, credit, money, personal finance

## Support + policy URLs

- Support URL: `<https://...>`
- Marketing URL: `<https://...>`
- Privacy Policy URL: `<https://...>`
- Terms of Service URL: `<https://...>`

## In-app purchases

- Subscription group: `Moneta Pro`
- Products (example):
  - `moneta.pro.monthly`
  - `moneta.pro.yearly`

Ensure the in-app purchase display name and description clearly state:

- duration
- auto-renewal
- how to cancel
- what features unlock

## Reviewer notes

Provide steps to access key features and any test credentials.

- Backend base URL: `<https://...>`
- Test account email: `<...>`
- Test account password: `<...>`
- Notes:
  - To test subscription gating, use sandbox/TestFlight purchase flows.
  - Account export/deletion actions are in Profile.

## App Privacy (nutrition label)

Fill based on `docs/store-submission/app-store-privacy-nutrition-label-worksheet.md`.

## Age rating

- Target audience: `<13+ / 17+ etc>`
- Does the app contain:
  - unrestricted web access? `<yes/no>`
  - user-generated content? `<yes/no>`
  - gambling? `<no>`

## Export compliance (encryption)

Confirm whether the app uses encryption beyond Apple’s exempt categories. Document your answer for submission.

