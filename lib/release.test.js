const { composeReleaseBody, defaultFormatter, defaultCategorizer } = require('./release')

describe('composeReleaseBody', () => {
  it('should return empty body', () => {
    const body = composeReleaseBody([])
    expect(body).toEqual('')
  })

  it('should return changes separated by category sorted by weights', () => {
    const formatter = commit => `* ${commit.commit.message}`
    const categorizer = message => {
      const kind = message.split(':')[0]
      return {
        id: kind,
        heading: kind.toUpperCase(),
        weight: kind.length
      }
    }

    const body = composeReleaseBody([
      { commit: { message: 'a: some feature' } },
      { commit: { message: 'ccc: describe getting started' } },
      { commit: { message: 'bb: correct a bug' } },
      { commit: { message: 'a: another feature' } }
    ], formatter, categorizer)

    expect(body).toEqual(
`### CCC
* ccc: describe getting started

### BB
* bb: correct a bug

### A
* a: some feature
* a: another feature`
    )
  })
})

describe('defaultFormatter', () => {
  it('should strip type from subject and append author', () => {
    const commit = {
      commit: { message: 'feat: some feature' },
      author: { login: 'johndoe' }
    }
    expect(defaultFormatter(commit)).toEqual('* Some feature @johndoe')
  })
})

describe('defaultCategorizer', () => {
  it('should identify features', () => {
    expect(defaultCategorizer('feat: this is a feature')).toEqual({
      id: 'feat',
      heading: ':rocket: Features',
      weight: 2
    })
  })

  it('should identify bug fixes', () => {
    expect(defaultCategorizer('fix: this is a bug fix')).toEqual({
      id: 'fix',
      heading: ':beetle: Bug fixes',
      weight: 1
    })
  })

  it('everything else should go in Other', () => {
    expect(defaultCategorizer('anything else')).toEqual({
      id: 'other',
      heading: ':alien: Other',
      weight: 0
    })
  })
})
