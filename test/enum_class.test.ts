import { EnumDefinition, NoUndefined } from "../src/enum.ts";
import { Enum, Mut } from "../src/mod.ts";
import { EnumClass, EnumClassValue, EnumImpl } from "../src/enum_class.ts";
import { assert, assertEquals, delay, expectType } from "../dev_deps.ts";
import { TypeOf } from "./utils.ts";
import { memo, ofType } from "../src/utils.ts";

const MessageVariants = {
  Quit: null,
  Plaintext: ofType<unknown>(),
  Encrypted: ofType<number[]>(),
};

class MessageImpl<T> extends EnumImpl<
  typeof MessageVariants & { Plaintext: T }
> {
  async send(): Promise<void> {
    await delay(100);
  }

  encrypt(this: Mut<Message<T>>): void {
    Enum.match(this, {
      Plaintext: (data) => {
        expectType<NoUndefined<T>>(data);
        Enum.mutate(this, Message<T>().Encrypted([1, 2, 3]));
      },
      _: () => {},
    });
  }
}

type Message<T> = EnumClass<MessageImpl<T>>;
const Message = memo(<T>() =>
  Enum.factory<Message<T>>(MessageVariants, MessageImpl)
);

Deno.test({
  name: "EnumClass should be an Enum",
  fn() {
    let msg = Message<string>().Quit(null);
    type PureEnum = EnumClassValue<MessageImpl<string>>;

    expectType<PureEnum>(msg);
    expectType<TypeOf<PureEnum, Enum<EnumDefinition>>>(true);
    assertEquals(Object.keys(msg), ["Quit"]);
  },
});

Deno.test({
  name: "EnumClass should be filled with methods",
  async fn() {
    let msg = Message<string>().Plaintext("Hello");
    await msg.send();
  },
});

Deno.test({
  name: "EnumClass should interact well with Enum.match() and Enum.mutate()",
  async fn() {
    let msg = Message<string>().Plaintext("Hello") as Mut<Message<string>>;
    msg.encrypt();

    assert(
      Enum.match(msg, {
        Encrypted: () => true,
        _: () => false,
      }),
      "msg is Encrypted",
    );

    msg = Message<string>().Quit(null) as Mut<Message<string>>;
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
