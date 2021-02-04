import { NoUndefined } from "./enum.ts";
import { Enum, memo, ofType } from "./mod.ts";

const OptionVariants = {
  Some: ofType<unknown>(),
  None: null,
};

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
export type Option<T> = Enum<typeof OptionVariants & { Some: T }>;

export const Option = Object.assign(
  memo(<T = never>() => Enum.factory<Option<T>>(OptionVariants)),
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
