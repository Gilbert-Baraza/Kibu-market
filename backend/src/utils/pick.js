export function pick(object, keys) {
  return keys.reduce((result, key) => {
    if (object[key] !== undefined) {
      result[key] = object[key];
    }

    return result;
  }, {});
}