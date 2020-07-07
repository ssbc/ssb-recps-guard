const test = require('tape')
const Server = require('./test-bot')
const coreTests = require('./core-tests')

test('config - allowedTypes', t => {
  const config = {
    recpsGuard: {
      allowedTypes: ['pub', 'contact']
    }
  }
  const server = Server(config)

  console.log('standard behaviour:')
  coreTests(server, t, (err) => {
    if (err) throw err

    console.log('allowedTypes:')

    const msg = { type: 'contact', name: 'mix' }
    server.publish(msg, (err, data) => {
      t.error(err, 'allowedType passes through')
      t.deepEqual(data.value.content, msg, '(msg content unencrypted)')

      server.close(t.end())
    })
  })
})
