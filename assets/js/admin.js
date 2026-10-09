// =====================================================================
//  لوحة التحكم — إضافة وإدارة الصفوف والوحدات والسلاسل والفيديوهات
// =====================================================================
import * as D from "./data.js";

const { KINDS, esc } = D;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const show = (el, on = true) => el.classList.toggle("hidden", !on);

let S = { stages: [], units: [], series: [], videos: [] };

// ---------- أدوات واجهة ----------
let toastTimer;
function toast(msg, isErr) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("err", !!isErr);
  show(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => show(t, false), isErr ? 5000 : 2200);
}
function explain(e) {
  console.error(e);
  const c = e?.code || "";
  if (c.includes("permission-denied")) return "الحساب ده مش مسموح له بالتعديل. راجع قواعد الأمان وإيميل الأدمن.";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found") || c.includes("invalid-email"))
    return "الإيميل أو الباسورد غلط.";
  if (c.includes("too-many-requests")) return "محاولات كتير. استنى شوية وجرّب تاني.";
  if (c.includes("network")) return "مشكلة في الإنترنت.";
  return "حصل خطأ: " + (e?.message || e);
}
function setMsg(el, text, kind) {
  el.textContent = text || "";
  el.className = "msg" + (kind ? " " + kind : "") + (text ? "" : " hidden");
}

