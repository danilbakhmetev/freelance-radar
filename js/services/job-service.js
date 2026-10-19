import { fetchRemotiveJobs } from "./sources/remotive.js";
import { fetchRemoteOKJobs } from "./sources/remoteok.js";
import { fetchArbeitnowJobs } from "./sources/arbeitnow.js";
import { fetchTheMuseJobs } from "./sources/themuse.js";

const SOURCES = [
  { name: "Remotive", fetch: fetchRemotiveJobs },
  { name: "Remote OK", fetch: fetchRemoteOKJobs },
  { name: "Arbeitnow", fetch: fetchArbeitnowJobs },
  { name: "The Muse", fetch: fetchTheMuseJobs }
];

export async function loadAllJobs() {
  const settled = await Promise.allSettled(SOURCES.map(source => source.fetch()));
  const jobs = [];
  const errors = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") jobs.push(...result.value);
    else errors.push(SOURCES[index].name + ": " + (result.reason?.message || "источник временно недоступен"));
  });
  const seen = new Set();
  const unique = jobs.filter(job => {
    const normalizedTitle = job.title.toLocaleLowerCase("ru").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const normalizedCompany = job.company.toLocaleLowerCase("ru").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const key = job.url || normalizedTitle + "|" + normalizedCompany;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => {
    const da = Date.parse(a.published || "") || 0;
    const db = Date.parse(b.published || "") || 0;
    return db - da;
  });
  return { jobs: unique, errors };
}

export function normalizeJob(raw, source) {
  const clean = value => String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
  const safeUrl = value => {
    try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; }
    catch { return ""; }
  };
  const rawDate = raw.publication_date || raw.created_at || raw.date || "";
  return {
    id: source.toLowerCase().replace(/\s+/g, "-") + ":" + String(raw.id || raw.slug || raw.url || clean(raw.title || raw.position)),
    title: clean(raw.title || raw.position || "Вакансия без названия"),
    company: clean(raw.company_name || raw.company || "Компания не указана"),
    pay: clean(raw.salary || raw.salary_text || ""),
    desc: clean(raw.description || raw.description_text || "Описание не предоставлено").slice(0, 280),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 4).map(clean).filter(Boolean) : (raw.category ? [clean(raw.category)] : []),
    remote: raw.remote === true || /remote|worldwide|anywhere|удалён/i.test(String(raw.location || raw.candidate_required_location || "")) || source === "Remotive" || source === "Remote OK",
    url: safeUrl(raw.url || raw.apply_url || raw.job_url),
    source,
    location: clean(raw.location || raw.candidate_required_location || (raw.remote ? "Удалённо" : "")),
    published: rawDate || (raw.epoch ? new Date(Number(raw.epoch) * 1000).toISOString() : ""),
    responses: null
  };
}
