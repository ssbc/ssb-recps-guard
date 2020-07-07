const test = require('tape')
const Server = require('./test-bot')
const coreTests = require('./core-tests')

test('config - default', t => {
  const server = Server()
  t.deepEqual(server.recpsGuard.allowedTypes(), [], 'recps.allowedTypes')

  coreTests(server, t, (err) => {
    if (err) throw err

    server.close(t.end)
  })
})
