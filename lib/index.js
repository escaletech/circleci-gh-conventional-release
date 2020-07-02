#! /usr/bin/env node
const { createRelease } = require('./release')

const config = {
  gitHubToken: process.env.GITHUB_TOKEN,
  targetTag: process.env.TARGET_TAG,
  repoOwner: process.env.REPO_OWNER,
  repoName: process.env.REPO_NAME,
  continueOnError: process.env.CONTINUE_ON_ERROR === 'true'
}

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
    console.error(error)
    if (config.continueOnError) {
      console.log('Continuing because continue-on-error is set to true.')
    } else {
      process.exit(1)
    }
  }
}

main()
