/* REVO personalised client demo (/for/<slug>/). No dependencies.
   The page carries its own data in <script id="client-data" type="application/json">,
   written by tools/make-client-page.mjs. REVO's own number comes from config.js. */
(function () {
  "use strict";

  var cfg = window.REVO_CONFIG || {};
  var dataEl = document.getElementById("client-data");
  if (!dataEl) return;
  var client;
  try { client = JSON.parse(dataEl.textContent); } catch (e) { return; }

  // Questions per business type. The first question always lists the client's own 3 items.
  var TEMPLATES = {
    solar: {
      title: "استفسار جديد",
      itemsLabel: "ما الذي تحتاجه؟", itemsRow: "الطلب",
      fields: [
        { id: "building", label: "نوع المبنى", row: "نوع المبنى", type: "one", need: true, options: ["منزل", "محل تجاري", "مزرعة أو بئر"] },
        { id: "appliances", label: "ما الأجهزة التي تريد تشغيلها؟", row: "الأجهزة", type: "many", need: true,
          options: ["ثلاجة", "إنارة", "مراوح", "تلفاز", "غسالة", "مضخة مياه", "مكيّف"] },
        { id: "hours", label: "كم ساعة تحتاج الكهرباء يومياً؟", row: "ساعات التشغيل", type: "one", need: true,
          options: ["حتى 6 ساعات", "من 6 إلى 12 ساعة", "أكثر من 12 ساعة"] },
        { id: "area", label: "المنطقة", row: "المنطقة", type: "text", placeholder: "اسم الحي أو البلدة" }
      ],
      note: "أي تقدير للحمل يبقى أولياً، والمعاينة الهندسية تحدد المنظومة المناسبة."
    },
    clinics: {
      title: "طلب موعد جديد",
      itemsLabel: "الخدمة المطلوبة", itemsRow: "الخدمة",
      fields: [
        { id: "visit", label: "نوع الزيارة", row: "نوع الزيارة", type: "one", need: true, options: ["زيارة أولى", "متابعة"] },
        { id: "day", label: "اليوم المناسب", row: "اليوم", type: "one", options: ["أقرب موعد", "خلال هذا الأسبوع", "الأسبوع القادم"] },
        { id: "period", label: "الفترة المفضلة", row: "الفترة", type: "one", need: true, options: ["صباحاً", "بعد الظهر", "مساءً"] }
      ],
      note: "لا يطلب النموذج تشخيصاً أو صوراً أو تفاصيل صحية، فقط ما يحتاجه الاستقبال لتنظيم الموعد."
    },
    stores: {
      title: "طلب شراء جديد",
      itemsLabel: "المنتج", itemsRow: "المنتج",
      fields: [
        { id: "qty", label: "الكمية", row: "الكمية", type: "one", need: true, options: ["1", "2", "3"] },
        { id: "delivery", label: "طريقة الاستلام", row: "الاستلام", type: "one", need: true, options: ["توصيل إلى المنزل", "استلام من المتجر"] },
        { id: "note", label: "ملاحظة", row: "ملاحظة", type: "text", placeholder: "مثال: أفضّل التوصيل مساءً" }
      ]
    },
    institutes: {
      title: "طلب تسجيل جديد",
      itemsLabel: "الدورة", itemsRow: "الدورة",
      fields: [
        { id: "level", label: "المستوى الحالي", row: "المستوى", type: "one", need: true, options: ["مبتدئ", "متوسط", "أحتاج اختبار مستوى"] },
        { id: "schedule", label: "الفترة المناسبة", row: "الفترة", type: "one", need: true, options: ["صباحية", "مسائية", "عن بُعد"] }
      ]
    }
  };

  var tpl = TEMPLATES[client.sector];
  if (!tpl) return;
  var fields = [{ id: "item", label: tpl.itemsLabel, row: tpl.itemsRow, type: "one", need: true, options: client.items.slice(0, 3) }]
    .concat(tpl.fields);

  function $(s) { return document.querySelector(s); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  var motionOK = document.documentElement.classList.contains("motion");
  function flash(n) { if (!motionOK) return; n.classList.remove("is-updated"); void n.offsetWidth; n.classList.add("is-updated"); }

  var form = $("#demo-form"), rows = $("#demo-rows"), state = $("#demo-state"), status = $("#demo-status");
  var sendBtn = $("#send-test"), note = $("#demo-note");
  $("#demo-title").textContent = tpl.title;
  if (tpl.note && note) note.textContent = tpl.note; else if (note) note.hidden = true;

  // Build the form and the request slip from the field list.
  fields.forEach(function (f) {
    var block;
    if (f.type === "text") {
      block = el("div", { class: "q" });
      var lab = el("label", { class: "field-label", for: "d-" + f.id }, f.label + " ");
      lab.appendChild(el("span", { class: "optional" }, "(اختياري)"));
      block.appendChild(lab);
      block.appendChild(el("input", { class: "field", type: "text", id: "d-" + f.id, name: f.id, maxlength: "40", autocomplete: "off", placeholder: f.placeholder || "" }));
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
    rows.appendChild(row);
  });

  var last = {};
  function read(f) {
    if (f.type === "text") { var t = form.elements[f.id]; return t ? t.value.trim() : ""; }
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + f.id + '"]:checked'), function (c) { return c.value; }).join("، ");
  }
  function update(silent) {
    var ready = true, lines = [];
    fields.forEach(function (f) {
      var v = read(f), dd = rows.querySelector('dd[data-key="' + f.id + '"]');
      if (!v && f.need) ready = false;
      dd.textContent = v || (f.type === "text" ? "لم تُذكر" : "لم يُحدَّد بعد");
      dd.setAttribute("data-empty", v ? "false" : "true");
      if (!silent && v !== (last[f.id] || "")) flash(dd);
      last[f.id] = v;
      if (v) lines.push(f.row + ": " + v);
    });
    state.textContent = ready ? "جاهز للمتابعة" : "ناقص";
    state.setAttribute("data-done", ready ? "true" : "false");
    var need = fields.filter(function (f) { return f.need; }).map(function (f) { return f.row; });
    status.textContent = ready
      ? "اكتمل الطلب. جرّب إرساله إلى واتساب " + client.name + " لترى كيف يصلكم."
      : "اختر " + need.join(" و") + " ليكتمل الطلب.";
    sendBtn.setAttribute("aria-disabled", ready ? "false" : "true");
    var msg = "مرحباً " + client.name + "، أرسل لكم هذا الطلب:\n\n" + lines.join("\n") + "\n\n(أُرسل من نموذج الطلب)";
    sendBtn.href = "https://wa.me/" + client.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  form.addEventListener("change", function () { update(false); });
  form.addEventListener("input", function () { update(false); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  sendBtn.addEventListener("click", function (e) {
    if (sendBtn.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      status.textContent = "أكمل الاختيارات أولاً، ثم جرّب الإرسال.";
      flash(status);
    }
  });
  update(true);

  // Claim bar and the closing button: REVO's own WhatsApp, naming the company.
  var revo = String(cfg.whatsappNumber || "").replace(/\D/g, "");
  var claimMsg = "مرحباً REVO، جرّبت النموذج الخاص بـ " + client.name + " وأريد معرفة تفاصيل تفعيله لدينا.";
  Array.prototype.forEach.call(document.querySelectorAll("[data-claim]"), function (a) {
    a.href = revo ? "https://wa.me/" + revo + "?text=" + encodeURIComponent(claimMsg) : (cfg.instagramUrl || "#");
  });

  // Phase 3 radar: tells REVO's n8n that this page was opened or tried. It sends only the page
  // id, the company name already shown on the page, and the event. No device, no visitor data.
  // Off until config.js has demoTrackingUrl. Team browsers opt out once with ?revo=1 (every link
  // on REVO's n8n board carries it); ?revo=0 undoes it. The flag is then removed from the address
  // bar, so a link copied from there and sent to a client is always the clean one.
  var slugMatch = /\/for\/([a-z0-9-]+)\/?/.exec(location.pathname);
  var slug = slugMatch ? slugMatch[1] : "";
  function teamBrowser() {
    try {
      var m = /[?&]revo=([01])\b/.exec(location.search);
      if (m) {
        if (m[1] === "1") localStorage.setItem("revo_team", "1"); else localStorage.removeItem("revo_team");
        if (history.replaceState) history.replaceState(null, "", location.pathname + location.hash);
      }
      return localStorage.getItem("revo_team") === "1";
    } catch (e) { return false; }
  }
  var isTeam = teamBrowser();
  if (isTeam) {
    var pill = document.createElement("p");
    pill.className = "team-pill";
    pill.setAttribute("role", "status");
    pill.textContent = "وضع الفريق: هالجهاز ما بينحسب";
    document.body.appendChild(pill);
  }
  var trackingOn = !!(cfg.demoTrackingUrl && slug && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !isTeam);
  var sent = {};
  function track(ev) {
    if (!trackingOn || sent[ev]) return;
    sent[ev] = true;
    var u = cfg.demoTrackingUrl + (cfg.demoTrackingUrl.indexOf("?") === -1 ? "?" : "&") +
      "slug=" + encodeURIComponent(slug) + "&event=" + ev + "&name=" + encodeURIComponent(client.name);
    try { fetch(u, { method: "GET", mode: "no-cors", keepalive: true, credentials: "omit" }).catch(function () {}); } catch (e) { /* never block the page */ }
  }
  (function () {
    var key = "revo_open_" + slug, seen = false;
    try { seen = sessionStorage.getItem(key) === "1"; sessionStorage.setItem(key, "1"); } catch (e) {}
    if (!seen) track("open");
  })();
  form.addEventListener("change", function () { track("tried"); });
  sendBtn.addEventListener("click", function () { if (sendBtn.getAttribute("aria-disabled") === "false") track("send_test"); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-claim]"), function (a) {
    a.addEventListener("click", function () { track("claim"); });
  });

  // Reveal on scroll, same behaviour as the main page.
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!motionOK || !("IntersectionObserver" in window)) { items.forEach(function (n) { n.classList.add("is-in"); }); }
  else {
    var io = new IntersectionObserver(function (entries) {
      var t = 0;
      entries.filter(function (e) { return e.isIntersecting; }).forEach(function (e) {
        e.target.style.setProperty("--d", t + "ms"); t += 110;
        e.target.classList.add("is-in"); io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  }
  window.__revealReady = true;
})();
