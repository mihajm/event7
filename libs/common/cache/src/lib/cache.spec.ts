import { Cache } from './cache';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TTL = 200;
const STALE_TIME = 50;

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache(TTL, STALE_TIME);
  });

  afterEach(() => {
    cache = null;
  });

  it('should store and retrieve a value', () => {
    cache.store('key', 'value');
    expect(cache.get('key').value).toBe('value');
    expect(cache.get('key').isStale).toBe(false);
  });

  it('should return stale when the value is stale', async () => {
    cache.store('key', 'value');
    await sleep(STALE_TIME + 1);
    expect(cache.get('key').isStale).toBe(true);
  });

  it('should not return if the value is expired', async () => {
    cache.store('key', 'value');
    await sleep(TTL + 1);
    expect(cache.get('key')).toBe(null);
  });

  describe('change$', () => {
    it('should emit when the value is stored', async () => {
      const spy = jest.fn();
      cache.changes$('key').subscribe(spy);
      cache.store('key', 'value');
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        value: 'value',
        isStale: false,
      });
    });

    it('should emit when the value is invalidated', async () => {
      const spy = jest.fn();
      cache.changes$('key').subscribe(spy);

      cache.store('key', 'value');
      cache.invalidate('key');
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(2, null);
    });
  });

  describe('cleanup', () => {
    const CHECK_INTERVAL = 500;

    describe('lru', () => {
      let cache: Cache<string>;

      beforeEach(() => {
        cache = new Cache(200, 50, {
          type: 'lru',
          maxSize: 2,
          checkInterval: CHECK_INTERVAL,
        });
      });

      afterEach(() => {
        cache = null;
      });

      it('should remove the least recently used entry', async () => {
        cache.store('key1', 'value1');
        cache.store('key2', 'value2');

        cache.get('key1');
        cache.get('key1');
        cache.get('key2');
        cache.store('key3', 'value3');

        await sleep(1);

        expect(cache.get('key1')).toBeTruthy();
        expect(cache.get('key2')).toBeFalsy();
        expect(cache.get('key3')).toBeFalsy();
      });
    });

    describe('oldset', () => {
      let cache: Cache<string>;

      beforeEach(() => {
        cache = new Cache(200, 50, {
          type: 'oldest',
          maxSize: 3,
          checkInterval: CHECK_INTERVAL,
        });
      });

      afterEach(() => {
        cache = null;
      });

      it('should remove the oldest entry', async () => {
        cache.store('key1', 'value1');
        await sleep(1);

        cache.store('key2', 'value2');
        await sleep(1);

        cache.store('key3', 'value3');
        await sleep(1);

        cache.store('key4', 'value4');

        await sleep(1);

        expect(cache.get('key1')).toBeFalsy();
        expect(cache.get('key2')).toBeFalsy();
        expect(cache.get('key3')).toBeFalsy();
        expect(cache.get('key4')).toBeTruthy();
      });
    });
  });
});
