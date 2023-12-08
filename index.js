/* eslint-disable brace-style */
const get = require('lodash.get')

const isString = (t) => (typeof t === 'string')
const NotBothError = () => new Error(
  'recps-guard: should not have recps && allowPublic, check your code'
)
const NotAllowedTypeError = (type) => new Error(
  `recps-guard: public messages of type "${type}" not allowed`
)

module.exports = {
  name: 'recpsGuard',
  version: require('./package.json').version,
  manifest: {
    allowedTypes: 'async'
  },
  init (ssb, config) {
    const allowedTypes = getAllowedTypes(ssb, config)
    const isAllowedType = (type) => allowedTypes.has(type)

    function publishHook (publish, args) {
      const [input, cb] = args

      const isExplictAllow = (
        input.allowPublic === true ||
        get(input, ['options', 'allowPublic']) === true // legacy support
      )

      if (isExplictAllow) {
        const content = input.content

        if (hasRecps(content)) cb(NotBothError())
        else publish(content, cb)
      }
      else {
        const content = input

        const isAllowed = (
          isString(content) || // already encrypted
          hasRecps(content) ||
          isAllowedType(content.type)
        )

        if (isAllowed) publish(content, cb)
        else cb(NotAllowedTypeError(content.type))
      }
    }

    function createHook (create, args) {
      const [input, cb] = args

      if (input.allowPublic === true) {
        if (hasRecps(input.content)) return cb(NotBothError())

        return create(input, cb)
      }
      else {
        const content = input.content

        const isAllowed = (
          isString(content) || // already encrypted
          input.encryptionFormat || // signed up for encryption
          hasRecps(content) ||
          isAllowedType(content.type)
        )

        if (isAllowed) create(input, cb)
        else cb(NotAllowedTypeError(content.type))
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
      ssb.db.create.hook(createHook)

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
