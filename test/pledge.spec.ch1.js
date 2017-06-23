'use strict';

// Promises Workshop: Build a Constructor-Style Implementation

// We are going to write a promise library similar to ES6 Promise, called
// pledge.js. Our promises will be named "$Promise" to avoid triggering
// existing browser code. To focus on concepts, pledge.js will use many public
// variables and not be standards-compliant.

// To execute the spec, run `npm test` in this directory. When you pass a test,
// change the next pending test from active. This spec is iterative and
// opinionated; do the tests in order.


describe('Chapter 1: Structure and State', function(){
/*======================================================


                           d888
                          d8888
                            888
                            888
                            888
                            888
                            888
                          8888888


Chapter 1: Basic Structure and State Changes
--------------------------------------------------------*/
// Let's start with some essential pieces and begin to
// define how promise construction, the `executor` argument,
// and resolution / rejection.
/*========================================================*/

/* global $Promise */

// Even before ES6 `class` syntax, devs commonly called certain functions
// "classes". Although JS is not a class-based language, we still tend to talk
// in terms of constructors and instances.

describe('The `$Promise` class', function(){

  it('is a function', function(){
    expect( typeof $Promise ).toBe( 'function' );
  });

  // The only argument to a promise constructor is a function called the
  // "executor". We will circle back to this function later.

  it('can be called with a function argument (the "executor"), returning a new promise instance', function(){
    var executor = function () {};
    var promise = new $Promise(executor);
    expect( promise instanceof $Promise ).toBe( true );
  });

  // This type check mimics the strictness of real ES6 Promises.

  it('throws a descriptive type error if called with no function argument', function(){
    var nonFunctions = [null, 'bonjour', undefined, 452, {}, false];
    nonFunctions.forEach(function (nonFunction) {
      expect(callingNewPromiseWith(nonFunction)).toThrowError(
        TypeError,
        /executor.+function/i // any error message containing "executor" and later "function"
      );
    });
    function callingNewPromiseWith (argument) {
      return function mightThrowError () {
        var promise = new $Promise(argument); // eslint-disable-line no-unused-vars
      };
    }
  });

});

describe('A promise instance', function(){

  var promise;
  beforeEach(function(){
    var executor = function () {};
    promise = new $Promise(executor);
  });

  // Promises internally hold some state (changing information), which in turn
  // affects how they behave. Promises are a kind of *state machine*.

  // JavaScript lacks some privacy control compared to other languages. A
  // common convention is to use a naming scheme to mark a method as "private".
  // Beginning methods with an `._underscore` is one such signal.

  it('starts with "pending" internal state', function(){
    expect( promise._state ).toBe( 'pending' );
  });

  // NOTE — promises are NOT supposed to have public resolver and rejector
  // methods. However, hiding this implementation detail can be tricky.

  it('has an `._internalResolve` instance method', function () {
    expect( typeof promise._internalResolve ).toBe( 'function' );
  });

  it('has an `._internalReject` instance method', function () {
    expect( typeof promise._internalReject ).toBe( 'function' );
    expect( promise._internalReject ).not.toBe( promise._internalResolve );
  });

  // We have some scaffolding set up, now let's work on behavior.

  describe('resolving', function(){

    it('changes the promise state to "fulfilled"', function(){

      // Why not "resolved"? This will be covered in detail in Ch. 5, but
      // for now just know that strict P/A+ terminology draws a distinction
      // between "resolution" and "fulfillment." Normally a resolved promise
      // is also fulfilled, but in one particular case, a resolved promise is
      // actually rejected. You don't have to know why just yet.

      promise._internalResolve();
      expect( promise._state ).toBe( 'fulfilled' );
    });

    it('can send data to the promise for storage', function(){
      var someData = { name: 'Harry Potter' };
      promise._internalResolve( someData );
      expect( promise._value ).toBe( someData );
    });

    // Hint: use the pending status.

    it('does not affect an already-fulfilled promise', function(){
      var data1 = { name: 'Harry Potter' };
      var data2 = { name: 'Gandalf' };
      promise._internalResolve( data1 );
      promise._internalResolve( data2 );
      expect( promise._value ).toBe( data1 );
    });

    it('works even with falsey values', function(){
      var data1; // undefined; could also work with null, 0, false, etc.
      var data2 = 'oops!';
      promise._internalResolve( data1 );
      promise._internalResolve( data2 );
      expect( promise._value ).toBe( data1 );
    });

  });

  describe('rejecting', function(){

    // Rejection and fulfillment are virtually identical. This should not
    // require much more code.

    it('changes the promise state to "rejected"', function(){
      promise._internalReject();
      expect( promise._state ).toBe( 'rejected' );
    });

    it('can send a reason to the promise for storage', function(){
      var myReason = { error: 'bad request' };
      promise._internalReject( myReason );
      expect( promise._value ).toBe( myReason );
    });

    it('does not affect an already-rejected promise', function(){
      var reason1 = { error: 'bad request' };
      var reason2 = { error: 'timed out' };
      promise._internalReject( reason1 );
      promise._internalReject( reason2 );
      expect( promise._value ).toBe( reason1 );
    });

    it('works even with falsey values', function(){
      var reason1;
      var reason2 = 'oops!';
      promise._internalReject( reason1 );
      promise._internalReject( reason2 );
      expect( promise._value ).toBe( reason1 );
    });

  });

  describe('settled promises never change state:', function(){

    // If you used the pending status for your "does not affect already
    // fulfilled / rejected" specs, these two specs should pass already.

    it('`reject` does not overwrite fulfillment', function(){
      promise._internalResolve( 'Dumbledore' );
      promise._internalReject( 404 );
      expect( promise._state ).toBe( 'fulfilled' );
      expect( promise._value ).toBe( 'Dumbledore' );
    });

    it('`resolve` does not overwrite rejection', function(){
      promise._internalReject( 404 );
      promise._internalResolve( 'Dumbledore' );
      expect( promise._state ).toBe( 'rejected' );
      expect( promise._value ).toBe( 404 );
    });

  });

});

// The Promise constructor takes one argument (in fact, ES6 Promises *must*
// receive this argument, or throw an error): an "executor" function. The
// executor will be called with two arguments: a "resolver" and "rejector".

// The executor is a way for the *creator* of a new promise to control that
// promise's eventual fate. Remember, `._internalResolve` is how we are
// implementing our promises, but users normally aren't supposed to have access
// to that directly. This is mostly to prevent abuse: promises are supposed to
// represent the result of an async action, but if *anyone* can call
// `._internalResolve`, we can no longer trust that the promise settled
// because of the original async. Since the executor only runs when the
// promise is constructed, access to the resolver and rejector is naturally
// limited, making the promise more trustable.

describe('The executor function', function(){

  var executor;
  beforeEach(function(){
    executor = jasmine.createSpy();
  });

  it('gets called when making a new $Promise', function(){
    expect( executor ).not.toHaveBeenCalled();
    var promise = new $Promise(executor); // eslint-disable-line no-unused-vars
    expect( executor ).toHaveBeenCalled();
  });

  it('gets called with two different functions (funception!), resolve and reject', function(){
    var promise = new $Promise(executor); // eslint-disable-line no-unused-vars
    var argsPassedIntoExecutor = executor.calls.argsFor(0);

    expect(argsPassedIntoExecutor.length).toBe(2);
    var resolve = argsPassedIntoExecutor[0];
    var reject = argsPassedIntoExecutor[1];

    expect( typeof resolve ).toBe( 'function' );
    expect( typeof reject ).toBe( 'function' );
    expect( resolve ).not.toBe( reject );
  });

  describe('resolve argument', function(){

    // At this point you might try one approach, only to be stymied by errors
    // like "cannot read X of undefined". Think carefully; you may have an
    // issue with *context* (the `this` keyword).

    it('resolves the promise', function(){
      var promise = new $Promise(function (resolve) {
        resolve('WinGARdium leviOHsa.');
      });
      expect( promise._state ).toBe( 'fulfilled' );
      expect( promise._value ).toBe( 'WinGARdium leviOHsa.' );
    });

    // Don't cheat! The resolver and rejector functions provided to the
    // executor should be (or call) the internal resolve and reject methods.
    // After all, you worked so hard to make sure `._internalResolve` and
    // `._internalReject` work properly.

    it('is indistinguishable in behavior from `._internalResolve`', function () {
      var resolver;
      var promise = new $Promise(function (resolve) {
        resolve('Use the promise machinery, Luke.');
        resolver = resolve;
      });
      // Can we mess up the state?
      resolver('No, Luke. I am your resolver.');
      promise._internalReject("No, that's impossible!");
      promise._internalResolve('Search your feelings, Luke.');
      // Nope, `resolve` either is or uses `._internalResolve`.
      expect( promise._state ).toBe( 'fulfilled' );
      expect( promise._value ).toBe( 'Use the promise machinery, Luke.' );
    });

  });

  describe('reject argument', function () {

    // Yet again, resolution and rejection are basically the same.

    it('rejects the promise', function(){
      var promise = new $Promise(function (resolve, reject) {
        reject('Stupefy!');
      });
      expect( promise._state ).toBe( 'rejected' );
      expect( promise._value ).toBe( 'Stupefy!' );
    });

    it('is indistinguishable in behavior from `._internalReject`', function () {
      var rejector;
      var promise = new $Promise(function (resolve, reject) {
        reject('You must unlearn what you have learned.');
        rejector = reject;
      });
      // Can we mess up the state?
      rejector('No! Try not. Do. Or do not. There is no try.');
      promise._internalReject("I don't believe it!");
      promise._internalResolve('That is why you fail.');
      // Nope, `reject` either is or uses `._internalResolve`.
      expect( promise._state ).toBe( 'rejected' );
      expect( promise._value ).toBe( 'You must unlearn what you have learned.' );
    });

  });

  // This part should pass if you did the above correctly. Follow the logic:

  it('therefore allows the *creator* of a new promise to control its fate, even asynchronously!', function (done) {

    var promise3 = new $Promise(function (resolve) {
      setTimeout(function runsInTheFuture () {
        resolve('Wow, the future is so cool.');
      }, 50);
    });

    expect( promise3._state ).toBe( 'pending' );
    expect( promise3._value ).toBe( undefined );

    setTimeout(function runsInTheFarFuture () {
      expect( promise3._state ).toBe( 'fulfilled' );
      expect( promise3._value ).toBe( 'Wow, the future is so cool.' );
      done();
    }, 100);
  });

});

// At this point we have some basic facts established. A promise starts out
// with *pending* state and no value. At some point, the promise can become
// *fulfilled* with data, or *rejected* with a reason. Once *settled*
// (fulfilled or rejected), a promise is stuck in that state and cannot be
// changed again.

// The executor function enables developers to access a promise's resolver and
// rejector, which control the promise's fate. This pattern naturally limits
// how the resolver and rejector are accessed, encouraging developers to use
// promises correctly.

});

// Don't forget to `git commit`!
