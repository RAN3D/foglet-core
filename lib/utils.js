/**
 * Pick a random element inside a list, given a list of exceptions if any
 * @param  {Array}  [list=[]]
 * @param  {Array}  [except=[]]
 * @return {*} A random element from the list argument
 */
const pickRandom = (list = [], except = []) => {
  let res = []
  if (except.length > 0) {
    for (const i in list) {
      if (!except.includes(list[i])) {
        res.push(list[i])
      }
    }
  } else {
    res = list
  }
  const rn = getRandomInt(0, list.length - 1)
  return list[rn]
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Asynchronous while with condition
 * Resolved when the condition function return true
 * @param  {function}  cond function returning a boolean
 * @return {Promise}
 */
const asyncWhile = async (cond) => {
  if (cond()) {
    return Promise.resolve()
  } else {
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    return asyncWhile(cond)
  }
}

const countDown = async (n, wait) => {
  for (let i = 0; i < n; i++) {
    console.log(`[${i}] sleeping (${wait} ms)`)
    await asyncTimeout(wait)
  }
}

const asyncTimeout = async (wait = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('waiting: ', wait)
      resolve()
    }, wait)
  })
}

module.exports = {
  countDown,
  asyncWhile,
  pickRandom,
  getRandomInt
}
