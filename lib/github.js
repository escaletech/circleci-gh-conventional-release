const semver = require('semver')

class GitHubService {
  /**
   * @param {import('@octokit/rest').Octokit} gh
   * @param {string} repoOwner
   * @param {string} repoName
   */
  constructor (gh, repoOwner, repoName) {
    this.gh = gh
    this.repo = { owner: repoOwner, repo: repoName }
  }

  /**
   * @param {string} targetTag
   * @returns {Promise<string>}
   */
  async getPreviousTag (targetTag) {
    const tagResponse = await this.gh.repos.listTags(this.repo)

    return semver
      .sort(tagResponse.data.map(tag => tag.name))
      .reverse()
      .find(tag => semver.lt(tag, targetTag))
  }

  /**
   * @param {string} base
   * @param {string} head
   */
  async compareCommits (base, head) {
    if (!base) {
      const res = await this.gh.repos.listCommits({
        sha: head,
        per_page: 100,
        ...this.repo
      })

      return res.data
    }

    const res = await this.gh.repos.compareCommits({
      base,
      head,
      ...this.repo
    })

    return res.data.commits
  }

  /**
   * @param {string} tag
   * @param {string} body
   */
  async createRelease (tag, body) {
    const res = await this.gh.repos.createRelease({
      tag_name: tag,
      name: tag,
      body: body,
      ...this.repo
    })

    return res.data
  }
}

module.exports.GitHubService = GitHubService
