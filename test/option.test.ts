import { Option } from "../src/mod.ts";
import { assert, assertEquals, expectType, TypeEqual } from "./deps.ts";

Deno.test({
  name: "Construct Option classes",
  fn() {
    let option = Option.Some(5);
    expectType<TypeEqual<Option<number>, typeof option>>(true);
    assertEquals(option, { Some: 5 });

    let option2 = Option.None();
    expectType<TypeEqual<Option<never>, typeof option2>>(true);
    assertEquals(option2, { None: null });

    let option3 = Option.from(null);
    expectType<TypeEqual<Option<never>, typeof option3>>(true);
    assertEquals(option3, { None: null });

    let option4 = Option.from(undefined);
    expectType<TypeEqual<Option<never>, typeof option4>>(true);
    assertEquals(option4, { None: null });

    let option5 = Option.from("blah");
    expectType<TypeEqual<Option<string>, typeof option5>>(true);
    assertEquals(option5, { Some: "blah" });
  },
});

Deno.test({
  name: "Option should be iterable",
  fn() {
    let option = Option.Some(5);
    assertEquals([...option], [5]);

    let option2 = Option.None();
    assertEquals([...option2], []);
  },
});

Deno.test({
  name: "Option#clone()",
  fn() {
    let option = Option.Some("blah");
    let cloned = option.clone();

    assertEquals(option.Some, cloned.Some);
    assertEquals(option.None, cloned.None);
    assert(option !== cloned, "should not be the same reference");

    let option2 = Option.None();
    let cloned2 = option2.clone();

    assertEquals(option2.Some, cloned2.Some);
    assertEquals(option2.None, cloned2.None);
    assert(option2 !== cloned2, "should not be the same reference");
  },
});
