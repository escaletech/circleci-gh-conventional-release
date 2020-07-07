#! /usr/bin/env node
const chalk = require('chalk')

const { createRelease } = require('./release')

const config = {
  gitHubToken: process.env.GITHUB_TOKEN,
  targetTag: process.env.TARGET_TAG,
  repoOwner: process.env.REPO_OWNER,
  repoName: process.env.REPO_NAME
}

const continueOnError = process.env.CONTINUE_ON_ERROR === 'true'

const NOT_FOUND_MESSAGE = `
GitHub API returned 404 Not Found when creating the new release. This probably means two things:
  1. You have valid API Token
  2. However, he user doesn't have sufficient permissions on the repository. So please make sure that they are at least a "Maintainer".
`.trim()

async function main () {
  const missingConfig = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => key)
  if (missingConfig.length > 0) {
    console.error(`Missing configuration: ${missingConfig.join(', ')}`)
    process.exit(2)
  }

  try {
    const release = await createRelease(config)
    console.log('Release created: ' + release.html_url)
  } catch (error) {
    if (error.status === 404) {
      console.error(chalk.red(NOT_FOUND_MESSAGE))
      console.error(error.stack)
    } else {
      console.error(error)
    }
    if (continueOnError) {
      console.log('Continuing because continue-on-error is set to true.')
    } else {
      process.exit(1)
    }
  }
}

main()
