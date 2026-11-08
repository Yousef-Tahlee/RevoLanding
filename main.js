/* REVO landing page behaviour. No dependencies.
   Settings come from window.REVO_CONFIG (config.js), demo content from window.REVO_CONTENT (content.js). */
(function () {
  "use strict";

  var cfg = window.REVO_CONFIG || {};
  var content = window.REVO_CONTENT || { demos: {} };
  var isDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  var motionOK = document.documentElement.classList.contains("motion");
  var SECTOR_IDS = ["solar", "clinics", "stores", "institutes"];
  var selectedCategory = null; // set only by a real choice (tab, link hash, final picker)
  var selectedChannel = null;  // final picker only

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function categoryLabel(id) {
    var list = cfg.categories || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return null;
  }
  function flash(node) {
    if (!motionOK || !node) return;
    node.classList.remove("is-updated"); void node.offsetWidth; node.classList.add("is-updated");
  }
  function enter(node, cls) {
    cls = cls || "is-entering";
    if (!motionOK || !node) return;
    node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls);
  }

  /* ---------- Reveal: each block arrives in turn as it scrolls into view ----------
     [data-reveal]          the block fades and rises.
     [data-reveal="words"]  the text arrives word by word; inline marks (the highlighter) are kept.
     data-delay             fixed timing for the first screen (the hero choreography).
     data-step              gap after this block when several arrive together (default 110ms). */
  function splitWords(root) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span");
            w.className = "rw"; w.style.setProperty("--wi", String(i++)); w.textContent = part;
            frag.appendChild(w);
          });
          ch.parentNode.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) { walk(ch); }
      });
    })(root);
  }
  (function reveal() {
    var items = $all("[data-reveal]");
    if (!motionOK || !("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("is-in"); });
      window.__revealReady = true;
      return;
    }
    items.forEach(function (n) { if (n.getAttribute("data-reveal") === "words") { splitWords(n); n.classList.add("is-split"); } });
    var t0 = performance.now();
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      var t = 0;
      batch.forEach(function (n) {
        var fixed = n.getAttribute("data-delay");
        var d;
        if (fixed !== null && performance.now() - t0 < 1200) d = Number(fixed);
        else { d = t; t += Number(n.getAttribute("data-step") || 110); }
        n.style.setProperty("--d", Math.min(d, 2600) + "ms");
        n.classList.add("is-in");
        io.unobserve(n);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
    window.__revealReady = true;
  })();

  /* ---------- Campaign context (kept for this visit only) ---------- */
  var campaign = (function () {
    var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var out = {};
    try {
      var params = new URLSearchParams(location.search);
      keys.forEach(function (k) { var v = params.get(k); if (v) out[k] = v.slice(0, 80); });
      if (Object.keys(out).length) sessionStorage.setItem("revo_utm", JSON.stringify(out));
      else out = JSON.parse(sessionStorage.getItem("revo_utm") || "{}");
    } catch (e) { /* storage blocked: keep whatever the URL gave us */ }
    return out;
  })();
  function referrerOrigin() {
    try { return document.referrer ? new URL(document.referrer).origin : ""; } catch (e) { return ""; }
  }

  /* ---------- Tracking: inactive until IDs and consent are configured ---------- */
  function trackRevoEvent(eventName, payload) {
    var a = cfg.analytics || {};
    var data = Object.assign({ event: eventName }, payload || {});
    if (!(a.enabled && a.consentGranted)) { if (isDev) console.debug("[REVO track: inactive]", data); return; }
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(data);
      if (typeof window.gtag === "function") window.gtag("event", eventName, payload || {});
      if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, payload || {});
      if (typeof window.clarity === "function") window.clarity("event", eventName);
    } catch (e) { if (isDev) console.warn("[REVO track] failed", e); }
  }
  window.trackRevoEvent = trackRevoEvent;

  /* ---------- Optional webhook for non-sensitive conversion events ---------- */
  var WEBHOOK_EVENTS = { whatsapp_click: true, instagram_click: true };
  function sendWebhook(eventName, payload) {
    if (!cfg.webhookUrl || !WEBHOOK_EVENTS[eventName]) return;
    var body = JSON.stringify(Object.assign({
      event: eventName, timestamp: new Date().toISOString(),
      page: location.origin + location.pathname, referrer: referrerOrigin()
    }, campaign, payload || {}));
    try {
      // text/plain keeps this a simple request (no CORS preflight); keepalive lets it finish
      // while WhatsApp opens. A failure never blocks the visitor.
      fetch(cfg.webhookUrl, { method: "POST", body: body, keepalive: true, mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" } })
        .catch(function (e) { if (isDev) console.warn("[REVO webhook] failed", e); });
    } catch (e) { if (isDev) console.warn("[REVO webhook] failed", e); }
  }

  /* ---------- WhatsApp ---------- */
  function waMessage(catId) {
    var m = cfg.messages || {};
    var label = catId ? categoryLabel(catId) : null;
    var text = label && m.withCategory ? m.withCategory.replace("{category}", label) : (m.general || "مرحباً REVO");
    if (selectedChannel && m.channel) text += "\n" + m.channel.replace("{channel}", selectedChannel);
    return text;
  }
  function waUrl(catId) {
    var number = String(cfg.whatsappNumber || "").replace(/\D/g, "");
    var text = encodeURIComponent(waMessage(catId));
    return number ? "https://wa.me/" + number + "?text=" + text : "https://wa.me/?text=" + text;
  }
  function refreshWaLinks() {
    $all("[data-wa]").forEach(function (a) { a.href = waUrl(a.getAttribute("data-wa-cat") || selectedCategory); });
  }

  var dialog = $("#wa-dialog");
  function numberIsSet() { return String(cfg.whatsappNumber || "").replace(/\D/g, "").length >= 8; }
  // Two honest states: WhatsApp is opening with the message ready, or contact by WhatsApp is not set up yet.
  function openDialog(href, ready) {
    var title = $("#wa-dialog-title"), text = $("#wa-dialog-text"), fallback = $("#wa-dialog-fallback"), link = $("#wa-dialog-link");
    if (title) title.textContent = ready ? "نفتح لك واتساب الآن" : "التواصل عبر واتساب غير مفعّل بعد";
    if (text) text.textContent = ready
      ? "رسالتك جاهزة في واتساب. اضغط «إرسال» لتصلنا، ونتابع معك من هناك."
      : "رقم واتساب REVO لم يُضبط في هذه النسخة من الصفحة. يمكنك التواصل معنا الآن عبر إنستغرام.";
    if (fallback) fallback.hidden = !ready;
    if (link && ready) link.href = href;
    if (!dialog || typeof dialog.showModal !== "function") return;
    setTimeout(function () { if (!dialog.open) dialog.showModal(); }, ready ? 300 : 0); // let WhatsApp start opening first
  }
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var wa = t.closest && t.closest("[data-wa]");
    if (wa) {
      var cat = wa.getAttribute("data-wa-cat") || selectedCategory || "";
      var from = wa.getAttribute("data-wa-from") || "";
      if (from === "hero") trackRevoEvent("primary_cta_click", { location: from });
      if (!numberIsSet()) {
        // No destination yet: do not open WhatsApp without a recipient, say so plainly instead.
        ev.preventDefault();
        trackRevoEvent("whatsapp_click_unconfigured", { location: from, category: cat });
        openDialog(null, false);
        return;
      }
      trackRevoEvent("whatsapp_click", { location: from, category: cat });
      sendWebhook("whatsapp_click", { location: from, category: cat });
      openDialog(wa.href, true);
      return;
    }
    var ig = t.closest && t.closest("[data-ig]");
    if (ig) {
      var igFrom = ig.getAttribute("data-ig-from") || "";
      trackRevoEvent("instagram_click", { location: igFrom });
      sendWebhook("instagram_click", { location: igFrom });
    }
  });
  $all("[data-ig]").forEach(function (a) { if (cfg.instagramUrl) a.href = cfg.instagramUrl; });
  $all("[data-close-dialog]").forEach(function (b) { b.addEventListener("click", function () { if (dialog) dialog.close(); }); });
  if (dialog) dialog.addEventListener("click", function (ev) { if (ev.target === dialog) dialog.close(); });

  /* ---------- Share ---------- */
  function pageUrl() { return cfg.siteUrl || (location.origin + location.pathname); }
  $all("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var status = btn.closest("dialog, section").querySelector(".share-status");
      var url = pageUrl();
      var say = function (t) { if (status) status.textContent = t; };
      trackRevoEvent("share_click", {});
      if (navigator.share) {
        navigator.share({ title: document.title, text: "صفحة REVO عن تنظيم استقبال طلبات العملاء", url: url })
          .catch(function () { /* visitor closed the share sheet */ });
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { say("نُسخ رابط الصفحة. يمكنك لصقه في أي محادثة."); },
          function () { location.href = "https://wa.me/?text=" + encodeURIComponent(url); });
        return;
      }
      location.href = "https://wa.me/?text=" + encodeURIComponent(url);
    });
  });

  /* ---------- 1 · Hero scene replay ---------- */
  var scene = $("#hero-scene"), replay = $("#hero-replay");
  if (scene && replay) {
    replay.addEventListener("click", function () {
      scene.classList.remove("is-playing"); void scene.offsetWidth; scene.classList.add("is-playing");
    });
  }

  /* ---------- 2 · Compare ---------- */
  var baAfter = $(".ba-after");
  $all('input[name="ba"]').forEach(function (r) {
    r.addEventListener("change", function () {
      trackRevoEvent("before_after_switch", { state: r.value });
      if (r.value === "after" && baAfter) enter(baAfter, "is-replaying");
    });
  });

  /* ---------- 3 · Story: the stage follows the step the reader is on ---------- */
  var device = $("#story-device"), dots = $all("#story-dots i"), steps = $all(".story-step");
  var storyDone = false;
  function setStep(n) {
    if (!device) return;
    device.setAttribute("data-step", String(n));
    dots.forEach(function (d, i) { d.classList.toggle("is-on", i === n - 1); });
    steps.forEach(function (s) { s.classList.toggle("is-active", Number(s.getAttribute("data-step-n")) === n); });
    if (n === 4 && !storyDone) { storyDone = true; trackRevoEvent("story_completed", {}); }
  }
  if (device && steps.length && "IntersectionObserver" in window) {
    setStep(1);
    var storyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setStep(Number(e.target.getAttribute("data-step-n"))); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { storyObserver.observe(s); });
  }

  /* ---------- 4 · Choose a business and try it ---------- */
  var tablist = $(".sector-tabs");
  var tabs = $all('[role="tab"]', tablist || document);
  var panel = $("#try-panel");
  var sectors = SECTOR_IDS.map(function (id) { return document.getElementById(id); });
  var form = $("#demo-form"), rowsEl = $("#demo-rows"), titleEl = $("#demo-title");
  var stateEl = $("#demo-state"), statusEl = $("#demo-status"), demoCta = $("#demo-cta");
  var peekCount = $("#peek-count");
  var demo = { cat: null, values: {}, started: {}, completed: {} };

  function renderDemo(cat) {
    var d = content.demos[cat];
    if (!form || !d) return;
    demo.cat = cat; demo.values = {};
    form.textContent = ""; rowsEl.textContent = "";
    titleEl.textContent = d.title;

    d.fields.forEach(function (f) {
      var block;
      if (f.type === "text") {
        block = el("div", { class: "q" });
        var lab = el("label", { class: "field-label", for: "d-" + f.id }, f.label + " ");
        lab.appendChild(el("span", { class: "optional" }, "(اختياري)"));
        block.appendChild(lab);
        block.appendChild(el("input", { class: "field", type: "text", id: "d-" + f.id, name: f.id,
          maxlength: "40", autocomplete: "off", placeholder: f.placeholder || "" }));
      } else {
        block = el("fieldset", { class: "q" });
        var lg = el("legend", null, f.label + (f.need ? "" : " "));
        if (!f.need) lg.appendChild(el("span", { class: "optional" }, "(اختياري)"));
        block.appendChild(lg);
        var opts = el("div", { class: "options" });
        f.options.forEach(function (o, i) {
          var id = "d-" + f.id + "-" + i;
          opts.appendChild(el("input", { type: f.type === "many" ? "checkbox" : "radio", name: f.id, id: id, value: o }));
          opts.appendChild(el("label", { for: id }, o));
        });
        block.appendChild(opts);
      }
      form.appendChild(block);

      var row = el("div");
      row.appendChild(el("dt", null, f.row));
      row.appendChild(el("dd", { "data-key": f.id }));
      rowsEl.appendChild(row);
    });
    form.appendChild(el("button", { type: "reset", class: "btn btn-quiet" }, "ابدأ التجربة من جديد"));

    if (demoCta) { demoCta.textContent = d.cta; demoCta.setAttribute("data-wa-cat", cat); }
    refreshWaLinks();
    updateDemo(true);
    enter(form); enter($("#demo-slip"));
  }

  function readField(f) {
    if (f.type === "text") { var t = form.elements[f.id]; return t ? t.value.trim() : ""; }
    return $all('input[name="' + f.id + '"]:checked', form).map(function (c) { return c.value; }).join("، ");
  }
  function updateDemo(silent) {
    var d = content.demos[demo.cat]; if (!d) return;
    var filled = 0, ready = true;
    d.fields.forEach(function (f) {
      var v = readField(f);
      var dd = $('dd[data-key="' + f.id + '"]', rowsEl);
      if (v) filled++; else if (f.need) ready = false;
      if (dd) {
        dd.textContent = v || (f.type === "text" ? "لم تُذكر" : "لم يُحدَّد بعد");
        dd.setAttribute("data-empty", v ? "false" : "true");
        if (!silent && v !== (demo.values[f.id] || "")) flash(dd);
      }
      demo.values[f.id] = v;
    });
    stateEl.textContent = ready ? "جاهز للمتابعة" : "ناقص";
    stateEl.setAttribute("data-done", ready ? "true" : "false");
    var need = d.fields.filter(function (f) { return f.need; }).map(function (f) { return f.row; });
    var msg = ready ? d.done : "اختر " + need.join(" و") + " ليكتمل الطلب.";
    if (statusEl.textContent !== msg) statusEl.textContent = msg;
    if (peekCount) peekCount.textContent = filled + " من " + d.fields.length;
    if (!silent && ready && !demo.completed[demo.cat]) { demo.completed[demo.cat] = true; trackRevoEvent("demo_completed", { demo: demo.cat }); }
  }
  if (form) {
    var onDemoInput = function () {
      if (!demo.started[demo.cat]) { demo.started[demo.cat] = true; trackRevoEvent("demo_started", { demo: demo.cat }); }
      updateDemo(false);
    };
    form.addEventListener("input", onDemoInput);
    form.addEventListener("change", onDemoInput);
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });
    form.addEventListener("reset", function () { setTimeout(function () { updateDemo(false); }, 0); });
  }

  function selectSector(id, opts) {
    opts = opts || {};
    if (SECTOR_IDS.indexOf(id) === -1) return;
    var changed = demo.cat !== id;
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-cat") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    sectors.forEach(function (s) { s.hidden = s.id !== id; });
    if (panel) panel.setAttribute("aria-labelledby", "tab-" + id);
    if (changed) { renderDemo(id); if (!opts.initial) enter(document.getElementById(id)); }
    if (!opts.initial) setCategory(id);
  }

  if (tablist && panel && sectors.every(Boolean)) {
    tablist.hidden = false;
    panel.setAttribute("role", "tabpanel");
    panel.tabIndex = 0;
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        var id = t.getAttribute("data-cat");
        selectSector(id);
        try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
      });
      t.addEventListener("keydown", function (ev) {
        var dir = { ArrowLeft: 1, ArrowRight: -1, Home: "first", End: "last" }[ev.key]; // RTL: left moves forward
        if (dir === undefined) return;
        ev.preventDefault();
        var next = dir === "first" ? 0 : dir === "last" ? tabs.length - 1 : (i + dir + tabs.length) % tabs.length;
        tabs[next].click(); tabs[next].focus();
      });
    });
    selectSector("solar", { initial: true });
  }

  function applyHash(scroll) {
    var id = (location.hash || "").replace("#", "");
    if (SECTOR_IDS.indexOf(id) === -1) return;
    selectSector(id);
    if (scroll) {
      var target = $("#try");
      if (target) target.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "start" });
    }
  }
  window.addEventListener("hashchange", function () { applyHash(true); });

  /* ---------- 7 · Final: the visitor's own request to REVO ---------- */
  var finalOptions = $("#final-options"), finalCat = $("#final-cat"), finalChannel = $("#final-channel");
  if (finalOptions && cfg.categories) {
    cfg.categories.forEach(function (c) {
      var input = el("input", { type: "radio", name: "final-cat", id: "fc-" + c.id, value: c.id });
      input.addEventListener("change", function () { setCategory(c.id); });
      finalOptions.appendChild(input);
      finalOptions.appendChild(el("label", { for: "fc-" + c.id }, c.label));
    });
  }
  $all('input[name="channel"]').forEach(function (r) {
    r.addEventListener("change", function () {
      selectedChannel = r.value;
      if (finalChannel) { finalChannel.textContent = r.value; finalChannel.setAttribute("data-empty", "false"); flash(finalChannel); }
      refreshWaLinks();
    });
  });

  function setCategory(id) {
    selectedCategory = id || null;
    var radio = document.getElementById("fc-" + id);
    if (radio && !radio.checked) radio.checked = true;
    if (finalCat) {
      var label = categoryLabel(id);
      finalCat.textContent = label || "لم يُحدَّد";
      finalCat.setAttribute("data-empty", label ? "false" : "true");
      flash(finalCat);
    }
    refreshWaLinks();
    trackRevoEvent("category_select", { category: id });
  }

  /* ---------- 5 · Process: each step lights up once it is reached ---------- */
  var processSteps = $all(".steps li");
  if (processSteps.length && "IntersectionObserver" in window) {
    var processObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-lit"); processObserver.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -30% 0px" });
    processSteps.forEach(function (li) { processObserver.observe(li); });
  } else {
    processSteps.forEach(function (li) { li.classList.add("is-lit"); });
  }

  /* ---------- 6 · FAQ ---------- */
  $all(".faq details").forEach(function (d, i) {
    d.addEventListener("toggle", function () { if (d.open) trackRevoEvent("faq_open", { index: i + 1 }); });
  });

  /* ---------- Bottom bars (phones only, via CSS) ----------
     Sticky CTA: after the hero button scrolls away; steps aside while another WhatsApp button is on
     screen, while the demo bar is up, and at the final section.
     Demo bar: while choosing in the demo, shows how full the request is and jumps to it. */
  var sticky = $("#sticky-cta"), peek = $("#demo-peek");
  var heroCta = $("#hero-cta"), finalSection = $("#start"), demoOut = $(".demo-output");
  if (sticky && heroCta && finalSection && "IntersectionObserver" in window) {
    var st = { pastHero: false, atFinal: false, inForm: false, outSeen: false };
    var onScreenCtas = new Set();
    var stickyLink = $("a", sticky);
    var setBar = function (node, on, focusable) {
      node.classList.toggle("is-visible", on);
      node.setAttribute("aria-hidden", on ? "false" : "true");
      if (focusable) focusable.tabIndex = on ? 0 : -1;
    };
    var update = function () {
      var peekOn = !!(peek && st.inForm && !st.outSeen);
      if (peek) setBar(peek, peekOn, peek);
      setBar(sticky, st.pastHero && !st.atFinal && onScreenCtas.size === 0 && !peekOn, stickyLink);
    };
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      st.pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(heroCta);
    new IntersectionObserver(function (entries) { st.atFinal = entries[0].isIntersecting; update(); },
      { rootMargin: "0px 0px -20% 0px" }).observe(finalSection);
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) onScreenCtas.add(e.target); else onScreenCtas.delete(e.target); });
      update();
    });
    if (demoCta) ctaObserver.observe(demoCta);
    if (form && demoOut) {
      new IntersectionObserver(function (entries) { st.inForm = entries[0].isIntersecting; update(); },
        { rootMargin: "-30% 0px -30% 0px" }).observe(form);
      new IntersectionObserver(function (entries) { st.outSeen = entries[0].isIntersecting; update(); }).observe(demoOut);
    }
  }

  /* ---------- Start ---------- */
  refreshWaLinks();
  applyHash(false);
  // A shared link like #clinics: the browser jumps to the description itself after load,
  // which hides the business tabs above it. Land on the section start instead.
  if (SECTOR_IDS.indexOf((location.hash || "").replace("#", "")) !== -1) {
    window.addEventListener("load", function () {
      setTimeout(function () { var t = $("#try"); if (t) t.scrollIntoView({ block: "start" }); }, 60);
    });
  }
  trackRevoEvent("page_view", {});

  if (isDev && !/[?&]nobanner\b/.test(location.search) && !String(cfg.whatsappNumber || "").replace(/\D/g, "")) {
    console.warn("[REVO] whatsappNumber is empty in config.js. WhatsApp buttons open WhatsApp without a recipient.");
    var b = el("div", { class: "dev-banner" }, "للمطور فقط: رقم واتساب غير مضبوط في config.js. يظهر هذا التنبيه على الجهاز المحلي فقط.");
    document.body.insertBefore(b, document.body.firstChild);
  }
})();
