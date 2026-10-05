/**
 * ─────────────────────────────────────────────────────────────
 *  Invitation content — edit this file to customise the card.
 *  All visible text is Central Kurdish (Sorani). Numbers are
 *  written with Latin digits here and rendered as Kurdish
 *  digits (٠١٢٣…) automatically.
 * ─────────────────────────────────────────────────────────────
 */
window.INVITE_CONFIG = {
  project: {
    name: "بۆرسەی زەوییەکانی کۆیە",
    latinName: "BORSAY ZAWIYAKANI KOYA",
    tagline: "گەورەترین بۆرسەی کڕین و فرۆشتنی زەوی و زار",
    host: "٢٠ خاوەن نووسینگەی شاری کۆیە",
  },

  // Default recipient
  guest: "بیلال سەعید",

  event: {
    title: "مەراسیمی کردنەوەی فەرمی",
    // ISO 8601 with the venue's UTC offset (Kurdistan Region = +03:00).
    start: "2026-10-07T10:00:00+03:00",
    end: "2026-10-07T13:00:00+03:00",
    timeZone: "Asia/Baghdad",
    rsvpBy: "2026-10-06",
    dressCode: "فەرمی",
    message:
      "بە خۆشحاڵییەوە هەڵدەستین بە کردنەوەی گەورەترین بۆرسە بە ئەندامبوونی ٢٠ خاوەن نووسینگە لە شاری کۆیە؛ بە شانازییەوە بانگهێشتی بەڕێزتان دەکەین بۆ ئامادەبوون و بەشداریکردن لە مەراسیمی کردنەوەی فەرمیی بۆرسەی زەوییەکانی کۆیە.",
  },

  venue: {
    name: "بۆرسەی زەوییەکانی کۆیە",
    address: "شاری کۆیە",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=36.085083,44.627806",
  },

  contact: {
    // Shown in the footer and used for the tel: link.
    phone: "",
    // Organiser's WhatsApp number in international format, digits only
    // (e.g. "9647501234567").
    whatsapp: "",
  },

  stats: [
    { value: 20, label: "خاوەن نووسینگەی ئەندام" },
    { value: 1, label: "بۆرسەی ناوەندیی زەوی" },
    { value: 100, suffix: "٪", label: "متمانە و یاسایی" },
  ],

  program: [],

  // Guests can have a personalised link: index.html?to=ناوی میوان
  maxGuests: 4,
};
