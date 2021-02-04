# algebraic_enum [![CI Status](https://github.com/yishn/algebraic_enum/workflows/CI/badge.svg?event=push)](https://github.com/yishn/algebraic_enum/actions)

An algebraic enum type for TypeScript heavily inspired by Rust.

## Getting Started

For optimal type safety, use this library in TypeScript's strict mode.

- [Installation](#installation)
- [Creating an Enum Type](#creating-an-enum-type)
- [Different Variant Data Types](#different-variant-data-types)
- [Match Data](#match-data)
- [Generic Enum Types](#generic-enum-types)
- [Mutate Enum Variant](#mutate-enum-variant)
- [Enum Classes](#enum-classes)

### Installation

Using with Deno is as simple as adding an import to your code:

```ts
import {/* ... */} from "https://deno.land/x/algebraic_enum/src/mod.ts";
```

For Node.js, you can install with npm:

```
$ npm install algebraic_enum
```

### Creating an Enum Type

You can define an algebraic enum type by using the `Enum` helper type. First,
define and provide your variants in a separate object. Then, you can pass the
type of your variants object as a generic to `Enum`.

Note that variant names cannot be `_` as it is reserved.

```ts
import { Enum } from "https://deno.land/x/algebraic_enum/src/mod.ts";

const StatusVariants = {
  Success: null,
  Failure: null,
  Pending: null,
};

type Status = Enum<typeof StatusVariants>;

let status: Status = { Success: null };

let invalidStatus: Status = { Success: null, Failure: null };
// Compilation error, as `Enum` can only contain exactly one variant
```

In this case, `null` denotes the absence of any data on the variants. If you do
not need to attach any data to any of your variants, it's probably better to
simply use the built-in `enum` construct for your enum type.

As you can see, enum type values are plain JavaScript objects with no baggage
attached, meaning no extra runtime costs, and also simplified interoperability
with other libraries.

Roughly speaking, the type `Status` is like the union of its variants, ensuring
only one variant exists. That's the main idea, however `Enum` does a few other
things in the background to ensure type safety and better autocompletion
support.

```ts
// Simplified version of Enum:
type Status =
  | { Success: null }
  | { Failure: null }
  | { Pending: null };
```

For easier enum value construction, you can use the `Enum.factory` function:

```ts
type Status = Enum<typeof StatusVariants>;
const Status = Enum.factory<Status>(StatusVariants);

let success = Status.Success(null);
let failure = Status.Failure(null);
let pending = Status.Pending(null);
```

### Different Variant Data Types

You can attach data of different data types to each variant of an enum by using
the `ofType` helper function. One restriction is that you cannot use `undefined`
or `void` as your variant data type.

```ts
import { Enum, ofType } from "https://deno.land/x/algebraic_enum/src/mod.ts";

const StatusVariants = {
  Success: ofType<string>(),
  Failure: ofType<{
    code: number;
    message: string;
  }>(),
  Pending: null,
};

type Status = Enum<typeof StatusVariants>;
const Status = Enum.factory<Status>(StatusVariants);

let success = Status.Success("Hello World!");
let failure = Status.Failure({
  code: 404,
  message: "Not Found",
});
let pending = Status.Pending(null);
```

### Match Data

You can use `Enum.match` to determine the correct variant and extract data from
your enum:

```ts
let message = Enum.match(status, {
  Success: (data) => data,
  Failure: (data) => data.message,
  Pending: (data) => "Pending...",
});
```

Note that matches need to be exhaustive. You need to exhaust every last
possibility in order for the code to be valid. The following code won't compile:

```ts
let code = Enum.match(status, {
  Failure: (data) => data.code,
  // Won't compile because of missing variants
});
```

In case you don't care about other variants, you can either use the special
wildcard match `_` which matches all variants not specified in the matcher, or a
simple `if` statement:

```ts
Enum.match(status, {
  Failure: (data) => console.log(data.message),
  _: () => {},
});

// Or equivalently:
if (status.Failure !== undefined) {
  console.log(status.Failure.message); // Access is now type safe
}
```

### Generic Enum Types

It is possible to create generic enum types. Since TypeScript doesn't support
generic objects, you need to create your variants object without generics.
Instead, mark variants with generic types as `unknown`. When constructing the
enum type itself, you can finally override certain variant data types with the
correct generic type.

```ts
import {
  Enum,
  memo,
  ofType,
} from "https://deno.land/x/algebraic_enum/src/mod.ts";

const StatusVariants = {
  Success: ofType<unknown>(),
  Failure: ofType<{
    code: number;
    message: string;
  }>(),
  Pending: null,
};

// Mark `Success` variant data type as generic
type Status<T> = Enum<typeof StatusVariants & { Success: T }>;
```

Creating an enum factory is going to be more complicated, but possible. You can
wrap it in another function to specify the generic types. To avoid recreating
the enum factory over and over again, it is recommended to use the `memo` helper
function.

```ts
type Status<T> = Enum<typeof StatusVariants & { Success: T }>;
const Status = memo(<T>() => Enum.factory<Status<T>>(StatusVariants));

let success = Status<string>().Success("Hello World!");
let failure = Status<boolean>().Failure({
  code: 404,
  message: "Not Found",
});
let pending = Status<number>().Pending(null);
```

### Mutate Enum Variant

By default, enum types are shallow read-only, meaning you can't change the
variant of an existing enum value or assigning different data to an existing
variant (This is prevented by TypeScript's type system which doesn't incur
additional runtime performance penalty), but it's still possible to mutate the
underlying variant data itself.

With `Enum.mutate`, you can change the variant of an existing enum value itself,
provided the variable is marked as mutable:

```ts
import { Mut } from "https://deno.land/x/algebraic_enum/src/mod.ts";

// ...

let status = Status<string>().Success("Hello World!");

Enum.mutate(status, Status<string>().Pending(null));
// Compilation error, since `status` is not marked as mutable

let mutableStatus = Status<string>().Pending(null) as Mut<Status<string>>;

Enum.mutate(mutableStatus, Status<string>().Success("Mutated!"));
// `mutableStatus` is now a `Success` variant
```

### Enum Classes

If you want to define methods on your enum for easier readability, you can
create an enum class which behaves like a normal enum and also like a class
where you can have instance methods.

First, you need to define your enum methods separately, extending from the
abstract class `EnumImpl` along with your enum variants object. Your actual type
can be defined using the `EnumClass` helper type.

Make sure your method and property names on your `EnumImpl` class do not collide
with your variant names.

```ts
import {
  ofType,
  memo,
  Enum,
  EnumClass,
  EnumImpl,
} from "https://deno.land/x/algebraic_enum/src/mod.ts";

const StatusVariants = {
  Success: ofType<unknown>(),
  Failure: ofType<{
    code: number;
    message: string;
  }>(),
  Pending: null;
}

class StatusImpl<T> extends EnumImpl<typeof StatusVariants & { Success: T }> {
  // Make sure to have the correct enum class type as `this`, otherwise you
  // won't be able to treat `this` as an `Enum`.
  getMessage(this: Status<T>): string {
    return Enum.match(this, {
      Success: (data) => data,
      Failure: (data) => data.message,
      Pending: (data) => "Pending...",
    });
  }

  // Declare `this` as mutable to enable enum mutation.
  fail(this: Mut<Status<T>>, code: number, message: string): void {
    Enum.mutate(this, Status<T>().Failure({ code, message }));
  }
}

type Status<T> = EnumClass<StatusImpl<T>>;
```

It's also possible to create an enum factory for easy object construction by
additionally passing `StatusImpl` to `Enum.factory`.

```ts
const Status = memo(<T>() =>
  Enum.factory<Status<T>>(StatusVariants, StatusImpl)
);

let status = Status<string>().Success("Hello!");
let message = status.getMessage();
message.fail(404, "Not found");
// Compilation error, since `message` is not marked as mutable

let mutableStatus = Status<string>().Pending(null) as Mut<Status<string>>;
mutableStatus.fail(404, "Not found");
```
