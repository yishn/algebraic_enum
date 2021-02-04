import { Enum, memo, ofType } from "./mod.ts";

const ResultVariants = {
  Ok: ofType<unknown>(),
  Err: ofType<unknown>(),
};

/**
 * The `Result` enum type represents either success (`Ok` variant) or failure
 * (`Err` variant).
 *
 * ```ts
 * let a = Result<number, Error>().Ok(5);
 * let b = Result<unknown, Error>().Err(new Error("Failed!"));
 * ```
 *
 * @template T Type of the data that the `Ok` variant contains
 * @template E Type of the error that the `Err` variant contains
 */
export type Result<T, E extends Error> = Enum<
  typeof ResultVariants & { Ok: T; Err: E }
>;

export const Result = memo(<T, E extends Error = Error>() =>
  Enum.factory<Result<T, E>>(ResultVariants)
);
