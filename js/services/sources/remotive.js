import { normalizeJob } from "../job-service.js";
export async function fetchRemotiveJobs() {
  const response = await fetch("https://remotive.com/api/remote-jobs?limit=100", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Remotive: HTTP " + response.status);
  const data = await response.json();
  if (!Array.isArray(data.jobs)) throw new Error("Remotive: неожиданный формат ответа");
  return data.jobs.map(job => normalizeJob(job, "Remotive")).filter(job => job.url);
}
