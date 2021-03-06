export const ofType = <T>() => undefined as never as T;

export function memo<F extends () => unknown>(f: F): F {
  let cache: unknown | undefined;

  return (() => {
    if (cache === undefined) cache = f();
    return cache;
  }) as F;
}
