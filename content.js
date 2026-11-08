/*
  REVO landing page: demo content per business type.
  Fictional, illustrative options only. Nothing here is sent anywhere.
  type: "one" = pick one, "many" = pick any, "text" = short optional text.
  "need": true marks what the request needs before it is "ready".
*/
window.REVO_CONTENT = {
  demos: {
    solar: {
      title: "استفسار جديد: منظومة طاقة شمسية",
      cta: "اطلب معاينة أولية لشركتك عبر واتساب",
      done: "اكتمل الاستفسار. هكذا يصل إلى المهندس قبل أي محادثة.",
      fields: [
        { id: "building", label: "نوع المبنى", row: "نوع المبنى", type: "one", need: true,
          options: ["منزل", "محل تجاري", "مزرعة أو بئر"] },
        { id: "appliances", label: "ما الأجهزة التي تريد تشغيلها؟", row: "الأجهزة", type: "many", need: true,
          options: ["ثلاجة", "إنارة", "مراوح", "تلفاز", "غسالة", "مضخة مياه", "مكيّف"] },
        { id: "hours", label: "كم ساعة تحتاج الكهرباء يومياً؟", row: "ساعات التشغيل", type: "one", need: true,
          options: ["حتى 6 ساعات", "من 6 إلى 12 ساعة", "أكثر من 12 ساعة"] },
        { id: "area", label: "المنطقة", row: "المنطقة", type: "text", placeholder: "اسم الحي أو البلدة" },
        { id: "contact", label: "الوقت المناسب للتواصل", row: "وقت التواصل", type: "one",
          options: ["صباحاً", "مساءً"] }
      ]
    },
    clinics: {
      title: "طلب موعد جديد",
      cta: "اطلب معاينة أولية لمركزك عبر واتساب",
      done: "اكتمل الطلب. هكذا يصل إلى الاستقبال من دون أسئلة إضافية.",
      fields: [
        { id: "service", label: "الخدمة المطلوبة", row: "الخدمة", type: "one", need: true,
          options: ["معاينة عامة", "علاج فيزيائي", "علاج أسنان"] },
        { id: "visit", label: "نوع الزيارة", row: "نوع الزيارة", type: "one", need: true,
          options: ["زيارة أولى", "متابعة"] },
        { id: "day", label: "اليوم المناسب", row: "اليوم", type: "one",
          options: ["أقرب موعد", "خلال هذا الأسبوع", "الأسبوع القادم"] },
        { id: "period", label: "الفترة المفضلة", row: "الفترة", type: "one", need: true,
          options: ["صباحاً", "بعد الظهر", "مساءً"] }
      ]
    },
    stores: {
      title: "طلب شراء جديد",
      cta: "اطلب معاينة أولية لمتجرك عبر واتساب",
      done: "اكتمل الطلب. هكذا يصل إلى المتجر جاهزاً للتجهيز.",
      fields: [
        { id: "product", label: "المنتج", row: "المنتج", type: "one", need: true,
          options: ["قميص قطني", "حقيبة جلدية", "طقم فناجين"] },
        { id: "color", label: "اللون", row: "اللون", type: "one",
          options: ["أزرق", "أسود", "بيج"] },
        { id: "qty", label: "الكمية", row: "الكمية", type: "one", need: true,
          options: ["1", "2", "3"] },
        { id: "delivery", label: "طريقة الاستلام", row: "الاستلام", type: "one", need: true,
          options: ["توصيل إلى المنزل", "استلام من المتجر"] },
        { id: "note", label: "ملاحظة للمتجر", row: "ملاحظة", type: "text", placeholder: "مثال: أفضّل التوصيل مساءً" }
      ]
    },
    institutes: {
      title: "طلب تسجيل جديد",
      cta: "اطلب معاينة أولية لمعهدك عبر واتساب",
      done: "اكتمل الطلب. هكذا يصل إلى قسم التسجيل جاهزاً للمتابعة.",
      fields: [
        { id: "course", label: "الدورة", row: "الدورة", type: "one", need: true,
          options: ["لغة إنجليزية", "برمجة للمبتدئين", "محاسبة"] },
        { id: "level", label: "مستواك الحالي", row: "المستوى", type: "one", need: true,
          options: ["مبتدئ", "متوسط", "أحتاج اختبار مستوى"] },
        { id: "schedule", label: "الفترة المناسبة", row: "الفترة", type: "one", need: true,
          options: ["صباحية", "مسائية", "عن بُعد"] },
        { id: "reach", label: "طريقة التواصل المفضلة", row: "التواصل", type: "one",
          options: ["اتصال", "واتساب"] }
      ]
    }
  }
};
