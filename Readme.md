# safer-buffer [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![javascript style guide][standard-image]][standard-url] [![Security Responsible Disclosure][secuirty-image]][secuirty-url]

[travis-image]: https://travis-ci.org/ChALkeR/safer-buffer.svg?branch=master
[travis-url]: https://travis-ci.org/ChALkeR/safer-buffer
[npm-image]: https://img.shields.io/npm/v/safer-buffer.svg
[npm-url]: https://npmjs.org/package/safer-buffer
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com
[secuirty-image]: https://img.shields.io/badge/Security-Responsible%20Disclosure-green.svg
[secuirty-url]: https://github.com/nodejs/security-wg/blob/master/processes/responsible_disclosure_template.md

Modern Buffer API polyfill without footguns.

## Why not [safe-buffer](https://npmjs.com/safe-buffer)?

_In short: while `safe-buffer` serves as a polyfill for the new API, it allows old API usage and itself
contains footguns._

`safe-buffer` could be used safely to get the new API while still keeping support for older
Node.js versions (like this module), but while analyzing ecosystem usage of the old Buffer API
I found out that `safe-buffer` is itself causing problems in some cases.

For example, consider the following snippet:

```console
$ cat example.unsafe.js
console.log(Buffer(20))
$ ./node-v6.13.0-linux-x64/bin/node example.unsafe.js
<Buffer 0a 00 00 00 00 00 00 00 28 13 de 02 00 00 00 00 05 00 00 00>
$ standard example.unsafe.js
standard: Use JavaScript Standard Style (https://standardjs.com)
  /home/chalker/repo/safer-buffer/example.unsafe.js:2:13: 'Buffer()' was deprecated since v6. Use 'Buffer.alloc()' or 'Buffer.from()' (use 'https://www.npmjs.com/package/safe-buffer' for '<4.5.0') instead.
```

This is allocates and writes to console an uninitialized chunk of memory.
[standard](https://www.npmjs.com/package/standard) linter (among others) catch that and warn people
to avoid using unsafe API.

Let's now throw in `safe-buffer`!

```console
$ cat example.safe-buffer.js
const Buffer = require('safe-buffer').Buffer
console.log(Buffer(20))
$ standard example.safe-buffer.js
$ ./node-v6.13.0-linux-x64/bin/node example.safe-buffer.js
<Buffer 08 00 00 00 00 00 00 00 28 58 01 82 fe 7f 00 00 00 00 00 00>
```

See the problem? Adding in `safe-buffer` _magically removes the lint warning_, but the behavior
remains idential to what we had before, and when launched on Node.js 6.x LTS — this dumps out chunks
of uninitialized memory. _And this code will still emit runtime warnings on Node.js 10.x and above._

That was done by design. I first considered changing `safe-buffer`, prohibiting old API usage or
emitting warnings on it, but that significantly diverges from `safe-buffer` design. After some
discussion, it was decided to move my approach into a separate package, and _this is that separate
package_.

This footgun is not imaginary — I observed top-downloaded packages doing that kind of thing,
«fixing» the lint warning by blindly including `safe-buffer` without any actual changes.

Also in some cases, even if the API _was_ migrated to use of safe Buffer API — a random pull request
can bring unsafe Buffer API usage back to the codebase by adding new calls — and that could go
unnoticed even if you have a linter prohibiting that (becase of the reason stated above), and even
pass CI. _I also observed that being done in popular packages._

Some examples:
 * [webdriverio](https://github.com/webdriverio/webdriverio/commit/05cbd3167c12e4930f09ef7cf93b127ba4effae4#diff-124380949022817b90b622871837d56cR31)
   (a module with 548 759 downloads/month),
 * [websocket-stream](https://github.com/maxogden/websocket-stream/commit/c9312bd24d08271687d76da0fe3c83493871cf61)
   (218 288 d/m, fix in [maxogden/websocket-stream#142](https://github.com/maxogden/websocket-stream/pull/142)),
 * [node-serialport](https://github.com/node-serialport/node-serialport/commit/e8d9d2b16c664224920ce1c895199b1ce2def48c)
   (113 138 d/m, fix in [node-serialport/node-serialport#1510](https://github.com/node-serialport/node-serialport/pull/1510)),
 * [karma](https://github.com/karma-runner/karma/commit/3d94b8cf18c695104ca195334dc75ff054c74eec)
   (3 973 193 d/m, fix in [karma-runner/karma#2947](https://github.com/karma-runner/karma/pull/2947)),
 * [spdy-transport](https://github.com/spdy-http2/spdy-transport/commit/5375ac33f4a62a4f65bcfc2827447d42a5dbe8b1)
   (5 970 727 d/m, fix in [spdy-http2/spdy-transport#53](https://github.com/spdy-http2/spdy-transport/pull/53)).
 * And there are a lot more over the ecosystem.

I filed a PR at
[mysticatea/eslint-plugin-node#110](https://github.com/mysticatea/eslint-plugin-node/pull/110) to
partially fix that (for cases when that lint rule is used), but it is a semver-major change for
linter rules and presets, so it would take significant time for that to reach actual setups.

Also, `safer-buffer` discourages the usage of `.allocUnsafe()`, which is often done by a mistake.
It still supports it with an explicit concern barier, by placing it under
`require('safer-buffer/dangereous')`.