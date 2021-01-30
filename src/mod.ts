import type {
  EnumDefinition,
  EnumKeys,
  Matcher,
  PlaceholderMatcher,
  Tagged,
} from "./types.ts";

export type Enum<D extends EnumDefinition> =
  & Tagged<D>
  & {
    [K in EnumKeys<D>]:
      & { readonly [L in Exclude<EnumKeys<D>, K>]?: never }
      & { readonly [L in K]: D[K] };
  }[EnumKeys<D>];

export function Enum<E extends Enum<EnumDefinition>>(e: E): E {
  return e;
}

export namespace Enum {
  export function match<D extends EnumDefinition, T>(
    e: Enum<D>,
    matcher: Matcher<D, T>,
  ): T {
    let key = (Object.keys(e) as EnumKeys<D>[])
      .find((key) => e[key] !== undefined);

    if (key !== undefined && matcher[key] !== undefined) {
      return matcher[key]!(e[key]!);
    } else if ("_" in matcher && matcher._ !== undefined) {
      return (matcher as PlaceholderMatcher<D, T>)._();
    }

    throw new Error("Non-exhaustive matcher");
  }
}
