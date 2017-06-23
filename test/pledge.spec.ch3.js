'use strict';
describe('Chapter 3: Rejection Callback Attachment', function(){
/*=======================================================


                         .d8888b.
                        d88P  Y88b
                             .d88P
                            8888"
                             "Y8b.
                        888    888
                        Y88b  d88P
                         "Y8888P"


Chapter 3: Completing the Handlers: Rejection & Catch
---------------------------------------------------------*/
// With `.resolve` sending and `.then` acting on data, we have
// a major part of promises working. Rejection is similar;
// finish the "callback aggregation" of promises in this chapter.
/*========================================================*/

/* global $Promise */

function noop () {}

describe('Another promise', function(){

  var promiseForThing, log;
  var logOops = jasmine.createSpy('logOops').and.callFake(function () {
    log.push({ code: 'oops' });
  });
  var logInput = jasmine.createSpy('logInput').and.callFake(function (input) {
    log.push(input);
  });
  beforeEach(function(){
    promiseForThing = new $Promise(noop);
    log = [];
    logOops.calls.reset();
    logInput.calls.reset();
  });

  describe('that is not yet rejected', function(){

    it('does not call error handlers yet', function(){
      promiseForThing.then( null, logOops );
      expect( logOops ).not.toHaveBeenCalled();
    });

  });

  describe('that is already rejected', function(){

    var theReason = { code: 'timed out' };
    beforeEach(function(){
      promiseForThing._internalReject( theReason );
    });

    // If you get "not a function" errors, think carefully about
    // what happens when you call `.then`. What is getting added
    // to the `handlerGroups`? What is your code trying to do with
    // those `handlerGroups`? There is going to have to be some
    // sort of "safety check" somewhere…

    it('does not call any success handlers', function(){
      promiseForThing.then( logOops );
      expect( logOops ).not.toHaveBeenCalled();
    });

    it('calls an error handler added by `.then`', function(){
      promiseForThing.then( null, logOops );
      expect( logOops ).toHaveBeenCalled();
    });

    it("calls an error handler by passing in the promise's value", function(){
      promiseForThing.then( null, logInput );
      expect( logInput ).toHaveBeenCalledWith( theReason );
    });

    it('calls each error handler once per attachment', function(){
      promiseForThing.then( null, logOops );
      promiseForThing.then( null, logInput );
      promiseForThing.then( null, logInput );
      expect( logOops.calls.count() ).toBe( 1 );
      expect( logInput.calls.count() ).toBe( 2 );
      expect( logInput ).toHaveBeenCalledWith( theReason );
    });

    it('calls each error handler in the order added', function(){
      promiseForThing.then( null, logOops );
      promiseForThing.then( null, logInput );
      expect( log ).toEqual( [{ code: 'oops'}, {code: 'timed out'}] );
    });

  });

  describe('that already has an error handler', function(){

    var theReason = { code: 'unauthorized' };

    it('calls that handler when rejected', function(){
      promiseForThing.then( null, logInput );
      promiseForThing._internalReject( theReason );
      expect( logInput ).toHaveBeenCalledWith( theReason );
    });

    it('calls all its error handlers in order one time when rejected', function(){
      promiseForThing.then( null, logInput );
      promiseForThing.then( null, logOops );
      promiseForThing._internalReject( theReason );
      expect( log ).toEqual( [{code: 'unauthorized'}, {code: 'oops'}] );
    });

  });

  // This next part is a demonstration; with working resolution and rejection,
  // promises can be used as drop-in callback replacements.

  describe('with both success and error handlers', function(){

    var ui;
    beforeEach(function(){
      ui = {
        animals: ['kitten', 'puppy'],
        warning: null
      };

      promiseForThing.then(
        function thingSuccess (thing) {
          ui.animals.push( thing.animal );
        },
        function thingError (reason) {
          ui.warning = reason.message;
        }
      );

    });

    it('can do stuff with fulfilled data', function(){
      promiseForThing._internalResolve({ animal: 'duckling' });
      expect( ui.animals[2] ).toBe( 'duckling' );
    });

    it('can deal with rejection reasons', function(){
      promiseForThing._internalReject({ message: 'unauthorized' });
      expect( ui.warning ).toBe( 'unauthorized' );
    });

    // Optional but recommended garbage collection

    it('discards handlers that are no longer needed', function(){
      promiseForThing._internalResolve({ animal: 'chipmunk' });
      expect( promiseForThing._handlerGroups ).toEqual( [] );
    });

  });

});

// A quick detour while we are finishing rejections: add a `.catch` convenience
// method to your promise prototype. The internals of this method can be coded
// as one short line.

describe("A promise's `.catch` method", function(){

  var promise;
  beforeEach(function(){
     promise = new $Promise(noop);
     spyOn( promise, 'then' ).and.callThrough();
  });
  function myFunc (reason) { console.log(reason); }

  it('attaches the passed-in function as an error handler', function(){
    promise.catch( myFunc );
    expect( promise.then ).toHaveBeenCalledWith( null, myFunc );
  });

  // This spec will probably already pass at this point, because by default all
  // functions return `undefined`. However, as you start Ch. 4, this may fail.
  // If that happens, you will have to return here and fix `.catch` — this
  // time, taking the Ch. 4 specs into account.

  it('returns the same kind of thing that .then would', function(){
    var catchReturn = promise.catch( myFunc );
    var thenReturn = promise.then( null, myFunc );
    [catchReturn, thenReturn].forEach(sanitize);
    // should be visually identical (but are not necessarily ===):
    expect( catchReturn ).toEqual( thenReturn );
  });

  // Utility to simplify the return value somewhat. Not always necessary, but
  // some valid solutions don't work with normal `toEqual`.

  function sanitize (val) {
    if (!val || typeof val !== 'object') return;

    Object.keys(val)
    .filter(key => typeof val[key] === 'function')
    .forEach(key => {
      val[key] = (val[key].name.trim() || 'anonymous') + ' function';
    });
  }

});

// That finishes the attachment and triggering of our handlers! In the next
// chapter, we will dive deeply into how `.then` chaining actually works.
// This behavior is what drives promises beyond being just portable callback
// sinks and transforms them into dynamic, versatile, powerful,
// manipulatable machines.

});

// Don't forget to `git commit`!
