/* =====================================================================
   glass-tuner.js — 리퀴드 글래스 테마 디자이너 (개발 도구) v2
   liquid-glass.css의 --lg-* 컨트롤(모서리·농도·블러·틴트·굴절·반사·그림자·
   테두리·깊이)과 배경 시스템(스타일·색·darkness·saturation·noise·애니메이션)을
   실시간 조정하고, 추천 프리셋 적용 + 확정값 CSS 복사를 지원한다.
   사용: <script src="glass-tuner.js"></script> 한 줄. 우하단 🎛 또는 Ctrl+Shift+G.
   localStorage("glass.tuner.v2")에 자동 저장. 운영 배포 시 이 스크립트는 제거.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  var LS = "glass.tuner.v2";

  /* ---------- 컨트롤 정의 ---------- */
  var GLASS = [
    { v: "--lg-radius",        label: "Corner Radius", min: 0, max: 40,  step: 1,   def: 14,        unit: "px", desc: "모서리 둥글기 — 0=각짐, 40=알약처럼 둥긂" },
    { v: "--lg-opacity",       label: "Opacity",       min: 0, max: 100, step: 1,   def: 55,        unit: "",   desc: "유리 농도 — 낮으면 투명(뒤가 비침), 높으면 불투명 프로스트" },
    { v: "--lg-blur",          label: "Blur",          min: 0, max: 40,  step: 1,   def: 28,        unit: "px", desc: "뒤 배경 흐림(프로스트) — 컬러 배경 위에서만 체감됨" },
    { v: "--lg-tint",          label: "Tint Color",    type: "color",               def: "#9fc0ff",             desc: "유리 표면에 감도는 색조" },
    { v: "--lg-tint-strength", label: "Tint Strength", min: 0, max: 100, step: 1,   def: 6,         unit: "",   desc: "틴트 색을 얼마나 진하게 섞나 — Tint Color와 짝" },
    { v: "--lg-refraction",    label: "Refraction",    min: 0, max: 100, step: 1,   def: 50,        unit: "",   desc: "굴절 — 유리 너머 색의 채도·밝기를 부스트(쨍하게)" },
    { v: "--lg-reflection",    label: "Reflection",    min: 0, max: 100, step: 1,   def: 50,        unit: "",   desc: "반사 — 유리 표면의 흰 광택·하이라이트·윗면 림" },
    { v: "--lg-shadow",        label: "Shadow",        min: 0, max: 100, step: 1,   def: 50,        unit: "",   desc: "드롭 그림자 세기 — 배경에서 떠 보이는 정도" },
    { v: "--lg-border",        label: "Border",        min: 0, max: 10,  step: 0.5, def: 1,         unit: "px", desc: "유리 가장자리 테두리 선 두께" },
    { v: "--lg-depth",         label: "Depth Layers",  min: 1, max: 5,   step: 1,   def: 2,         unit: "",   desc: "유리 두께감·입체 — 얇은 막 ~ 두꺼운 슬래브" }
  ];
  var BG = [
    { v: "--lg-bg-primary",    label: "Primary",    type: "color",             def: "#0F172A",          desc: "배경 바탕(주) 색 — 라이트 모드는 흰 베일로 밝게 희석됨" },
    { v: "--lg-bg-secondary",  label: "Secondary",  type: "color",             def: "#0EA5A4",          desc: "배경 보조 색 — 그라데이션·오로라/메시 블롭에 사용" },
    { v: "--lg-bg-accent",     label: "Accent",     type: "color",             def: "#22D3EE",          desc: "배경 강조 색 — 프리셋에선 글래스 틴트도 여기서 파생" },
    { v: "--lg-bg-darkness",   label: "Darkness",   min: 0, max: 100, step: 1, def: 90,      unit: "", desc: "배경 어둡기(검정 오버레이) — 라이트 모드는 흰 베일로 대체" },
    { v: "--lg-bg-saturation", label: "Saturation", min: 0, max: 100, step: 1, def: 80,      unit: "", desc: "배경 색의 채도" },
    { v: "--lg-bg-noise",      label: "Noise",      min: 0, max: 8,   step: 1, def: 4,       unit: "", desc: "배경 그레인(필름 질감) 양 — 프리미엄 텍스처" }
  ];
  var STYLES = [["gradient", "Gradient"], ["aurora", "Aurora"], ["mesh", "Mesh"], ["solid", "Solid"]];
  var ALL = GLASS.concat(BG);
  var BYVAR = {}; ALL.forEach(function (k) { BYVAR[k.v] = k; });

  var PRESETS = [
    { name: "Apple Liquid Glass", backgroundType: "gradient", primary: "#111827", secondary: "#1F2937", accent: "#F8FAFC", darkness: 92, saturation: 10, noise: 2 },
    { name: "Vision Pro Purple", backgroundType: "aurora",   primary: "#4C1D95", secondary: "#7C3AED", accent: "#A78BFA", darkness: 85, saturation: 70, noise: 3 },
    { name: "Aurora",            backgroundType: "aurora",   primary: "#0F172A", secondary: "#0EA5A4", accent: "#22D3EE", darkness: 90, saturation: 80, noise: 4 },
    { name: "Ocean",             backgroundType: "gradient", primary: "#082F49", secondary: "#0369A1", accent: "#38BDF8", darkness: 88, saturation: 65, noise: 3 },
    { name: "Cyberpunk",         backgroundType: "mesh",     primary: "#18181B", secondary: "#EC4899", accent: "#8B5CF6", darkness: 92, saturation: 95, noise: 5 },
    { name: "Sunset",            backgroundType: "mesh",     primary: "#7F1D1D", secondary: "#EA580C", accent: "#FB7185", darkness: 70, saturation: 85, noise: 2 },
    { name: "Emerald",           backgroundType: "gradient", primary: "#064E3B", secondary: "#10B981", accent: "#6EE7B7", darkness: 80, saturation: 70, noise: 3 },
    { name: "Midnight",          backgroundType: "solid",    primary: "#020617", secondary: "#1E293B", accent: "#64748B", darkness: 98, saturation: 20, noise: 4 },
    { name: "Royal Gold",        backgroundType: "gradient", primary: "#111827", secondary: "#D4AF37", accent: "#FCD34D", darkness: 90, saturation: 60, noise: 2 },
    { name: "AI Neon",           backgroundType: "aurora",   primary: "#0B1120", secondary: "#6366F1", accent: "#06B6D4", darkness: 92, saturation: 85, noise: 4 },
    { name: "Arctic Glass",      backgroundType: "gradient", primary: "#E2E8F0", secondary: "#CBD5E1", accent: "#7DD3FC", darkness: 20, saturation: 30, noise: 1 },
    { name: "Galaxy",            backgroundType: "aurora",   primary: "#0F172A", secondary: "#4338CA", accent: "#EC4899", darkness: 95, saturation: 90, noise: 5 },
    { name: "Forest Night",      backgroundType: "mesh",     primary: "#052E16", secondary: "#166534", accent: "#4ADE80", darkness: 88, saturation: 65, noise: 3 }
  ];

  /* ---------- 값 헬퍼 ---------- */
  function cssValue(k, val) { return k.unit === "px" ? (val + "px") : String(val); }   // color/unitless는 그대로
  function disp(k, val) { return k.unit === "px" ? (val + "px") : (k.type === "color" ? String(val) : String(val)); }

  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (_) { return {}; } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (_) {} }

  var st = load();
  if (!st.vars) st.vars = {};
  if (!st.style) st.style = "aurora";
  if (st.anim == null) st.anim = true;

  /* ---------- 배경 레이어 확보 ---------- */
  var bgEl = document.getElementById("lgBg");
  if (!bgEl) {
    bgEl = document.createElement("div");
    bgEl.id = "lgBg";
    document.body.insertBefore(bgEl, document.body.firstChild);
  }
  function applyBgClass() { bgEl.className = "lg-bg lg-bg--" + st.style + (st.anim ? " is-animated" : ""); }

  function applyVar(k) {
    var val = st.vars[k.v];
    if (val == null) root.style.removeProperty(k.v);
    else root.style.setProperty(k.v, cssValue(k, val));
  }
  function applyAll() { ALL.forEach(applyVar); applyBgClass(); }
  applyAll(); // 저장값 즉시 복원

  /* ---------- 패널 스타일 (자체 주입) ---------- */
  var css = [
    "#glassTunerBtn{position:fixed;right:18px;bottom:18px;z-index:99998;width:44px;height:44px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;",
    " background:var(--card-2,rgba(30,36,48,0.78));border:1px solid var(--glass-ctl-border,rgba(255,255,255,0.16));color:var(--txt-2,#cbd5e1);",
    " backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);",
    " box-shadow:0 1px 0 rgba(255,255,255,0.14) inset,0 8px 24px rgba(0,0,0,0.28);cursor:pointer;transition:transform .2s,color .2s,background .2s,box-shadow .2s;}",
    "#glassTunerBtn svg{width:20px;height:20px;display:block;}",
    "#glassTunerBtn:hover{transform:translateY(-2px);color:var(--info,#38bdf8);box-shadow:0 1px 0 rgba(255,255,255,0.14) inset,0 0 0 1px color-mix(in srgb,var(--info,#38bdf8) 60%,transparent),0 10px 28px rgba(0,0,0,0.34);}",
    "#glassTunerBtn.gt-inline{position:static;right:auto;bottom:auto;width:34px;height:34px;border-radius:10px;box-shadow:0 1px 0 rgba(255,255,255,0.1) inset,0 2px 8px rgba(0,0,0,0.18);}",
    "#glassTunerBtn.gt-inline svg{width:17px;height:17px;}",
    "#glassTuner.gt-top{bottom:auto;top:60px;}",
    "#glassTuner{position:fixed;right:18px;bottom:72px;z-index:99999;width:300px;max-height:min(86vh,760px);overflow-y:auto;overscroll-behavior:contain;",
    " padding:16px;border-radius:16px;background:linear-gradient(135deg,rgba(24,30,40,0.92),rgba(10,14,22,0.95));",
    " border:1px solid rgba(255,255,255,0.14);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);",
    " box-shadow:0 1px 0 rgba(255,255,255,0.1) inset,0 18px 56px rgba(0,0,0,0.6);",
    " font:12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;color:#e2e8f0;}",
    "#glassTuner::-webkit-scrollbar{width:8px;}#glassTuner::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.14);border-radius:999px;}",
    "#glassTuner[hidden]{display:none;}",
    "#glassTuner h3{margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.04em;color:#cbd5e1;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;-webkit-user-select:none;}",
    "#glassTuner .gt-sec{margin:14px 0 4px;font-size:10px;font-weight:700;letter-spacing:.12em;color:#64748b;text-transform:uppercase;}",
    "#glassTuner .gt-row{display:grid;grid-template-columns:78px 1fr 46px;gap:8px;align-items:center;margin:6px 0;}",
    "#glassTuner .gt-row label{color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    "#glassTuner .gt-val{text-align:right;color:#7dd3fc;font-variant-numeric:tabular-nums;font-size:11px;}",
    "#glassTuner input[type=range]{width:100%;accent-color:#38bdf8;height:4px;cursor:pointer;}",
    "#glassTuner input[type=color]{width:100%;height:24px;padding:0;border:1px solid rgba(255,255,255,0.16);border-radius:6px;background:none;cursor:pointer;}",
    "#glassTuner .gt-styles{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0;}",
    "#glassTuner .gt-style{padding:7px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04);color:#cbd5e1;font-size:11px;font-weight:600;cursor:pointer;transition:.15s;}",
    "#glassTuner .gt-style:hover{background:rgba(255,255,255,0.1);}",
    "#glassTuner .gt-style.active{background:linear-gradient(180deg,rgba(56,189,248,0.28),rgba(56,189,248,0.12));border-color:rgba(56,189,248,0.55);color:#bae6fd;}",
    "#glassTuner .gt-toggle{display:flex;align-items:center;justify-content:space-between;margin:8px 0 2px;color:#cbd5e1;}",
    "#glassTuner .gt-sw{width:38px;height:21px;border-radius:999px;background:rgba(255,255,255,0.14);position:relative;cursor:pointer;transition:.2s;flex:none;}",
    "#glassTuner .gt-sw::after{content:'';position:absolute;top:2px;left:2px;width:17px;height:17px;border-radius:50%;background:#e2e8f0;transition:.2s;}",
    "#glassTuner .gt-sw.on{background:#38bdf8;}#glassTuner .gt-sw.on::after{transform:translateX(17px);}",
    "#glassTuner .gt-presets{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px;}",
    "#glassTuner .gt-preset{display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04);color:#e2e8f0;font-size:10.5px;cursor:pointer;transition:.15s;}",
    "#glassTuner .gt-preset:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.28);}",
    "#glassTuner .gt-dot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 0 1px rgba(255,255,255,0.25);}",
    "#glassTuner .gt-foot{display:flex;gap:6px;margin-top:14px;position:sticky;bottom:-16px;padding-bottom:2px;}",
    "#glassTuner .gt-foot button{flex:1;padding:7px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:rgba(20,26,36,0.9);color:#e2e8f0;font-size:11px;font-weight:600;cursor:pointer;transition:.15s;}",
    "#glassTuner .gt-foot button:hover{background:rgba(255,255,255,0.14);}",
    "#glassTuner .gt-theme{border-color:rgba(56,189,248,0.4)!important;color:#7dd3fc!important;}",
    "#glassTuner .gt-copied{border-color:rgba(34,197,94,0.6)!important;color:#4ade80!important;}"
  ].join("");
  var styleEl = document.createElement("style"); styleEl.textContent = css; document.head.appendChild(styleEl);

  /* ---------- 패널 DOM ---------- */
  function rowHtml(k) {
    var cur = st.vars[k.v] != null ? st.vars[k.v] : k.def;
    var tip = k.desc ? (k.label + " — " + k.desc) : k.label;   // 행 전체 + 라벨 툴팁(슬라이더 위에서도 뜸)
    if (k.type === "color") {
      return '<div class="gt-row" title="' + tip + '"><label title="' + tip + '">' + k.label + '</label>' +
        '<input type="color" data-v="' + k.v + '" value="' + cur + '">' +
        '<span class="gt-val" data-d="' + k.v + '">' + disp(k, cur) + '</span></div>';
    }
    return '<div class="gt-row" title="' + tip + '"><label title="' + tip + '">' + k.label + '</label>' +
      '<input type="range" data-v="' + k.v + '" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + cur + '">' +
      '<span class="gt-val" data-d="' + k.v + '">' + disp(k, cur) + '</span></div>';
  }

  var panel = document.createElement("div");
  panel.id = "glassTuner"; panel.hidden = true;
  panel.innerHTML =
    "<h3 title='시작 순서 추천: 배경 스타일/색 먼저 → Blur·Opacity로 재질 잡기 → Refraction·Reflection으로 생기 → Depth·Shadow로 안착 → 마지막에 Tint로 분위기.'>LIQUID GLASS TUNER <span style='font-weight:400;color:#64748b'>Ctrl+Shift+G</span></h3>" +
    '<div class="gt-sec">Glass</div>' + GLASS.map(rowHtml).join("") +
    '<div class="gt-sec">Background · Style</div>' +
    '<div class="gt-styles">' + STYLES.map(function (s) {
      return '<button type="button" class="gt-style' + (st.style === s[0] ? " active" : "") + '" data-style="' + s[0] + '">' + s[1] + "</button>";
    }).join("") + "</div>" +
    BG.map(rowHtml).join("") +
    '<div class="gt-toggle"><span>Animated Background</span><div class="gt-sw' + (st.anim ? " on" : "") + '" data-act="anim" role="switch"></div></div>' +
    '<div class="gt-sec">Presets</div>' +
    '<div class="gt-presets">' + PRESETS.map(function (p, i) {
      return '<button type="button" class="gt-preset" data-preset="' + i + '"><span class="gt-dot" style="background:' + p.accent + '"></span>' + p.name + "</button>";
    }).join("") + "</div>" +
    '<div class="gt-foot">' +
    '<button type="button" class="gt-theme" data-act="theme">밤/낮</button>' +
    '<button type="button" data-act="reset">초기화</button>' +
    '<button type="button" data-act="copy" title="확정값 CSS 복사 — 지금 튜닝한 모든 --lg-* 값을 :root{…} 블록 + 배경 div 마크업으로 클립보드에 복사. 운영 반영 시 CSS에 붙여넣고 튜너 스크립트는 제거">CSS 복사</button>' +
    "</div>";
  document.body.appendChild(panel);

  var btn = document.createElement("button");
  btn.id = "glassTunerBtn"; btn.type = "button";
  btn.title = "리퀴드 글래스 튜너 (Ctrl+Shift+G)";
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>';
  var slot = document.getElementById("glassTunerSlot") || document.querySelector("[data-glass-tuner-slot]");
  if (slot) { btn.classList.add("gt-inline"); panel.classList.add("gt-top"); slot.appendChild(btn); }
  else { document.body.appendChild(btn); }

  function toggle() { panel.hidden = !panel.hidden; }
  btn.addEventListener("click", toggle);
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === "G" || e.key === "g")) { e.preventDefault(); toggle(); }
  });

  /* ---------- 패널 드래그 이동 (헤더 잡고) ---------- */
  (function () {
    var handle = panel.querySelector("h3"); if (!handle) return;
    var on = false, sx, sy, ox, oy;
    handle.addEventListener("mousedown", function (e) {
      var r = panel.getBoundingClientRect();
      panel.style.left = r.left + "px"; panel.style.top = r.top + "px";
      panel.style.right = "auto"; panel.style.bottom = "auto";
      on = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!on) return;
      var nx = ox + (e.clientX - sx), ny = oy + (e.clientY - sy);
      nx = Math.max(6, Math.min(nx, window.innerWidth - panel.offsetWidth - 6));
      ny = Math.max(6, Math.min(ny, window.innerHeight - 44));
      panel.style.left = nx + "px"; panel.style.top = ny + "px";
    });
    document.addEventListener("mouseup", function () { on = false; });
  })();

  /* ---------- 슬라이더·컬러 → 변수 ---------- */
  panel.addEventListener("input", function (e) {
    var v = e.target.getAttribute("data-v"); if (!v) return;
    var k = BYVAR[v], val = k.type === "color" ? e.target.value : parseFloat(e.target.value);
    st.vars[v] = val;
    root.style.setProperty(v, cssValue(k, val));
    var d = panel.querySelector('[data-d="' + v + '"]'); if (d) d.textContent = disp(k, val);
    save();
  });

  /* ---------- 버튼/토글/프리셋 ---------- */
  function setControl(v, val) {           // UI + 변수 동기화
    var k = BYVAR[v]; if (!k) return;
    st.vars[v] = val;
    root.style.setProperty(v, cssValue(k, val));
    var inp = panel.querySelector('[data-v="' + v + '"]'); if (inp) inp.value = val;
    var d = panel.querySelector('[data-d="' + v + '"]'); if (d) d.textContent = disp(k, val);
  }
  function setStyle(s) {
    st.style = s; applyBgClass();
    [].forEach.call(panel.querySelectorAll(".gt-style"), function (b) { b.classList.toggle("active", b.getAttribute("data-style") === s); });
  }

  panel.addEventListener("click", function (e) {
    var t = e.target;
    var styleBtn = t.closest ? t.closest(".gt-style") : null;
    if (styleBtn) { setStyle(styleBtn.getAttribute("data-style")); save(); return; }

    var preset = t.closest ? t.closest(".gt-preset") : null;
    if (preset) {
      var p = PRESETS[+preset.getAttribute("data-preset")];
      setControl("--lg-bg-primary", p.primary);
      setControl("--lg-bg-secondary", p.secondary);
      setControl("--lg-bg-accent", p.accent);
      setControl("--lg-bg-darkness", p.darkness);
      setControl("--lg-bg-saturation", p.saturation);
      setControl("--lg-bg-noise", p.noise);
      setControl("--lg-tint", p.accent);          // 글래스 틴트도 accent로 통일
      setControl("--lg-tint-strength", 14);
      setStyle(p.backgroundType);
      save();
      return;
    }

    var act = t.getAttribute("data-act");
    if (act === "anim") { st.anim = !st.anim; applyBgClass(); t.classList.toggle("on", st.anim); save(); return; }

    if (act === "theme") {
      var light = document.body.dataset.theme === "light";
      if (light) delete document.body.dataset.theme; else document.body.dataset.theme = "light";
      try { localStorage.setItem("dashboard.theme", light ? "dark" : "light"); } catch (_) {}
      return;
    }

    if (act === "reset") {
      st = { vars: {}, style: "aurora", anim: true };
      save();
      ALL.forEach(function (k) {
        root.style.removeProperty(k.v);
        var inp = panel.querySelector('[data-v="' + k.v + '"]'); if (inp) inp.value = k.def;
        var d = panel.querySelector('[data-d="' + k.v + '"]'); if (d) d.textContent = disp(k, k.def);
      });
      setStyle("aurora");
      var sw = panel.querySelector('[data-act="anim"]'); if (sw) sw.classList.add("on");
      return;
    }

    if (act === "copy") {
      var lines = ALL.map(function (k) {
        var val = st.vars[k.v] != null ? st.vars[k.v] : k.def;
        return "  " + k.v + ": " + cssValue(k, val) + ";";
      });
      var out = ":root {\n" + lines.join("\n") + "\n}\n" +
        "/* 배경: <div class=\"lg-bg lg-bg--" + st.style + (st.anim ? " is-animated" : "") + "\"></div> 를 body 첫 자식으로 */";
      var done = function () {
        t.classList.add("gt-copied"); t.textContent = "복사됨!";
        setTimeout(function () { t.classList.remove("gt-copied"); t.textContent = "CSS 복사"; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out).then(done, function () { window.prompt("아래 CSS를 복사하세요:", out); });
      } else { window.prompt("아래 CSS를 복사하세요:", out); }
    }
  });
})();
