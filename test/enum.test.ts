import { Enum, Mut } from "../src/mod.ts";
import { DefinitionFromEnum, Matcher, NoUndefined } from "../src/enum.ts";
import { assertEquals, assertThrows, expectType } from "../dev_deps.ts";
import { TypeOf } from "./utils.ts";

type Message = Enum<{
  Quit: null;
  Plaintext: string;
  Encrypted: number[];
}>;

const Message = Enum.proxyFactory<Message>();

Deno.test({
  name: "Enums can contain one and only one variant",
  fn() {
    expectType<Message>(Message.Quit(null));
    expectType<Message>(Message.Plaintext("Hello World!"));
    expectType<Message>(Message.Encrypted([4, 8, 15, 16, 23, 42]));

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
  name: "Enum factory should simplify enum value creation",
  fn() {
    let msg = Message.Plaintext("Hello World");
    assertEquals(msg, { Plaintext: "Hello World" });

    msg = Message.Quit(null);
    assertEquals(msg, { Quit: null });

    msg = Message.Encrypted([1, 2, 3]);
    assertEquals(msg, { Encrypted: [1, 2, 3] });
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

    assertThrows(() => run({} as any));
    assertThrows(() => run({ Invalid: null } as any));
    assertEquals(run(Message.Quit(null)), -1);
    assertEquals(run(Message.Plaintext("Hello!")), 6);
    assertEquals(run(Message.Encrypted([0, 1, 2, 3, 0])), 3);

    run = (msg: Message) =>
      Enum.match(msg, {
        Plaintext: (data) => data.length,
        _: () => -1,
      });

    assertEquals(run({} as any), -1);
    assertEquals(run({ Invalid: null } as any), -1);
    assertEquals(run(Message.Quit(null)), -1);
    assertEquals(run(Message.Plaintext("Hello!")), 6);
    assertEquals(run(Message.Encrypted([0, 1, 2, 3, 0])), -1);
  },
});

Deno.test({
  name: "Enum.mutate() should be able to change variant",
  fn() {
    let msg = Message.Plaintext("Hello!") as Mut<Message>;
    assertEquals(msg, Message.Plaintext("Hello!"));

    let other = Message.Encrypted([5, 4, 3]);
    Enum.mutate(msg, other);

    assertEquals(msg, Message.Encrypted([5, 4, 3]));
    assertEquals(other, Message.Encrypted([5, 4, 3]));
    assertEquals(msg.Encrypted, other.Encrypted);
  },
});
