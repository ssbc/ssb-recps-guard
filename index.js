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
      const [input, cb] = args

      if (
        isEncrypted(input) ||
        hasRecps(input) ||
        allowedTypes.has(input.type)
      ) return publish(input, cb)

      if (isAllowPublic(input)) {
        if (hasRecps(input.content)) {
          return cb(new Error('recps-guard: should not have recps && allowPublic, check your code'))
        }
        return publish(input.content, cb)
      }

      cb(new Error(`recps-guard: public messages of type "${input.type}" not allowed`))
    })

    ssb.publish.hook = () => {
      throw new Error('ssb-recps-guard must be the last to hook ssb.publish')
      // NOTE because of the last hook get run first we need to guarentee
      // that no other hooks on publish occured after our, otherwise we cannot
      // guarentee other hooks do not bypass the guard
    }

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

function isAllowPublic (input) {
  if (typeof input !== 'object') return false
  if (typeof get(input, ['content', 'type']) !== 'string') return false
  if (get(input, ['options', 'allowPublic']) !== true) return false

  return true
}
