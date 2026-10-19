import { loadAllJobs } from "./services/job-service.js";

const $ = id => document.getElementById(id);
const STORAGE_KEY = "freelance-radar-v2";
let jobs = [];
let loading = true;
let errors = [];
let filter = "all";
let page = "jobs";
let saved = new Set();
let settings = { remoteOnly: false, currency: "Любая валюта" };

function readStorage() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    saved = new Set(Array.isArray(value.saved) ? value.saved : []);
    settings = { ...settings, ...(value.settings || {}) };
  } catch (_) {}
  $("remoteOnly").checked = !!settings.remoteOnly;
  $("currency").value = [...$("currency").options].some(o => o.value === settings.currency || o.text === settings.currency)
    ? settings.currency : "Любая валюта";
}
function saveStorage() {
  settings.remoteOnly = $("remoteOnly").checked;
  settings.currency = $("currency").value;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved: [...saved], settings })); }
  catch (_) { toast("Не удалось сохранить настройки в этом браузере"); }
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1800);
}
function publishedLabel(value) {
  if (!value) return "Дата публикации не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата публикации не указана";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Опубликовано только что";
  if (minutes < 60) return "Опубликовано " + minutes + " мин. назад";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "Опубликовано " + hours + " ч. назад";
  const days = Math.floor(hours / 24);
  if (days < 30) return "Опубликовано " + days + " дн. назад";
  return "Опубликовано " + date.toLocaleDateString("ru-RU", { day:"numeric", month:"short", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}
function filteredJobs() {
  const query = $("search").value.trim().toLocaleLowerCase("ru");
  return jobs.filter(job => {
    const haystack = [job.title, job.company, job.desc, ...(job.tags || [])].join(" ").toLocaleLowerCase("ru");
    if (query && !haystack.includes(query)) return false;
    if ((filter === "remote" || $("remoteOnly").checked) && !job.remote) return false;
    if (filter === "saved" && !saved.has(job.id)) return false;
    return true;
  });
}
function render() {
  const list = filteredJobs();
  $("count").textContent = list.length + " вакансий";
  $("savedCount").textContent = saved.size + " сохранённых вакансий";
  document.querySelectorAll(".filter").forEach(button => button.classList.toggle("active", button.dataset.filter === filter));
  if (loading && jobs.length === 0) {
    $("cards").innerHTML = '<div class="empty"><i data-lucide="loader-circle"></i><strong>Загружаем вакансии</strong>Подключаем открытые источники…</div>';
  } else if (list.length === 0) {
    $("cards").innerHTML = '<div class="empty"><i data-lucide="search-x"></i><strong>' + (errors.length && jobs.length === 0 ? "Вакансии пока не загрузились" : "Ничего не найдено") + '</strong>' + (errors.length && jobs.length === 0 ? "Проверь соединение и нажми «Обновить» ниже." : "Измени запрос или фильтр.") + '</div>';
  } else {
    $("cards").innerHTML = list.map(job => {
      const pay = job.pay || "Зарплата не указана";
      const tags = (job.tags || []).map(tag => '<span class="tag">' + esc(tag) + '</span>').join("");
      return '<article class="job"><div class="jobtop"><div class="jobicon"><i data-lucide="briefcase-business"></i></div><div class="jobmain"><h3>' + esc(job.title) + '</h3><div class="company">' + esc(job.company) + '</div></div><div class="pay">' + esc(pay) + '</div></div>' +
        '<p class="desc">' + esc(job.desc || "Описание не предоставлено") + '</p>' +
        '<div class="jobmeta"><span class="metaitem"><i data-lucide="clock-3"></i>' + esc(publishedLabel(job.published)) + '</span><span class="metaitem"><i data-lucide="messages-square"></i>Отклики: ' + esc(job.responses == null ? "нет данных" : job.responses) + '</span></div>' +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
        '<div class="jobfoot"><span class="source"><i data-lucide="globe-2"></i><a href="' + esc(job.url) + '" target="_blank" rel="noopener noreferrer">' + esc(job.source) + '</a>' + (job.location ? " · " + esc(job.location) : "") + '</span>' +
        '<button class="save ' + (saved.has(job.id) ? "saved" : "") + '" data-save="' + esc(job.id) + '" aria-label="Сохранить вакансию"><i data-lucide="' + (saved.has(job.id) ? "bookmark-check" : "bookmark") + '"></i></button></div></article>';
    }).join("");
  }
  const successful = jobs.length > 0;
  const sourceNames = ["Remotive", "Remote OK", "Arbeitnow"];
  const goodNames = [...new Set(jobs.map(job => job.source))];
  $("sourceNotice").innerHTML = '<i data-lucide="radio-tower"></i><div><b>' +
    (loading ? "Загружаем источники…" : (jobs.length + " вакансий из " + goodNames.length + " источников")) +
    '</b>' + (errors.length ? '<p>' + esc(errors.join(" · ")) + '</p>' : '') +
    '<button class="action" id="refreshJobs" style="margin-top:9px"><i data-lucide="refresh-cw"></i> Обновить</button></div>';
  $("settingsSources").textContent = sourceNames.map(name => name + (goodNames.includes(name) ? " — подключён" : errors.some(error => error.startsWith(name + ":")) ? " — ошибка загрузки" : " — пока нет данных")).join(" · ");
  if (window.lucide) window.lucide.createIcons();
}
async function refreshJobs() {
  loading = true;
  errors = [];
  render();
  try {
    const result = await loadAllJobs();
    jobs = result.jobs;
    errors = result.errors;
  } catch (error) {
    errors = [error?.message || "Не удалось загрузить источники"];
  } finally {
    loading = false;
    render();
  }
}
function setPage(nextPage) {
  page = nextPage;
  $("jobsPage").classList.toggle("active", page === "jobs");
  $("settingsPage").classList.toggle("active", page === "settings");
  document.querySelectorAll(".nav-btn").forEach(button => {
    const active = button.dataset.page === page;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
readStorage();
document.querySelectorAll(".nav-btn").forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => { filter = button.dataset.filter; render(); }));
$("search").addEventListener("input", render);
$("cards").addEventListener("click", event => {
  const button = event.target.closest("[data-save]");
  if (!button) return;
  const id = button.dataset.save;
  if (saved.has(id)) { saved.delete(id); toast("Убрано из избранного"); }
  else { saved.add(id); toast("Сохранено в избранное"); }
  saveStorage();
  render();
});
$("remoteOnly").addEventListener("change", () => { saveStorage(); render(); });
$("currency").addEventListener("change", () => { saveStorage(); toast("Настройка сохранена"); });
$("showSaved").addEventListener("click", () => { filter = "saved"; setPage("jobs"); render(); });
document.addEventListener("click", event => { if (event.target.closest("#refreshJobs")) refreshJobs(); });
if (window.lucide) window.lucide.createIcons();
render();
refreshJobs();
