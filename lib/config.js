const requiredConfig = [
  'gitHubToken',
  'targetTag',
  'repoOwner',
  'repoName'
]

function readConfig () {
  const config = {
    gitHubToken: process.env.GITHUB_TOKEN,
    targetTag: process.env.TARGET_TAG,
    repoOwner: process.env.REPO_OWNER,
    repoName: process.env.REPO_NAME,
    continueOnError: process.env.CONTINUE_ON_ERROR === 'true'
  }

  const missingConfig = requiredConfig.filter(key => !config[key])
  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(', ')}`)
  }

  return config
}

module.exports.readConfig = readConfig
