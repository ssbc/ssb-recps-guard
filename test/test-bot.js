const Server = require('scuttle-testbot')

module.exports = function (opts) {
  // opts = {
  //   name: String,
  //   keys: SecretKeys,
  //   startUnclean: Boolean
  // }

  return Server // eslint-disable-line
    .use(require('ssb-private1'))
    .use(require('../')) // ssb-recps-guard
    .call(null, {
      ...opts,
      db1: true
    })
}
