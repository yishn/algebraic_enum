import type { Enum, EnumDefinition, NoUndefined } from "./enum.ts";

declare const enumType: unique symbol;

/**
 * With `EnumImpl`, you can write your own classes that behave like enums. In
 * particular, you can define methods that act on enums.
 *
 * ```ts
 * class MessageImpl<T> extends EnumImpl<{
 *   Quit: null,
 *   Plaintext: T,
 *   Encrypted: number[]
 * }> {
 *   async send(this: Message<T>): Promise<void> {
 *     // ...
 *   }
 * }
 *
 * type Message<T> = EnumClass<MessageImpl<T>>;
 * const Message = <T>(value: EnumImplValue<MessageImpl<T>>) =>
 *   Enum<Message<T>>(value, MessageImpl);
 *
 * let msg = Message({ Plaintext: "Hello World!" });
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

export type EnumImplValue<I extends EnumImpl<EnumDefinition>> = NoUndefined<
  I[typeof enumType]
>;

export type EnumClass<I extends EnumImpl<EnumDefinition>> =
  & EnumImplValue<I>
  & I;