// نافذة إدخال عامة
function ask(title, fields) {
  const dlg = $("#dlg");
  $("#dlg-title").textContent = title;
  $("#dlg-fields").innerHTML = fields.map((f, i) => {
    const id = "dlg-f" + i;
    const attrs = `id="${id}" ${f.required ? "required" : ""}`;
    let input;
    if (f.type === "textarea") input = `<textarea ${attrs}>${esc(f.value || "")}</textarea>`;
    else if (f.type === "select")
      input = `<select ${attrs}>${f.options.map(([v, l]) => `<option value="${esc(v)}" ${v === f.value ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    else input = `<input ${attrs} type="${f.type === "url" ? "url" : "text"}" ${f.type === "url" ? 'class="ltr"' : ""} value="${esc(f.value || "")}">`;
    return `<label for="${id}">${esc(f.label)}</label>${input}`;
  }).join("");
  return new Promise((resolve) => {
    const finish = (v) => { dlg.close(); resolve(v); };
    $("#dlg-form").onsubmit = (e) => {
      e.preventDefault();
      const out = {};
      fields.forEach((f, i) => (out[f.key] = $("#dlg-f" + i).value.trim()));
      finish(out);
    };
    $("#dlg-cancel").onclick = () => finish(null);
    dlg.oncancel = () => resolve(null);
    dlg.showModal();
    $("#dlg-f0")?.focus();
  });
}

async function run(fn, okMsg = "تم ✔") {
  try {
    await fn();
    await reload();
    if (okMsg) toast(okMsg);
    return true;
  } catch (e) {
    toast(explain(e), true);
    return false;
  }
}

// ---------- تحميل البيانات ----------
async function reload() {
  const [stages, units, series, videos] = await Promise.all(["stages", "units", "series", "videos"].map(D.listAll));
  S = { stages, units, series, videos };
  renderAddForm();
  renderTree();
}

// =====================================================================
//  تبويب: إضافة فيديو
// =====================================================================
const opt = (v, l, sel) => `<option value="${esc(v)}" ${sel ? "selected" : ""}>${esc(l)}</option>`;
const currentTarget = () => $("input[name=target]:checked").value;

function renderAddForm() {
  // الصفوف
  const prevStage = $("#f-stage").value;
  $("#f-stage").innerHTML = S.stages.length
    ? S.stages.map((s) => opt(s.id, s.title, s.id === prevStage)).join("")
    : opt("", "— مفيش صفوف، ضيف صف من إدارة المحتوى —");
  fillUnits();
  // الأنواع
  if (!$("#f-kind").options.length)
    $("#f-kind").innerHTML = Object.entries(KINDS).map(([k, l]) => opt(k, l)).join("");
  // السلاسل
  const prevSeries = $("#f-series").value;
  $("#f-series").innerHTML =
    S.series.map((s) => opt(s.id, s.title, s.id === prevSeries)).join("") + opt("__new", "＋ سلسلة جديدة…", !S.series.length);
  toggleNew();
}

function fillUnits(selectId) {
  const stageId = $("#f-stage").value;
  const prev = selectId ?? $("#f-unit").value;
  const units = S.units.filter((u) => u.stageId === stageId);
  const values = ["", ...units.map((u) => u.id), "__new"];
  const keep = values.includes(prev) ? prev : units[0]?.id ?? "__new";
  $("#f-unit").innerHTML =
    opt("", "— بدون وحدة (عام للصف) —", keep === "") +
    units.map((u) => opt(u.id, u.title, u.id === keep)).join("") +
    opt("__new", "＋ وحدة جديدة…", keep === "__new");
  toggleNew();
}

function toggleNew() {
  const isStage = currentTarget() === "stage";
  show($("#stage-fields"), isStage);
  show($("#series-fields"), !isStage);
  show($("#new-unit-box"), isStage && $("#f-unit").value === "__new");
  show($("#new-series-box"), !isStage && $("#f-series").value === "__new");
  $("#title-label").innerHTML = isStage
    ? 'عنوان الفيديو <span class="muted">(اختياري — لو سبته هيظهر اسم النوع مثل "الشرح")</span>'
    : "عنوان الفيديو";
}

async function submitAdd(e) {
  e.preventDefault();
  const msg = $("#add-msg");
  setMsg(msg, "");
  const url = $("#f-url").value.trim();
  const title = $("#f-title").value.trim();
  const description = $("#f-desc").value.trim();
  if (!D.isValidUrl(url)) return setMsg(msg, "اللينك مش صحيح. انسخه كامل من اليوتيوب.", "err");

  const btn = $("#add-btn");
  btn.disabled = true;
  try {
    let video;
    if (currentTarget() === "stage") {
      const stageId = $("#f-stage").value;
      if (!stageId) return setMsg(msg, "اختار الصف الأول.", "err");
      let unitId = $("#f-unit").value;
      if (unitId === "__new") {
        const name = $("#f-newunit").value.trim();
        if (!name) return setMsg(msg, "اكتب اسم الوحدة الجديدة.", "err");
        unitId = await D.add("units", { stageId, title: name, order: await D.nextOrder("units", ["stageId", stageId]) });
        $("#f-newunit").value = "";
      }
      video = {
        stageId, unitId, kind: $("#f-kind").value, title, description, url,
        order: await D.nextOrder("videos", ["stageId", stageId]),
      };
      await D.add("videos", video);
      await reload();
      fillUnits(unitId);
    } else {
      let seriesId = $("#f-series").value;
      if (!title) return setMsg(msg, "اكتب عنوان الفيديو.", "err");
      if (seriesId === "__new") {
        const name = $("#f-newseries").value.trim();
        if (!name) return setMsg(msg, "اكتب اسم السلسلة الجديدة.", "err");
        seriesId = await D.add("series", {
          title: name, pageTitle: name, description: $("#f-newseries-desc").value.trim(),
          order: await D.nextOrder("series"),
        });
        $("#f-newseries").value = "";
        $("#f-newseries-desc").value = "";
      }
      await D.add("videos", {
        seriesId, title, description, url, order: await D.nextOrder("videos", ["seriesId", seriesId]),
      });
      await reload();
      $("#f-series").value = seriesId;
      toggleNew();
    }
    ["#f-title", "#f-url", "#f-desc"].forEach((s) => ($(s).value = ""));
    toast("اتضاف الفيديو واتنشر على الموقع ✔");
    if (!D.isYoutube(url)) setMsg(msg, "ملحوظة: اللينك ده مش من يوتيوب، بس اتضاف عادي.", "warn");
  } catch (err) {
    setMsg(msg, explain(err), "err");
  } finally {
    btn.disabled = false;
  }
}

// =====================================================================
//  تبويب: إدارة المحتوى
// =====================================================================
const ctrl = (type, id) => `
  <button class="ghost sm" data-act="up" data-type="${type}" data-id="${esc(id)}" title="فوق">↑</button>
  <button class="ghost sm" data-act="down" data-type="${type}" data-id="${esc(id)}" title="تحت">↓</button>
  <button class="ghost sm" data-act="edit" data-type="${type}" data-id="${esc(id)}">تعديل</button>
  <button class="danger sm" data-act="del" data-type="${type}" data-id="${esc(id)}">حذف</button>`;

function videoRow(v, kindLabel) {
  return `<div class="tree-item"><div class="tree-head">
    <span class="badge">${esc(kindLabel)}</span>
    <div class="grow">${esc(v.title || "(بدون عنوان)")}<div class="muted ltr" dir="ltr">${esc(v.url)}</div>
    ${v.description ? `<div class="muted">${esc(v.description)}</div>` : ""}</div>
    ${ctrl("videos", v.id)}</div></div>`;
}

function renderTree() {
  $("#tree-stages").innerHTML = S.stages.length
    ? S.stages.map((st) => {
      const units = S.units.filter((u) => u.stageId === st.id);
      const vids = S.videos.filter((v) => v.stageId === st.id);
      const general = vids.filter((v) => !v.unitId);
      return `<div class="tree-item"><div class="tree-head">
        <h3 class="grow">${esc(st.title)} <span class="muted">(${vids.length} فيديو)</span></h3>
        <button class="sm" data-act="add-unit" data-id="${esc(st.id)}">+ وحدة</button>${ctrl("stages", st.id)}</div>
        <div class="tree-children">
          ${general.length ? `<div class="muted">عام للصف</div>` + general.map((v) => videoRow(v, KINDS[v.kind] || "أخرى")).join("") : ""}
          ${units.map((u) => {
            const uv = vids.filter((v) => v.unitId === u.id);
            return `<div class="tree-item"><div class="tree-head"><b class="grow">${esc(u.title)} <span class="muted">(${uv.length})</span></b>${ctrl("units", u.id)}</div>
              <div class="tree-children">${uv.map((v) => videoRow(v, KINDS[v.kind] || "أخرى")).join("") || '<div class="muted">لسه مفيش فيديوهات</div>'}</div></div>`;
          }).join("") || (general.length ? "" : '<div class="muted">مفيش وحدات لسه</div>')}
        </div></div>`;
    }).join("")
    : '<p class="muted">مفيش صفوف لسه. دوس "+ صف جديد" أو استورد المحتوى الحالي من تبويب أدوات.</p>';

  $("#tree-series").innerHTML = S.series.length
    ? S.series.map((s) => {
      const vs = S.videos.filter((v) => v.seriesId === s.id);
      return `<div class="tree-item"><div class="tree-head">
        <div class="grow"><h3>${esc(s.title)} <span class="muted">(${vs.length} فيديو)</span></h3><div class="muted">${esc(s.description || "")}</div></div>
        ${ctrl("series", s.id)}</div>
        <div class="tree-children">${vs.map((v) => videoRow(v, "فيديو")).join("") || '<div class="muted">لسه مفيش فيديوهات</div>'}</div></div>`;
    }).join("")
    : '<p class="muted">مفيش سلاسل لسه.</p>';
}

// الأخوات في نفس المستوى (للترتيب فوق/تحت)
function siblings(type, item) {
  if (type === "stages") return S.stages;
  if (type === "series") return S.series;
  if (type === "units") return S.units.filter((u) => u.stageId === item.stageId);
  return S.videos.filter((v) =>
    item.seriesId ? v.seriesId === item.seriesId : v.stageId === item.stageId && (v.unitId || "") === (item.unitId || ""));
}

async function editItem(type, item) {
  if (type === "stages") {
    const r = await ask("تعديل الصف", [
      { key: "title", label: "اسم الصف", value: item.title, required: true },
      { key: "description", label: "وصف قصير", value: item.description },
      { key: "bookUrl", label: "لينك الكتاب (اختياري)", value: item.bookUrl, type: "url" },
    ]);
    return r && run(() => D.update("stages", item.id, r));
  }
  if (type === "units") {
    const r = await ask("تعديل الوحدة", [{ key: "title", label: "اسم الوحدة", value: item.title, required: true }]);
    return r && run(() => D.update("units", item.id, r));
  }
  if (type === "series") {
    const r = await ask("تعديل السلسلة", [
      { key: "title", label: "اسم السلسلة", value: item.title, required: true },
      { key: "description", label: "الوصف (بيظهر في الهوم)", value: item.description, type: "textarea" },
    ]);
    return r && run(() => D.update("series", item.id, { ...r, pageTitle: r.title }));
  }
  // video
  const fields = [
    { key: "title", label: "العنوان", value: item.title },
    { key: "url", label: "اللينك", value: item.url, type: "url", required: true },
    { key: "description", label: "التفاصيل", value: item.description, type: "textarea" },
  ];
  if (item.stageId) {
    fields.push({ key: "kind", label: "النوع", type: "select", value: item.kind || "other", options: Object.entries(KINDS) });
    fields.push({
      key: "unitId", label: "الوحدة", type: "select", value: item.unitId || "",
      options: [["", "— عام للصف —"], ...S.units.filter((u) => u.stageId === item.stageId).map((u) => [u.id, u.title])],
    });
  }
  const r = await ask("تعديل الفيديو", fields);
  if (!r) return;
  if (!D.isValidUrl(r.url)) return toast("اللينك مش صحيح", true);
  return run(() => D.update("videos", item.id, r));
}

async function deleteItem(type, item) {
  const kids =
    type === "stages" ? S.units.filter((u) => u.stageId === item.id).length + S.videos.filter((v) => v.stageId === item.id).length
    : type === "units" ? S.videos.filter((v) => v.unitId === item.id).length
    : type === "series" ? S.videos.filter((v) => v.seriesId === item.id).length : 0;
  const name = item.title || "الفيديو ده";
  const ok = confirm(`متأكد إنك عايز تحذف "${name}"؟` + (kids ? `\nهيتحذف معاه ${kids} عنصر تحته.` : "") + "\nمش هينفع تتراجع.");
  if (!ok) return;
  return run(() => (type === "videos" ? D.remove("videos", item.id) : D.removeCascade(type, item.id)), "اتحذف ✔");
}

async function onTreeClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const { act, type, id } = b.dataset;
  if (act === "add-unit") {
    const r = await ask("وحدة جديدة", [{ key: "title", label: "اسم الوحدة", value: "Unit ", required: true }]);
    return r && run(async () => D.add("units", { stageId: id, title: r.title, order: await D.nextOrder("units", ["stageId", id]) }));
  }
  const item = S[type].find((x) => x.id === id);
  if (!item) return;
  if (act === "edit") return editItem(type, item);
  if (act === "del") return deleteItem(type, item);
  if (act === "up" || act === "down")
    return run(() => D.move(type, siblings(type, item), id, act === "up" ? -1 : 1), "");
}

