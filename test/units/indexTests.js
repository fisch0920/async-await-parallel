'use strict';

const parallel = require('../../lib/');
const expect   = require('expect.js');

const createResolvedPromise = function(timeout = 10, result = true) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(result);
    }, timeout);
  });
};

const createRejectedPromise = function(timeout = 10) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('test error'));
    }, timeout);
  });
};

describe('parallelMap', async () => {
  it('basic usage', async () => {
    const input = [
      () => createResolvedPromise(10),
      () => createResolvedPromise(20),
      () => createResolvedPromise(50),
      () => createResolvedPromise(30),
      () => createResolvedPromise(100),
      () => createResolvedPromise(5)
    ];

    const results = await parallel(input, 2);

    expect(results).to.have.length(6);

    // all results should be the resolved value of createResolvedPromise (truthy)
    for(const result of results) {
      expect(result).to.be.ok();
    }
  });

  it('ensure max concurrency', async () => {
    const concurrency = 3;
    let hitMaxConcurrency = false;
    let numActive = 0;

    const checkConcurrency = function() {
      expect(numActive).to.be.greaterThan(0);
      expect(numActive).to.be.lessThan(concurrency + 1);

      if(numActive === concurrency) {
        // we expect the max concurrency to be hit at some point to ensure we're
        // not just executing the tasks serially
        hitMaxConcurrency = true;
      }
    };

    const task = function(timeout = 10, result = true) {
      numActive++;

      return new Promise(resolve => {
        checkConcurrency();

        setTimeout(() => {
          checkConcurrency();
          resolve(result);
        }, timeout);
      }).then(res => {
        checkConcurrency();
        --numActive;

        return res;
      });
    };

    const input = [
      async () => task(5),
      () => task(5),
      () => task(5),
      () => task(5),
      () => task(5),
      () => task(5),
      () => task(5),
      async () => task(5),
      () => task(10),
      () => task(20),
      () => task(50),
      () => task(30),
      () => task(100),
      () => task(5),
      () => task(5),
      () => task(5),
      () => task(5),
      async () => task(5),
      async () => task(5),
      async () => task(5),
      async () => task(20),
      () => task(180),
      () => task(5),
      () => task(5)
    ];

    const results = await parallel(input, concurrency);

    expect(results).to.have.length(input.length);
    expect(hitMaxConcurrency).to.be.ok();

    for(const result of results) {
      expect(result).to.be.ok();
    }
  });

  it('handle rejections properly', async () => {
    const expectUnreachable = async function() {
      // this function should never be reached
      expect(false).to.be.ok();
    };

    const input = [
      () => createResolvedPromise(10),
      () => createResolvedPromise(10),
      () => createRejectedPromise(10),
      () => createResolvedPromise(20),

      () => expectUnreachable(),
      () => expectUnreachable(),
      () => expectUnreachable(),
      () => expectUnreachable()
    ];

    let exception;

    try {
      await parallel(input, 2);
    } catch(err) {
      exception = err;
    }

    expect(exception).to.be.ok();
  });

  it('handle empty array', async () => {
    await parallel([]);
  });

  it('handle invalid type', async () => {
    let exception;

    try {
      await parallel();
    } catch(err) {
      exception = err;
    }

    expect(exception).to.be.an(Error);
    expect(exception.message).to.eql('thunks must be of type array');
  });
});
