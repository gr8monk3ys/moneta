# Expo SDK 54 → 56 Upgrade Runbook

The mobile app currently targets **Expo SDK 54**. Upgrading to **SDK 56** clears the
remaining moderate dependency advisories (transitive `postcss` / `uuid` in the Expo
toolchain) and keeps the app on a supported SDK.

> **Why this isn't automated in CI / cloud sessions:** `expo install --fix` and
> `expo-doctor` call Expo's API (`api.expo.dev`), and validating an upgrade requires
> running the app on a simulator/device. Neither is available in the sandboxed/CI
> environment, so this is a local task. Mocked Jest passing does **not** prove the
> app boots — do the device smoke test.

## Risk / urgency

**Low urgency.** The 15 outstanding advisories are all **moderate** and **build/dev-time
only** (`postcss <8.5.10`, `uuid <11.1.1`), pulled in transitively by the Expo
toolchain. They are not runtime-exploitable in the shipped app and do not trip the
`--audit-level=high` gate. Upgrade when convenient; it does not block release of the
current code.

Note the headline change: **React Native 0.81 → 0.85** (a real major jump). Expect a
few API touch-ups, not just version bumps.

## Steps (run locally)

```bash
cd mobile

# 1. Bump the SDK and let Expo align all SDK-managed dependencies.
npx expo install expo@^56
npx expo install --fix        # requires api.expo.dev

# 2. Validate the dependency graph.
npx expo-doctor

# 3. Bump the non-Expo-managed packages that --fix does NOT touch (see table below).

# 4. Reinstall and run the static gates.
npm install
npm run typecheck
npm run lint
npm run test:ci

# 5. The part that actually matters — boot it on real targets.
npx expo start --ios
npx expo start --android
#   Manually walk: login → today feed → open a lesson → complete a session →
#   progress updates → purchase/restore flow (sandbox) → logout.
```

## Target versions (SDK 56 bundled map)

These are what `expo install --fix` should set; listed so the result can be sanity-checked.

| Package | 54 | 56 |
|---|---|---|
| `react-native` | 0.81.5 | **0.85.3** |
| `react` / `react-dom` | 19.1.0 | 19.2.3 |
| `@expo/metro-runtime` | ~6.1.2 | ~56.0.13 |
| `expo-secure-store` | ~15.0.8 | ~56.0.4 |
| `expo-status-bar` | ~3.0.9 | ~56.0.4 |
| `expo-linear-gradient` | ~15.0.8 | ~56.0.4 |
| `expo-dev-client` | ~6.0.20 | ~56.0.18 |
| `react-native-gesture-handler` | ~2.28.0 | ~2.31.1 |
| `react-native-screens` | ~4.16.0 | 4.25.2 |
| `react-native-safe-area-context` | ^5.6.1 | ~5.7.0 |
| `react-native-web` | ^0.21.0 | ~0.21.0 |
| `jest-expo` | ~54.0.17 | ~56.0.4 |

## Manual watch-items (`expo install --fix` will NOT handle these)

- **`babel-preset-expo`** → `~56` (transform-critical for `jest-expo`; mismatched versions break the Jest transform).
- **`react-test-renderer`** → match React `19.2.3`, **or** upgrade `@testing-library/react-native` to v13 (which drops `react-test-renderer` for React 19) and remove `react-test-renderer` + `@types/react-test-renderer`.
- **`@types/react`** → `~19.2`.
- **`expo-iap`** (third-party, not Expo-managed) → verify a release compatible with SDK 56 / RN 0.85 before trusting the purchase/restore flow; device-test in/app purchases specifically.
- The mobile `overrides` block (`tar`, `qs`, `minimatch`) — re-check whether still needed after the bump; remove any that the new tree resolves on its own.

## Done when

- `expo-doctor` reports no issues.
- `typecheck`, `lint`, `test:ci` pass.
- The app boots on iOS **and** Android and the full learn + billing loop works on-device.
- `npm audit` is clean at the moderate level (or the remaining items are documented).
