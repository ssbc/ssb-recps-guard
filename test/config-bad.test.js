const test = require('tape')
const Server = require('./test-bot')

test('config - bad', t => {
  t.plan(1)

  const config = {
    recpsGuard: {
      allowedTypes: ['pub', ['dog']]
    }
  }
  t.throws(
    () => Server(config),
    /recps-guard: expects allowedTypes to be an Array of Strings/,
    'throws on bad config'
  )
})
