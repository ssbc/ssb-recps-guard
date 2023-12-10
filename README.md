# ssb-recps-guard

Guards against accidentally publishing messages publicly (i.e. unencrypted)

Works by hooking the `publish` method, so **must be installed as the LAST plugin**


## Example usage

```js
const Stack = require('secret-stack')
const caps = require('ssb-caps')


const stack = Stack({ caps })
  .use(require('ssb-d2'))
  .use(require('ssb-recps-guard'))  // << must be last

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
const unallowedMsg = {
  content: { type: 'profile' }
}

server.db.create(unallowedMsg, (err, msg) => {
  console.log(err)
  // => Error: recps-guard - no accidental public messages allowed!
})
```

config-allowed:
```js
const allowedMsg = {
  content: { type: 'contact' }
}
// this type was allowed in our config (see above)

server.db.create(allowedType, (err, msg) => {
  console.log(msg.value.content)
  // => { type: 'contact' }
})
```

explictly public:
```js
const explicitPublicMsg = {
  content: { type: 'profile' },
  allowPublic: true
}

server.db.create(explicitPublicMsg, (err, msg) => {
  console.log(msg.value.content)
  // => { type: 'profile' }
})
```


private: 
```js
const privateMsg = {
  content: {
    type: 'profile'
    recps: ['@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519']
  }
}

server.db.create(privateMsg, (err, msg) => {
  console.log(msg.value.content)
  // => VayTFa.....yZ3Wqsg==.box

  // NOTE: this is private, so allowed through an content is encrypted
  // (in this example by ssb-private1, assuming that was installed)
})
```

NOTE that if you are using _classic_ `ssb-db`, the API behaves the same:

```js
const explicitPublicMsgDB1 = {
  content: { type: 'profile' },
  allowPublic: true
}

server.db.create(explicitPublicMsgDN!, (err, msg) => {
  console.log(msg.value.content)
  // => { type: 'profile' }
})
```


## Installation

Because `ssb-recps-guard` hooks the publish method you **must install it as the LAST plugin**
If you don't other plugins may also hook the publish and modify messages
which may break guarentees this plugin tries to offer

(actually we will now throw if anyone else tries to hook publish after this plugin!)

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
publish method to be of form `{ content, allowPublic: true }` 

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
