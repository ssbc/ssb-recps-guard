const { promisify: p } = require('util')
const test = require('tape')
const Server = require('./test-bot')

test('db2', async t => {
  const server = Server({ db1: false })
  t.deepEqual(server.recpsGuard.allowedTypes(), [], 'recps.allowedTypes')

  let content = { type: 'profile' }
  await p(server.db.create)({ content })
    .then(msg => t.error(msg, "shouldn't get msg on err"))
    .catch((err) => {
      t.match(err.message, /recps-guard: public messages of type "profile" not allowed/, 'public blocked')
    })
  await p(server.tribes.publish)(content)
    .then(msg => t.error(msg, "shouldn't get msg on err"))
    .catch((err) => {
      t.match(err.message, /tribes.publish requires content.recps/, "tribes.publish can't publish public at all")
    })

  content = { type: 'profile', recps: [server.id] }
  await p(server.db.create)({ content })
    .then(data => {
      t.equal(typeof data.value.content, 'string', '(msg content encrypted)')
    })
    .catch(err => {
      t.error(err, 'msgs with recps allowed')
    })

  content = { type: 'profile', name: 'mix' }
  await p(server.db.create)({ content, allowPublic: true })
    .then(data => {
      t.deepEqual(data.value.content, content, '(msg content unencrypted, allowPublic pruned). db.create')
    })
    .catch(err => {
      t.error(err, 'msgs { content, { allowPublic: true } db.create')
    })

  const weird = {
    content: { type: 'profile', recps: [server.id] },
    allowPublic: true
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

  await p(server.close)()
})

test('can create a group', async t => {
  const server = Server({ db1: false })

  const group = await p(server.tribes.create)({})
  t.equal(typeof group.groupId, 'string', 'created group with groupId')

  await p(server.close)()
})
