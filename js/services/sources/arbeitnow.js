import { normalizeJob } from "../job-service.js";
export async function fetchArbeitnowJobs() {
  const response = await fetch("https://www.arbeitnow.com/api/job-board-api", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Arbeitnow: HTTP " + response.status);
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error("Arbeitnow: неожиданный формат ответа");
  return payload.data.map(job => normalizeJob({
    ...job,
    id: job.slug || job.id,
    publication_date: job.created_at || job.createdAt || "",
    location: job.location || (job.remote ? "Удалённо" : ""),
    url: job.url || (job.slug ? "https://www.arbeitnow.com/view/" + job.slug : "")
  }, "Arbeitnow")).filter(job => job.url);
}
