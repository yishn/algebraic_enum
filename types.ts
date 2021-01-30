declare const tag: unique symbol;

export type Tagged<T> = { [tag]?: T };

export type EnumDefinition = Record<string, any> & { _?: never };

export type EnumKeys<D extends EnumDefinition> = Exclude<keyof D, "_">;

export type ExhaustiveMatcher<D extends EnumDefinition, T> = {
  [K in EnumKeys<D>]: (data: D[K]) => T;
};

export type PlaceholderMatcher<D extends EnumDefinition, T> =
  & Partial<ExhaustiveMatcher<D, T>>
  & { _: () => T };

export type Matcher<D extends EnumDefinition, T> =
  | ExhaustiveMatcher<D, T>
  | PlaceholderMatcher<D, T>;
