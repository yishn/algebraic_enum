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

### Installation

Using with Deno is as simple as adding an import to your code:

```ts
import /* ... */ "https://deno.land/x/algebraic_enum/src/mod.ts";
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

class StatusVariants {
  Success = null;
  Failure = null;
  Pending = null;
}

type Status = Enum<StatusVariants>;

const status: Status = { Success: null };

const invalidStatus: Status = { Success: null, Failure: null };
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
type Status = { Success: null } | { Failure: null } | { Pending: null };
```

For easier enum value construction, you can use the `Enum.factory` function:

```ts
type Status = Enum<StatusVariants>;
const Status = () => Enum.factory(StatusVariants);

const success = Status().Success();
const failure = Status().Failure();
const pending = Status().Pending();
```

### Different Variant Data Types

You can attach data of different data types to each variant of an enum by using
the `Variant` function. One restriction is that you cannot use `undefined` or
`void` as your variant data type.

```ts
import { Enum, Variant } from "https://deno.land/x/algebraic_enum/src/mod.ts";

class StatusVariants {
  Success = Variant<string>();
  Failure = Variant<{
    code: number;
    message: string;
  }>();
  Pending = null;
}

type Status = Enum<StatusVariants>;
const Status = () => Enum.factory(StatusVariants);

const success = Status().Success("Hello World!");
const failure = Status().Failure({
  code: 404,
  message: "Not Found",
});
const pending = Status().Pending();
```

### Match Data

You can use `Enum.match` to determine the correct variant and extract data from
your enum:

```ts
const message = Enum.match(status, {
  Success: (data) => data,
  Failure: (data) => data.message,
  Pending: (data) => "Pending...",
});
```

Note that matches need to be exhaustive. You need to exhaust every last
possibility in order for the code to be valid. The following code won't compile:

```ts
const code = Enum.match(status, {
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

It is possible to create generic enum types:

```ts
import { Enum, Variant } from "https://deno.land/x/algebraic_enum/src/mod.ts";

class StatusVariants<T> {
  Success = Variant<T>();
  Failure = Variant<{
    code: number;
    message: string;
  }>(),
  Pending = null;
};

type Status<T> = Enum<StatusVariants<T>>;
const Status = <T>() => Enum.factory(StatusVariants<T>);

const success = Status<string>().Success("Hello World!");
const failure = Status<boolean>().Failure({
  code: 404,
  message: "Not Found",
});
const pending = Status<number>().Pending();
```

### Mutate Enum Variant

By default, enum types are shallow read-only, meaning you can't change the
variant of an existing enum value or assigning different data to an existing
variant (this is prevented by TypeScript's type system which doesn't incur
additional runtime performance penalty), but it's still possible to mutate the
underlying variant data itself.

With `Enum.mutate`, you can change the variant of an existing enum value itself:

```ts
const status = Status<string>().Success("Hello World!");

Enum.mutate(status, Status<string>().Pending());
// `status` is now of variant `Pending`
```
