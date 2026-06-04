/**
 * Generic typed EventEmitter.
 *
 * User-facing methods (on / off / once) are fully typed via the event map T.
 * The internal _emit method uses an optional payload so void-like events
 * can be fired without an argument: `_emit('destroy')`.
 *
 * @example
 *   interface MyEvents { click: MouseEvent; destroy: undefined; }
 *   class Foo extends EventEmitter<MyEvents> { ... }
 *
 *   foo.on('click',   (e: MouseEvent) => { ... })
 *   foo.on('destroy', () => { ... })          // no-arg callbacks are fine
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventEmitter<T = Record<string, any>> {
  private readonly _ev = new Map<keyof T, Set<AnyFn>>();

  on<K extends keyof T>(event: K, fn: (payload: T[K]) => void): this {
    if (!this._ev.has(event)) this._ev.set(event, new Set());
    this._ev.get(event)!.add(fn as AnyFn);
    return this;
  }

  off<K extends keyof T>(event: K, fn?: AnyFn): this {
    if (!this._ev.has(event)) return this;
    if (fn) this._ev.get(event)!.delete(fn);
    else this._ev.get(event)!.clear();
    return this;
  }

  once<K extends keyof T>(event: K, fn: (payload: T[K]) => void): this {
    const wrapper = (payload: T[K]) => {
      this.off(event, wrapper as AnyFn);
      fn(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * @internal — fire an event.
   * Payload is optional so no-arg events can be fired as `_emit('destroy')`.
   */
  _emit<K extends keyof T>(event: K, payload?: T[K]): this {
    this._ev.get(event)?.forEach((fn) => fn(payload));
    return this;
  }
}
