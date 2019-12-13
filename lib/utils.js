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

module.exports = {
  pickRandom,
  getRandomInt
}
