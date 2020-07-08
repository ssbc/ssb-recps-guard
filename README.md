# ssb-recps-guard

Guards against accidentally publishing messages publicly (i.e. unencrypted)

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
  content: { type: 'profile' },
  options: { allowPublic: true }
}

server.publish(explicitPublicMsg, (err, msg) => {
  console.log(msg.value.content)
  // => { type: 'profile' }

  // NOTE: only `content` is published
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

Messages which would normally be blocked by the guard  bypass the guard by changing what's passed to the
publish method to be of form `{ content, options: { allowPublic: true } }` 

The `content` is what will be passed to the normal publish function.

Design: this is deliberately verbose to avoid accidental publishing.
It also has the benefit that if `ssb-guard-recps` isn't installed this publish will error because publish
will expect the `type` to be in a different place.

## API

You can check if `ssb-recps-guard` is installed in your server by looking to
see if `server.recpsGuard` is present.

### `server.recpsGuard.allowedTypes => [String]`

Returns a (sorted) Array of the types of messages which are allowed to be
published publicly.
