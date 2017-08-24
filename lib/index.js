'use strict';

/* eslint-disable no-loop-func */
/* eslint-disable prefer-reflect */

/**
 * Executes a given async `task` multiple times in parallel with a guaranteed
 * max concurrency given by `size`.
 *
 * The task should be an async function which resolves to a boolean for whether
 * or not there are more tasks to process.
 *
 * If any single task fails (eg, returns a rejected Promise), the pool will
 * drain any remaining active tasks and reject the resulting Promise with the
 * value of the promise that rejected, whether or not the other promises have
 * resolved.
 *
 * @param {Number} size
 * @param {async Function(Void) => Boolean} task
 *
 * @return {Promise<Void>}
 */
const parallelPool = async function(size, task) {
  let   done   = false;
  let   error  = false;
  let   active = 0;

  return new Promise((resolve, reject) => {
    const poolIterator = function() {
      while(active < size && !done) {
        active++;

        task().then(more => {
          if(error) {
            // There was an error, so the Promise was rejected already.
          } else if(--active <= 0 && (done || !more)) {
            // all tasks completed successfully
            return resolve();
          } else if(more) {
            poolIterator();
          } else {
            done = true;
          }
        })
        .catch(err => {
          error = true;
          done  = true;

          return reject(err);
        });
      }
    };

    poolIterator();
  });
};

/**
 * Invokes an array of async functions in parallel with a limit to the maximum
 * number of concurrent invocations. Async functions are executed in-order and
 * the results are mapped to the return array.
 *
 * Acts as a replacement for `await Promise.all([ ... ])` by limiting the max
 * concurrency of the array of function invocations.
 *
 * If any single task fails (eg, returns a rejected Promise), the pool will
 * drain any remaining active tasks and reject the resulting Promise with the
 * value of the promise that rejected, whether or not the other promises have
 * resolved.
 *
 * @param {Array<async Function(Void) => Any>} thunks
 * @param {Number?} concurrency Max concurrency (defaults to 5)
 *
 * @return {Promise<Array<Any>>}
 */
const parallelMap = async function(thunks, concurrency = 5) {
  if(!Array.isArray(thunks)) {
    throw new Error('thunks must be of type array');
  }
  if(!thunks.length) {
    return;
  }

  if(concurrency > 0) {
    concurrency = Math.min(concurrency, thunks.length);
  } else {
    concurrency = thunks.length;
  }

  let   index   = 0;
  const results = [];

  await parallelPool(concurrency, async () => {
    if(index < thunks.length) {
      const currentIndex = index++;
      const thunk        = thunks[currentIndex];

      results[currentIndex] = await thunk.call(this);
    }

    return index < thunks.length;
  });

  return results;
};

module.exports      = parallelMap;
module.exports.pool = parallelPool;

// module.exports = {
//   parallelMap,
//   pool: parallelPool
// };
