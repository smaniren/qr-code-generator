# Prompt -> TinyURL -> QR-Code Generator

Create a ChatGPT prompt link, shorten it with TinyURL, and export a scannable QR code in one clean flow.

## Why this project

This app is built for speed and clarity:

- One-click pipeline: Prompt -> Long URL -> TinyURL -> QR
- Modern UI with strong keyboard accessibility
- Copy-ready outputs for text, long URL, and short URL
- PNG export for print, slides, docs, or stickers
- No build step, no framework overhead

## Key Features

- Prompt input and automatic URL encoding
- TinyURL API integration (`https://api.tinyurl.com/create`)
- Session-only token storage (`sessionStorage`)
- Live status feedback for each generation step
- Responsive layout for desktop and mobile
- Accessibility improvements:
  - Skip link
  - Semantic landmarks (`header`, `main`, `footer`)
  - Visible focus states
  - ARIA live regions for status messages
  - Reduced motion support

## Quick Start

1. Clone the repo
2. Open the project folder
3. Start a local static server (recommended), for example:

```bash
python -m http.server 5500
```

4. Open:

```text
http://localhost:5500
```

You can also open `index.html` directly in a browser, but a local server is more reliable for testing.

## TinyURL API Token Setup

1. Go to `https://tinyurl.com/app`
2. Sign in or create an account
3. Open `Developer/API` in the dashboard
4. Create a new API token
5. Paste the token into the app's token field

## How to Use

1. Paste your TinyURL API token
2. Enter a prompt text
3. Click `Alles erstellen`
4. Copy generated values or download QR as PNG

## Project Structure

```text
qr-code-generator/
  index.html
  README.md
  src/
    main.js
    styles.css
```

## Privacy Notes

- The token is kept only in your current browser session.
- No backend is used in this project.
- API calls are sent directly from browser to TinyURL.

## Troubleshooting

- `TinyURL API-Token fehlt`: Enter a valid token first.
- `HTTP 401/403`: Token invalid, expired, or missing API permissions.
- `QR-Bibliothek wurde nicht geladen`: Refresh and check internet access to CDN.
- No output after click: Open browser devtools and inspect network/API response.

## Next Ideas

- Optional custom TinyURL alias input
- History of recently generated links
- Bulk mode for multiple prompts
- Built-in theme switcher

---

Built as a lightweight utility app with focus on usability, accessibility, and practical output.
