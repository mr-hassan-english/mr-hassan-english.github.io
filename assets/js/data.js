// =====================================================================
//  طبقة البيانات (الباك إند) — بتكلّم Firebase Firestore
//  - لو إعدادات Firebase لسه ما اتحطتش ➜ بتقرأ من seed.js (المحتوى الحالي)
//  - الكولكشنز: stages / units / series / videos
// =====================================================================
import { firebaseConfig } from "./firebase-config.js";
import { SEED } from "./seed.js";

// أنواع الفيديو — عايز تضيف نوع جديد؟ ضيفه هنا بس وهيظهر في اللوحة والموقع
export const KINDS = {
  explain: "الشرح",
  review: "المراجعة",
  midterm: "ميد ترم",
  half: "نص المنهج",
  other: "أخرى",
};

export const isConfigured = () =>
  !!firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("PASTE");

// ---------- تحميل Firebase عند الحاجة فقط ----------
let _fb;
async function fb() {
  if (_fb) return _fb;
  const sdk = await import("./firebase-sdk.js");
  const app = sdk.initializeApp(firebaseConfig);
  _fb = { sdk, db: sdk.getFirestore(app), auth: sdk.getAuth(app) };
  return _fb;
}

const byOrder = (a, b) =>
  (a.order ?? 9999) - (b.order ?? 9999) || String(a.title || "").localeCompare(String(b.title || ""), "ar");

async function fetchAll(coll, filter) {
  if (!isConfigured()) {
    let rows = (SEED[coll] || []).map((x) => ({ ...x }));
    if (filter) rows = rows.filter((r) => r[filter[0]] === filter[1]);
    return rows.sort(byOrder);
  }
  const { sdk, db } = await fb();
  let q = sdk.collection(db, coll);
  if (filter) q = sdk.query(q, sdk.where(filter[0], "==", filter[1]));
  const snap = await sdk.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
}

async function fetchOne(coll, id) {
  if (!isConfigured()) {
    const r = (SEED[coll] || []).find((x) => x.id === id);
    return r ? { ...r } : null;
  }
  const { sdk, db } = await fb();
  const s = await sdk.getDoc(sdk.doc(db, coll, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// ---------- قراءة (عامة للزوار) ----------
export const listStages = (level = "prep") => fetchAll("stages", ["level", level]);
export const getStage = (id) => fetchOne("stages", id);
export const listUnits = (stageId) => fetchAll("units", ["stageId", stageId]);
export const listSeries = () => fetchAll("series");
export const getSeries = (id) => fetchOne("series", id);
export const listStageVideos = (stageId) => fetchAll("videos", ["stageId", stageId]);
export const listSeriesVideos = (seriesId) => fetchAll("videos", ["seriesId", seriesId]);
export const listAll = (coll) => fetchAll(coll);

// ---------- دخول الأدمن ----------
export async function login(email, password) {
  const { sdk, auth } = await fb();
  return sdk.signInWithEmailAndPassword(auth, email, password);
}
export async function logout() {
  const { sdk, auth } = await fb();
  return sdk.signOut(auth);
}
export async function onAuth(cb) {
  const { sdk, auth } = await fb();
  return sdk.onAuthStateChanged(auth, cb);
}

// ---------- كتابة (للأدمن فقط — القواعد في firestore.rules بتحمي ده) ----------
export async function add(coll, data) {
  const { sdk, db } = await fb();
  const ref = await sdk.addDoc(sdk.collection(db, coll), { ...data, createdAt: sdk.serverTimestamp() });
  return ref.id;
}
export async function update(coll, id, data) {
  const { sdk, db } = await fb();
  return sdk.updateDoc(sdk.doc(db, coll, id), data);
}
export async function remove(coll, id) {
  const { sdk, db } = await fb();
  return sdk.deleteDoc(sdk.doc(db, coll, id));
}

// حذف مع كل اللي تحته (مرحلة ➜ وحداتها وفيديوهاتها، إلخ)
export async function removeCascade(coll, id) {
  const { sdk, db } = await fb();
  const refs = [];
  const collect = async (c, field, val) => {
    const snap = await sdk.getDocs(sdk.query(sdk.collection(db, c), sdk.where(field, "==", val)));
    snap.docs.forEach((d) => refs.push(d.ref));
  };
  if (coll === "stages") {
    await collect("videos", "stageId", id);
    await collect("units", "stageId", id);
  } else if (coll === "units") await collect("videos", "unitId", id);
  else if (coll === "series") await collect("videos", "seriesId", id);
  refs.push(sdk.doc(db, coll, id));
  for (let i = 0; i < refs.length; i += 400) {
    const batch = sdk.writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  return refs.length;
}

// رقم الترتيب الجاي (آخر واحد + 1)
export async function nextOrder(coll, filter) {
  const rows = await fetchAll(coll, filter);
  return rows.reduce((m, r) => Math.max(m, Number(r.order) || 0), 0) + 1;
}

// تبديل ترتيب عنصرين (فوق/تحت). نعيد ترقيم القائمة كلها عشان نتفادى التكرار.
export async function move(coll, rows, id, dir) {
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  const list = rows.slice();
  [list[i], list[j]] = [list[j], list[i]];
  const { sdk, db } = await fb();
  const batch = sdk.writeBatch(db);
  list.forEach((r, k) => batch.update(sdk.doc(db, coll, r.id), { order: k + 1 }));
  await batch.commit();
}

// استيراد المحتوى الحالي (seed.js) إلى Firestore — آمن تكرره (بيكتب فوق نفس الـ IDs)
export async function importSeed() {
  const { sdk, db } = await fb();
  const jobs = [];
  for (const coll of ["stages", "units", "series", "videos"]) {
    for (const row of SEED[coll]) {
      const { id, ...data } = row;
      jobs.push({ ref: sdk.doc(db, coll, id), data: { ...data, createdAt: sdk.serverTimestamp() } });
    }
  }
  for (let i = 0; i < jobs.length; i += 400) {
    const batch = sdk.writeBatch(db);
    jobs.slice(i, i + 400).forEach((j) => batch.set(j.ref, j.data));
    await batch.commit();
  }
  return jobs.length;
}

// ---------- أدوات صغيرة ----------
export function isValidUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" || x.protocol === "http:";
  } catch {
    return false;
  }
}
export function isYoutube(u) {
  try {
    const h = new URL(u).hostname.replace(/^www\.|^m\./, "");
    return h === "youtu.be" || h === "youtube.com";
  } catch {
    return false;
  }
}
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
