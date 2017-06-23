'use strict';
describe('Chapter 5: Static Methods `.resolve` and `.all`', function(){
/*=======================================================


                        888888888
                        888
                        888
                        8888888b.
                             "Y88b
                               888
                        Y88b  d88P
                         "Y8888P


Chapter 5: Extra Credit: Static Methods `.resolve` and `.all`
---------------------------------------------------------*/
// Promises on their own have many advantages over callbacks,
// chiefly when dealing with *composability* — combining and
// orchestrating multiple asynchronous results. That being
// said, practically every promise library provides a couple
// of helper functions to make promise composition even easier.
// In this chapter you will implement two of the most crucial
// static methods, so useful they are part of the ES6 spec for
// promises (EcmaScript follows, but also goes beyond, P/A+).

// SPECIAL NOTE: the best solutions for this chapter DO NOT
// CALL `_internalResolve` or `_internalReject` directly.
// Instead, they can be solved entirely using the public
// parts of your $Promise library. Remember: the executor
// function gives public access to the resolver / rejector.
/*========================================================*/

/* global $Promise customMatchers */

jasmine.DEFAULT_TIMEOUT_INTERVAL = 250;

function noop () {}

// `$Promise.resolve` is not exactly the same thing as a resolver, at least
// not in Pledge (depends on your promise library's implementation.)

describe('The static method `$Promise.resolve`', function(){

  it('is a function, and not one we have already written', function(){
    expect( typeof $Promise.resolve ).toBe( 'function' );
    var promise = new $Promise(noop);
    expect( $Promise.resolve ).not.toBe( promise._internalResolve );
  });

  it('takes a <plain value A> and returns a <promise for A>', function(){
    [42, 'hi', {}, undefined, /cool/, false].forEach(value => {
      var promise = $Promise.resolve(value);
      expect( promise instanceof $Promise ).toBe( true );
      // Do not set state & value manually; call a resolver.
      expect( promise._state ).toBe( 'fulfilled' );
      expect( promise._value ).toBe( value );
    });
  });

  // This would be more complex with "thenables," but we are ignoring those.

  it('takes a <promise for A> and returns the same <promise for A>', function(){
    var firstPromise = new $Promise(noop);
    var secondPromise = $Promise.resolve(firstPromise);
    expect( secondPromise ).toBe( firstPromise );
  });

  // As you can see, `$Promise.resolve` "normalizes" values which may or may
  // not be promises. Values become promises, and promises are already
  // promises. Not sure if something is a promise? Use `$Promise.resolve`.

  // This spec should already pass if the above works. Read through the
  // assertions and try to understand what they demonstrate.

  it('demonstrates why "resolved" and "fulfilled" are not synonyms', function(){
    var rejectedPromise = new $Promise(function (resolve, reject) {
      reject();
    });
    // And now for the reveal:
    var result = $Promise.resolve(rejectedPromise); // RESOLVING...
    expect( result._state ).toBe( 'rejected' ); // ...but REJECTED!
    // We "resolved" but still ended up with a rejected promise. So "resolve"
    // really means *attempt* fulfillment. That works with normal values, or
    // promises which are already fulfilled. However, we cannot lie and claim
    // that an already-rejected promise is now magically fulfilled, without
    // having actually handled the rejection reason.
  });

});

// `Promise.all` is one of the most useful methods in any async toolkit. The
// `then` method gave us serial chaining; `all` gives us parallel waiting.

describe('The static method `$Promise.all`', function(){

  var SMALL_DELAY = 10;
  var MAX_DELAY = 100;

  var values;
  beforeEach(function(){
    values = [42, 'hi', false, {}, undefined, [] ];
    jasmine.addMatchers(customMatchers);
  });

  it('is a function', function(){
    expect( typeof $Promise.all ).toBe( 'function' );
  });

  // Real ES6 `Promise.all` accepts ANY iterable (https://mzl.la/1SopN1G), but
  // that is beyond Pledge's scope. Our `.all` only needs to support arrays.

  it('takes a single array argument', function(){
    // Passing an array into `$Promise.all` causes no errors.
    function callingAllWithArrays () {
      $Promise.all([]);
      $Promise.all(values);
    }
    expect( callingAllWithArrays ).not.toThrow();
    // Passing a non-array into `$Promise.all` throws a `TypeError`.
    const nonArrayValues = [42, 'hi', false, {}, undefined, /wow/];
    nonArrayValues.forEach(value => {
      function callingAllWithValue () { return $Promise.all(value); }
      expect( callingAllWithValue ).toThrowError( TypeError );
    });
  });

  // Doesn't seem so hard at first.

  it('converts an <array of values> into a <promise for an array of values>', function (done) {
    var promise = $Promise.all(values);
    expect( promise instanceof $Promise ).toBe(true);
    // The promise should fulfill with the values.
    expect( promise ).toFulfillWith( values, done );
  });

  // Uh oh, getting a bit trickier.
  it('converts an <array of promises> into a <promise for an array of values>', function (done) {
    var promises = values.map(value => $Promise.resolve(value));
    console.log('promises')
    var promise = $Promise.all(promises);
    // The promise should fulfill with values (not promises for values).
    expect( promise ).toFulfillWith( values, done );
  });

  // No shortcuts; each individual element may be a value or a promise for a value.

  it('converts an <array of values and promises> into a <promise for an array of values>', function (done) {
    var valuesAndPromises = values.map(value => {
      return Math.random() < 0.5 ? value : $Promise.resolve(value);
    });
    var promise = $Promise.all(valuesAndPromises);
    // promise should fulfill with values (not mix of promises and values).
    expect( promise ).toFulfillWith( values, done );
  });

  // Helper: gives a promise for a value, resolves after a set or random delay.

  function slowPromise (value, delay) {
    return new $Promise(function (resolve) {
      setTimeout(
        () => resolve(value),
        delay || (Math.random() * MAX_DELAY)
      );
    });
  }

  // Oops! You weren't synchronously checking `._value`, were you? That won't
  // work if a promise is still pending. Remember how to access a promise's
  // eventual value? You might have to alter or augment your approach here.

  it('converts an <array of async promises> into a <promise for an array of values>', function (done) {
    var promises = values.map((value, i) => {
      return slowPromise(value, SMALL_DELAY * (i + 1));
    });
    var promise = $Promise.all(promises);
    // promise should fulfill with values... once those values actually exist.
    expect( promise ).toFulfillWith( values, done );
  });

  // Don't simply push values in the order they finish. Somehow you have to
  // keep track of which values go where in the final array.

  it('converts an <array of async promises> (fulfilling in random order) into a <promise for an array of values> (ordered by index in the original array)', function (done) {
    var promises = values.map(slowPromise); // random delays
    var promise = $Promise.all(promises);
    // promise should fulfill with values, and in the right order too!
    expect( promise ).toFulfillWith( values, done );
  });

  // So close now! What happens if one of the promises fails?

  it('rejects with <reason E> when one of the input promises rejects with <reason E>', function (done) {
    // promise that rejects after a random delay
    var promiseThatRejects = new $Promise(noop);
    var doomsday = Math.random * MAX_DELAY;
    setTimeout(() => promiseThatRejects._internalReject('any Black Mirror episode'), doomsday);
    // a bunch of promises which fulfill in random order
    var promises = values.map(slowPromise);
    // slip our doomed promise in there somewhere
    var randomIndex = Math.floor(Math.random() * promises.length);
    promises.splice(randomIndex, 0, promiseThatRejects);
    // wait for everything with $Promise.all
    var promise = $Promise.all(promises);
    // promise should be rejected.
    expect( promise ).toRejectWith( 'any Black Mirror episode', done );
  });

  // This probably already passes, but let's be sure. We're strict that way.

  it('is not affected by additional rejections', function (done) {
    // promises that reject after a random delay
    var doomed = new $Promise(noop);
    var reallyDoomed = new $Promise(noop);
    var doomsday = Math.random * MAX_DELAY;
    var postApocalypse = doomsday + SMALL_DELAY;
    setTimeout(() => doomed._internalReject('I am the first rejection'), doomsday);
    setTimeout(() => reallyDoomed._internalReject('I am too late, ignore me'), postApocalypse);
    // a bunch of promises which fulfill in random order
    var promises = values.map(slowPromise);
    // slip our doomed promises in there somewhere
    var randomIndex1 = Math.floor(Math.random() * promises.length);
    var randomIndex2 = Math.floor(Math.random() * promises.length);
    promises.splice(randomIndex1, 0, doomed);
    promises.splice(randomIndex2, 0, reallyDoomed);
    // wait for everything with $Promise.all
    var promise = $Promise.all(promises);
    // promise should be rejected with first rejection reason.
    expect( promise ).toRejectWith( 'I am the first rejection', done );
  });

  // Whew! As we can see, `Promise.all` actually does quite a bit for us.
  // Basically, we can give `.all` an array containing any mix of values and
  // randomly-timed promises. In return, `.all` gives us a promise for all the
  // eventual values, maintaining the original order of the array even if
  // the promises fulfill out of order. And if any input promise fails, the
  // output promise fails immediately with the same rejection reason.
});

});

// Don't forget to `git commit`!
