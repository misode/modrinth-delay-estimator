const API = 'https://api.modrinth.com/v2'
const USER_AGENT = 'github.com/misode/modrinth-delay-estimator'
const SAMPLE_SIZE = 50

const PROJECT_TYPES = {
  mod: [["project_type:mod"],["project_types!=datapack"],["project_types!=plugin"]],
  datapack: [["project_type:datapack"]],
  plugin: [["project_type:plugin"]],
  resourcepack: [["project_type:resourcepack"]],
  shader: [["project_type:shader"]],
  modpack: [["project_type:modpack"]],
}

async function main() {
  addLine(`Analyzing the ${SAMPLE_SIZE} newest projects of each type in search...`)
  document.body.appendChild(document.createElement('br'))

  const allProjects = []
  for (const [projectType, facets] of Object.entries(PROJECT_TYPES)) {
    const projects = await downloadProjects(facets)
    allProjects.push(...projects)
    const top = projects[0]
    addLine(`The most recently <strong>${projectType}</strong> "<a href="https://modrinth.com/project/${top.id}" target="_blank">${top.title}</a>" was approved ${formatDuration(new Date() - top.approved)} ago`)
    addLine(`The average review time for these projects was <strong>${formatDuration(avgDelay(projects))}</strong>`)
    document.body.appendChild(document.createElement('br'))
  }

  addLine(`Combined, the average review time for all these projects was <strong>${formatDuration(avgDelay(allProjects))}</strong>`)
  document.body.appendChild(document.createElement('br'))

  await new Promise((res) => setTimeout(res, 1000))
  addLine(`Keep in mind that this is only an estimate and current review delays will vary`)
  document.body.appendChild(document.createElement('br'))

  await new Promise((res) => setTimeout(res, 5000))
  const p = document.createElement('p')
  p.textContent = 'Made by Misode - Check out '
  const a = document.createElement('a')
  a.textContent = 'this project on GitHub'
  a.href = 'https://github.com/misode/modrinth-delay-estimator'
  a.target = '_blank'
  p.appendChild(a)
  document.body.appendChild(p)
}

function addLine(text) {
  const p = document.createElement('p')
  p.innerHTML = text
  document.body.appendChild(p)
}

function formatDuration(date) {
  const diff = Math.floor(date / 1000)
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);
  return parts.slice(0, 2).join(" and ");
}

async function downloadProjects(facets) {
  const url = `search?index=newest&limit=${SAMPLE_SIZE}&facets=${encodeURIComponent(JSON.stringify(facets))}`
  const search = await api(url)
  const ids = search.hits.map(p => p.project_id)
  const projects = await api(`projects?ids=${JSON.stringify(ids)}`)
  projects.sort((a, b) => new Date(a.approved) > new Date(b.approved) ? -1 : 0)

  let results = []
  for (const p of projects) {
    const approved = new Date(p.approved)
    const queued = new Date(p.queued)
    if (approved.getUTCFullYear() < 2000 || queued.getFullYear() < 2000) {
      continue
    }
    results.push({
      id: p.id,
      title: p.title,
      approved,
      queued,
      delay: approved - queued,
    })
  }
  return results
}

function avgDelay(projects) {
  let totalDelay = 0
  const accountedProjects = new Set()
  for (const project of projects) {
    if (!accountedProjects.has(project.id)) {
      totalDelay += project.delay
    }
    accountedProjects.add(project.id)
  }
  return totalDelay / accountedProjects.size
}

async function api(url) {
  const res = await fetch(`${API}/${url}`, { headers: {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
  } })
  return await res.json()
}

main()
