/*
  REVO landing page: the one settings file.
  Everything a non-developer may need to change lives here. Nothing else in the
  code holds a phone number, link, ID or category name.

  This file loads in <head> before the page paints, so keep it small.
*/
window.REVO_CONFIG = {
  // WhatsApp Business number in international format, digits only, no "+" or spaces.
  // Example shape (not a real number): "9639XXXXXXXX". Leave "" until REVO supplies it.
  // While empty, WhatsApp buttons open WhatsApp with the message ready and let the
  // visitor pick the chat, and a reminder shows on localhost.
  whatsappNumber: "963956314901",

  instagramUrl: "https://www.instagram.com/rev0tech/",

  // Public address of this page once it has a domain, e.g. "https://example.com/".
  // Used for sharing. Also update the canonical / og:url / og:image lines in index.html.
  siteUrl: "https://start.revotech.systems/",

  // Colour set: "prompt" = Deep Black, White, Electric Blue (the master prompt).
  //             "brand"  = Oxford, Icy, Persimmon, Pale Sky (the REVO brand kit).
  palette: "brand",

  // Optional endpoint (n8n, Google Sheets script, etc.) for non-sensitive conversion
  // events. Leave "" to keep the integration off. Never put a secret key here:
  // this file is public.
  webhookUrl: "",

  // Analytics stays off until real IDs exist AND consent is handled.
  // No tracking script is loaded by this page. Fill these in only together with
  // the matching snippet and a consent step where the law requires one.
  analytics: {
    enabled: false,
    consentGranted: false,
    ga4MeasurementId: "",
    metaPixelId: "",
    clarityProjectId: ""
  },

  // Business categories used by the sector tabs, the final selector and the
  // WhatsApp message. "id" matches the link hash (#solar, #clinics, ...).
  categories: [
    { id: "solar", label: "طاقة شمسية وأنظمة هندسية" },
    { id: "clinics", label: "مركز طبي أو علاجي" },
    { id: "stores", label: "متجر" },
    { id: "institutes", label: "معهد تدريبي" },
    { id: "other", label: "نشاط آخر" }
  ],

  messages: {
    withCategory:
      "مرحباً REVO، أود معرفة كيف يمكن تنظيم استقبال الطلبات في نشاطي التجاري. نوع النشاط: {category}.",
    general:
      "مرحباً REVO، أود طلب معاينة أولية لطريقة استقبال الطلبات في نشاطي التجاري.",
    // Added on a new line when the visitor picks a channel in the final section.
    channel: "تصلنا الطلبات حالياً عبر: {channel}."
  }
};

(function applyPalette() {
  var p = window.REVO_CONFIG.palette === "brand" ? "brand" : "prompt";
  // Local preview only: http://127.0.0.1:4321/?palette=brand shows the other colour set.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    var m = /[?&]palette=(brand|prompt)\b/.exec(location.search);
    if (m) p = m[1];
  }
  document.documentElement.setAttribute("data-palette", p);
})();
