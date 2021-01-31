import { EnumDefinition, NoUndefined } from "../src/enum.ts";
import { Enum, EnumImpl, EnumImplData, EnumWithImpl, Mut } from "../src/mod.ts";
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

type Message<T> = EnumWithImpl<MessageImpl<T>>;
const Message = MessageImpl as new <T>(
  data: EnumImplData<MessageImpl<T>>,
) => Message<T>;

Deno.test({
  name: "EnumWithImpl should be an Enum",
  fn() {
    let msg = new Message<string>({ Quit: null });
    type PureEnum = EnumImplData<MessageImpl<string>>;

    expectType<PureEnum>(msg);
    expectType<TypeOf<PureEnum, Enum<EnumDefinition>>>(true);
    assertEquals(Object.keys(msg), ["Quit"]);
  },
});

Deno.test({
  name: "EnumWithImpl should be filled with methods",
  async fn() {
    let msg = new Message<string>({ Plaintext: "Hello" });
    await msg.send();
  },
});

Deno.test({
  name: "EnumWithImpl should interact well with Enum.match() and Enum.mutate()",
  async fn() {
    let msg = new Message<string>({ Plaintext: "Hello" }) as Mut<
      Message<string>
    >;
    msg.encrypt();

    assert(Enum.match(msg, {
      Encrypted: () => true,
      _: () => false,
    }));

    msg = new Message<string>({ Quit: null }) as Mut<Message<string>>;
    msg.encrypt();

    assert(Enum.match(msg, {
      Quit: () => true,
      _: () => false,
    }));
  },
});
