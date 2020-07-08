module.exports = (server, t, cb) => {
  const msg = { type: 'profile' }
  server.publish(msg, (err, data) => {
    t.match(err.message, /recps-guard: public messages of type "profile" not allowed/, 'public blocked')

    const msg = { type: 'profile', recps: [server.id] }
    server.publish(msg, (err, data) => {
      t.error(err, 'msgs with recps allowed')
      t.equal(typeof data.value.content, 'string', '(msg content encrypted)')

      const msg = Buffer.from('cats are cool').toString('base64') + '.box7'
      server.publish(msg, (err, data) => {
        t.error(err, 'pre-encrypted content published fine')
        t.equal(typeof data.value.content, 'string', '(msg content encrypted)')

        const content = { type: 'profile', name: 'mix' }
        server.publish({ content, options: { allowPublic: true } }, (err, data) => {
          if (err) return cb(err)
          t.error(err, 'msgs { content, options: { allowPublic: true } allowed')
          t.deepEqual(data.value.content, content, '(msg content unencrypted, allowPublic pruned)')

          const weird = {
            content: { type: 'profile', recps: [server.id] },
            options: { allowPublic: true }
          }
          server.publish(weird, (err, data) => {
            t.match(
              err.message,
              /recps-guard: should not have recps && allowPublic, check your code/,
              'disallow recps AND allowPublic'
            )

            cb(null)
          })
        })
      })
    })
  })
}
