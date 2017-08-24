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
 * If any single task fails (eg, returns a rejected Promise), the pool will drain
 * any remaining active tasks and reject the resulting Promsie.
 *
 * @param {Number} size
 * @param {async Function(Void) => Boolean} task
 *
 * @return {Promise<Void>}
 */
const parallelPool = async function(size, task) {
  let   done   = false;
  let   active = 0;
  const errors = [];

  return new Promise((resolve, reject) => {
    const poolIterator = function() {
      while(active < size && !done) {
        active++;

        task().then(more => {
          if(--active <= 0 && (done || !more)) {
            if(errors.length > 0) {
              // at least one task failed
              return reject(new Error(errors));
            }

            // all tasks completed successfully
            return resolve();
          } else if(more) {
            poolIterator();
          } else {
            done = true;
          }
        })
        .catch(err => {
          errors.push(err);
          done = true;

          if(--active <= 0) {
            return reject(new Error(errors));
          }

          // wait until all active tasks are drained before rejecting the
          // final result (no new tasks will be started now that we're in
          // this error state)
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
 * If any single task fails (eg, returns a rejected Promise), the pool will drain
 * any remaining active tasks and reject the resulting Promsie.
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
