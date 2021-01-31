# algebraic_enum

An algebraic enum type for TypeScript heavily inspired by Rust.

## Getting Started

### Creating an Enum Type

You can define an algebraic enum type by using the `Enum` helper type. Define
and provide your variants and data types in a generic to `Enum`:

```ts
import { Enum } from "https://deno.land/x/algebraic_enum/src/mod.ts";

type Status = Enum<{
  Success: null;
  Failure: null;
  Pending: null;
}>;

let status: Status = { Success: null };

// Or equivalently:
let status = Enum<Status>({ Success: null });
```

In this case, `null` denotes the absence of any data on the variants. If you do
not need to attach any data to your variants, it's probably better to simply use
the built-in `enum` construct for your enum type.

As you can see, enum type values are plain JavaScript objects with no baggage
attached. Simplified, the type `Status` is like the union of its variants,
ensuring only one variant exists. That's the main idea, however `Enum` does a
few other things in the background to ensure type safety and better
autocompletion support.

```ts
// Simplified version of Enum:
type Status =
  | { Success: null }
  | { Failure: null }
  | { Pending: null };
```

### Different Variant Data Types

You can attach data of different data types to each variant of an enum. One
restriction is that you cannot use `undefined` as your variant data type.

```ts
import { Enum } from "https://deno.land/x/algebraic_enum/src/mod.ts";

type Status = Enum<{
  Success: string;
  Failure: {
    code: number;
    message: string;
  };
  Pending: null;
}>;

let status = Enum<Status>({ Success: "Hello World!" });
let failure = Enum<Status>({
  Failure: {
    code: 404,
    message: "Not Found",
  },
});
let pending = Enum<Status>({ Pending: null });
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

Within the type system of TypeScript, you can easily create generic enum types:

```ts
import { Enum } from "https://deno.land/x/algebraic_enum/src/mod.ts";

type Status<T> = Enum<{
  Success: T;
  Failure: {
    code: number;
    message: string;
  };
  Pending: null;
}>;

let status = Enum<Status<string>>({ Success: "Hello World!" });
let failure = Enum<Status<boolean>>({
  Failure: {
    code: 404,
    message: "Not Found",
  },
});
let pending = Enum<Status<number>>({ Pending: null });
```

### Mutate Enum Variant

By default, enum types are shallow read-only, meaning you can't change the
variant of an existing enum value or assigning different data to an existing
variant (This is prevented by TypeScript's type system), but you can mutate the
underlying variant data itself.

With `Enum.mutate`, you can change the variant of an existing enum value itself,
provided the variable is marked as mutable:

```ts
import { Enum, Mut } from "https://deno.land/x/algebraic_enum/src/mod.ts";

type Status<T> = Enum<{
  Success: T;
  Failure: {
    code: number;
    message: string;
  };
  Pending: null;
}>;

let status = Enum<Status<string>>({ Success: "Hello World!" });

Enum.mutate(status, { Pending: null });
// Compilation error, since `status` is not marked as mutable

let mutableStatus = Enum<Mut<Status<string>>>({ Failure: null });

Enum.mutate(mutableStatus, { Success: "Mutated!" });
// `mutableStatus` is now a `Success` variant
```
