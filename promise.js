class Promise {
  constructor(executor) {
    this.value = undefined
    this.reason = undefined
    this.status = 'pending'
    this.onResolveeCallbacks = []
    this.onRejectedCallbacks = []
    this.resolve = (value) => {
      if (this.status === 'pending') {
        this.value = value
        this.status = 'resolved'
        this.onResolveeCallbacks.forEach(fn => {
          fn()
        })
      }
    }
    this.reject = (reason) => {
      if (this.status === 'pending') {
        this.reason = reason
        this.status = 'rejected'
        this.onRejectedCallbacks.forEach(fn => {
          fn()
        })
      }
    }
    try {
      executor(this.resolve, this.reject)
    } catch (e) {
      this.reject(e)
    }
  }
  then(onFulfilled, onRejected) {
    let self = this
    onFulfilled = typeof onFulfilled == 'function' ? onFulfilled : (data) => {
      return data
    }
    onRejected = typeof onRejected == 'function' ? onRejected : (err) => {
      throw err
    }
    let promise2 = new Promise((resolve, reject) => {
      if (self.status === 'resolved') {
        setTimeout(() => {
          try {
            let x = onFulfilled(self.value);
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (self.status === 'rejected') {
        setTimeout(() => {
          try {
            let x = onRejected(self.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0)
      }
      if (self.status === 'pending') {
        self.onResolveeCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(self.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        self.onRejectedCallbacks.push(function () {
          setTimeout(() => {
            try {
              let x = onRejected(self.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0)
        })
      }
    })
    return promise2
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('循环引用'))
  }
  let called;
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(x, (y) => {
          if (!called) {
            called = true
          } else {
            return
          }
          resolvePromise(promise2, y, resolve, reject)
        }, (err) => {
          if (!called) {
            called = true
          } else {
            return
          }
          reject(err)
        })
      } else {
        if (!called) {
          called = true
        } else {
          return
        }
        resolve(x)
      }
    } catch (err) {
      if (!called) {
        called = true
      } else {
        return
      }
      reject(err)
    }
  } else {
    resolve(x)
  }
}