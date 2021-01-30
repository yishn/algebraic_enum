declare const tag: unique symbol;

type Tagged<T> = { [tag]?: T };

type EnumDefinition = Record<string, any> & { _?: never };

type EnumKeys<D extends EnumDefinition> = Exclude<keyof D, "_">;

type ExhaustiveMatcher<D extends EnumDefinition, T> = {
  [K in EnumKeys<D>]: (data: D[K]) => T;
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
      & { readonly [L in K]-?: Exclude<D[K], undefined> };
  }[EnumKeys<D>],
  Record<string, undefined>
>;

export function Enum<E>(e: E): E {
  return e;
}

Enum.match = <D extends EnumDefinition, T>(
  e: Enum<D>,
  matcher: Matcher<D, T>,
): T => {
  let key = (Object.keys(e) as EnumKeys<D>[])
    .find((key) => e[key] !== undefined);

  if (key === undefined) {
    throw new Error("No available variant found on `Enum`.");
  }

  if (matcher[key] !== undefined) {
    return matcher[key]!(e[key]!);
  } else if ("_" in matcher && matcher._ !== undefined) {
    return (matcher as PlaceholderMatcher<D, T>)._();
  }

  throw new Error(
    "Non-exhaustive matcher. To ensure all possible cases are covered, you " +
      "can add a wildcard `_` match arm.",
  );
};

Enum.mutate = <D extends EnumDefinition>(
  e: Enum<D>,
  d: Enum<D>,
): void => {
  for (let key in e) {
    delete e[key];
  }

  Object.assign(e, d);
};
