const get = require('lodash.get')

module.exports = {
  version: require('./package.json').version,
  manifest: {},
  init (ssb, config) {
    const allowedTypes = getAllowedTypes(config)

    ssb.publish.hook((publish, args) => {
      const [content, cb] = args
      // if (typeof content === 'string') return publish(content, cb)

      if (hasRecps(content)) return publish(content, cb)

      if (content.allowPublic === true) {
        delete content.allowPublic
        return publish(content, cb)
      }

      if (allowedTypes.has(content.type)) return publish(content, cb)

      cb(new Error(`recps-guard: public messages of type "${content.type}" not allowed`))
    })
  }
}

function getAllowedTypes (config) {
  const types = get(config, 'recpsGuard.allowedTypes', [])

  // TODO check all strings

  return new Set(types)
}

function hasRecps (content) {
  if (!content.recps) return false
  if (!Array.isArray(content.recps)) return false
  if (content.recps.length === 0) return false

  return true
}
