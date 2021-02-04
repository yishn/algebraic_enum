import type { Enum, EnumDefinition, NoUndefined } from "./enum.ts";

declare const enumType: unique symbol;

/**
 * With `EnumImpl`, you can write your own classes that behave like enums. In
 * particular, you can define methods that act on enums.
 *
 * ```ts
 * const MessageVariants = {
 *   Quit: null,
 *   Plaintext: ofType<string>(),
 *   Encrypted: ofType<number[]>(),
 * };
 *
 * class MessageImpl extends EnumImpl<typeof MessageVariants> {
 *   async send(this: Message): Promise<void> {
 *     // ...
 *   }
 * }
 *
 * type Message = EnumClass<MessageImpl>;
 * const Message = Enum.factory<Message>(MessageVariants, MessageImpl);
 *
 * let msg = Message.Plaintext("Hello World!");
 *
 * await Enum.match(msg, {
 *   Plaintext: async () => await msg.send(),
 *   _: async () => {}
 * });
 * ```
 */
export abstract class EnumImpl<D extends EnumDefinition> {
  readonly [enumType]?: Enum<D>;

  constructor(data: Enum<D>) {
    Object.assign(this, data);
  }
}

export type EnumClassValue<I extends EnumImpl<EnumDefinition>> = NoUndefined<
  I[typeof enumType]
>;

export type EnumClass<I extends EnumImpl<EnumDefinition>> =
  & EnumClassValue<I>
  & I;
