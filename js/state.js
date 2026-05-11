// js/state.js

const State = (() => {
  const store = {};
  const listeners = {};

  function get(key) {
    return store[key];
  }

  function set(key, value) {
    store[key] = value;
    if (!listeners[key]) return;
    listeners[key].forEach((listener) => listener(value));
  }

  function subscribe(key, listener) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(listener);
    return () => {
      listeners[key] = listeners[key].filter((item) => item !== listener);
    };
  }

  function reset() {
    Object.keys(store).forEach((key) => {
      delete store[key];
    });
    Object.keys(listeners).forEach((key) => {
      listeners[key] = [];
    });
  }

  return { get, set, subscribe, reset };
})();
