# @swinfra/async-await-parallel

<!-- toc -->

This module is a simple utility for limiting the concurrency of `await`ing async arrays in ES7. It replaces `Promise.all` when using `async` `await` much like `async.mapLimit` is commonly used in place of the analogous `async.map` when using callback-style async functions.

### Installation

```
npm install async-await-parallel
```

This module uses async and await and therefore requires Node >= 7.

### Background

Normally, when you have an array of `async` operations that you want to `await` on, you would use `Promise.all`.

```javascript
await Promise.all([
  async () => { ... },
  async () => { ... },
  async () => { ... },
  async () => { ... },
  async () => { ... },
])
```

Unfortunately, there's nothing built into ES7's implementation of `async` `await` that allows you to limit the concurrency of how many async handlers are running at once.

This is problematic in many common scenarios such as performing operations on each file in a directory or downloading a batch of URLs without opening too many sockets or clogging IO bandwidth.

### Usage

`async-await-parallel` allows you to set a maximum concurrency for an array of async results you want to `await` on.

```javascript
const parallel = require('async-await-parallel')

await parallel([
  async () => { ... },
  async () => { ... },
  async () => { ... },
  async () => { ... },
  async () => { ... },
], 2)
```

In this example, a max concurrency of 2 is set, so no more than 2 of the async functions may execute concurrently. Async functions will be executed in order once previous ones resolve.

### API

```javascript
/**
 * Invokes an array of async functions in parallel with a limit to the maximum
 * number of concurrent invocations. Async functions are executed in-order and
 * the results are mapped to the return array.
 *
 * Acts as a replacement for `await Promise.all([ ... ])` by limiting the max
 * concurrency of the array of function invocations.
 *
 * If any single task fails (eg, returns a rejected Promise), the pool will drain
 * any remaining active tasks and reject the resulting Promsie.
 *
 * @param {Array<async Function(Void) => Any>} thunks
 * @param {Number?} concurrency Max concurrency (defaults to 5)
 *
 * @return {Promise<Array<Any>>}
 */
async function parallel (thunks, concurrency = 5)
```

### Inspiration

* [async.mapLimit](http://caolan.github.io/async/) equivalent functionality for callbacks
* [co-parallel](https://github.com/tj/co-parallel) equivalent functionality for co generators
* [async-parallel](https://github.com/davetemplin/async-parallel) this library is heavily inspired by this TypeScript library for async / await by Dave Templin (simplified, converted from TS to ES, and added tests)
