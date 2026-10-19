import { normalizeJob } from "../job-service.js";
export async function fetchRemoteOKJobs() {
  const response = await fetch("https://remoteok.com/api", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Remote OK: HTTP " + response.status);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Remote OK: неожиданный формат ответа");
  return data.filter(job => job && (job.position || job.title) && job.id).map(job => normalizeJob({
    ...job, title: job.position || job.title, company_name: job.company, url: job.url || job.apply_url,
    publication_date: job.date || (job.epoch ? new Date(Number(job.epoch) * 1000).toISOString() : ""),
    tags: Array.isArray(job.tags) ? job.tags : []
  }, "Remote OK")).filter(job => job.url);
}
