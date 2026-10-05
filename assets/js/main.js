/* ═══════════════════════════════════════════════════════════
   Aso Towers — invitation behaviour
   Binds config → DOM, runs the door intro, countdown, calendar,
   sharing and RSVP. No dependencies.
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const C = window.INVITE_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────── Central Kurdish (Sorani) locale ─────────── */

  const KU_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const MONTHS = [
    "کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران",
    "تەممووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم",
  ];
  const WEEKDAYS = {
    Sat: "شەممە", Sun: "یەکشەممە", Mon: "دووشەممە", Tue: "سێشەممە",
    Wed: "چوارشەممە", Thu: "پێنجشەممە", Fri: "هەینی",
  };

  const toKu = (v) => String(v).replace(/[0-9]/g, (d) => KU_DIGITS[d]);
  const toLatin = (v) =>
    String(v).replace(/[٠-٩۰-۹]/g, (d) => {
      const i = KU_DIGITS.indexOf(d);
      return String(i >= 0 ? i : FA_DIGITS.indexOf(d));
    });
  const pad2 = (n) => String(n).padStart(2, "0");
  // First-strong isolate so names in any script sit correctly inside RTL text.
  const isolate = (s) => `\u2068${s}\u2069`;

  /** Date parts as seen in the venue's time zone, not the viewer's. */
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

  function dayPeriod(h) {
    if (h >= 5 && h < 12) return "بەیانی";
    if (h === 12) return "نیوەڕۆ";
    if (h > 12 && h < 17) return "دوای نیوەڕۆ";
    if (h >= 17 && h < 21) return "ئێوارە";
    return "شەو";
  }

  const clock = (h, m) => `${toKu(h % 12 || 12)}:${toKu(pad2(m))}`;
  const formatTime = ({ hour, minute }) => `${clock(hour, minute)}ی ${dayPeriod(hour)}`;

  /* ─────────── Model ─────────── */

  const start = new Date(C.event.start);
  const end = new Date(C.event.end);
  const sp = zonedParts(start, C.event.timeZone);
  const ep = zonedParts(end, C.event.timeZone);
  const [rsvpY, rsvpM, rsvpD] = C.event.rsvpBy.split("-").map(Number);
  const slug = (C.project.latinName || "invite").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || C.guest || "بیلال سەعید").trim().replace(/\s+/g, " ").slice(0, 48);
  const guestTitle = guest.startsWith("بەڕێز") ? isolate(guest) : `بەڕێز ${isolate(guest)}`;

  const view = {
    coverGuest: guestTitle,
    salutation: `${guestTitle}،`,
    signature: `— ${C.project.host}`,
    weekday: WEEKDAYS[sp.weekday],
    day: toKu(sp.day),
    month: MONTHS[sp.month - 1],
    year: toKu(sp.year),
    timeRange: `${formatTime(sp)} تا ${formatTime(ep)}`,
    rsvpBy: `${toKu(rsvpD)}ی ${MONTHS[rsvpM - 1]}`,
    phone: C.contact.phone,
  };

  const model = { ...C, view };
  const resolve = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), model);

  /* ─────────── Render ─────────── */

  $$("[data-text]").forEach((el) => {
    const v = resolve(el.dataset.text);
    if (v != null) el.textContent = v;
  });
  $$("[data-href]").forEach((el) => {
    const v = resolve(el.dataset.href);
    if (v) el.href = v;
  });
  const phoneLink = $("#phoneLink");
  if (phoneLink && C.contact?.phone) {
    phoneLink.href = `tel:${C.contact.phone.replace(/[^\d+]/g, "")}`;
  }

  const statsEl = $("#stats");
  C.stats.forEach((s) => {
    const node = $("#tpl-stat").content.cloneNode(true);
    const num = $(".stat__num", node);
    num.dataset.value = s.value;
    num.textContent = toKu(reducedMotion ? s.value : 0);
    $(".stat__suffix", node).textContent = s.suffix || "";
    $(".stat__label", node).textContent = s.label;
    statsEl.append(node);
  });

  const timeline = $("#timeline");
  if (timeline && C.program) {
    C.program.forEach((item) => {
      const tpl = $("#tpl-program");
      if (!tpl) return;
      const node = tpl.content.cloneNode(true);
      const [h, m] = item.time.split(":").map(Number);
      $(".timeline__time", node).textContent = clock(h, m);
      $(".timeline__title", node).textContent = item.title;
      $(".timeline__note", node).textContent = item.note || "";
      timeline.append(node);
    });
  }

  /* ─────────── Toast ─────────── */

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  /* ─────────── Cover → doors open ─────────── */

  const body = document.body;
  const invite = $("#invite");

  $("#openInvite").addEventListener("click", () => {
    if (body.classList.contains("is-opening")) return;
    body.classList.add("is-opening");
    setTimeout(() => body.classList.add("is-open"), reducedMotion ? 0 : 450);
    setTimeout(() => {
      $("#cover").remove();
      body.classList.remove("is-locked");
      invite.inert = false;
      $("#title").focus({ preventScroll: true });
      observeScroll();
    }, reducedMotion ? 0 : 1850);
  });

  /* ─────────── Countdown ─────────── */

  const units = Object.fromEntries($$("[data-unit]").map((el) => [el.dataset.unit, el]));
  let countdownTimer;

  function updateCountdown() {
    const now = Date.now();
    const diff = start.getTime() - now;

    if (diff <= 0) {
      clearInterval(countdownTimer);
      const live = now < end.getTime();
      $("#countdown").hidden = true;
      $("#countdown-title").textContent = live ? "ئێستا بەڕێوەدەچێت" : "سوپاس بۆ ئامادەبوونتان";
      const status = $("#countdownStatus");
      status.textContent = live ? "مەراسیمەکە دەستی پێکردووە — بەخێربێن!" : "مەراسیمەکە کۆتایی هات.";
      status.hidden = false;
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
      const text = toKu(pad2(value));
      if (el.textContent === text) continue;
      el.textContent = text;
      if (!reducedMotion) {
        el.classList.remove("tick");
        void el.offsetWidth; // restart the animation
        el.classList.add("tick");
      }
    }
  }

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);

  /* ─────────── Scroll reveal, counters, floating RSVP ─────────── */

  function runCounters() {
    $$(".stat__num").forEach((el) => {
      const target = Number(el.dataset.value);
      if (reducedMotion) {
        el.textContent = toKu(target);
        return;
      }
      const duration = 1600;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        el.textContent = toKu(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const fab = $("#fab");
  const rsvpDone = $("#rsvpDone");
  let heroGone = false;
  let rsvpReached = false;
  const syncFab = () => {
    if (fab) fab.classList.toggle("is-visible", heroGone && !rsvpReached && rsvpDone && rsvpDone.hidden);
  };

  function observeScroll() {
    const reveals = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      runCounters();
      return;
    }

    const revealer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (entry.target === statsEl) runCounters();
          revealer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => revealer.observe(el));

    if (fab) {
      new IntersectionObserver(
        ([entry]) => {
          heroGone = entry.intersectionRatio < 0.35;
          syncFab();
        },
        { threshold: [0, 0.35, 1] }
      ).observe($(".hero"));

      const rsvpEl = $("#rsvp");
      if (rsvpEl) {
        new IntersectionObserver(([entry]) => {
          rsvpReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
          syncFab();
        }).observe(rsvpEl);
      }
    }
  }

  /* ─────────── Calendar ─────────── */

  const calTitle = `${C.event.title}ی ${C.project.name}`;
  const calLocation = `${C.venue.name}، ${C.venue.address}`;
  const calDetails = `${C.event.message}\n\n${C.venue.mapUrl}`;
  const utcStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  $("#calGoogle").href =
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      text: calTitle,
      dates: `${utcStamp(start)}/${utcStamp(end)}`,
      details: calDetails,
      location: calLocation,
      ctz: C.event.timeZone,
    });

  /** RFC 5545 line folding: max 75 octets, never splitting a UTF-8 sequence. */
  function fold(line) {
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
    const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
    const url = /^https?:/.test(location.protocol) ? shareUrl() : "";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${C.project.latinName}//Invitation//CKB`,
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
      ...(url ? [`URL:${url}`] : []),
      "BEGIN:VALARM",
      "TRIGGER:-PT3H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(calTitle)}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.map(fold).join("\r\n") + "\r\n";
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: `${slug}.ics` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  }

  const calDialog = $("#calDialog");
  $("#btnCalendar").addEventListener("click", () => {
    if (typeof calDialog.showModal === "function") calDialog.showModal();
    else downloadIcs();
  });
  $("#calIcs").addEventListener("click", () => {
    downloadIcs();
    calDialog.close();
  });
  $("#calGoogle").addEventListener("click", () => calDialog.close());
  calDialog.addEventListener("click", (e) => {
    if (e.target === calDialog) calDialog.close(); // backdrop click
  });

  /* ─────────── Share ─────────── */

  /** The public link — strips the personal ?to= name so guests don't forward it. */
  function shareUrl() {
    const u = new URL(location.href);
    u.searchParams.delete("to");
    u.hash = "";
    return u.toString();
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast("بەستەرەکە کۆپی کرا");
    } catch {
      toast("نەتوانرا بەستەرەکە کۆپی بکرێت");
    }
  }

  $("#btnShare").addEventListener("click", async () => {
    const data = { title: document.title, text: calTitle, url: shareUrl() };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    copyLink(data.url);
  });

  /* ─────────── RSVP ─────────── */

  const STORAGE_KEY = `invite-rsvp:${slug}`;
  const store = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        /* storage unavailable (private mode) — the reply still goes out */
      }
    },
  };

  const form = $("#rsvpForm");
  if (form) {
    const nameInput = $("#f-name");
    const phoneInput = $("#f-phone");
    const guestsField = $("#guestsField");
    const maxGuests = C.maxGuests || 4;
    let guests = 1;

    function setGuests(n) {
      guests = Math.min(maxGuests, Math.max(1, n));
      $("#guestsOut").textContent = toKu(guests);
      $$("[data-step]").forEach((btn) => {
        const step = Number(btn.dataset.step);
        btn.disabled = (step > 0 && guests >= maxGuests) || (step < 0 && guests <= 1);
      });
    }

    $$("[data-step]").forEach((btn) => btn.addEventListener("click", () => setGuests(guests + Number(btn.dataset.step))));
    setGuests(1);

    const isAttending = () => form.elements.attending.value === "yes";
    form.addEventListener("change", (e) => {
      if (e.target.name === "attending") guestsField.hidden = !isAttending();
    });

    /** Accepts Kurdish/Persian/Latin digits and +964 / 00964 prefixes → 07XXXXXXXXX. */
    function normalizePhone(raw) {
      let d = toLatin(raw).replace(/[\s\-().]/g, "");
      if (d.startsWith("+964")) d = "0" + d.slice(4);
      else if (d.startsWith("00964")) d = "0" + d.slice(5);
      else if (d.startsWith("964")) d = "0" + d.slice(3);
      if (/^7\d{9}$/.test(d)) d = "0" + d;
      return d;
    }

    function setError(input, message = "") {
      $(`#${input.id}-err`).textContent = message;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }

    [nameInput, phoneInput].forEach((input) =>
      input.addEventListener("input", () => {
        if (input.hasAttribute("aria-invalid")) setError(input);
      })
    );

    function sendViaWhatsApp(reply) {
      const number = String(C.contact.whatsapp || "").replace(/\D/g, "");
      if (!number) return false;
      const text = reply.attending
        ? `سڵاو، من ${reply.name} ئامادەبوونم بۆ ${calTitle} دووپات دەکەمەوە. ژمارەی کەسەکان: ${toKu(reply.guests)}.`
        : `سڵاو، من ${reply.name}، سوپاس بۆ بانگهێشتەکەتان؛ بەداخەوە ناتوانم ئامادەی ${calTitle} بم.`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      return true;
    }

    function showDone(reply, { celebrate = false, viaWhatsApp = false } = {}) {
      form.hidden = true;
      if (rsvpDone) rsvpDone.hidden = false;
      const titleEl = $("#rsvpDoneTitle");
      if (titleEl) titleEl.textContent = reply.attending ? "سوپاس، چاوەڕێتان دەکەین!" : "سوپاس بۆ وەڵامەکەتان";
      const textEl = $("#rsvpDoneText");
      if (textEl) {
        textEl.textContent = viaWhatsApp
          ? "وەڵامەکەتان لە واتسئەپ ئامادەیە؛ تەنها دوگمەی ناردن دابگرن."
          : reply.attending
            ? `ئامادەبوونی ${toKu(reply.guests)} کەس تۆمار کرا.`
            : "هیوادارین لە بۆنەیەکی تردا ببینینتان.";
      }
      syncFab();

      if (celebrate && rsvpDone) {
        rsvpDone.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
        if (titleEl) {
          titleEl.setAttribute("tabindex", "-1");
          titleEl.focus({ preventScroll: true });
        }
        if (reply.attending) setTimeout(confetti, 350);
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = nameInput.value.trim().replace(/\s+/g, " ");
      const phone = normalizePhone(phoneInput.value);
      let firstInvalid = null;

      if (name.length < 2) {
        setError(nameInput, "تکایە ناوی تەواوی خۆتان بنووسن.");
        firstInvalid = nameInput;
      } else setError(nameInput);

      if (!/^07\d{9}$/.test(phone)) {
        setError(phoneInput, `تکایە ژمارەی مۆبایلێکی دروست بنووسن، بۆ نموونە ${isolate("0750 123 4567")}`);
        firstInvalid ??= phoneInput;
      } else setError(phoneInput);

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const attending = isAttending();
      const reply = { attending, name, phone, guests: attending ? guests : 0, at: new Date().toISOString() };
      store.set(reply);
      const viaWhatsApp = sendViaWhatsApp(reply);
      showDone(reply, { celebrate: true, viaWhatsApp });
    });

    const rsvpEditBtn = $("#rsvpEdit");
    if (rsvpEditBtn) {
      rsvpEditBtn.addEventListener("click", () => {
        if (rsvpDone) rsvpDone.hidden = true;
        form.hidden = false;
        nameInput.focus();
        syncFab();
      });
    }

    // Restore a previous reply on this device, else pre-fill the guest's name.
    const saved = store.get();
    if (saved && saved.name) {
      nameInput.value = saved.name;
      phoneInput.value = saved.phone || "";
      form.elements.attending.value = saved.attending ? "yes" : "no";
      guestsField.hidden = !saved.attending;
      setGuests(saved.guests || 1);
      showDone(saved);
    } else if (guest) {
      nameInput.value = guest;
    }
  }

  /* ─────────── Gold confetti ─────────── */

  function confetti() {
    if (reducedMotion || !Element.prototype.animate) return;
    const ox = window.innerWidth / 2;
    const oy = window.innerHeight * 0.42;
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("span");
      p.className = "confetti";
      p.style.left = `${ox}px`;
      p.style.top = `${oy}px`;
      if (i % 3 === 0) p.style.borderRadius = "50%";
      document.body.append(p);
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 150;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      const spin = Math.random() * 720 - 360;
      p.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 140}px)) rotate(${spin}deg) scale(0.5)`, opacity: 0 },
        ],
        { duration: 1300 + Math.random() * 700, easing: "cubic-bezier(.15,.7,.3,1)" }
      ).onfinish = () => p.remove();
    }
  }
})();
