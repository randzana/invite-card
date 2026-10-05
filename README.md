# بۆرسەی زەوییەکانی کۆیە — Digital Invitation (Central Kurdish / Sorani)

A mobile-first, RTL luxury digital invitation for the launch of **بۆرسەی زەوییەکانی کۆیە**. It is static HTML/CSS/JS with no build step and zero dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | The invitation page |
| `assets/js/config.js` | **All content**: project, date, venue, stats, contact |
| `assets/js/main.js` | Behaviour: door intro, countdown, calendar, share |
| `assets/css/style.css` | Design system: obsidian and champagne-gold theme |
| `links.html` | Host tool that creates a personalised link for each guest |

## Customise

Edit `assets/js/config.js` to customise details.

## Run Locally

```bash
python3 -m http.server 8080
```

Deploy the whole folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
