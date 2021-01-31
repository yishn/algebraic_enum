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
 * type Message<T> = EnumWithImpl<MessageImpl<T>>;
 * const Message = MessageImpl as new <T>(
 *   data: EnumImplData<MessageImpl<T>>
 * ) => Message<T>;
 *
 * let msg = new Message({ Plaintext: "Hello World!" });
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

export type EnumImplData<I extends EnumImpl<EnumDefinition>> = NoUndefined<
  I[typeof enumType]
>;

export type EnumWithImpl<I extends EnumImpl<EnumDefinition>> =
  & EnumImplData<I>
  & I;
