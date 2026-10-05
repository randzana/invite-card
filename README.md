# Aso Towers — Digital Invitation (Central Kurdish / Sorani)

A mobile-first, RTL invitation for a real estate project launch. It's static HTML/CSS/JS with no build step and no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | The invitation page |
| `assets/js/config.js` | **All content**: project, date, venue, program, stats, contact |
| `assets/js/main.js` | Behaviour: door intro, countdown, calendar, share, RSVP |
| `assets/css/style.css` | Design system: obsidian and champagne-gold theme |
| `links.html` | Host tool that creates a personalised link for each guest |

## Customise

Edit `assets/js/config.js` only. Write numbers with Latin digits. They're shown as Kurdish digits (٠١٢٣…) automatically.

- `event.start` / `event.end`: ISO dates with the venue offset, e.g. `2026-11-12T19:00:00+03:00`. The weekday, Kurdish month name, time of day (بەیانی / ئێوارە / شەو) and countdown all come from these.
- `contact.whatsapp`: put the organiser's number here (digits only, e.g. `9647501234567`) so RSVPs reach you. Each reply then opens WhatsApp with a ready-made Kurdish message. **If it's left empty, replies are only saved on the guest's own device.**
- Also update the `og:description` meta in `index.html`. It's static because link previews don't run JavaScript.

## Personalised invitations

`index.html?to=ئاراس محەمەد` puts the guest's name on the cover and in the greeting, and pre-fills the RSVP. Open `links.html` to paste a list of names and copy or WhatsApp each guest's link. The share button always strips the name, so forwarded links stay generic.

## Run / deploy

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8080
```

Deploy the whole folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

## Built in

- Correct Sorani typography: Noto Kufi Arabic and Noto Sans Arabic, which cover ڕ ڵ ێ ۆ ە, with no letter-spacing on Arabic script
- Dates computed in the venue's time zone, not the viewer's
- `.ics` export (RFC 5545, UTF-8-safe line folding, 3-hour reminder) plus Google Calendar
- Phone validation that accepts Kurdish, Persian or Latin digits and `+964` / `00964` prefixes
- `prefers-reduced-motion` support, keyboard and screen-reader friendly, `inert` while the cover is closed
- Countdown switches to "happening now" and then "thank you" automatically
