const test = require('tape')
const Server = require('scuttle-testbot')

test('installed in right order', t => {
  t.plan(2)

  const content = { type: 'thingee' }

  var server = Server // eslint-disable-line
    .use({
      name: 'goodHook',
      manifest: {},
      init: (ssb) => {
        ssb.publish.hook((fn, args) => {
          t.deepEqual(args[0], content, 'earlier plugins see just "content"')
          fn(...args)
        })
      }
    })
    .use(require('../')) // ssb-recps-guard
    .call(null, {
      db1: true
    })

  const input = {
    content,
    options: { allowPublic: true }
  }

  server.publish(input, (err, msg) => {
    t.error(err)
    server.close()
  })
})

// SKIP: TRUE
// things start in secret-stack which cannot be closed after ssb-recps-guard throws
// so these tests pass but never end ...

test('installed in wrong order', { skip: true }, t => {
  t.plan(2) // goodHook + throw

  var server
  t.throws(
    () => {
       server = Server // eslint-disable-line
        .use({
          name: 'goodHook',
          manifest: {},
          init: (ssb) => {
            ssb.publish.hook((fn, args) => {
              fn(...args)
            })

            t.ok(true, 'hook before recps-guard')
          }
        })
        .use(require('../')) // ssb-recps-guard
        .use({
          name: 'naughtyHook',
          manifest: {},
          init: (ssb) => {
            ssb.publish.hook((fn, args) => {
            })
            t.ok(false, 'naughtyHook should not be seen')
          }
        })
        .call(null, {})
    },
    /ssb-recps-guard must be the last to hook ssb.publish/
  )

  server.close() // server is undefined!
})
