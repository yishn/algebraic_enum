import type { Enum, EnumDefinition } from "../src/enum.ts";

export type TypeOf<T, U> = T extends U ? true : false;

export type DefinitionFromEnum<E extends Enum<EnumDefinition>> = E extends
  Enum<infer D> ? D
  : never;
