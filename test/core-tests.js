const { promisify: p } = require('util')

module.exports = async (server, t, cb) => {
  let description, content, input

  description = 'public blocked'
  content = { type: 'profile' }
  await p(server.publish)(content)
    .then(() => t.fail(description))
    .catch(err => {
      t.match(err.message, /recps-guard: public messages of type "profile" not allowed/, description)
    })

  description = 'msgs with recps allowed'
  content = { type: 'profile', recps: [server.id] }
  await p(server.publish)(content)
    .then(data => t.equal(typeof data.value.content, 'string', description))
    .catch(err => t.error(err, description))

  description = 'pre-encrypted content published fine'
  content = Buffer.from('cats are cool').toString('base64') + '.box7'
  await p(server.publish)(content)
    .then(data => t.equal(typeof data.value.content, 'string', description))
    .catch(err => t.fail(err, description))

  description = 'msgs { content, allowPublic: true } allowed'
  content = { type: 'profile', name: 'mix' }
  input = { content, allowPublic: true }
  await p(server.publish)(input)
    .then(data => t.deepEqual(data.value.content, content, description))
    .catch(err => t.fail(err, description))

  description = 'legacy: msgs { content, options: { allowPublic: true } }'
  content = { type: 'profile', name: 'mix' }
  input = { content, options: { allowPublic: true } }
  await p(server.publish)(input)
    .then(data => t.deepEqual(data.value.content, content, description))
    .catch(err => t.fail(err, description))

  description = 'disallow recps AND allowPublic'
  input = {
    content: { type: 'profile', recps: [server.id] },
    allowPublic: true
  }
  await p(server.publish)(input)
    .then(() => t.fail(description))
    .catch(err => t.match(
      err.message,
      /recps-guard: should not have recps && allowPublic, check your code/,
      'disallow recps AND allowPublic'
    ))

  cb(null)
}
