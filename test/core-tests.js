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

        const msg = { type: 'profile', name: 'mix' }
        const modifiedMsg = Object.assign({ allowPublic: true }, msg)
        server.publish(modifiedMsg, (err, data) => {
          if (err) return cb(err)
          t.error(err, 'msgs allowPublic: true allowed')
          t.deepEqual(data.value.content, msg, '(msg content unencrypted, allowPublic pruned)')

          const weird = { type: 'profile', recps: [server.id], allowPublic: true }
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
