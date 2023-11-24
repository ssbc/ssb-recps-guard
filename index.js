const get = require('lodash.get')
const isString = (t) => (typeof t === 'string')

module.exports = {
  name: 'recpsGuard',
  version: require('./package.json').version,
  manifest: {
    allowedTypes: 'async'
  },
  init (ssb, config) {
    const allowedTypes = getAllowedTypes(ssb, config)

    const publishHook = ({ db2 }) => (publish, args) => {
      const [input, cb] = args

      if (db2 ? input.allowPublic === true : get(input, ['options', 'allowPublic']) === true) {
        // allowPublic and has recps, disallowed
        if (hasRecps(input.content)) {
          return cb(new Error('recps-guard: should not have recps && allowPublic, check your code'))
        }

        // allowPublic and no recps, allowed
        return publish(db2 ? input : input.content, cb)
      } else {
        // without allowPublic, content isn't nested with db1 publish
        const content = db2 ? input.content : input

        // no allowPublic and has recps/can publish without recps, allowed
        if (
          (db2 ? (input.encryptionFormat !== undefined) : false) ||
          isString(content) ||
          hasRecps(content) ||
          allowedTypes.has(content.type)
        ) return publish(db2 ? input : content, cb)

        // no allowPublic and no recps, disallowed
        return cb(new Error(`recps-guard: public messages of type "${content.type}" not allowed`))
      }
    }

    if (ssb.publish) {
      ssb.publish.hook(publishHook({ db2: false }))

      ssb.publish.hook = () => {
        throw new Error('ssb-recps-guard must be the last to hook ssb.publish')
        // NOTE because of the last hook get run first we need to guarentee
        // that no other hooks on publish occured after our, otherwise we cannot
        // guarentee other hooks do not bypass the guard
      }
    }

    if (ssb.db && ssb.db.create) {
      ssb.db.create.hook(publishHook({ db2: true }))

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
