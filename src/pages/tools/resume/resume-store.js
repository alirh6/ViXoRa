// 🗄️ ViXoRa Resume Store — ذخیره‌سازی رزومه‌ها و قالب‌های سفارشی
// src/pages/tools/resume/resume-store.js

const DOCS_KEY = 'vixora:resumes';
const TPLS_KEY = 'vixora:resume-customtpls';

function read(key, fb) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fb : JSON.parse(v);
  } catch { return fb; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
}

export function listDocs() {
  const d = read(DOCS_KEY, []);
  return Array.isArray(d) ? d.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) : [];
}
export function getDoc(id) {
  return listDocs().find((d) => String(d.id) === String(id)) || null;
}
export function saveDoc(doc) {
  const docs = listDocs().filter((d) => String(d.id) !== String(doc.id));
  doc.updatedAt = Date.now();
  docs.unshift(doc);
  write(DOCS_KEY, docs.slice(0, 100));
  return doc;
}
export function deleteDoc(id) {
  write(DOCS_KEY, listDocs().filter((d) => String(d.id) !== String(id)));
}
export function newDocId() {
  return 'rs' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}

export function blankData() {
  return {
    photo: '', fullName: '', title: '', email: '', phone: '', city: '', country: '',
    linkedin: '', website: '', github: '', summary: '', objective: '',
    skills: [], languages: [], exp: [], edu: [], certs: [], projects: [], refs: [],
    personal: { dob: '', pob: '', nat: '', marital: '', gender: '', address: '', visa: '', military: '', children: '' },
    hobbies: '', decl: { name: '', place: '', date: '' },
  };
}

export function listCustomTpls() {
  const t = read(TPLS_KEY, []);
  return Array.isArray(t) ? t : [];
}
export function saveCustomTpl(tpl) {
  const arr = listCustomTpls().filter((t) => t.id !== tpl.id);
  arr.unshift({ ...tpl, custom: true });
  write(TPLS_KEY, arr.slice(0, 50));
}
export function deleteCustomTpl(id) {
  write(TPLS_KEY, listCustomTpls().filter((t) => t.id !== id));
}

/** فشرده‌سازی عکس به dataURL سبک (حداکثر ۴۰۰px) */
export function fileToPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('not-image')); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const max = 400;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load-fail')); };
    img.src = url;
  });
}
