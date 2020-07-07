# ssb-recps-guard

Guards against accidentally publishing messages publicly

Works by hooking the `publish` method, so **must be installed as the first plugin**


## Example usage

```js
const Stack = require('secret-stack')
const caps = require('ssb-caps')


const stack = Stack({ caps })
  .use(require('ssb-db'))           // << required
  .use(require('ssb-recps-guard'))

const config = {
  // see ssb-config for other needed config
  recpsGuard: {
    allowedTypes: ['contact', 'pub']
  }
}
const sever = stack(config)
```

auto-blocked:
```js
const unallowedMsg = { type: 'profile' }

server.publish(unallowedMsg, (err, msg) => {
  console.log(err)
  // => Error: recps-guard - no accidental public messages allowed!
})
```

config-allowed:
```js
const allowedMsg = { type: 'contact' }
// this type was allowed in our config (see above)

server.publish(allowedType, (err, msg) => {
  console.log(msg.value.content)
  // => { type: 'contact' }
})
```

explictly public:
```js
const explicitPublicMsg = {
  type: 'profile'
  allowPublic: true
}
// this type was allowed in our config (see above)

server.publish(allowedType, (err, msg) => {
  console.log(msg.value.content)
  // => { type: 'profile' }

  // NOTE: allowPublic is pruned off
})
```

private: 
```js
const privateMsg = {
  type: 'profile'
  recps: ['@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519']
}

server.publish(privateMsg, (err, msg) => {
  console.log(msg.value.content)
  // => VayTFa.....yZ3Wqsg==.box

  // NOTE: this is private, so allowed through an content is encrypted
  // (in this example by ssb-private1, assuming that was installed)
})
```

## Installation

Because `ssb-recps-guard` hooks the publish method you **must install it as the first plugin** (after ssb-db).
If you don't other plugins may also hook the publish and modify messages
which may break guarentees this plugin tries to offer

## Config

You can configure `ssb-recps-guard` behaviour through the config you pass in
when starting secret-stack:

```js
{
  recpsGuard: {
    allowedTypes: [String]
  }
}
```

where `allowedTypes` is an Array of message types which are allowed to be published publicly.


## Explicit bypass

Messages which would normally be blocked by the guard can add `allowPublic: true`
and will be passed on to publishing (with this property pruned off).
See usage example above.

We considered overloading the `recps` value with magical values,
but decided a verbose property which couldn't accidentally be filled was safer.

