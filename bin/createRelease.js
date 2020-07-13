#! /usr/bin/env node
const chalk = require('chalk')
const { Octokit } = require('@octokit/rest')

const { readConfig } = require('../lib/config')
const { GitHubService } = require('../lib/github')
const { composeReleaseBody, defaultFormatter, defaultCategorizer } = require('../lib/release')

const NOT_FOUND_MESSAGE = `
GitHub API returned 404 Not Found when creating the new release. This probably means two things:
  1. You have valid API Token
  2. However, he user doesn't have sufficient permissions on the repository. So please make sure that they are at least a "Maintainer".
`.trim()

async function main () {
  const config = getConfig()

  try {
    const gh = new GitHubService(
      new Octokit({ auth: config.gitHubToken }),
      config.repoOwner,
      config.repoName)

    const release = await createRelease(gh, {
      targetTag: config.targetTag
    })

    console.log('Release created: ' + release.html_url)
  } catch (error) {
    handleError(error)
  }
}

function getConfig () {
  try {
    return readConfig()
  } catch (error) {
    console.error(error)
    process.exit(2)
  }
}

/**
 * @param {import('../lib/github').GitHubService} gh
 */
async function createRelease (gh, { targetTag }) {
  const previousTag = await gh.getPreviousTag(targetTag)
  const commits = await gh.compareCommits(previousTag, targetTag)

  const body = composeReleaseBody(commits, defaultFormatter, defaultCategorizer)

  return gh.createRelease(targetTag, body)
}

function handleError (error, continueOnError) {
  if (error.status === 404) {
    console.error(chalk.red(NOT_FOUND_MESSAGE))
    console.error(error.stack)
  } else {
    console.error(error)
  }

  if (continueOnError) {
    console.log('Continuing because continue-on-error is set to true.')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main()
