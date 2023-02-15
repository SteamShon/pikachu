import LRU from "lru-cache";

/**
 * Small utility around an LRU cache that gives us some features:
 *  - Promisification: Async ready to easily change to a memcached/redis implementation
 *  - Improved get method, to make more expressive usage of the pattern "if not found
 *  in the cache, go get it, store in the cache, and return the value"
 *  - Funnel values: Promises are stored and returned, so if the value for a key
 *  is being obtained while another get is requested, the promise of the value is returned
 *  so only one request for value is done
 */
export class MyCache<K, V = unknown> {
  lru: LRU<string, Promise<V>>;
  constructor(opt: LRU.Options<string, Promise<V>>) {
    this.lru = new LRU(opt);
  }

  /**
   * Gets a value from the cache. When an optional getter method is provided,
   * it will be called when there is a cache miss to get the value and store
   * it in the cache.
   * When the getter method throws/rejects, it will be propagated down the chain
   *
   * ```js
   *    // Old Way (Sync code)
   *    let value = cache.get(key);
   *    if (!value) {
   *      value = calculateValue();
   *      cache.put(key, value);
   *    }
   *    return value;
   * ```
   *    that becomes
   * ```js
   *    return cache.get(key, calculateValue);
   * ```
   *
   * @param {String} key the cache entry key
   * @param {Function} [getter] the function to call when a value is not found
   *    in the cache. Return promise or a discrete value, that will be
   *    stored in the cache for that key
   * @returns {Promise.<V>} the cache entry
   */
  async get(key: K, getter: (k: K) => Promise<V>): Promise<V> {
    const _key = JSON.stringify(key);
    const inCache = this.lru.get(_key);
    if (inCache) {
      return inCache;
    }
    // Create a promise to hold the getter promise,
    // because it may throw sync
    const promise = new Promise<V>((resolve, reject) => {
      try {
        resolve(getter(key));
      } catch (err) {
        reject(err);
      }
    });

    // once stored, we resolve with the getter promise,
    // to allow userland to use the value inmediatly
    await this.set(key, promise);
    return promise;
  }

  /**
   * Sets a value in the cache
   *
   * When the value is a promise, and the value rejects, it will be automatically
   * dropped from the cache
   *
   * @returns {Promise.<Boolean>} Success on setting the value on the cache
   */
  async set(key: K, value: Promise<V>) {
    const _key = JSON.stringify(key);
    // catch its error and delete from cache
    Promise.resolve(value).catch((err) => this.del(key));

    return this.lru.set(_key, value);
  }

  /**
   * Deletes a value from the cache
   *
   * @param {String} key
   * @returns {Promise.<*>}
   */
  async del(key: K): Promise<boolean> {
    const _key = JSON.stringify(key);
    return this.lru.delete(_key);
  }

  /**
   * Clear the cache entirely, throwing away all values.
   *
   * @returns {Promise.<*>}
   */
  async reset(): Promise<void> {
    return this.lru.clear();
  }
}
