import { Enum, Mut } from "../src/mod.ts";
import { Matcher, NoUndefined } from "../src/enum.ts";
import { assertEquals, assertThrows, expectType } from "./deps.ts";
import { DefinitionFromEnum, TypeOf } from "./utils.ts";

type Message = Enum<{
  Quit: null;
  Plaintext: string;
  Encrypted: number[];
}>;

Deno.test({
  name: "Enums can contain one and only one variant",
  fn() {
    expectType<Message>({ Quit: null });
    expectType<Message>({ Plaintext: "Hello World!" });
    expectType<Message>({ Encrypted: [4, 8, 15, 16, 23, 42] });

    expectType<TypeOf<{}, Message>>(false);
    expectType<TypeOf<{ Quit: 5 }, Message>>(false);
    expectType<
      TypeOf<{
        Quit: null;
        Plaintext: "";
      }, Message>
    >(false);
  },
});

Deno.test({
  name: "Enum.match() has to be exhaustive",
  fn() {
    type M = Matcher<DefinitionFromEnum<Message>, number>;

    expectType<M>({
      Quit: () => -1,
      Plaintext: (data) => data.length,
      Encrypted: (data) => data.filter((x) => x !== 0).length,
    });
    expectType<M>({
      Quit: () => -1,
      Plaintext: (data) => data.length,
      Encrypted: (data) => data.filter((x) => x !== 0).length,
      _: () => -2,
    });
    expectType<M>({
      Quit: () => 0,
      _: () => 1,
    });

    expectType<TypeOf<{}, M>>(false);
    expectType<
      TypeOf<{
        Quit: (data: NoUndefined<null>) => number;
        Plaintext: (data: NoUndefined<string>) => number;
        Encrypted: (data: NoUndefined<number[]>) => number;
      }, M>
    >(true);
    expectType<
      TypeOf<{
        Plaintext: (data: NoUndefined<string>) => number;
        Encrypted: (data: NoUndefined<number[]>) => number;
      }, M>
    >(false);
    expectType<
      TypeOf<{
        Encrypted: (data: NoUndefined<number[]>) => number;
      }, M>
    >(false);
  },
});

Deno.test({
  name: "Enum.match() should pick the right variant or wildcard",
  fn() {
    let run = (msg: Message) =>
      Enum.match(msg, {
        Quit: () => -1,
        Plaintext: (data) => data.length,
        Encrypted: (data) => data.filter((x) => x !== 0).length,
      });

    assertThrows(() => run({ Invalid: null } as any));
    assertEquals(run({ Quit: null }), -1);
    assertEquals(run({ Plaintext: "Hello!" }), 6);
    assertEquals(run({ Encrypted: [0, 1, 2, 3, 0] }), 3);

    run = (msg: Message) =>
      Enum.match(msg, {
        Plaintext: (data) => data.length,
        _: () => -1,
      });

    assertThrows(() => run({} as any));
    assertEquals(run({ Invalid: null } as any), -1);
    assertEquals(run({ Quit: null }), -1);
    assertEquals(run({ Plaintext: "Hello!" }), 6);
    assertEquals(run({ Encrypted: [0, 1, 2, 3, 0] }), -1);
  },
});

Deno.test({
  name: "Enum.mutate() should be able to change variant",
  fn() {
    let msg = Enum<Mut<Message>>({ Plaintext: "Hello!" });
    assertEquals(msg, { Plaintext: "Hello!" });

    let other = Enum<Message>({ Encrypted: [5, 4, 3] });
    Enum.mutate(msg, other);

    assertEquals(msg, { Encrypted: [5, 4, 3] });
    assertEquals(other, { Encrypted: [5, 4, 3] });
    assertEquals(msg.Encrypted, other.Encrypted);
  },
});
