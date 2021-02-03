import { Enum, Mut, NoUndefined } from "./enum.ts";
import { EnumClass, EnumImpl } from "./enum_class.ts";
import { Result } from "./result.ts";
import { memo } from "./utils.ts";

class OptionImpl<T> extends EnumImpl<{
  None: null;
  Some: T;
}> {
  *[Symbol.iterator](this: Option<T>): Iterator<T> {
    if (this.isSome()) yield this.unwrap();
  }

  /**
   * Makes a shallow copy of the option.
   */
  clone(this: Option<T>): Option<T> {
    return Enum.match(this, {
      Some: (data) => Option<T>().Some(data),
      None: () => Option().None(null),
    });
  }

  /**
   * Returns `true` if the option is a `Some` variant.
   */
  isSome(this: Option<T>): boolean {
    return Enum.match(this, {
      Some: () => true,
      None: () => false,
    });
  }

  /**
   * Returns `true` if the option is a `None` variant.
   */
  isNone(this: Option<T>): boolean {
    return !this.isSome();
  }

  /**
   * Returns `None` if the option is `None`, otherwise returns `other`.
   *
   * @param other
   */
  and<U>(this: Option<T>, other: Option<U>): Option<U> {
    return this.andThen(() => other);
  }

  /**
   * Returns `None` if the option is `None`, otherwise calls `f` with the
   * wrapped value and returns the result as option.
   *
   * @param f
   */
  andThen<U>(this: Option<T>, f: (data: T) => Option<U>): Option<U> {
    return Enum.match(this, {
      None: () => Option().None(null),
      Some: f,
    });
  }

  /**
   * Returns the option if it contains a value, otherwise returns `other`.
   *
   * @param other
   */
  or(this: Option<T>, other: Option<T>): Option<T> {
    return this.orElse(() => other);
  }

  /**
   * Returns the option if it contains a value, otherwise calls `f` and returns
   * the result as option.
   *
   * @param f
   */
  orElse(this: Option<T>, f: () => Option<T>): Option<T> {
    return Enum.match(this, {
      Some: () => this,
      None: f,
    });
  }

  /**
   * Returns `Some` if exactly one of `this`, `other` is `Some`, otherwise
   * returns `None`.
   *
   * @param other
   */
  xor(this: Option<T>, other: Option<T>): Option<T> {
    return Enum.match(this, {
      Some: () => other.isNone() ? this : Option().None(null),
      None: () => other,
    });
  }

  /**
   * Returns the contained `Some` value. Throws if option is `None`.
   */
  unwrap(this: Option<T>): T {
    return Enum.match(this, {
      Some: (data) => data,
      None: () => {
        throw new Error("Called `Option.unwrap()` on a `None` value");
      },
    });
  }

  /**
   * Returns the contained `Some` value or a provided fallback.
   *
   * @param fallback
   */
  unwrapOr(this: Option<T>, fallback: T): T {
    return this.unwrapOrElse(() => fallback);
  }

  /**
   * Returns the contained `Some` value or computes it from `fallback`.
   *
   * @param fallback
   */
  unwrapOrElse(this: Option<T>, fallback: () => T): T {
    return Enum.match(this, {
      Some: (data) => data,
      None: fallback,
    });
  }

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`.
   *
   * @param err
   */
  okOr<E extends Error>(this: Option<T>, err: NoUndefined<E>): Result<T, E> {
    return this.okOrElse(() => err);
  }

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`.
   *
   * @param err
   */
  okOrElse<E extends Error>(
    this: Option<T>,
    err: () => NoUndefined<E>,
  ): Result<T, E> {
    return Enum.match(this, {
      Some: (data) => Result<T, E>().Ok(data),
      None: () => Result<T, E>().Err(err()),
    });
  }

  /**
   * Returns `None` if the option is `None`, otherwise calls `predicate` with
   * the wrapped value and returns:
   *
   * - `Some` if `predicate` returns `true`
   * - `None` if `predicate` returns `false`
   *
   * @param predicate
   */
  filter(this: Option<T>, predicate: (data: T) => boolean): Option<T> {
    return Enum.match(this, {
      None: () => this,
      Some: (data) => predicate(data) ? this : Option().None(null),
    });
  }

  /**
   * Maps an `Option<T>` to `Option<U>` by applying a function to a contained
   * value.
   *
   * @param f
   */
  map<U>(
    this: Option<T>,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): Option<U> {
    return Enum.match(this, {
      None: () => Option().None(null),
      Some: (data) => Option<U>().Some(f(data)),
    });
  }

  /**
   * Applies a function to the contained value (if any), or returns the provided
   * fallback (if not).
   *
   * @param fallback
   * @param f
   */
  mapOr<U>(
    this: Option<T>,
    fallback: U,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): U {
    return this.map(f).unwrapOr(fallback);
  }

  /**
   * Applies a function to the contained value (if any), or computes a default
   * (if not).
   *
   * @param fallback
   * @param f
   */
  mapOrElse<U>(
    this: Option<T>,
    fallback: () => U,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): U {
    return this.map(f).unwrapOrElse(fallback);
  }

  /**
   * Converts from `Option<Option<T>>` to `Option<T>`.
   */
  flatten<U>(this: Option<Option<U>>): Option<U> {
    return Enum.match(this, {
      None: () => Option().None(null),
      Some: (option) => option,
    });
  }

  /**
   * Zips `this` with another `Option`.
   *
   * If both options is `Some` with corresponding values `x` and `y`, this
   * method returns `Some` with value `[x, y]`. Otherwise, `None` is returned.
   *
   * @param other
   */
  zip<U>(this: Option<T>, other: Option<U>): Option<[T, U]> {
    return Enum.match(this, {
      None: () => Option().None(null),
      Some: (x) =>
        Enum.match(other, {
          None: () => Option().None(null),
          Some: (y) => Option<[T, U]>().Some([x, y]),
        }),
    });
  }

  /**
   * Transposes an `Option` of a `Result` into a `Result` of an `Option`.
   */
  transpose<U, E extends Error>(
    this: Option<Result<U, E>>,
  ): Result<Option<U>, E> {
    return Enum.match(this, {
      None: () => Result<Option<U>, E>().Ok(Option().None(null)),
      Some: (result) => result.map((data) => Option<U>().Some(data)),
    });
  }

  /**
   * Inserts `data` into the option if it is `None`, then returns the contained
   * value.
   *
   * @param data
   */
  getOrInsert(this: Mut<Option<T>>, data: NoUndefined<T>): T {
    return this.getOrInsertWith(() => data);
  }

  /**
   * Inserts a value computed from `f` into the option if it is `None`, then
   * returns the contained value.
   *
   * @param f
   */
  getOrInsertWith(this: Mut<Option<T>>, f: () => NoUndefined<T>): T {
    return Enum.match(this, {
      None: () => {
        let data = f();
        Enum.mutate(this, Option<T>().Some(data));
        return data;
      },
      Some: (data) => data,
    });
  }

  /**
   * Takes the value out of the option, leaving a `None` in its place.
   */
  take(this: Mut<Option<T>>): Option<T> {
    return Enum.match(this, {
      None: () => Option().None(null),
      Some: (data) => {
        Enum.mutate(this, Option().None(null));
        return Option<T>().Some(data);
      },
    });
  }

  /**
   * Replaces the actual value in the option by the value given by `data`,
   * returning the old value if present, leaving a `Some` in its place.
   *
   * @param data
   */
  replace(this: Mut<Option<T>>, data: NoUndefined<T>): Option<T> {
    let oldOption = this.clone();
    Enum.mutate(this, Option<T>().Some(data));
    return oldOption;
  }
}

/**
 * The `Option` enum type represents an optional value. It has two variants:
 * `Some`, which contains data, and `None`, which does not.
 *
 * ```ts
 * let a: Option<number> = Option<number>().Some(5);
 * let b: Option<never> = Option().None(null);
 * let c: Option<string> = Option.from("Hello")
 * ```
 *
 * @template T Type of the data that the `Option` contains
 */
export type Option<T> = EnumClass<OptionImpl<T>>;

export const Option = Object.assign(
  memo(<T = never>() =>
    Enum.factory<Option<T>>({
      Some: undefined,
      None: undefined,
    }, OptionImpl)
  ),
  {
    /**
     * Creates an `Option` based on `value`. If `value` is `null` or `undefined`,
     * this will return a `None` variant, otherwise the given `value` is attached
     * to a `Some` variant.
     *
     * @param value
     */
    from<T>(value: T | null | undefined): Option<NonNullable<T>> {
      return value == null
        ? Option<NonNullable<T>>().None(null)
        : Option<NonNullable<T>>().Some(value as NoUndefined<NonNullable<T>>);
    },
  },
);
