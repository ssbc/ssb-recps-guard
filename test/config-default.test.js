const test = require('tape')
const Server = require('./test-bot')
const coreTests = require('./core-tests')

test('config - default', t => {
  const server = Server()

  coreTests(server, t, (err) => {
    if (err) throw err

    server.close(t.end)
  })
})
