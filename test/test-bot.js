const Server = require('scuttle-testbot')

module.exports = function (opts) {
  // opts = {
  //   name: String,
  //   keys: SecretKeys,
  //   startUnclean: Boolean
  // }

  return Server // eslint-disable-line
    .use(require('../')) // ssb-recps-guard
    .use(require('ssb-private1'))
    .call(null, opts)
}
