# Mock backend

The app has no backend: every `HttpClient` call is answered here from synthetic data. It is registered in
`src/main.ts` (Android) and `web/main.ts` (browser).

- `mock-data.ts` – people, shops, products, orders, trips and stops (Hyderabad / Alwal hub, today + yesterday).
- `mock-backend.interceptor.ts` – URL path → handler table; keeps state in memory so starting trips,
  completing stops, collecting cash/QR payments and recording returns all show up on later screens.
  Restarting the app resets it.
- `mock-pdf.service.ts` – invoice / indent PDFs bypass `HttpClient`, so downloads show a notice instead.
- Product and QR images live in `src/images/mock/`.

Sign-in numbers are listed in the main [README](../../../README.md#sign-in).

Location distance checks are switched off in the mock app settings so stops can be completed anywhere.
