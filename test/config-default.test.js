const test = require('tape')
const Server = require('./test-bot')

test('config - default', t => {
  const server = Server()

  const msg = { type: 'profile' }
  server.publish(msg, (err, data) => {
    t.match(err.message, /recps-guard: public messages of type "profile" not allowed/, 'public blocked')

    const msg = { type: 'profile', recps: [server.id] }
    server.publish(msg, (err, data) => {
      t.error(err, 'msgs with recps allowed')
      t.equal(typeof data.value.content, 'string', '(msg content encrypted)')

      const msg = { type: 'profile', name: 'mix' }
      const modifiedMsg = Object.assign({ allowPublic: true }, msg)

      server.publish(modifiedMsg, (err, data) => {
        t.error(err, 'msgs allowedPublic: true allowed')
        t.deepEqual(data.value.content, msg, '(msg content unencrypted, allowPublic pruned)')

        server.close(t.end())
      })
    })
  })
})
