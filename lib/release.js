const { Octokit } = require('@octokit/rest')
const semver = require('semver')

const categories = {
  feat: ':rocket: Features',
  fix: ':beetle: Bug fixes',
  '*': ':alien: Other'
}

module.exports.createRelease = async function createRelease ({
  gitHubToken,
  targetTag,
  repoOwner,
  repoName
}) {
  const repo = { owner: repoOwner, repo: repoName }
  const gh = new Octokit({ auth: gitHubToken })

  const tagResponse = await gh.repos.listTags(repo)

  const previousTag = semver
    .sort(tagResponse.data.map(tag => tag.name))
    .reverse()
    .find(tag => semver.lt(tag, targetTag))

  const comp = await gh.repos.compareCommits({
    base: previousTag,
    head: targetTag,
    ...repo
  })

  const getChange = commit => {
    const firstLine = commit.commit.message.split('\n')[0]
    const change = firstLine.replace(/^[\w()]+!?:\s*/, '')
    return `* ${change.charAt(0).toUpperCase() + change.slice(1)} @${commit.author.login}`
  }

  const getCategory = message =>
    /^([\w()]+)!?:*/.exec(message)[1].toLowerCase()

  const allChanges = comp.data.commits.map(c => ({
    message: getChange(c),
    category: getCategory(c.commit.message)
  }))

  const knownKinds = new Set(Object.keys(categories).filter(k => k !== '*'))
  const body = Object.entries(categories)
    .map(([category, title]) => {
      const changes = category === '*'
        ? allChanges.filter(c => !knownKinds.has(c.category))
        : allChanges.filter(c => c.category === category)
      return changes.length > 0
        ? `### ${title}\n${changes.map(c => c.message).join('\n')}`
        : undefined
    })
    .filter(summary => summary !== undefined)
    .join('\n\n')

  const payload = {
    ...repo,
    tag_name: targetTag,
    name: targetTag,
    body: body
  }

  const res = await gh.repos.createRelease(payload)
  return res.data
}
