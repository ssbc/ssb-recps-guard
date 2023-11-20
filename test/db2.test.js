const { promisify: p } = require('util')
const test = require('tape')
const Server = require('./test-bot')

test('db2', async t => {
  const server = Server({db1: false})
  t.deepEqual(server.recpsGuard.allowedTypes(), [], 'recps.allowedTypes')

  let content = { type: 'profile' }
  await p(server.db.create)({content})
    .then(msg => t.error(msg, "shouldn't get msg on err"))
    .catch((err) => {
      t.match(err.message, /recps-guard: public messages of type "profile" not allowed/, 'public blocked')
    })
  await p(server.tribes.publish)(content)
    .then(msg => t.error(msg, "shouldn't get msg on err"))
    .catch((err) => {
      t.match(err.message, /recps-guard: public messages of type "profile" not allowed/, 'public blocked')
    })

  content = { type: 'profile', recps: [server.id] }
  await p(server.db.create)({content})
    .then(data => {
      t.equal(typeof data.value.content, 'string', '(msg content encrypted)')
    })
    .catch(err => {
      t.error(err, 'msgs with recps allowed')
    })
  await p(server.tribes.publish)(content)
    .then(data => {
      t.equal(typeof data.value.content, 'string', '(msg content encrypted)')
    })
    .catch(err => {
      t.error(err, 'msgs with recps allowed')
    })

  content = { type: 'profile', name: 'mix' }
  await p(server.db.create)({ content, options: { allowPublic: true } })
    .then(data => {
      t.deepEqual(data.value.content, content, '(msg content unencrypted, allowPublic pruned). db.create')
    })
    .catch(err => {
      t.error(err, 'msgs { content, options: { allowPublic: true } allowed. db.create')
    })
  await p(server.tribes.publish)({ content, options: { allowPublic: true } })
    .then(data => {
      t.deepEqual(data.value.content, content, '(msg content unencrypted, allowPublic pruned). tribes.publish')
    })
    .catch(err => {
      t.error(err, 'msgs { content, options: { allowPublic: true } allowed. tribes.publish')
    })

  const weird = {
    content: { type: 'profile', recps: [server.id] },
    options: { allowPublic: true }
  }
  await p(server.db.create)(weird)
    .then(msg => {
      t.error(msg, "it's supposed to error. db.create")
    }).catch(err => {
      t.match(
        err.message,
        /recps-guard: should not have recps && allowPublic, check your code/,
        'disallow recps AND allowPublic. db.create'
      )
    })
  await p(server.tribes.publish)(weird)
    .then(msg => {
      t.error(msg, "it's supposed to error. tribes.publish")
    }).catch(err => {
      t.match(
        err.message,
        /recps-guard: should not have recps && allowPublic, check your code/,
        'disallow recps AND allowPublic. tribes.publish'
      )
    })

  await p(server.close)()
})
