import { Enum, Variant } from "../src/mod.ts";
import { Matcher } from "../src/enum.ts";
import {
  assertEquals,
  assertThrows,
  expectType,
  TypeEqual,
} from "../dev_deps.ts";
import { TypeExtends } from "./utils.ts";

class MessageVariants<T> {
  Quit = null;
  Plaintext = Variant<T>();
  Encrypted = Variant<number[]>();
}

type Message = Enum<MessageVariants<string>>;
const Message = () => Enum.factory(MessageVariants<string>);

type GenericMessage<T> = Enum<MessageVariants<T>>;
const GenericMessage = <T>() => Enum.factory(MessageVariants<T>);

Deno.test({
  name: "Enums can contain one and only one variant",
  fn() {
    expectType<Message>({ Quit: null });
    expectType<Message>({ Plaintext: "Hello World!" });
    expectType<Message>({ Encrypted: [4, 8, 15, 16, 23, 42] });

    expectType<TypeExtends<{}, Message>>(false);
    expectType<TypeExtends<{ Quit: 5 }, Message>>(false);
    expectType<
      TypeExtends<
        {
          Quit: null;
          Plaintext: "";
        },
        Message
      >
    >(false);
  },
});

Deno.test({
  name: "Enum factory should simplify enum value creation",
  fn() {
    let msg = Message().Plaintext("Hello World");
    assertEquals(msg, { Plaintext: "Hello World" });

    msg = Message().Quit();
    assertEquals(msg, { Quit: null });

    msg = Message().Encrypted([1, 2, 3]);
    assertEquals(msg, { Encrypted: [1, 2, 3] });

    let genMsg = GenericMessage<boolean>().Plaintext(true);
    assertEquals(genMsg, { Plaintext: true });
  },
});

Deno.test({
  name: "Enum.match() has to be exhaustive",
  fn() {
    type M = Matcher<MessageVariants<string>>;

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

    expectType<TypeExtends<{}, M>>(false);
    expectType<
      TypeExtends<
        {
          Quit: () => number;
          Plaintext: (data: string) => number;
          Encrypted: (data: number[]) => number;
        },
        M
      >
    >(true);
    expectType<
      TypeExtends<
        {
          Plaintext: (data: string) => number;
          Encrypted: (data: number[]) => number;
        },
        M
      >
    >(false);
    expectType<
      TypeExtends<
        {
          Encrypted: (data: number[]) => number;
        },
        M
      >
    >(false);
  },
});

Deno.test({
  name: "Enum.match() should pick the right variant or wildcard",
  fn() {
    const run = (msg: Message) =>
      Enum.match(msg, {
        Quit: () => -1,
        Plaintext: (data) => data.length,
        Encrypted: (data) => data.filter((x) => x !== 0).length,
      });

    expectType<TypeEqual<ReturnType<typeof run>, number>>(true);
    assertThrows(() => run({} as any));
    assertThrows(() => run({ Invalid: null } as any));
    assertEquals(run(Message().Quit()), -1);
    assertEquals(run(Message().Plaintext("Hello!")), 6);
    assertEquals(run(Message().Encrypted([0, 1, 2, 3, 0])), 3);

    const run2 = (msg: Message) =>
      Enum.match(msg, {
        Plaintext: (data) => data.length,
        _: () => -1,
      });

    expectType<TypeEqual<ReturnType<typeof run2>, number>>(true);
    assertEquals(run2({} as any), -1);
    assertEquals(run2({ Invalid: null } as any), -1);
    assertEquals(run2(Message().Quit()), -1);
    assertEquals(run2(Message().Plaintext("Hello!")), 6);
    assertEquals(run2(Message().Encrypted([0, 1, 2, 3, 0])), -1);
  },
});

Deno.test({
  name: "Enum.mutate() should be able to change variant",
  fn() {
    const msg = Message().Plaintext("Hello!");
    assertEquals(msg, Message().Plaintext("Hello!"));

    const other = Message().Encrypted([5, 4, 3]);
    Enum.mutate(msg, other);

    assertEquals(msg, Message().Encrypted([5, 4, 3]));
    assertEquals(msg, other);
  },
});
