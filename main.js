const API = 'https://api.modrinth.com/v2'
const USER_AGENT = 'github.com/misode/modrinth-delay-estimator'

async function main() {
  addLine(`Analyzing the 25 newest projects in search...`)

  const search = await api(`search?index=newest&limit=25`)
  const ids = search.hits.map(p => p.project_id)
  const projects = await api(`projects?ids=${JSON.stringify(ids)}`)

  projects.sort((a, b) => new Date(a.approved) > new Date(b.approved) ? -1 : 0)
  addLine(`The most recent project in search "${projects[0].title}" was approved ${formatDuration(new Date(projects[0].approved))} ago`)

  const delays = projects.map(p => new Date(p.approved) - new Date(p.queued))
  const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length
  await new Promise((res) => setTimeout(res, 400))
  addLine(`The average review time for these projects was ${formatDuration(avgDelay)}`)

  await new Promise((res) => setTimeout(res, 1000))
  addLine(`Keep in mind that this is only an estimate and current review delays will vary`)
}

function addLine(text) {
  const p = document.createElement('p')
  p.textContent = text
  document.body.appendChild(p)
}

function formatDuration(date) {
  const diff = typeof date === 'number' ? Math.floor(date / 1000) : Math.floor((new Date() - date) / 1000)
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);
  if (seconds > 0) parts.push(`${seconds} seconds`);
  return parts.slice(0, 2).join(" and ");
}

async function api(url) {
  const res = await fetch(`${API}/${url}`, { headers: {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
  } })
  return await res.json()
}

main()
