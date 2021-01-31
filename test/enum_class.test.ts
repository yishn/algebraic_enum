import { EnumDefinition, NoUndefined } from "../src/enum.ts";
import { Enum, Mut } from "../src/mod.ts";
import { EnumClass, EnumImpl, EnumImplValue } from "../src/enum_class.ts";
import { assert, assertEquals, delay, expectType } from "./deps.ts";
import { TypeOf } from "./utils.ts";

class MessageImpl<T> extends EnumImpl<{
  Quit: null;
  Plaintext: T;
  Encrypted: number[];
}> {
  async send(): Promise<void> {
    await delay(100);
  }

  encrypt(this: Mut<Message<T>>): void {
    Enum.match(this, {
      Plaintext: (data) => {
        expectType<NoUndefined<T>>(data);
        Enum.mutate(this, { Encrypted: [1, 2, 3] });
      },
      _: () => {},
    });
  }
}

type Message<T> = EnumClass<MessageImpl<T>>;
const Message = <T>(value: EnumImplValue<MessageImpl<T>>) =>
  Enum<Message<T>>(value, MessageImpl);

Deno.test({
  name: "EnumClass should be an Enum",
  fn() {
    let msg = Message<string>({ Quit: null });
    type PureEnum = EnumImplValue<MessageImpl<string>>;

    expectType<PureEnum>(msg);
    expectType<TypeOf<PureEnum, Enum<EnumDefinition>>>(true);
    assertEquals(Object.keys(msg), ["Quit"]);
  },
});

Deno.test({
  name: "EnumClass should be filled with methods",
  async fn() {
    let msg = Message({ Plaintext: "Hello" });
    await msg.send();
  },
});

Deno.test({
  name: "EnumClass should interact well with Enum.match() and Enum.mutate()",
  async fn() {
    let msg = Message({ Plaintext: "Hello" }) as Mut<Message<string>>;
    msg.encrypt();

    assert(
      Enum.match(msg, {
        Encrypted: () => true,
        _: () => false,
      }),
      "msg is Encrypted",
    );

    msg = Message({ Quit: null }) as Mut<Message<string>>;
    msg.encrypt();

    assert(
      Enum.match(msg, {
        Quit: () => true,
        _: () => false,
      }),
      "msg is Quit",
    );
  },
});
