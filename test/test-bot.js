const Server = require('scuttle-testbot')

module.exports = function (opts = {}) {
  // opts = {
  //   name: String,
  //   keys: SecretKeys,
  //   startUnclean: Boolean
  // }

  if (opts.db1 !== false) {
    return Server // eslint-disable-line
      .use(require('ssb-private1'))
      .use(require('../')) // ssb-recps-guard
      .call(null, {
        db1: true,
        ...opts
      })
  }
  return Server // eslint-disable-line
    .use(require('ssb-db2/core'))
    .use(require('ssb-classic'))
    .use(require('ssb-box'))
    .use(require('ssb-box2'))
    .use(require('ssb-db2/compat'))
    .use(require('ssb-db2/compat/feedstate'))
    .use(require('ssb-tribes'))
    .use(require('../')) // ssb-recps-guard
    .call(null, {
      box2: {
        legacyMode: true
      },
      ...opts,
      noDefaultUse: true
    })
}
