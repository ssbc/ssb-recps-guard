const { promisify: p } = require('util')
const test = require('tape')

const Server = require('scuttle-testbot')

test('no-boxer', async t => {
  {
    const ssb = Server // eslint-disable-line
      .use(require('../')) // ssb-recps-guard
      .call(null, {
        db1: true
      })

    await p(ssb.publish)({ type: 'hello', recps: [ssb.id] })
      .then(res => t.fail('should fail'))
      .catch(err => { // eslint-disable-line
        t.pass('should fail')
        // console.log(err)
      })

    await p(ssb.close)(true)
  }

  {
    const ssb = Server // eslint-disable-line
      .use(require('ssb-db2/core'))
      .use(require('ssb-classic'))
      .use(require('ssb-db2/compat'))
      .use(require('ssb-db2/compat/feedstate'))
      // .use(require('ssb-box2'))
      // .use(require('ssb-tribes'))
      .use(require('../')) // ssb-recps-guard
      .call(null, {
        noDefaultUse: true,
        box2: {
          legacyMode: true
        }
      })

    const content = { type: 'hello', recps: [ssb.id] }
    await p(ssb.db.create)({ content, encryptionFormat: 'box2' })
      .then(res => t.fail('should fail'))
      .catch(err => { // eslint-disable-line
        t.pass('should fail')
        // console.log(err)
      })

    await p(ssb.close)(true)
  }

  t.end()
})
