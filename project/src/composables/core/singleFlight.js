export function createSingleFlight() {
  let inFlight = null

  function singleFlight(fn) {
    if (inFlight) {
      return inFlight
    }

    inFlight = Promise.resolve()
      .then(fn)
      .finally(() => {
        inFlight = null
      })

    return inFlight
  }

  singleFlight.reset = () => {
    inFlight = null
  }

  return singleFlight
}

export function createKeyedSingleFlight() {
  const inFlight = new Map()

  function singleFlight(key, fn) {
    if (inFlight.has(key)) {
      return inFlight.get(key)
    }

    const promise = Promise.resolve()
      .then(fn)
      .finally(() => {
        inFlight.delete(key)
      })

    inFlight.set(key, promise)
    return promise
  }

  singleFlight.reset = (key) => {
    if (key === undefined) {
      inFlight.clear()
    } else {
      inFlight.delete(key)
    }
  }

  return singleFlight
}
