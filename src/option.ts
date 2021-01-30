import { Enum } from "./mod.ts";

type PureOption<T> = Enum<{
  None: null;
  Some: T;
}>;

export type Option<T> = PureOption<T> & OptionImpl<T>;

class OptionImpl<T> {
  static create<T>(
    data: Enum<{
      None: null;
      Some: T;
    }>,
  ): Option<T> {
    let result = new OptionImpl<T>();
    Object.assign(result, data);
    return result as Option<T>;
  }

  *[Symbol.iterator](this: Option<T>) {
    if (this.isSome()) yield this.unwrap();
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
      None: () => Option.None,
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
      Some: () => other.isNone() ? this : Option.None,
      None: () => other.isSome() ? other : Option.None,
    });
  }

  expect(this: Option<T>, err: any): T {
    return Enum.match(this, {
      Some: (data) => data,
      None: () => {
        throw err;
      },
    });
  }

  unwrap(this: Option<T>): T {
    return this.expect(new Error("Called `Option.unwrap()` on a `None` value"));
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
      Some: (data) => predicate(data) ? this : Option.None,
    });
  }

  map<U>(this: Option<T>, f: (data: T) => U): Option<U> {
    return Enum.match(this, {
      None: () => Option.None,
      Some: (data) => Option.Some(f(data)),
    });
  }

  zip<U>(this: Option<T>, other: Option<U>): Option<[T, U]> {
    return Enum.match(this, {
      None: () => Option.None,
      Some: (x) =>
        Enum.match(other, {
          None: () => Option.None,
          Some: (y) => Option.Some([x, y]),
        }),
    });
  }
}

export const Option = {
  Some: <T>(data: T) => OptionImpl.create({ Some: data }),
  None: OptionImpl.create<never>({ None: null }),

  from: <T>(data: T | null | undefined) =>
    data == null ? Option.None : Option.Some(data),
};
