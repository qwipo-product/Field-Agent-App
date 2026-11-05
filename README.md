# Qwipo Field Agent (demo build)

The Qwipo Field Agent app (the delivery app used by delivery executives, drivers, operations and managers)
running entirely on **synthetic data**. Same screens, flows and app logic as the live Android app, with no
backend: every API call is answered in-app by a mock, so nothing is sent anywhere.

It runs two ways from the same code:

| | How | Where |
|---|---|---|
| **Browser** | Open the link, no install | **https://qwipo-product.github.io/Field-Agent-App/** |
| **Android** | NativeScript build on an emulator or phone | `npm run android` |

This repository is independent of the production BMS / Field Agent code: no production URLs, keys,
Firebase config, signing keys or CI. See [What was removed](#what-was-removed-from-the-production-app).

## Sign in

Any 6-digit OTP works.

| Mobile | Who | Lands on |
|---|---|---|
| 9876543210 | Ravi Kumar, delivery executive | Today's stops on trip ALWAL-1 |
| 9876543211 | Suresh Reddy, driver | Today's stops on trip ALWAL-1 |
| 9876543212 | Priya Sharma, operations executive | All trips; can start a trip |
| 9876543213 | Anil Verma, manager | All trips, filters, stop OTPs |
| 9876543214 | Kiran Rao, inactive agent | "Thank you for signing up" page |
| 9876543215 | Naveen Goud, outdated app | Force-update page |
| any other | – | "Field Agent not found" message |

What you do is remembered until the app restarts: returns, QR and cash collections, completed stops and
started trips all show up on later screens. In the browser, **Back** under the phone is Android's back
button (Esc works too), **Restart app** restarts it, and **Reset demo** also signs you out.

## Run it

Requires Node 20+ and `npm install`.

**Browser**

```bash
npm run web          # dev server on http://localhost:4300, reloads on changes
npm run web:build    # production build in dist/web
```

**Android** (needs the [NativeScript 8.9 CLI](https://docs.nativescript.org/setup/) and Android SDK)

```bash
npm run android      # builds, installs and live-syncs to a running emulator or device
```

The app installs as **FA Demo** (`com.qwipo.fieldagent.demo`), so it can sit next to the real app.

## How it is put together

```
src/                    The app (NativeScript + Angular 19): pages, services, entities, styles
  app/mock/             Synthetic backend: mock-data.ts (people, shops, products, orders, trips, stops)
                        and mock-backend.interceptor.ts (answers each API path, keeps state in memory)
  assets/legal/         Placeholder Terms & Privacy pages shown in the in-app web view
App_Resources/          Android / iOS resources (icons, splash, manifest, Gradle)
web/                    Browser target for the same src/ code
  main.ts               Browser entry: same routes, services and mock as src/main.ts
  shims/renderer.ts     Turns NativeScript tags (StackLayout, GridLayout, Label…) into laid-out HTML
  shims/core.ts, plugins.ts, angular.ts, sqlite.js
                        Browser stand-ins for @nativescript/core and the native plugins
  styles.css            NativeScript layout rules, Android dialogs/toasts, the phone frame
  build-css.mjs         Compiles src/app.android.scss + Tailwind into browser CSS
```

**Changing data:** edit `src/app/mock/mock-data.ts`. Product and QR images are in `src/images/mock/`.
Totals are calculated from the orders, so balances stay consistent.

**Changing the UI:** edit `src/` as you would in the real app; both targets pick it up. The Android build
is the reference; if a screen looks different in the browser, check it on the emulator before changing the
app's markup.

## How the browser version matches the APK

The phone is laid out at the exact size of the reference emulator (Pixel, 1080×2424 at 420 dpi: a
411.4 × 845.3 dp app area under a 54 dp status bar) and scaled to fit any window; on a phone the app
fills the screen. `web/shims/renderer.ts` applies NativeScript's Android layout rules, taken from its
`StackLayout`/`GridLayout`/`CommonLayoutParams` code: lengths rounded to device pixels, percentages of the
parent's full size (and dropped when the parent's height is unbounded), children clamped to the space
left, `*` grid rows sized by their content when nothing above bounds the grid's height, Android text
metrics (font padding, hinted glyph advances, synthetic bold), and `px` meaning device pixels. The
device's own Roboto font is bundled (`web/fonts/Roboto-Android.ttf`, Apache 2.0).

Checked against the emulator element by element (position and size of every text view and image) on 24
screens and sheets: 22 match within 2 dp. On the product-wise list the last, partly hidden row is cut
2.1 dp shorter, and on the force-update page the Update button sits 2.9 dp higher (the bold lines above
it are slightly shorter).

Works in current Chrome, Edge, Safari and Firefox (needs CSS container queries: Chrome/Edge 105+,
Safari 16+, Firefox 110+).

## What works differently from the live app

- **No backend.** API hosts point at `*.fieldagent.invalid`, which can never resolve, and the mock answers
  every request. Data resets when the app restarts.
- **OTP is not checked**, and location is fixed at the Alwal hub, so stops can be completed anywhere.
- **Invoice and indent PDFs** are not available (they come from the live orders service).
- **Re-attempt photo:** Android uses the camera; the browser opens a file picker (or the camera on a phone).
- **Call and map buttons** open the phone dialler and Google Maps as in the app; on a desktop browser a
  call shows a notice instead.
- **Terms & Conditions / Privacy Policy** show placeholder pages.

## What was removed from the production app

Copied from the live `master` branch (v2.6.34), keeping only what the app needs to run its screens and flows:

- Production and test service URLs, Firebase config and keys, the OTP provider key, test credentials,
  the OTP-bypass phone numbers and the real warehouse contact details
- Android keystores, the Apple signing team, push-notification entitlements, the `qwipo.com` deep link
- Codemagic CI, environment configs and build scripts, migration backups, git history
- Unused pages, services, entities, plugins (image cache, theme, date-fns), fonts and images

App version is reset to 1.0.0.

## Publishing the browser version

The site is served by GitHub Pages from the `gh-pages` branch. To update it:

```bash
npm run web:build
```

Then publish the contents of `dist/web` to the `gh-pages` branch (with an empty `.nojekyll` file).
