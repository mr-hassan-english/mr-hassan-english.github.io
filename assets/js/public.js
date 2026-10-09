// =====================================================================
//  عرض المحتوى للزوار — بيشتغل حسب <body data-page="...">
//  home | level | stage | series
// =====================================================================
import {
  KINDS, listStages, getStage, listUnits, listStageVideos,
  listSeries, getSeries, listSeriesVideos, esc, isValidUrl,
} from "./data.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const kindOrder = Object.keys(KINDS);

const safeUrl = (u) => (isValidUrl(u) ? u : "#");
const setState = (el, msg, isError) => {
  el.innerHTML = `<p class="state-msg${isError ? " error" : ""}">${esc(msg)}</p>`;
};
const fail = (el, e) => {
  console.error(e);
  setState(el, "حصلت مشكلة في تحميل المحتوى. جرّب تحدّث الصفحة.", true);
};
const openVideo = (url) => window.open(safeUrl(url), "_blank", "noopener");

// ---------- الصفحة الرئيسية: كروت السلاسل ----------
async function home() {
  const slot = $("#series-slot");
  if (!slot) return;
  try {
    const series = await listSeries();
    slot.innerHTML = series.map((s) => `
      <div class="col-md-6 col-lg-3">
        <div class="skill-box text-center p-4 shadow-sm rounded">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description || "")}</p>
          <a href="series.html?id=${encodeURIComponent(s.id)}" class="btn btn-primary mt-3">الدخول لـ ${esc(s.title)}</a>
        </div>
      </div>`).join("");
  } catch (e) { console.error(e); }
}

// ---------- صفحة المرحلة التعليمية (الصفوف) ----------
async function level() {
  const box = $("#content");
  try {
    const stages = await listStages(params.get("level") || "prep");
    if (!stages.length) return setState(box, "لسه مفيش صفوف مضافة.");
    box.innerHTML = `<div class="units-grid">` + stages.map((s) => `
      <div class="unit-card">
        <div class="unit-content">
          <h2 class="unit-title">${esc(s.title)}</h2>
          <p class="unit-description">${esc(s.description || "")}</p>
        </div>
        <button class="unit-btn" data-go="stage.html?id=${encodeURIComponent(s.id)}">دخول (مجاناً)</button>
      </div>`).join("") + `</div>`;
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]");
      if (b) location.href = b.dataset.go;
    });
  } catch (e) { fail(box, e); }
}

// ---------- صفحة الصف: الوحدات والفيديوهات ----------
function groupHtml(videos) {
  const groups = kindOrder
    .map((k) => [k, videos.filter((v) => (v.kind || "other") === k)])
    .filter(([, vs]) => vs.length);
  return groups.map(([k, vs]) => `
    <div class="popup-group">${esc(KINDS[k])}</div>
    ${vs.map((v) => `
      <div class="popup-video">
        <button class="popup-btn" data-url="${esc(v.url)}">${esc(v.title || KINDS[k])}</button>
        ${v.description ? `<small>${esc(v.description)}</small>` : ""}
      </div>`).join("")}`).join("");
}

async function stage() {
  const box = $("#content");
  const id = params.get("id");
  try {
    const [st, units, videos] = await Promise.all([getStage(id), listUnits(id), listStageVideos(id)]);
    if (!st) return setState(box, "الصف ده مش موجود.", true);
    document.title = `${st.title} - Mr. Hassan`;
    $("#page-title").textContent = st.title;
    if (st.bookUrl) {
      const a = $("#book-btn");
      a.href = safeUrl(st.bookUrl);
      a.querySelector("button").textContent = `كتاب ${st.title}`;
      a.style.display = "";
    }
    const general = videos.filter((v) => !v.unitId);
    let html = "";
    if (general.length) {
      html += `<h2 class="section-label">مراجعات وامتحانات عامة</h2>
        <div class="general-box">${groupHtml(general)}</div>`;
    }
    html += `<div class="units-grid">` + units.map((u) => {
      const vs = videos.filter((v) => v.unitId === u.id);
      return `
      <div class="unit-card">
        <div class="unit-content">
          <h2 class="unit-title">${esc(u.title)}</h2>
          <p class="unit-description">${esc(u.description || "شرح شامل")}</p>
          <p class="unit-count">${vs.length ? vs.length + " فيديو" : "قريباً"}</p>
        </div>
        <button class="unit-btn" data-unit="${esc(u.id)}" ${vs.length ? "" : "disabled"}>دخول الوحدة</button>
      </div>
      <div class="popup" id="popup-${esc(u.id)}">
        <div class="popup-content">
          <span class="close" data-close>×</span>
          <h3>${esc(u.title)} — اختر المحتوى</h3>
          ${groupHtml(vs)}
        </div>
      </div>`;
    }).join("") + `</div>`;
    if (!units.length && !general.length) html = `<p class="state-msg">لسه مفيش وحدات مضافة.</p>`;
    box.innerHTML = html;
    wire(box);
  } catch (e) { fail(box, e); }
}

// ---------- صفحة السلسلة ----------
async function series() {
  const box = $("#content");
  const id = params.get("id");
  try {
    const [s, videos] = await Promise.all([getSeries(id), listSeriesVideos(id)]);
    if (!s) return setState(box, "السلسلة دي مش موجودة.", true);
    document.title = `${s.title} - Mr. Hassan`;
    $("#page-title").textContent = s.pageTitle || s.title;
    const d = $("#page-desc");
    if (d) d.textContent = s.description || "";
    if (!videos.length) return setState(box, "لسه مفيش فيديوهات في السلسلة دي.");
    box.innerHTML = `<div class="units-grid">` + videos.map((v) => `
      <div class="unit-card">
        <div class="unit-content">
          <h2 class="unit-title">${esc(v.title || s.title)}</h2>
          ${v.description ? `<p class="unit-description">${esc(v.description)}</p>` : ""}
        </div>
        <button class="unit-btn" data-url="${esc(v.url)}">مشاهدة الفيديو</button>
      </div>`).join("") + `</div>`;
    wire(box);
  } catch (e) { fail(box, e); }
}

// ---------- ربط الأزرار (فتح فيديو / فتح وإغلاق النافذة) ----------
function wire(box) {
  box.addEventListener("click", (e) => {
    const vb = e.target.closest("[data-url]");
    if (vb) return openVideo(vb.dataset.url);
    const ub = e.target.closest("[data-unit]");
    if (ub && !ub.disabled) {
      const p = document.getElementById("popup-" + ub.dataset.unit);
      if (p) p.style.display = "flex";
      return;
    }
    if (e.target.closest("[data-close]")) e.target.closest(".popup").style.display = "none";
    else if (e.target.classList.contains("popup")) e.target.style.display = "none";
  });
}

const pages = { home, level, stage, series };
(pages[document.body.dataset.page] || (document.getElementById("series-slot") ? home : null))?.();
