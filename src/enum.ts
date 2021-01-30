declare const definitionTag: unique symbol;
declare const mutableTag: unique symbol;

export type NoUndefined<T> = Exclude<T, undefined>;

export type EnumDefinition = Record<string, any> & { _?: never };

type EnumKeys<D extends EnumDefinition> = Exclude<keyof D, "_">;

type ExhaustiveMatcher<D extends EnumDefinition, T> = {
  [K in EnumKeys<D>]: (data: NoUndefined<D[K]>) => T;
};

type PlaceholderMatcher<D extends EnumDefinition, T> =
  & Partial<ExhaustiveMatcher<D, T>>
  & { _: () => T };

type Matcher<D extends EnumDefinition, T> =
  | ExhaustiveMatcher<D, T>
  | PlaceholderMatcher<D, T>;

/**
 * Marks an enum type as mutable, so it can be mutated by `Enum.mutate`.
 */
export type Mut<E> = E & { [mutableTag]?: true };

/**
 * Create an enum type by putting in all your variants in the generic `D`. The
 * data type contained in the variants cannot be `undefined`. The variant name
 * cannot be `_`, as it is reserved.
 *
 * ```ts
 * type Message = Enum<{
 *   Quit: null,
 *   Plaintext: string,
 *   Encrypted: number[]
 * }>;
 *
 * let msg: Message = { Encrypted: [4, 8, 15, 16, 23, 42] };
 *
 * // Or equivalently:
 * let msg = Enum<Message>({ Encrypted: [4, 8, 15, 16, 23, 42] });
 * ```
 *
 * @template D Definitions of all variants of the enum
 */
export type Enum<D extends EnumDefinition> =
  & {
    [K in EnumKeys<D>]:
      & { readonly [L in Exclude<EnumKeys<D>, K>]?: never }
      & { readonly [L in K]-?: NoUndefined<D[K]> };
  }[EnumKeys<D>]
  & Readonly<{
    [definitionTag]?: D;
    [mutableTag]?: unknown;
  }>;

export function Enum<E>(value: E): E {
  return value;
}

/**
 * Inspects the given enum `value` and executes code based on which variant
 * matches `value`.
 *
 * ```ts
 * type Message = Enum<{
 *   Quit: null,
 *   Plaintext: string,
 *   Encrypted: number[]
 * }>;
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
Enum.match = <D extends EnumDefinition, T>(
  value: Enum<D>,
  matcher: Matcher<D, T>,
): T => {
  let key = (Object.keys(value) as EnumKeys<D>[])
    .find((key) => value[key] !== undefined);

  if (key === undefined) {
    throw new Error("No variants found on `value`.");
  }

  if (matcher[key] !== undefined) {
    return matcher[key]!(value[key]!);
  } else if ("_" in matcher && matcher._ !== undefined) {
    return (matcher as PlaceholderMatcher<D, T>)._();
  }

  throw new Error(
    "Non-exhaustive matcher. To ensure all possible cases are covered, you " +
      "can add a wildcard `_` match arm.",
  );
};

/**
 * Mutates the given `value` enum in-place to match the data in `other`.
 * Requirement: The enum type has to be marked as mutable with `Mut`.
 *
 * ```ts
 * type E = Enum<{
 *   A: number,
 *   B: string
 * }>;
 *
 * const a: E = { A: 5 };
 * Enum.mutate(a, { B: "Hello" }); // Compilation error
 *
 * const b: Mut<E> = { A: 5 };
 * Enum.mutate(b, { B: "Hello" });
 *
 * console.log(b);
 * // => { B: "Hello" }
 * ```
 *
 * @param value
 * @param other
 */
Enum.mutate = <D extends EnumDefinition>(
  value: Mut<Enum<D>>,
  other: Enum<D>,
): void => {
  for (let key in value) {
    delete (value as any)[key];
  }

  Object.assign(value, other);
};
