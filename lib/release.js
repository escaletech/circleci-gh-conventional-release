const { Octokit } = require('@octokit/rest')
const { GitHubService } = require('./github')

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
  const gh = new GitHubService(new Octokit({ auth: gitHubToken }), repoOwner, repoName)

  return createReleaseWithService(gh, targetTag)
}

/**
 * @param {import('./github').GitHubService} gh
 * @param {string} targetTag
 */
async function createReleaseWithService (gh, targetTag) {
  const previousTag = await gh.getPreviousTag(targetTag)
  const commits = await gh.repo(previousTag, targetTag)

  const getChange = commit => {
    const firstLine = commit.commit.message.split('\n')[0]
    const change = firstLine.replace(/^[\w()]+!?:\s*/, '')
    return `* ${change.charAt(0).toUpperCase() + change.slice(1)} @${commit.author.login}`
  }

  const getCategory = message =>
    /^([\w()]+)!?:*/.exec(message)[1].toLowerCase()

  const allChanges = commits.map(c => ({
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

  return gh.createRelease(targetTag, body)
}
