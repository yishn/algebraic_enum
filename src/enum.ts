import type { EnumClassValue, EnumImpl } from "./enum_class.ts";

declare const definitionTag: unique symbol;
declare const mutableTag: unique symbol;

export type NoUndefined<T> = Exclude<T, undefined | void>;

export type EnumDefinition = Record<string, any> & { _?: never };

export type DefinitionFromEnum<E extends Enum<EnumDefinition>> = NoUndefined<
  E[typeof definitionTag]
>;

export type EnumVariant<
  E extends Enum<EnumDefinition>,
  V extends keyof DefinitionFromEnum<E>,
> = NoUndefined<DefinitionFromEnum<E>[V]>;

export type EnumFactory<E extends Enum<EnumDefinition>> = {
  [V in keyof DefinitionFromEnum<E>]: (data: EnumVariant<E, V>) => E;
};

export type ExhaustiveMatcher<E extends Enum<EnumDefinition>, T> = {
  [V in keyof DefinitionFromEnum<E>]: (data: EnumVariant<E, V>) => T;
};

export type WildcardMatcher<E extends Enum<EnumDefinition>, T> =
  & Partial<ExhaustiveMatcher<E, T>>
  & { _: () => T };

export type Matcher<E extends Enum<EnumDefinition>, T> =
  | ExhaustiveMatcher<E, T>
  | WildcardMatcher<E, T>;

/**
 * Marks an enum type as mutable, so it can be mutated by `Enum.mutate`.
 */
export type Mut<E extends Enum<EnumDefinition>> = E & { [mutableTag]?: true };

/**
 * Create an enum type by defining all your variants in a separate object with
 * the `ofType<T>()` helper function. The data type contained in the variants
 * cannot be `undefined`. The variant name cannot be `_` as it is reserved.
 *
 * Then use the helper type `Enum` to create your enum type. To construct enums
 * easier, you can use `Enum.factory()`.
 *
 * ```ts
 * const MessageVariants = {
 *   Quit: null,
 *   Plaintext: ofType<string>(),
 *   Encrypted: ofType<number[]>(),
 * };
 *
 * type Message = Enum<typeof MessageVariants>;
 * ```
 *
 * It's also possible to create generic enum types. Mark any generic variants as
 * type `unknown` in your variants object and supply the generic type in the
 * type definition itself:
 *
 * ```ts
 * const MessageVariants = {
 *   Quit: null,
 *   Plaintext: ofType<unknown>(),
 *   Encrypted: ofType<number[]>(),
 * };
 *
 * type Message<T> = Enum<typeof MessageVariants & { Plaintext: T }>;
 * ```
 *
 * @template D Definition of all variants of the enum
 */
export type Enum<D extends EnumDefinition> =
  & {
    [V in Exclude<keyof D, "_">]:
      & { readonly [_ in Exclude<keyof D, V>]?: never }
      & { readonly [_ in V]: NoUndefined<D[V]> };
  }[Exclude<keyof D, "_">]
  & {
    readonly [definitionTag]?: D;
    readonly [mutableTag]?: unknown;
  };

function createEnumFactory<E extends Enum<EnumDefinition>>(
  variants: Record<keyof DefinitionFromEnum<E>, unknown>,
): EnumFactory<Enum<DefinitionFromEnum<E>>>;
function createEnumFactory<
  I extends Enum<EnumDefinition> & EnumImpl<EnumDefinition>,
>(
  variants: Record<keyof DefinitionFromEnum<I>, unknown>,
  Impl: new (value: EnumClassValue<I>) => EnumImpl<EnumDefinition>,
): EnumFactory<I>;
function createEnumFactory<E extends Enum<EnumDefinition>>(
  variants: Record<keyof DefinitionFromEnum<E>, unknown>,
  Impl?: new (value: unknown) => unknown,
) {
  let result = {} as Record<keyof DefinitionFromEnum<E>, any>;

  for (let key in variants) {
    let variant = key as keyof DefinitionFromEnum<E>;

    result[variant] = Impl == null
      ? (data: unknown = null) => ({ [variant]: data })
      : (data: unknown = null) => new Impl({ [variant]: data });
  }

  return result;
}

export const Enum = {
  /**
   * Creates easier constructors for the given enum type.
   *
   * ```ts
   * const MessageVariants = {
   *   Quit: null,
   *   Plaintext: ofType<string>(),
   *   Encrypted: ofType<number[]>(),
   * };
   *
   * type Message = Enum<typeof MessageVariants>;
   * const Message = Enum.factory<Message>(MessageVariants);
   *
   * let plain = Message.Plaintext("Hello World!");
   * let quit = Message.Quit(null);
   * ```
   *
   * For generic enum types, you might want to use an additional function to
   * provide the generic type. To avoid recreating the enum factory, use the
   * `memo` helper function.
   *
   * ```ts
   * const MessageVariants = {
   *   Quit: null,
   *   Plaintext: ofType<unknown>(),
   *   Encrypted: ofType<number[]>(),
   * };
   *
   * type Message<T> = Enum<typeof MessageVariants & { Plaintext: T }>;
   * const Message = memo(<T>() => Enum.factory<Message<T>>(MessageVariants));
   *
   * let plain = Message<string>().Plaintext("Hello World!");
   * let quit = Message().Quit(null);
   * ```
   */
  factory: createEnumFactory,

  /**
   * Inspects the given enum `value` and executes code based on which variant
   * matches `value`.
   *
   * ```ts
   * const MessageVariants = {
   *   Quit: null,
   *   Plaintext: ofType<string>(),
   *   Encrypted: ofType<number[]>(),
   * };
   *
   * type Message = Enum<typeof MessageVariants>;
   * const Message = Enum.factory<Message>(MessageVariants);
   *
   * let msg: Message = getMessage();
   *
   * let length = Enum.match(msg, {
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
   *
   * @param value The enum value to match against
   * @param matcher
   */
  match: <E extends Enum<EnumDefinition>, T>(
    value: E,
    matcher: Matcher<E, T>,
  ): T => {
    let variant: keyof DefinitionFromEnum<E> | "_" = "_";

    for (let key in value) {
      if (value[key] !== undefined && matcher[key] !== undefined) {
        variant = key as keyof DefinitionFromEnum<E>;
        break;
      }
    }

    if (variant !== "_") {
      return matcher[variant]!(value[variant as keyof E]);
    } else if ("_" in matcher && matcher._ !== undefined) {
      return (matcher as WildcardMatcher<E, T>)._();
    }

    throw new Error(
      "Non-exhaustive matcher. To ensure all possible cases are covered, you " +
        "can add a wildcard `_` match arm.",
    );
  },

  /**
   * Mutates the given `value` enum in-place to match the data in `other`.
   * Requirement: The enum type has to be marked as mutable with `Mut`.
   *
   * ```ts
   * const EVariants = {
   *   A: ofType<number>(),
   *   B: ofType<string>(),
   * };
   *
   * type E = Enum<typeof EVariants>;
   * const E = Enum.factory<E>(EVariants);
   *
   * const a = E.A(5);
   * Enum.mutate(a, E.B("Hello")); // Compilation error
   *
   * const b = E.A(5) as Mut<E>;
   * Enum.mutate(b, E.B("Hello"));
   *
   * console.log(b);
   * // => { B: "Hello" }
   * ```
   *
   * @param value
   * @param other
   */
  mutate: <D extends EnumDefinition>(
    value: Mut<Enum<D>>,
    other: Enum<D>,
  ): void => {
    for (let key in value) {
      delete (value as any)[key];
    }

    Object.assign(value, other);
  },
};
