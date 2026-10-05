/* ═══════════════════════════════════════════════════════════
   Borsay Zawiakani Koya — Multi-language Invitation Behaviour
   Central Kurdish (Sorani), Arabic & English
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const C = window.INVITE_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────── Locales Data ─────────── */

  const LOCALES = {
    ckb: {
      digits: "٠١٢٣٤٥٦٧٨٩",
      months: [
        "کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران",
        "تەممووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم",
      ],
      weekdays: {
        Sat: "شەممە", Sun: "یەکشەممە", Mon: "دووشەممە", Tue: "سێشەممە",
        Wed: "چوارشەممە", Thu: "پێنجشەممە", Fri: "هەینی",
      },
      dayPeriod(h) {
        if (h >= 5 && h < 12) return "بەیانی";
        if (h === 12) return "نیوەڕۆ";
        if (h > 12 && h < 17) return "دوای نیوەڕۆ";
        if (h >= 17 && h < 21) return "ئێوارە";
        return "شەو";
      },
      timeRange(sp, ep, clockFn, dayFn) {
        return `${clockFn(sp.hour, sp.minute)}ی ${dayFn(sp.hour)} تا ${clockFn(ep.hour, ep.minute)}ی ${dayFn(ep.hour)}`;
      },
      coverGuest(name) {
        return name.startsWith("بەڕێز") ? name : `بەڕێز ${name}`;
      },
      salutation(name) {
        return name.startsWith("بەڕێز") ? `${name}،` : `بەڕێز ${name}،`;
      },
      signature(host) {
        return `— ${host}`;
      },
    },

    ar: {
      digits: "٠١٢٣٤٥٦٧٨٩",
      months: [
        "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
        "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
      ],
      weekdays: {
        Sat: "السبت", Sun: "الأحد", Mon: "الاثنين", Tue: "الثلاثاء",
        Wed: "الأربعاء", Thu: "الخميس", Fri: "الجمعة",
      },
      dayPeriod(h) {
        if (h >= 5 && h < 12) return "صباحاً";
        if (h === 12) return "ظهراً";
        if (h > 12 && h < 17) return "بعد الظهر";
        if (h >= 17 && h < 21) return "مساءً";
        return "ليلاً";
      },
      timeRange(sp, ep, clockFn, dayFn) {
        return `${clockFn(sp.hour, sp.minute)} ${dayFn(sp.hour)} حتى ${clockFn(ep.hour, ep.minute)} ${dayFn(ep.hour)}`;
      },
      coverGuest(name) {
        if (name.includes("المحترم") || name.startsWith("السيد") || name.startsWith("الأستاذ")) return name;
        return `الأستاذ الفاضل ${name} المحترم`;
      },
      salutation(name) {
        if (name.includes("المحترم") || name.startsWith("السيد") || name.startsWith("الأستاذ")) return `${name}،`;
        return `الأستاذ الفاضل ${name} المحترم،`;
      },
      signature(host) {
        return `— ${host}`;
      },
    },

    en: {
      digits: null, // English uses Latin digits (0-9)
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ],
      weekdays: {
        Sat: "Saturday", Sun: "Sunday", Mon: "Monday", Tue: "Tuesday",
        Wed: "Wednesday", Thu: "Thursday", Fri: "Friday",
      },
      dayPeriod(h) {
        return h < 12 ? "AM" : "PM";
      },
      timeRange(sp, ep, clockFn, dayFn) {
        return `${clockFn(sp.hour, sp.minute)} ${dayFn(sp.hour)} – ${clockFn(ep.hour, ep.minute)} ${dayFn(ep.hour)}`;
      },
      coverGuest(name) {
        if (/^(Mr\.|Ms\.|Mrs\.|Dr\.)/i.test(name)) return name;
        return `Mr. ${name}`;
      },
      salutation(name) {
        if (/^(Mr\.|Ms\.|Mrs\.|Dr\.)/i.test(name)) return `Dear ${name},`;
        return `Dear Mr. ${name},`;
      },
      signature(host) {
        return `— ${host}`;
      },
    },
  };

  const toDigits = (v, lang) => {
    const s = String(v);
    const d = LOCALES[lang]?.digits;
    if (!d) return s;
    return s.replace(/[0-9]/g, (digit) => d[digit]);
  };

  const pad2 = (n) => String(n).padStart(2, "0");
  const isolate = (s) => `\u2068${s}\u2069`;

  /** Date parts as seen in the venue's time zone */
  function zonedParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return { year: +p.year, month: +p.month, day: +p.day, weekday: p.weekday, hour: +p.hour % 24, minute: +p.minute };
  }

  const start = new Date(C.event.start);
  const end = new Date(C.event.end);
  const sp = zonedParts(start, C.event.timeZone);
  const ep = zonedParts(end, C.event.timeZone);

  const params = new URLSearchParams(location.search);
  const customGuest = (params.get("to") || "").trim().slice(0, 48);

  // Active language resolution
  let currentLang = params.get("lang") || localStorage.getItem("invite-lang") || "ckb";
  if (!C.languages[currentLang]) currentLang = "ckb";

  /* ─────────── Toast ─────────── */

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  /* ─────────── Render / Switch Language ─────────── */

  function setLanguage(langKey) {
    if (!C.languages[langKey]) langKey = "ckb";
    currentLang = langKey;
    try {
      localStorage.setItem("invite-lang", langKey);
    } catch {
      /* storage unavailable */
    }

    const langCfg = C.languages[langKey];
    const loc = LOCALES[langKey];

    // HTML lang and dir
    document.documentElement.lang = langKey;
    document.documentElement.dir = langCfg.dir;

    // Language pills active state
    $$(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === langKey;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    // Time formatting helper
    const clock = (h, m) => `${toDigits(h % 12 || 12, langKey)}:${toDigits(pad2(m), langKey)}`;
    const guestName = customGuest || langCfg.guest;

    const view = {
      coverGuest: loc.coverGuest(isolate(guestName)),
      salutation: loc.salutation(isolate(guestName)),
      signature: loc.signature(langCfg.project.host),
      weekday: loc.weekdays[sp.weekday] || sp.weekday,
      day: toDigits(sp.day, langKey),
      month: loc.months[sp.month - 1],
      year: toDigits(sp.year, langKey),
      timeRange: loc.timeRange(sp, ep, clock, loc.dayPeriod),
    };

    const model = {
      project: langCfg.project,
      event: { ...C.event, ...langCfg.event },
      venue: { ...langCfg.venue, mapUrl: C.event.mapUrl },
      ui: langCfg.ui,
      view,
    };

    const resolve = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), model);

    // Apply data-text
    $$("[data-text]").forEach((el) => {
      const v = resolve(el.dataset.text);
      if (v != null) el.textContent = v;
    });

    // Set Map Links
    const mapHref = C.event.mapUrl;
    const vMap = $("#venueMapLink");
    if (vMap) vMap.href = mapHref;
    const aMap = $("#actionMapLink");
    if (aMap) aMap.href = mapHref;

    // Document Title & Meta
    document.title = `${langCfg.project.name} · ${langCfg.event.title}`;

    // Render Stats
    const statsEl = $("#stats");
    if (statsEl) {
      statsEl.replaceChildren();
      langCfg.stats.forEach((s) => {
        const node = $("#tpl-stat").content.cloneNode(true);
        const num = $(".stat__num", node);
        num.dataset.value = s.value;
        num.textContent = toDigits(s.value, langKey);
        $(".stat__suffix", node).textContent = s.suffix || "";
        $(".stat__label", node).textContent = s.label;
        statsEl.append(node);
      });
    }

    // Refresh countdown values and labels
    updateCountdown();

    // Update Calendar and Share
    updateCalendarLinks();
  }

  /* ─────────── Countdown ─────────── */

  const units = Object.fromEntries($$("[data-unit]").map((el) => [el.dataset.unit, el]));
  let countdownTimer;

  function updateCountdown() {
    const langCfg = C.languages[currentLang];
    const now = Date.now();
    const diff = start.getTime() - now;

    if (diff <= 0) {
      clearInterval(countdownTimer);
      const live = now < end.getTime();
      $("#countdown").hidden = true;
      const titleEl = $("#countdown-title");
      if (titleEl) titleEl.textContent = live ? langCfg.ui.liveStatus : langCfg.ui.endedStatus;
      const status = $("#countdownStatus");
      if (status) {
        status.textContent = live ? langCfg.ui.liveStatus : langCfg.ui.endedStatus;
        status.hidden = false;
      }
      return;
    }

    const s = Math.floor(diff / 1000);
    const values = {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };

    for (const [unit, value] of Object.entries(values)) {
      const el = units[unit];
      if (!el) continue;
      const text = toDigits(pad2(value), currentLang);
      if (el.textContent === text) continue;
      el.textContent = text;
      if (!reducedMotion) {
        el.classList.remove("tick");
        void el.offsetWidth;
        el.classList.add("tick");
      }
    }
  }

  countdownTimer = setInterval(updateCountdown, 1000);

  /* ─────────── Calendar Links & ICS ─────────── */

  const utcStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  function updateCalendarLinks() {
    const langCfg = C.languages[currentLang];
    const calTitle = `${langCfg.event.title} - ${langCfg.project.name}`;
    const calLocation = `${langCfg.venue.name}, ${langCfg.venue.address}`;
    const calDetails = `${langCfg.event.message}\n\n${C.event.mapUrl}`;

    const googleBtn = $("#calGoogle");
    if (googleBtn) {
      googleBtn.href =
        "https://calendar.google.com/calendar/render?" +
        new URLSearchParams({
          action: "TEMPLATE",
          text: calTitle,
          dates: `${utcStamp(start)}/${utcStamp(end)}`,
          details: calDetails,
          location: calLocation,
          ctz: C.event.timeZone,
        });
    }
  }

  function foldIcs(line) {
    const enc = new TextEncoder();
    let out = "";
    let bytes = 0;
    for (const ch of line) {
      const n = enc.encode(ch).length;
      if (bytes + n > 75) {
        out += "\r\n ";
        bytes = 1;
      }
      out += ch;
      bytes += n;
    }
    return out;
  }

  function buildIcs() {
    const langCfg = C.languages[currentLang];
    const calTitle = `${langCfg.event.title} - ${langCfg.project.name}`;
    const calLocation = `${langCfg.venue.name}, ${langCfg.venue.address}`;
    const calDetails = `${langCfg.event.message}\n\n${C.event.mapUrl}`;
    const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
    const slug = (langCfg.project.latinName || "koya-exchange").toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${langCfg.project.latinName}//Invitation//${currentLang.toUpperCase()}`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${utcStamp(start)}-${slug}@invite`,
      `DTSTAMP:${utcStamp(new Date())}`,
      `DTSTART:${utcStamp(start)}`,
      `DTEND:${utcStamp(end)}`,
      `SUMMARY:${esc(calTitle)}`,
      `LOCATION:${esc(calLocation)}`,
      `DESCRIPTION:${esc(calDetails)}`,
      `URL:${location.href}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT3H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(calTitle)}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.map(foldIcs).join("\r\n") + "\r\n";
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: `invitation-${currentLang}.ics` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  }

  const calDialog = $("#calDialog");
  const btnCalendar = $("#btnCalendar");
  if (btnCalendar && calDialog) {
    btnCalendar.addEventListener("click", () => {
      if (typeof calDialog.showModal === "function") calDialog.showModal();
      else downloadIcs();
    });
  }
  const calIcs = $("#calIcs");
  if (calIcs && calDialog) {
    calIcs.addEventListener("click", () => {
      downloadIcs();
      calDialog.close();
    });
  }
  const calGoogle = $("#calGoogle");
  if (calGoogle && calDialog) {
    calGoogle.addEventListener("click", () => calDialog.close());
  }
  if (calDialog) {
    calDialog.addEventListener("click", (e) => {
      if (e.target === calDialog) calDialog.close();
    });
  }

  /* ─────────── Share ─────────── */

  function shareUrl() {
    const u = new URL(location.href);
    u.searchParams.set("lang", currentLang);
    u.searchParams.delete("to");
    u.hash = "";
    return u.toString();
  }

  const btnShare = $("#btnShare");
  if (btnShare) {
    btnShare.addEventListener("click", async () => {
      const langCfg = C.languages[currentLang];
      const data = {
        title: `${langCfg.project.name} · ${langCfg.event.title}`,
        text: `${langCfg.event.title} - ${langCfg.project.name}`,
        url: shareUrl(),
      };
      if (navigator.share) {
        try {
          await navigator.share(data);
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(data.url);
        toast(langCfg.ui.toastCopied);
      } catch {
        toast(langCfg.ui.toastFailed);
      }
    });
  }

  /* ─────────── Cover Door Animation ─────────── */

  const body = document.body;
  const invite = $("#invite");
  const openBtn = $("#openInvite");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      if (body.classList.contains("is-opening")) return;
      body.classList.add("is-opening");
      setTimeout(() => body.classList.add("is-open"), reducedMotion ? 0 : 450);
      setTimeout(() => {
        const cover = $("#cover");
        if (cover) cover.remove();
        body.classList.remove("is-locked");
        if (invite) {
          invite.inert = false;
          const title = $("#title");
          if (title) title.focus({ preventScroll: true });
        }
        observeScroll();
      }, reducedMotion ? 0 : 1850);
    });
  }

  /* ─────────── Scroll Reveal & Counters ─────────── */

  function runCounters() {
    $$(".stat__num").forEach((el) => {
      const target = Number(el.dataset.value);
      if (reducedMotion) {
        el.textContent = toDigits(target, currentLang);
        return;
      }
      const duration = 1600;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = toDigits(val, currentLang);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function observeScroll() {
    const reveals = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      runCounters();
      return;
    }

    const statsEl = $("#stats");
    const revealer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (statsEl && entry.target === statsEl) runCounters();
          revealer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => revealer.observe(el));
  }

  /* ─────────── Language Switcher Buttons ─────────── */

  $$(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
    });
  });

  // Initial render
  setLanguage(currentLang);
})();
