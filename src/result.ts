import { Enum, NoUndefined } from "./enum.ts";
import { EnumClass, EnumImpl } from "./enum_class.ts";
import { Option } from "./option.ts";
import { memo } from "./utils.ts";

class ResultImpl<T, E extends Error> extends EnumImpl<{
  Ok: T;
  Err: E;
}> {
  *[Symbol.iterator](this: Result<T, E>): Iterator<T> {
    if (this.isOk()) yield this.unwrap();
  }

  /**
   * Makes a shallow copy of the result.
   */
  clone(this: Result<T, E>): Result<T, E> {
    return Enum.match(this, {
      Ok: (data) => Result<T, E>().Ok(data),
      Err: (err) => Result<T, E>().Err(err),
    });
  }

  /**
   * Returns `true` if the result is `Ok`.
   */
  isOk(this: Result<T, E>): boolean {
    return Enum.match(this, {
      Ok: () => true,
      Err: () => false,
    });
  }

  /**
   * Returns `true` if the result is `Err`.
   */
  isErr(this: Result<T, E>): boolean {
    return !this.isOk();
  }

  /**
   * Converts from `Result<T, E>` to `Option<T>`.
   */
  ok(this: Result<T, E>): Option<T> {
    return Enum.match(this, {
      Ok: (data) => Option.from(data),
      Err: () => Option().None(null),
    });
  }

  /**
   * Converts from `Result<T, E>` to `Option<E>`.
   */
  err(this: Result<T, E>): Option<E> {
    return Enum.match(this, {
      Ok: () => Option().None(null),
      Err: (data) => Option.from(data),
    });
  }

  /**
   * Returns the contained `Ok` value. If result is `Err`, this will throw the
   * contained error value.
   */
  unwrap(this: Result<T, E>): T {
    return Enum.match(this, {
      Ok: (data) => data,
      Err: (err) => {
        throw err;
      },
    });
  }

  /**
   * Returns the contained `Err` value. This will throw if result is `Ok`.
   */
  unwrapErr(this: Result<T, E>): E {
    return Enum.match(this, {
      Ok: () => {
        throw new Error("Called `Result.unwrapErr()` on an `Ok` value");
      },
      Err: (err) => err,
    });
  }

  /**
   * Returns the contained `Ok` value or a provided fallback.
   *
   * @param fallback
   */
  unwrapOr(this: Result<T, E>, fallback: T): T {
    return this.ok().unwrapOr(fallback);
  }

  /**
   * Returns the contained `Ok` value or computes it from a function.
   *
   * @param fallback
   */
  unwrapOrElse(this: Result<T, E>, fallback: (err: E) => T): T {
    return Enum.match(this, {
      Ok: (data) => data,
      Err: fallback,
    });
  }

  /**
   * Returns `other` if result is `Ok`, otherwise passes the `Err` along.
   *
   * @param other
   */
  and<U>(this: Result<T, E>, other: Result<U, E>): Result<U, E> {
    return Enum.match(this, {
      Ok: () => other,
      Err: (err) => Result<U, E>().Err(err),
    });
  }

  /**
   * Calls `f` if result is `Ok`, otherwise returns the `Err` value.
   *
   * @param f
   */
  andThen<U>(this: Result<T, E>, f: (data: T) => Result<U, E>): Result<U, E> {
    return Enum.match(this, {
      Ok: f,
      Err: (err) => Result<U, E>().Err(err),
    });
  }

  /**
   * Returns `other` if result is `Err`, otherwise returns the `Ok` value
   * of result.
   *
   * @param other
   */
  or<F extends Error>(this: Result<T, E>, other: Result<T, F>): Result<T, F> {
    return this.orElse(() => other);
  }

  /**
   * Calls `f` if result is `Err`, otherwise returns the `Ok` value
   * of result.
   *
   * @param other
   */
  orElse<F extends Error>(
    this: Result<T, E>,
    f: (err: E) => Result<T, F>,
  ): Result<T, F> {
    return Enum.match(this, {
      Err: f,
      Ok: (data) => Result<T, F>().Ok(data),
    });
  }

  /**
   * Transposes a `Result` of an `Option` into an `Option` of a `Result`.
   */
  transpose<U>(
    this: Result<Option<U>, E>,
  ): Option<Result<U, E>> {
    return Enum.match(this, {
      Err: (err) => Option<Result<U, E>>().Some(Result<U, E>().Err(err)),
      Ok: (option) => option.map((data) => Result<U, E>().Ok(data)),
    });
  }

  /**
   * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a
   * contained `Ok` value, leaving an `Err` value untouched.
   *
   * @param f
   */
  map<U>(
    this: Result<T, E>,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): Result<U, E> {
    return Enum.match(this, {
      Ok: (data) => Result<U, E>().Ok(f(data)),
      Err: (err) => Result<U, E>().Err(err),
    });
  }

  /**
   * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a
   * contained `Err` value, leaving an `Ok` value untouched.
   *
   * @param f
   */
  mapErr<F extends Error>(
    this: Result<T, E>,
    f: (err: NoUndefined<E>) => NoUndefined<F>,
  ): Result<T, F> {
    return Enum.match(this, {
      Ok: (data) => Result<T, F>().Ok(data),
      Err: (err) => Result<T, F>().Err(f(err)),
    });
  }

  /**
   * Applies a function to the contained value (if `Ok`), or returns the
   * provided fallback (if `Err`).
   *
   * @param fallback
   * @param f
   */
  mapOr<U>(
    this: Result<T, E>,
    fallback: U,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): U {
    return this.map(f).unwrapOr(fallback);
  }

  /**
   * Applies a function to the contained value (if `Ok`), or computes it from
   * a function (if `Err`).
   *
   * @param fallback
   * @param f
   */
  mapOrElse<U>(
    this: Result<T, E>,
    fallback: (err: E) => NoUndefined<U>,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): U {
    return this.map(f).unwrapOrElse(fallback);
  }

  /**
   * Converts from `Result<Result<T, E>, E>` to `Result<T, E>`.
   */
  flatten<U>(this: Result<Result<U, E>, E>): Result<U, E> {
    return Enum.match(this, {
      Err: (err) => Result<U, E>().Err(err),
      Ok: (result) => result,
    });
  }
}

/**
 * The `Result` enum type represents either success (`Ok` variant) or failure
 * (`Err` variant).
 *
 * ```ts
 * let a = Result<number, Error>().Ok(5);
 * let b = Result<unknown, Error>().Err(new Error("Failed!"));
 * ```
 *
 * @template T Type of the data that the `Ok` variant contains
 * @template E Type of the error that the `Err` variant contains
 */
export type Result<T, E extends Error> = EnumClass<ResultImpl<T, E>>;

export const Result = memo(<T, E extends Error = Error>() =>
  Enum.factory<Result<T, E>>({
    Err: undefined,
    Ok: undefined,
  }, ResultImpl)
);
