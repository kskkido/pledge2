'use strict';
describe('Chapter 4: Promise Chaining and Transformation', function(){
/*=======================================================


                            d8888
                           d8P888
                          d8P 888
                         d8P  888
                        d88   888
                        8888888888
                              888
                              888


Chapter 4: Promises Can Return Values and Chain Together
---------------------------------------------------------*/
// A crucial aspect of promises is that `.then` always
// returns a new promise. When values are returned from
// promise A's handler, they are exported and represented by
// the return promise B. This leads to remarkably versatile
// behavior: choosing when to catch errors, chaining promises
// together, easily passing around promised values and acting
// on them where convenient… even returning new values.
// This chapter may be challenging.
/*========================================================*/

/* global $Promise customMatchers */
/* eslint no-throw-literal: 0 */

function noop () {}

describe('For a given promiseA (pA)', function(){

  var promiseA, thisReturnsHi, thisThrowsShade;
  beforeEach(function(){
    promiseA = new $Promise(noop);
    thisReturnsHi = function () { return 'hi'; };
    thisThrowsShade = function () { throw 'shade'; };
  });

  // Our parent promise must maintain some kind of reference to the downstream
  // promise, in order to control chaining.

  it('`.then` adds a new promise to its handler group', function(){
    promiseA.then();
    var groups = promiseA._handlerGroups;
    expect( groups[0].downstreamPromise instanceof $Promise ).toBe( true );
    // each handler group has its own `downstreamPromise`
    promiseA.then();
    expect( groups[1].downstreamPromise instanceof $Promise ).toBe( true );
    expect( groups[1].downstreamPromise ).not.toBe( groups[0].downstreamPromise );
  });

  // Passing this may break your `.catch` from chapter 3. If that happens,
  // you will have to go back and fix `.catch`, taking this spec into account.

  it('`.then` returns that downstream promise', function(){
    var promiseB = promiseA.then();
    expect( promiseB ).toBe( promiseA._handlerGroups[0].downstreamPromise );
  });

  // This section is detailed in the Promises Flowchart. Refer to the PDF.

  describe('that returns promiseB (pB) via `.then`:', function(){

    var FAST_TIMEOUT = 10;

    /* (In `utils/custom.matchers.js`, lets us test your promise cleanly.) */
    beforeEach(function(){
      jasmine.addMatchers(customMatchers);
    });

    // Fulfillment bubbles down to the first available success handler.

    it("if pA is fulfilled but has no success handler, pB is fulfilled with pA's value", function (done) {
      var promiseB = promiseA.then();
      promiseA._internalResolve( 9001 );
      // Do not set state manually; a resolver should be called somewhere.
      expect( promiseB._state ).toBe( 'fulfilled' );
      expect( promiseB._value ).toBe( 9001 );
      // The above is a hint; from now on we'll use this custom matcher. Ignore
      // the `done`, needed because Jasmine doesn't support async matchers.
      expect( promiseB ).toFulfillWith( 9001, done );
    }, FAST_TIMEOUT);

    // Rejection bubbles down to the first available error handler.

    it("if pA is rejected but has no error handler, pB is rejected with pA's reason", function (done) {
      var promiseB = promiseA.then();
      promiseA._internalReject( 'darn' );
      // Do not set state manually; a rejector should be called somewhere.
      expect( promiseB._state ).toBe( 'rejected' );
      expect( promiseB._value ).toBe( 'darn' );
      // The above is a hint; from now on we'll use this custom matcher.
      expect( promiseB ).toRejectWith( 'darn', done );
    }, FAST_TIMEOUT);

    // This is for normal (synchronous / non-promise) return values

    it("if pA's success handler returns a value `x`, pB is fulfilled with `x`", function (done) {
      var promiseB = promiseA.then( thisReturnsHi );
      promiseA._internalResolve();
      expect( promiseB ).toFulfillWith( 'hi', done );
    }, FAST_TIMEOUT);

    // This is for normal (synchronous / non-promise) return values

    it("if pA's error handler returns a value `x`, pB is fulfilled with `x`", function (done) {
      // Why fulfilled? This is similar to `try`-`catch`. If promiseA is
      // rejected (equivalent to `try` failure), we pass the reason to
      // promiseA's error handler (equivalent to `catch`). We have now
      // successfully handled the error, so promiseB should represent
      // the error handler returning something useful, not a new error.
      // promiseB would only reject if the error handler itself failed
      // somehow (which we already addressed in a previous test).
      var promiseB = promiseA.catch( thisReturnsHi );
      promiseA._internalReject();
      expect( promiseB ).toFulfillWith( 'hi', done );
    }, FAST_TIMEOUT);

    // Exceptions cause the returned promise to be rejected with the error.
    // Hint: you will need to use `try` & `catch` to make this work.

    it("if pA's success handler throws a reason `e`, pB is rejected with `e`", function (done) {
      var promiseB = promiseA.then( thisThrowsShade );
      promiseA._internalResolve();
      expect( promiseB ).toRejectWith( 'shade', done );
    }, FAST_TIMEOUT);

    it("if pA's error handler throws a reason `e`, pB is rejected with `e`", function (done) {
      var promiseB = promiseA.catch( thisThrowsShade );
      promiseA._internalReject();
      expect( promiseB ).toRejectWith( 'shade', done );
    }, FAST_TIMEOUT);

    //  What if promiseA returns a promiseZ? You could handle pZ like a
    // normal value, but then you have to start writing `.then` inside `.then`.
    // Instead, we want to make promiseB to "become" pZ by copying
    // pZ's behavior — aka assimilation. These four tests are brain-benders.

    it("if pA's success handler returns promiseZ which fulfills, pB mimics pZ", function (done) {
      var promiseZ = new $Promise(noop);
      var promiseB = promiseA.then(function(){
        return promiseZ;
      });
      console.log('resolve')
      promiseA._internalResolve();
      promiseZ._internalResolve( 'testing' );
      expect( promiseB ).toFulfillWith( 'testing', done );
    }, FAST_TIMEOUT);

    it("if pA's error handler returns promiseZ which fulfills, pB mimics pZ", function (done) {
      var promiseZ = new $Promise(noop);
      var promiseB = promiseA.catch(function(){
        return promiseZ;
      });
      promiseA._internalReject();
      promiseZ._internalResolve( 'testing' );
      expect( promiseB ).toFulfillWith( 'testing', done );
    }, FAST_TIMEOUT);

    it("if pA's success handler returns promiseZ which rejects, pB mimics pZ", function (done) {
      var promiseZ = new $Promise(noop);
      var promiseB = promiseA.then(function(){
        return promiseZ;
      });
      promiseA._internalResolve();
      promiseZ._internalReject( 'testing' );
      expect( promiseB ).toRejectWith( 'testing', done );
    }, FAST_TIMEOUT);

    it("if pA's error handler returns promiseZ which rejects, pB mimics pZ", function (done) {
      var promiseZ = new $Promise(noop);
      var promiseB = promiseA.catch(function(){
        return promiseZ;
      });
      promiseA._internalReject();
      promiseZ._internalReject( 'testing' );
      expect( promiseB ).toRejectWith( 'testing', done );
    }, FAST_TIMEOUT);

    // To really test assimilation properly would require many more specs.
    // But we won't be that strict.

    // All the above specs settled their promise AFTER returning the new
    // promise. But of course you can still chain off of settled promises!
    // Your solution might already pass this. But maybe not…

    it('still chains correctly if the promise is already settled', function (done) {
      // utility / helper functions
      var count = 0, shouldFulfill, shouldReject;
      function countPassed () { if (++count === 10) done(); }
      Object.assign(countPassed, done);
      function thisReturnsFulfilledPromise () {
        return new $Promise(resolve => resolve('yea'));
      }
      function thisReturnsRejectedPromise () {
        return new $Promise((resolve, reject) => reject('nay'));
      }
      // promiseA start points
      var fulfilledPromise = thisReturnsFulfilledPromise();
      var rejectedPromise = thisReturnsRejectedPromise();
      // bubbling works
      shouldFulfill = fulfilledPromise.then();
      expect( shouldFulfill ).toFulfillWith( 'yea', countPassed );
      shouldReject = rejectedPromise.then();
      expect( shouldReject ).toRejectWith( 'nay', countPassed );
      // returning values works
      shouldFulfill = fulfilledPromise.then( thisReturnsHi );
      expect( shouldFulfill ).toFulfillWith( 'hi', countPassed );
      shouldFulfill = rejectedPromise.catch( thisReturnsHi );
      expect( shouldFulfill ).toFulfillWith( 'hi', countPassed );
      // throwing values works
      shouldReject = fulfilledPromise.then( thisThrowsShade );
      expect( shouldReject ).toRejectWith( 'shade', countPassed );
      shouldReject = rejectedPromise.catch( thisThrowsShade );
      expect( shouldReject ).toRejectWith( 'shade', countPassed );
      // returning promises works
      shouldFulfill = fulfilledPromise.then( thisReturnsFulfilledPromise );
      expect( shouldFulfill ).toFulfillWith( 'yea', countPassed );
      shouldReject = fulfilledPromise.then( thisReturnsRejectedPromise );
      expect( shouldReject ).toRejectWith( 'nay', countPassed );
      shouldFulfill = rejectedPromise.catch( thisReturnsFulfilledPromise );
      expect( shouldFulfill ).toFulfillWith( 'yea', countPassed );
      shouldReject = rejectedPromise.catch( thisReturnsRejectedPromise );
      expect( shouldReject ).toRejectWith( 'nay', countPassed );
    });

  });

  // Another demonstration. This should work if the previous specs passed.

  it('`.then` can be chained many times', function(){
    var add1 = function (num) { return ++num; };
    var test = 0;
    promiseA
    .then(add1)
    .then(add1)
    .then()
    .then(function (data) {
      test = data;
    });
    promiseA._internalResolve( 0 );
    expect( test ).toBe( 2 );
  });

});


// Wow! If you got this far, congratulations. We omitted certain details
// (e.g. handlers must always be called in a true async wrapper), but you have
// built a promise library with most of the standard behavior. In the next
// (optional, but recommended) chapter, we'll be adding in some common library
// methods that make working with promises easier and cleaner.

});

// Don't forget to `git commit`!
