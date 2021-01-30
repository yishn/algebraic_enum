import { Enum, NoUndefined } from "./enum.ts";
import { Option } from "./option.ts";

type PureResult<T, E extends Error> = Enum<{
  Ok: T;
  Err: E;
}>;

class ResultImpl<T, E extends Error> {
  static attach<T, E extends Error>(data: PureResult<T, E>): Result<T, E> {
    let result = new ResultImpl<T, E>();
    Object.assign(result, data);
    return result as Result<T, E>;
  }

  *[Symbol.iterator](this: Result<T, E>): Iterator<T> {
    if (this.isOk()) yield this.unwrap();
  }

  isOk(this: Result<T, E>): boolean {
    return Enum.match(this, {
      Ok: () => true,
      Err: () => false,
    });
  }

  isErr(this: Result<T, E>): boolean {
    return !this.isOk();
  }

  ok(this: Result<T, E>): Option<T> {
    return Enum.match(this, {
      Ok: (data) => Option.from(data),
      Err: () => Option.None(),
    });
  }

  err(this: Result<T, E>): Option<E> {
    return Enum.match(this, {
      Ok: () => Option.None(),
      Err: (data) => Option.from(data),
    });
  }

  expect(this: Result<T, E>, msg: string): T {
    return Enum.match(this, {
      Ok: (data) => data,
      Err: () => {
        throw new Error(msg);
      },
    });
  }

  expectErr(this: Result<T, E>, msg: string): E {
    return Enum.match(this, {
      Ok: () => {
        throw new Error(msg);
      },
      Err: (err) => err,
    });
  }

  unwrap(this: Result<T, E>): T {
    return Enum.match(this, {
      Ok: (data) => data,
      Err: (err) => {
        throw err;
      },
    });
  }

  unwrapErr(this: Result<T, E>): E {
    return this.expectErr("Called `Result.unwrapErr()` on an `Ok` value");
  }

  unwrapOr(this: Result<T, E>, fallback: T): T {
    return this.ok().unwrapOr(fallback);
  }

  unwrapOrElse(this: Result<T, E>, f: (err: E) => T): T {
    return Enum.match(this, {
      Ok: (data) => data,
      Err: f,
    });
  }

  and<U>(this: Result<T, E>, other: Result<U, E>): Result<U, E> {
    return Enum.match(this, {
      Ok: () => other,
      Err: (err) => Result.Err(err),
    });
  }

  andThen<U>(this: Result<T, E>, f: (data: T) => Result<U, E>): Result<U, E> {
    return Enum.match(this, {
      Ok: f,
      Err: (err) => Result.Err(err),
    });
  }

  or<F extends Error>(this: Result<T, E>, other: Result<T, F>): Result<T, F> {
    return this.orElse(() => other);
  }

  orElse<F extends Error>(
    this: Result<T, E>,
    f: (err: E) => Result<T, F>,
  ): Result<T, F> {
    return Enum.match(this, {
      Err: f,
      Ok: (data) => Result.Ok(data as NoUndefined<T>),
    });
  }

  transpose(
    this: Result<Option<T>, E>,
  ): Option<Result<T, E>> {
    return Enum.match(this, {
      Err: (err) => Option.Some(Result.Err(err)),
      Ok: (option) => option.map((data) => Result.Ok(data as NoUndefined<T>)),
    });
  }

  map<U>(
    this: Result<T, E>,
    f: (data: T) => NoUndefined<U>,
  ): Result<U, E> {
    return Enum.match(this, {
      Ok: (data) => Result.Ok(f(data)),
      Err: (err) => Result.Err(err),
    });
  }

  mapErr<F extends Error>(this: Result<T, E>, f: (err: E) => F): Result<T, F> {
    return Enum.match(this, {
      Ok: (data) => Result.Ok(data as NoUndefined<T>),
      Err: (err) => Result.Err(f(err)),
    });
  }
}

export type Result<T, E extends Error> = PureResult<T, E> & ResultImpl<T, E>;

export const Result = {
  Ok<T, E extends Error = never>(data: NoUndefined<T>): Result<T, E> {
    return ResultImpl.attach({ Ok: data } as PureResult<T, E>);
  },

  Err<T, E extends Error>(err: E): Result<T, E> {
    return ResultImpl.attach({ Err: err } as PureResult<T, E>);
  },
};
