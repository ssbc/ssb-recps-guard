const get = require('lodash.get')
const isString = (t) => (typeof t === 'string')
const isEncrypted = isString

module.exports = {
  name: 'recpsGuard',
  version: require('./package.json').version,
  manifest: {
    allowedTypes: 'async'
  },
  init (ssb, config) {
    const allowedTypes = getAllowedTypes(ssb, config)

    ssb.publish.hook((publish, args) => {
      const [content, cb] = args

      if (isEncrypted(content)) return publish(content, cb)
      if (hasRecps(content)) {
        if (content.allowPublic === true) {
          return cb(new Error('recps-guard: should not have recps && allowPublic, check your code'))
        }
        return publish(content, cb)
      }

      if (content.allowPublic === true) {
        delete content.allowPublic
        return publish(content, cb)
      }

      if (allowedTypes.has(content.type)) return publish(content, cb)

      cb(new Error(`recps-guard: public messages of type "${content.type}" not allowed`))
    })

    /* API */
    return {
      allowedTypes () {
        return Array.from(allowedTypes).sort()
      }
    }
  }
}

function getAllowedTypes (ssb, config) {
  const types = get(config, 'recpsGuard.allowedTypes', [])

  if (!types.every(isString)) {
    ssb.close() // weird, but if we don't do this, tests hang
    throw new Error('recps-guard: expects allowedTypes to be an Array of Strings')
  }

  return new Set(types)
}

function hasRecps (content) {
  if (!content.recps) return false
  if (!Array.isArray(content.recps)) return false
  if (content.recps.length === 0) return false

  return true
}
