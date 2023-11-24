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

    const publishHook = (publish, args) => {
      const [input, cb] = args

      if (get(input, ['options', 'allowPublic']) === true) {
        if (hasRecps(input.content)) {
          return cb(new Error('recps-guard: should not have recps && allowPublic, check your code'))
        }

        return publish(input.content, cb)
      } else {
        if (
          isEncrypted(input) ||
          hasRecps(input) ||
          allowedTypes.has(input.type)
        ) return publish(input, cb)

        return cb(new Error(`recps-guard: public messages of type "${input.type}" not allowed`))
      }
    }

    if (ssb.publish) {
      ssb.publish.hook(publishHook)

      ssb.publish.hook = () => {
        throw new Error('ssb-recps-guard must be the last to hook ssb.publish')
        // NOTE because of the last hook get run first we need to guarentee
        // that no other hooks on publish occured after our, otherwise we cannot
        // guarentee other hooks do not bypass the guard
      }
    }

    if (ssb.db && ssb.db.create) {
      ssb.db.create.hook((create, args) => {
        const [input, cb] = args

        if (
          input.encryptionFormat !== undefined ||
          isEncrypted(input.content) ||
          (hasRecps(input.content) && input.allowPublic !== true) ||
          allowedTypes.has(input.content.type)
        ) {
          return create(input, cb)
        }

        if (input.allowPublic === true) {
          if (hasRecps(input.content)) {
            return cb(new Error('recps-guard: should not have recps && allowPublic, check your code'))
          }

          if (input.content.options) {
            delete input.content.options.allowPublic

            if (Object.keys(input.content.options).length === 0) {
              delete input.content.options
            }
          }

          return create(input, cb)
        }

        cb(new Error(`recps-guard: public messages of type "${input.content.type}" not allowed`))
      })

      ssb.db.create.hook = () => {
        throw new Error('ssb-recps-guard must be the last to hook ssb.db.create')
        // NOTE because of the last hook get run first we need to guarentee
        // that no other hooks on create occured after our, otherwise we cannot
        // guarentee other hooks do not bypass the guard
      }
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

function isAllowPublic2 (input) {
  return 
}