async function addStage() {
  const r = await ask("صف جديد", [
    { key: "title", label: "اسم الصف", value: "", required: true },
    { key: "description", label: "وصف قصير", value: "شرح شامل + مراجعة + أسئلة محلولة" },
    { key: "bookUrl", label: "لينك الكتاب (اختياري)", type: "url", value: "" },
  ]);
  return r && run(async () => D.add("stages", { ...r, level: "prep", order: await D.nextOrder("stages", ["level", "prep"]) }));
}
async function addSeries() {
  const r = await ask("سلسلة جديدة", [
    { key: "title", label: "اسم السلسلة (هيظهر في الهوم)", value: "", required: true },
    { key: "description", label: "وصف قصير", type: "textarea", value: "" },
  ]);
  return r && run(async () => D.add("series", { ...r, pageTitle: r.title, order: await D.nextOrder("series") }));
}

// =====================================================================
//  التشغيل
// =====================================================================
function bind() {
  $$(".tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".tabs button").forEach((x) => x.classList.toggle("active", x === b));
      ["add", "manage", "tools"].forEach((t) => show($("#tab-" + t), t === b.dataset.tab));
    }));
  $$("input[name=target]").forEach((r) => r.addEventListener("change", toggleNew));
  $("#f-stage").addEventListener("change", () => fillUnits("__reset"));
  $("#f-unit").addEventListener("change", toggleNew);
  $("#f-series").addEventListener("change", toggleNew);
  $("#add-form").addEventListener("submit", submitAdd);
  $("#tab-manage").addEventListener("click", onTreeClick);
  $("#add-stage").addEventListener("click", addStage);
  $("#add-series").addEventListener("click", addSeries);
  $("#logout").addEventListener("click", () => D.logout());
  $("#import-seed").addEventListener("click", async () => {
    if (!confirm("هيتم استيراد المحتوى الحالي للموقع إلى Firebase. نكمل؟")) return;
    const m = $("#tools-msg");
    try {
      const n = await D.importSeed();
      await reload();
      setMsg(m, `تم استيراد ${n} عنصر ✔`, "warn");
    } catch (e) { setMsg(m, explain(e), "err"); }
  });
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg($("#login-err"), "");
    try { await D.login($("#email").value.trim(), $("#password").value); }
    catch (err) { setMsg($("#login-err"), explain(err), "err"); }
  });
}

async function main() {
  bind();
  if (!D.isConfigured()) return show($("#noconfig-view"));
  await D.onAuth(async (user) => {
    show($("#login-view"), !user);
    show($("#app-view"), !!user);
    if (user) {
      $("#who").textContent = user.email;
      try { await reload(); } catch (e) { toast(explain(e), true); }
    }
  });
}
main().catch((e) => { console.error(e); toast(explain(e), true); });
