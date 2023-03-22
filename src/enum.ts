type NoUndefined<T> = Exclude<T, undefined | void>;

declare const enumDefinition: unique symbol;
declare const enumMutable: unique symbol;
const enumFactory = Symbol();

/**
 * Create an enum type by defining all your variants in a class with
 * the `Variant<T>()` function. The data type contained in the variants
 * cannot be `undefined`. The variant name cannot be `_` as it is reserved.
 *
 * Then use the helper type `Enum` to create your enum type. To construct enums
 * easier, you can use `Enum.factory()`.
 *
 * ```ts
 * class MessageVariants {
 *   Quit = null;
 *   Plaintext = Variant<string>();
 *   Encrypted = Variant<number[]>();
 * };
 *
 * type Message = Enum<MessageVariants>;
 * ```
 *
 * It's also possible to create generic enum types. Mark any generic variants as
 * type `unknown` in your variants object and supply the generic type in the
 * type definition itself:
 *
 * ```ts
 * class MessageVariants<T> {
 *   Quit = null;
 *   Plaintext = Variant<T>();
 *   Encrypted = Variant<number[]>();
 * };
 *
 * type Message<T> = Enum<MessageVariants<T>>;
 * ```
 */
export type Enum<E> = Readonly<
  (unknown extends E ? {}
    : {
      [K in keyof E]:
        & Record<K, NoUndefined<E[K]>>
        & Partial<Record<Exclude<keyof E, K>, never>>;
    }[keyof E]) & {
    [enumDefinition]?: E;
    [enumMutable]?: boolean;
  }
>;

type EnumDefinition<T extends Enum<unknown>> = NoUndefined<
  T[typeof enumDefinition]
>;

type EnumFactory<E> = {
  [K in keyof E]: E[K] extends null ? () => Enum<E>
    : (value: NoUndefined<E[K]>) => Enum<E>;
};

type ExhaustiveMatcher<E> = {
  [K in keyof E]: (value: NoUndefined<E[K]>) => unknown;
};

type WildcardMatcher<E> =
  & Partial<ExhaustiveMatcher<E>>
  & ExhaustiveMatcher<{ _: null }>;

export type Matcher<E> = ExhaustiveMatcher<E> | WildcardMatcher<E>;

export function Variant<T = null>(): T {
  return undefined as never;
}

export class NonExhaustiveMatcherError extends Error {
  constructor() {
    super(
      "Non-exhaustive matcher. To ensure all possible cases are covered, you " +
        "can add a wildcard `_` match arm.",
    );
  }
}

export namespace Enum {
  export function factory<E>(
    Enum: (new () => E) & { [enumFactory]?: EnumFactory<E> },
  ): EnumFactory<E> {
    if (Enum[enumFactory] != null) return Enum[enumFactory];

    const result: Partial<EnumFactory<E>> = {};

    for (const variant in new Enum()) {
      result[variant] = ((value: any) => {
        return { [variant]: value ?? null } as Enum<E>;
      }) as any;
    }

    return (Enum[enumFactory] = result as EnumFactory<E>);
  }

  export function match<
    T extends Enum<unknown>,
    M extends Matcher<EnumDefinition<T>>,
  >(
    value: T,
    matcher: M,
  ): {
    [K in keyof M]: M[K] extends (arg: any) => any ? ReturnType<M[K]> : never;
  }[keyof M] {
    for (let variant in value) {
      // @ts-ignore
      if (value[variant] !== undefined && matcher[variant] != null) {
        // @ts-ignore
        return matcher[variant]!(value[variant]);
      }
    }

    if ("_" in matcher) {
      // @ts-ignore
      return matcher._(null);
    }

    throw new NonExhaustiveMatcherError();
  }

  export function mutate<T extends Enum<unknown>>(value: T, other: T): void {
    for (const variant in value) {
      // @ts-ignore
      delete value[variant];
    }

    Object.assign(value, other);
  }
}
