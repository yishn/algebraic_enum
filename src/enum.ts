declare const tag: unique symbol;

export type NoUndefined<T> = Exclude<T, undefined>;

type Tagged<T> = { [tag]?: T };

type EnumDefinition = Record<string, any> & { _?: never };

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

export type Enum<D extends EnumDefinition> = Exclude<
  & Tagged<D>
  & {
    [K in EnumKeys<D>]:
      & { readonly [L in Exclude<EnumKeys<D>, K>]?: never }
      & { readonly [L in K]-?: NoUndefined<D[K]> };
  }[EnumKeys<D>],
  Record<string, undefined>
>;

export function Enum<E>(e: E): E {
  return e;
}

Enum.match = <D extends EnumDefinition, T>(
  value: Enum<D>,
  matcher: Matcher<D, T>,
): T => {
  let key = (Object.keys(value) as EnumKeys<D>[])
    .find((key) => value[key] !== undefined);

  if (key === undefined) {
    throw new Error("No available variant found on `Enum`.");
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

Enum.mutate = <D extends EnumDefinition>(
  value: Enum<D>,
  other: Enum<D>,
): void => {
  for (let key in value) {
    delete value[key];
  }

  Object.assign(value, other);
};
