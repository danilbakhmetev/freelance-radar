import { fetchRemotiveJobs } from "./sources/remotive.js";
import { fetchRemoteOKJobs } from "./sources/remoteok.js";
import { fetchArbeitnowJobs } from "./sources/arbeitnow.js";

const SOURCES = [fetchRemotiveJobs, fetchRemoteOKJobs, fetchArbeitnowJobs];

export async function loadAllJobs() {
  const settled = await Promise.allSettled(SOURCES.map(source => source()));
  const jobs = [];
  const errors = [];
  for (const result of settled) {
    if (result.status === "fulfilled") jobs.push(...result.value);
    else errors.push(result.reason?.message || "Источник временно недоступен");
  }
  const seen = new Set();
  const unique = jobs.filter(job => {
    const key = (job.url || "") + "|" + job.title.toLowerCase() + "|" + job.company.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
  return { jobs: unique, errors };
}

export function normalizeJob(raw, source) {
  const text = value => String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const safeUrl = value => {
    try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; }
    catch { return ""; }
  };
  return {
    id: String(raw.id || raw.slug || (source + "-" + text(raw.title) + "-" + text(raw.company_name || raw.company))),
    icon: "briefcase-business",
    title: text(raw.title || raw.position || "Вакансия без названия"),
    company: text(raw.company_name || raw.company || "Компания не указана"),
    pay: text(raw.salary || raw.salary_text || ""),
    desc: text(raw.description || raw.description_text || "Описание не предоставлено").slice(0, 280),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 4).map(text).filter(Boolean) : [],
    remote: raw.remote === true || /remote|worldwide|anywhere|удалён/i.test(String(raw.location || raw.candidate_required_location || "")) || source === "Remotive" || source === "Remote OK",
    url: safeUrl(raw.url || raw.apply_url || raw.job_url),
    source,
    location: text(raw.location || raw.candidate_required_location || (raw.remote ? "Удалённо" : "")),
    published: raw.publication_date || raw.created_at || raw.date || (raw.epoch ? new Date(Number(raw.epoch) * 1000).toISOString() : ""),
    responses: null
  };
}
