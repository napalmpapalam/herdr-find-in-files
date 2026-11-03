/** Resolves to the promise's value, or to the Error it rejected with. */
export const settle = (promise) => {
  return promise.catch((e) => (e instanceof Error ? e : new Error(String(e))));
};
