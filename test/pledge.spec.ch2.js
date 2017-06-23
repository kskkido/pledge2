'use strict';
describe('Chapter 2: Fulfillment Callback Attachment', function(){
/*======================================================


                         .d8888b.
                        d88P  Y88b
                               888
                             .d88P
                         .od888P"
                        d88P"
                        888"
                        888888888


Chapter 2: Attaching and Calling Promise Event Handlers
--------------------------------------------------------*/
// We are beginning to see how a promise can be manipulated
// through the executor. But what does a promise actually do?
// By completing this chapter, you will learn the fundamentals
// of how promises act on eventual information.
/*========================================================*/

/* global $Promise */

function noop () {}

// `then` is the core of promise behavior. In fact, the P/A+ spec which forms
// the underpinnings of the ES6 spec only covers this method. The `then`
// function is used to register *handlers* if and when the promise either
// fulfills or rejects.

describe("A promise's `.then` method", function(){

  var promise, s1, e1, s2, e2;
  beforeEach(function(){
    promise = new $Promise(noop);
    s1 = function (/* data */)   { /* use data */ };
    e1 = function (/* reason */) { /* handle reason */ };
    s2 = function (/* data */)   { /* use data */ };
    e2 = function (/* reason */) { /* handle reason */ };
  });

  it('adds groups of handlers (callback functions) to the promise', function(){
    promise.then( s1, e1 );
    expect( promise._handlerGroups[0].successCb ).toBe( s1 );
    expect( promise._handlerGroups[0].errorCb   ).toBe( e1 );
  });

  // This is calling `then` on the same promise multiple times, which is NOT
  // the same as "chaining." We'll deal with promise chaining in Ch. 4.

  it('can be called multiple times to add more handlers', function(){
    promise.then( s1, e1 );
    expect( promise._handlerGroups[0].successCb ).toBe( s1 );
    expect( promise._handlerGroups[0].errorCb   ).toBe( e1 );
    promise.then( s2, e2 );
    expect( promise._handlerGroups[1].successCb ).toBe( s2 );
    expect( promise._handlerGroups[1].errorCb   ).toBe( e2 );
  });

  it('attaches a falsy value in place of non-function success or error callbacks', function(){
    promise.then( 'a string', {} );
    expect( promise._handlerGroups[0].successCb ).toBeFalsy();
    expect( promise._handlerGroups[0].errorCb   ).toBeFalsy();
  });

});

// Now comes one of the "magic" parts of promises — the way they can trigger
// handlers both when they settle, and also after they have already settled.

describe('A promise', function(){

  var promiseForNum, foo;
  var setFoo10 = jasmine.createSpy('setFoo10').and.callFake(function () {
    foo = 10;
  });
  var addToFoo = jasmine.createSpy('addToFoo').and.callFake(function (num) {
    foo += num;
  });
  beforeEach(function(){
    promiseForNum = new $Promise(noop);
    foo = 0;
    setFoo10.calls.reset();
    addToFoo.calls.reset();
  });

  describe('that is not yet fulfilled', function(){

    it('does not call any success handlers yet', function(){
      promiseForNum.then( setFoo10 );
      expect( setFoo10 ).not.toHaveBeenCalled();
    });

  });

  describe('that is already fulfilled', function(){

    beforeEach(function(){
      promiseForNum._internalResolve( 25 );
    });

    // Recommended: add a `._callHandlers` method to your promise prototype.

    it('calls a success handler added by `.then`', function(){
      promiseForNum.then( setFoo10 );
      expect( setFoo10 ).toHaveBeenCalled();
    });

    it("calls a success handler by passing in the promise's value", function(){
      promiseForNum.then( addToFoo );
      expect( addToFoo ).toHaveBeenCalledWith( 25 );
    });

    it('calls each success handler once per attachment', function(){
      promiseForNum.then( setFoo10 );
      promiseForNum.then( addToFoo );
      promiseForNum.then( addToFoo );
      expect( setFoo10.calls.count() ).toBe( 1 );
      expect( addToFoo.calls.count() ).toBe( 2 );
      expect( addToFoo ).toHaveBeenCalledWith( 25 );
    });

    it('calls each success handler when added', function(){
      promiseForNum.then( setFoo10 );
      expect( foo ).toBe( 10 );
      promiseForNum.then( addToFoo );
      expect( foo ).toBe( 35 );
    });

  });

  // So we can run callbacks if we already have the value.
  // But what if events occur in opposite order?

  describe('that already has a success handler', function(){

    it('calls that handler when fulfilled', function(){
      promiseForNum.then( setFoo10 );
      promiseForNum._internalResolve();
      expect( setFoo10 ).toHaveBeenCalled();
    });

    it('calls all its success handlers in order one time when fulfilled', function(){
      promiseForNum.then( setFoo10 );
      console.log('post')
      promiseForNum.then( addToFoo );
      promiseForNum._internalResolve( 25 );
      expect( foo ).toBe( 35 );
    });

  });

});


// We've just made something nifty. A promise's `.then` can attach behavior
// both before & after the promise is actually fulfilled, and we know that the
// actions will run when they can. The `.then` method can also be called
// multiple times, so you can attach callbacks to run in different parts of
// your code, and they will all run once the promise is fulfilled.

});

// Don't forget to `git commit`!
