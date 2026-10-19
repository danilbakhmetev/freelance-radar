import { normalizeJob } from "../job-service.js";

export async function fetchTheMuseJobs() {
  const response = await fetch("https://www.themuse.com/api/public/jobs?page=0&descending=true", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("The Muse: HTTP " + response.status);
  const payload = await response.json();
  if (!Array.isArray(payload.results)) throw new Error("The Muse: неожиданный формат ответа");
  return payload.results.map(job => {
    const locations = Array.isArray(job.locations) ? job.locations.map(location => location.name).filter(Boolean) : [];
    const categories = Array.isArray(job.categories) ? job.categories.map(category => category.name).filter(Boolean) : [];
    const levels = Array.isArray(job.levels) ? job.levels.map(level => level.name).filter(Boolean) : [];
    const refs = Array.isArray(job.refs) ? job.refs : [];
    const landing = refs.find(ref => ref && ref.landing_page)?.landing_page;
    const company = job.company && typeof job.company === "object" ? job.company.name : job.company;
    return normalizeJob({
      id: job.id,
      title: job.name || job.title,
      company_name: company,
      url: landing || job.url,
      publication_date: job.publication_date || job.created_at || "",
      location: locations.join(", "),
      tags: [...categories, ...levels],
      description: job.contents || job.description || "",
      remote: locations.some(name => /remote|flexible/i.test(name))
    }, "The Muse");
  }).filter(job => job.url);
}
