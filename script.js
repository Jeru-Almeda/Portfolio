/* ============ CONFIGURATION ============ */
const CONFIG = {
  toEmail: "jeruxcyalmeda03@gmail.com",
  emailjs: {
    publicKey: "6Acz5h0vYu8tos2Hz",
    serviceId: "service_m9ehrt2",
    templateId: "template_o0w3bde"
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
root.classList.add("js");

/* ============ IMAGE FALLBACK ============ */
$$("img").forEach((img) => {
  img.addEventListener("error", () => img.remove(), { once: true });
  if (img.complete && img.naturalWidth === 0) img.remove();
});

/* ============ THEME ============ */
const themeBtn = $("#theme");

function applyTheme(theme, save = false) {
  root.dataset.theme = theme;
  if (themeBtn) {
    themeBtn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
    themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
  }
  if (save) {
    try {
      localStorage.setItem("ja-theme", theme);
    } catch (_) {
      // Theme still works for this page view if storage is unavailable.
    }
  }
}

if (themeBtn) {
  let savedTheme = root.dataset.theme || "dark";
  try {
    savedTheme =
      localStorage.getItem("ja-theme") ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : savedTheme);
  } catch (_) {}
  applyTheme(savedTheme);

  themeBtn.addEventListener("click", () => {
    document.body.classList.add("theming");
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    window.setTimeout(() => document.body.classList.remove("theming"), 600);
  });
}

/* ============ MOBILE MENU ============ */
const burger = $("#burger");
const menu = $("#menu");

function setMenu(open) {
  if (!menu || !burger) return;
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.classList.toggle("menu-open", open);
}

if (burger && menu) {
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("#menu a, #menu button").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.currentTarget !== burger) setMenu(false);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      setMenu(false);
      burger.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 800 && menu.classList.contains("open")) setMenu(false);
  }, { passive: true });
}

/* ============ SCROLL EFFECTS ============ */
const nav = $("#nav");
const bar = $("#progress");
const topBtn = $("#top-btn");
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;

  if (nav) nav.classList.toggle("stuck", y > 20);
  if (bar) bar.style.transform = `scaleX(${height > 0 ? Math.min(1, y / height) : 0})`;

  if (topBtn) {
    const show = y > 700;
    topBtn.classList.toggle("show", show);
    topBtn.hidden = !show;
    topBtn.tabIndex = show ? 0 : -1;
    topBtn.setAttribute("aria-hidden", String(!show));
  }
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }
}, { passive: true });

window.addEventListener("resize", onScroll, { passive: true });
onScroll();

if (topBtn) {
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ============ REVEAL ANIMATIONS + ACTIVE NAV ============ */
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$(".reveal").forEach((element) => revealObserver.observe(element));

  const navLinks = $$('.menu > a[href^="#"]:not(.btn)');
  if (navLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    $$("main section[id]").forEach((section) => sectionObserver.observe(section));
  }
} else {
  $$(".reveal").forEach((element) => element.classList.add("in"));
}

/* ============ CONTACT FORM ============ */
const form = $("#form");
const statusEl = $("#status");
const sendBtn = $("#send");

const rules = {
  name: (value) => value.trim() ? "" : "Enter your name.",
  email: (value) => {
    const email = value.trim();
    if (!email) return "Enter your email address.";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address.";
  },
  subject: (value) => value.trim() ? "" : "Enter a subject.",
  message: (value) => value.trim().length >= 10 ? "" : "Write a message of at least 10 characters."
};

function say(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function validateForm() {
  if (!form) return false;
  let firstInvalid = null;

  for (const fieldName in rules) {
    const field = form.elements.namedItem(fieldName);
    const errorEl = $(`#e-${fieldName}`);
    if (!field || !errorEl) continue;

    const errorMessage = rules[fieldName](field.value);
    errorEl.textContent = errorMessage;
    field.setAttribute("aria-invalid", String(Boolean(errorMessage)));
    field.setAttribute("aria-describedby", `e-${fieldName}`);

    if (errorMessage && !firstInvalid) firstInvalid = field;
  }

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

if (form && sendBtn && statusEl) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sendBtn.disabled || !validateForm()) return;

    const emailConfig = CONFIG.emailjs;
    if (
      !emailConfig.publicKey || !emailConfig.serviceId || !emailConfig.templateId ||
      emailConfig.publicKey === "YOUR_PUBLIC_KEY" ||
      emailConfig.serviceId === "YOUR_SERVICE_ID" ||
      emailConfig.templateId === "YOUR_TEMPLATE_ID"
    ) {
      say(`The contact form is not configured yet. Please email ${CONFIG.toEmail} directly for now.`, "bad");
      return;
    }

    const formData = new FormData(form);
    const templateParams = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    say("Sending your message...");

    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: emailConfig.serviceId,
          template_id: emailConfig.templateId,
          user_id: emailConfig.publicKey,
          template_params: templateParams
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Email sending failed.");
      }

      form.reset();
      for (const fieldName in rules) {
        const errorEl = $(`#e-${fieldName}`);
        const field = form.elements.namedItem(fieldName);
        if (errorEl) errorEl.textContent = "";
        if (field) field.setAttribute("aria-invalid", "false");
      }
      say("Thank you! Your message was sent successfully. I'll get back to you soon.", "ok");
    } catch (error) {
      console.error("EmailJS sending error:", error);
      say(`Sorry, your message could not be sent. Please try again or email ${CONFIG.toEmail} directly.`, "bad");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Message";
    }
  });

  $$("input, textarea", form).forEach((field) => {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") !== "true") return;
      const rule = rules[field.name];
      if (rule && !rule(field.value)) {
        field.setAttribute("aria-invalid", "false");
        const errorEl = $(`#e-${field.name}`);
        if (errorEl) errorEl.textContent = "";
      }
    });
  });
}

/* ============ FOOTER YEAR ============ */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
