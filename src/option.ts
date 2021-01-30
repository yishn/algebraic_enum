import { Enum, NoUndefined } from "./enum.ts";
import { Result } from "./result.ts";

type PureOption<T> = Enum<{
  None: null;
  Some: T;
}>;

class OptionImpl<T> {
  static attach<T>(data: PureOption<T>): Option<T> {
    let result = new OptionImpl<T>();
    Object.assign(result, data);
    return result as Option<T>;
  }

  *[Symbol.iterator](this: Option<T>): Iterator<T> {
    if (this.isSome()) yield this.unwrap();
  }

  clone(this: Option<T>): Option<T> {
    return Enum.match(this, {
      Some: (data) => Option.Some(data),
      None: () => Option.None(),
    });
  }

  isSome(this: Option<T>): boolean {
    return Enum.match(this, {
      Some: () => true,
      None: () => false,
    });
  }

  isNone(this: Option<T>): boolean {
    return !this.isSome();
  }

  and<U>(this: Option<T>, other: Option<U>): Option<U> {
    return this.andThen(() => other);
  }

  andThen<U>(this: Option<T>, f: (data: T) => Option<U>): Option<U> {
    return Enum.match(this, {
      None: () => Option.None(),
      Some: f,
    });
  }

  or(this: Option<T>, other: Option<T>): Option<T> {
    return this.orElse(() => other);
  }

  orElse(this: Option<T>, f: () => Option<T>): Option<T> {
    return Enum.match(this, {
      Some: () => this,
      None: f,
    });
  }

  xor(this: Option<T>, other: Option<T>): Option<T> {
    return Enum.match(this, {
      Some: () => other.isNone() ? this : Option.None(),
      None: () => other,
    });
  }

  expect(this: Option<T>, msg: string): T {
    return Enum.match(this, {
      Some: (data) => data,
      None: () => {
        throw new Error(msg);
      },
    });
  }

  expectNone(this: Option<T>, msg: string): void {
    if (this.isSome()) {
      throw new Error(msg);
    }
  }

  unwrap(this: Option<T>): T {
    return this.expect("Called `Option.unwrap()` on a `None` value");
  }

  unwrapOr(this: Option<T>, fallback: T): T {
    return this.unwrapOrElse(() => fallback);
  }

  unwrapOrElse(this: Option<T>, f: () => T): T {
    return Enum.match(this, {
      Some: (data) => data,
      None: f,
    });
  }

  filter(this: Option<T>, predicate: (data: T) => boolean): Option<T> {
    return Enum.match(this, {
      None: () => this,
      Some: (data) => predicate(data) ? this : Option.None(),
    });
  }

  map<U>(
    this: Option<T>,
    f: (data: NoUndefined<T>) => NoUndefined<U>,
  ): Option<U> {
    return Enum.match(this, {
      None: () => Option.None(),
      Some: (data) => Option.Some(f(data)),
    });
  }

  flatten(this: Option<Option<T>>): Option<T> {
    return Enum.match(this, {
      None: () => Option.None(),
      Some: (option) => option,
    });
  }

  zip<U>(this: Option<T>, other: Option<U>): Option<[T, U]> {
    return Enum.match(this, {
      None: () => Option.None(),
      Some: (x) =>
        Enum.match(other, {
          None: () => Option.None(),
          Some: (y) => Option.Some<[T, U]>([x, y]),
        }),
    });
  }

  transpose<E extends Error>(
    this: Option<Result<T, E>>,
  ): Result<Option<T>, E> {
    return Enum.match(this, {
      None: () => Result.Ok(Option.None()),
      Some: (result) => result.map((data) => Option.Some(data)),
    });
  }

  getOrInsert(this: Option<T>, data: NoUndefined<T>): T {
    return this.getOrInsertWith(() => data);
  }

  getOrInsertWith(this: Option<T>, f: () => NoUndefined<T>): T {
    return Enum.match(this, {
      None: () => {
        let data = f();
        Enum.mutate(this, Option.Some(data));
        return data;
      },
      Some: (data) => data,
    });
  }

  take(this: Option<T>): Option<T> {
    return Enum.match(this, {
      None: () => Option.None(),
      Some: (data) => {
        Enum.mutate(this, Option.None());
        return Option.Some(data);
      },
    });
  }

  replace(this: Option<T>, data: NoUndefined<T>): Option<T> {
    let oldOption = this.clone();
    Enum.mutate(this, Option.Some(data));
    return oldOption;
  }
}

export type Option<T> = PureOption<T> & OptionImpl<T>;

export const Option = {
  Some<T>(data: NoUndefined<T>): Option<T> {
    return OptionImpl.attach(
      { Some: data as Exclude<T, null | undefined> } as PureOption<T>,
    );
  },

  None<T = never>(): Option<T> {
    return OptionImpl.attach<T>({ None: null });
  },

  from<T>(data: T | null | undefined): Option<T> {
    return data == null ? Option.None() : Option.Some(data as NoUndefined<T>);
  },
};
