'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js ES6-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

// exec function takes resolve and reject as argument
const $Promise = function (exec) {
  if (typeof exec !== 'function') throw new TypeError('executor must be function')

  this._state = 'pending'
  // calls the exec function with the internal methods of promise
  exec(this._internalResolve.bind(this), this._internalReject.bind(this))
}

// called when the executor function is resolved. Sets the state to fulfilled and value to data it is passed
$Promise.prototype._internalResolve = function (data) {
  if (this._state !== 'pending') return

  this._state = 'fulfilled'
  this._value = data
  if (this._handlerGroups) this._handlerGroups.forEach(this._callHandler, this)
}

$Promise.prototype._internalReject = function (error) {
  if (this._state !== 'pending') return

  this._state = 'rejected'
  this._value = error
  if (this._handlerGroups) this._handlerGroups.forEach(this._callHandler, this)
}

$Promise.prototype.then = function(successCb, errorCb) {
  this._handlerGroups = this._handlerGroups || []

  successCb = typeof successCb === 'function' ? successCb : null
  errorCb = typeof errorCb === 'function' ? errorCb : null
  const downstreamPromise = new $Promise(function(){})
  this._handlerGroups.push({successCb, errorCb, downstreamPromise})

  if (this._state !== 'pending') this._callHandler({successCb, errorCb, downstreamPromise})
  return downstreamPromise
}

$Promise.prototype._callHandler = function ({successCb, errorCb, downstreamPromise}) {

  this._handlerGroups = this._handlerGroups.slice(1) || []
  return this._state === 'fulfilled' ?
    (successCb ? this._try(downstreamPromise, successCb) : downstreamPromise._internalResolve(this._value)) :
    (errorCb ? this._try(downstreamPromise, errorCb): downstreamPromise._internalReject(this._value))
}

$Promise.prototype.catch = function(errorCb) {
  return this.then(null, errorCb)
}

$Promise.prototype._try = function(dsp, cb) {
  try {
    const value = cb(this._value)
    value instanceof $Promise ?
      value.then(val => dsp._internalResolve(val), err => dsp._internalReject(err))
    :
      dsp._internalResolve(value)
  } catch (error) {
    dsp._internalReject(error)
  }
}

$Promise.resolve = function(data) {
  return data instanceof $Promise ? data :
  new $Promise((res, _) => {
    return res(data)
  })
}

$Promise.all = function(arr) {
  if (!Array.isArray(arr)) throw new TypeError('argument must be an array')

  function _curry (fn) {
    const args = []
    return function(arg, idx) {
      args.push({arg, idx})
      if (args.length === arr.length) {
        return fn(args)
      }
    }
  }

  return new $Promise((res, rej) => {
    const args = []

    const curriedRes = _curry(args => {
      args = args.sort((a, b) => a.idx - b.idx).map(({arg}) => arg)
      res(args)
    })

    arr.forEach((el, i) => {
      el instanceof $Promise ?
        el.then(val => curriedRes(val, i), rej)
      :
      curriedRes(el, i)
    })
  })
}



/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = $Promise;

So in a Node-based project we could write things like this:

var Promise = require('pledge');
…
var promise = new Promise(function (resolve, reject) { … });
--------------------------------------------------------*/
