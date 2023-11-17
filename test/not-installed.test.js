const Server = require('scuttle-testbot')
const test = require('tape')

test('not installed', t => {
  const ssb = Server // eslint-disable-line
    .use(require('ssb-private1'))
    .call(null, {
      db1: true
    })

  const content = { type: 'profile' }

  ssb.publish({ content, options: { allowPublic: true } }, (err) => {
    t.match(err.message, /type must be a string/)
    ssb.close(t.end)
  })
})
