type NoUndefined<T> = Exclude<T, undefined | void>;

declare const enumVariants: unique symbol;
const enumFactory = Symbol();

/**
 * Create an enum type by defining all your variants in a class with the
 * `Variant<T>()` function.
 *
 * The data type contained in the variants cannot be `undefined`. The variant
 * name cannot be `_` as it is reserved.
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
 * It's also possible to create generic enum types:
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
export type Enum<V> = Readonly<
  (unknown extends V ? {}
    : {
      [K in keyof V]:
        & Record<K, NoUndefined<V[K]>>
        & Partial<Record<Exclude<keyof Sanitize<V>, K>, never>>;
    }[keyof Sanitize<V>]) & {
    [enumVariants]?: Sanitize<V>;
  }
>;

type Sanitize<V> = Omit<
  V,
  | "_"
  | {
    [K in keyof V]: NoUndefined<V[K]> extends never ? K : never;
  }[keyof V]
>;

type EnumVariants<E extends Enum<unknown>> = NoUndefined<
  E[typeof enumVariants]
>;

type EnumFactory<V> = {
  [K in keyof Sanitize<V>]: V[K] extends null ? () => Enum<V>
    : (value: NoUndefined<V[K]>) => Enum<V>;
};

type ExhaustiveMatcher<V> = {
  [K in keyof Sanitize<V>]: (value: NoUndefined<Sanitize<V>[K]>) => unknown;
};

type WildcardMatcher<V> = Partial<ExhaustiveMatcher<V>> & { _: () => unknown };

export type Matcher<V> = ExhaustiveMatcher<V> | WildcardMatcher<V>;

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
  /**
   * Creates easier constructors for the given enum variants.
   *
   * ```ts
   * class MessageVariants {
   *   Quit = null;
   *   Plaintext = Variant<string>();
   *   Encrypted = Variant<number[]>();
   * };
   *
   * type Message = Enum<MessageVariants>;
   * const Message = () => Enum.factory(MessageVariants);
   *
   * const plain = Message().Plaintext("Hello World!");
   * const quit = Message().Quit(null);
   * ```
   *
   * You can also define generic enum types:
   *
   * ```ts
   * class MessageVariants<T> {
   *   Quit = null;
   *   Plaintext = Variant<T>();
   *   Encrypted = Variant<number[]>();
   * };
   *
   * type Message<T> = Enum<MessageVariants<T>>;
   * const Message = <T>() => Enum.factory(MessageVariants<T>);
   *
   * const plain = Message<string>().Plaintext("Hello World!");
   * const quit = Message().Quit(null);
   * ```
   */
  export function factory<V>(
    Enum: (new () => V) & { [enumFactory]?: EnumFactory<V> },
  ): EnumFactory<V> {
    if (Enum[enumFactory] != null) return Enum[enumFactory]!;

    const result: Partial<EnumFactory<V>> = {};

    for (const variant in new Enum()) {
      // @ts-ignore
      result[variant] = ((value: any) => {
        return { [variant]: value ?? null } as Enum<V>;
      }) as any;
    }

    return (Enum[enumFactory] = result as EnumFactory<V>);
  }

  /**
   * Inspects the given enum `value` and executes code based on which variant
   * matches `value`.
   *
   * ```ts
   * class MessageVariants {
   *   Quit = null;
   *   Plaintext = Variant<string>();
   *   Encrypted = Variant<number[]>();
   * };
   *
   * type Message = Enum<MessageVariants>;
   * const Message = () => Enum.factory(MessageVariants);
   *
   * const msg: Message = getMessage();
   *
   * const length = Enum.match(msg, {
   *   Quit: () => -1,
   *   Plaintext: (data) => data.length,
   *   Encrypted: (data) => decrypt(data).length
   * });
   * ```
   *
   * Note that matches need to be exhaustive. You need to exhaust every last
   * possibility in order for the code to be valid. The following code won't
   * compile:
   *
   * ```ts
   * Enum.match(msg, {
   *   Quit: () => console.log("Message stream ended.")
   * });
   * ```
   *
   * In case you don't care about other variants, you can either use the special
   * wildcard match `_` which matches all variants not specified in the matcher,
   * or a simple `if` statement:
   *
   * ```ts
   * Enum.match(msg, {
   *   Quit: () => console.log("Message stream ended."),
   *   _: () => console.log("Stream goes on...")
   * });
   *
   * if (msg.Plaintext !== undefined) {
   *   console.log(msg.Plaintext);
   * }
   * ```
   */
  export function match<
    E extends Enum<unknown>,
    M extends Matcher<EnumVariants<E>>,
  >(
    value: E,
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

  /**
   * Mutates the given `value` enum in-place to match the data in `other`.
   *
   * ```ts
   * class EVariants {
   *   A = Variant<number>();
   *   B = Variant<string>();
   * };
   *
   * type E = Enum<EVariants>;
   * const E = () => Enum.factory(EVariants);
   *
   * const a = E().A(5);
   * Enum.mutate(a, E().B("Hello"));
   *
   * console.log(b);
   * // => { B: "Hello" }
   * ```
   */
  export function mutate<E extends Enum<unknown>>(value: E, other: E): void {
    for (const variant in value) {
      // @ts-ignore
      delete value[variant];
    }

    Object.assign(value, other);
  }
}
