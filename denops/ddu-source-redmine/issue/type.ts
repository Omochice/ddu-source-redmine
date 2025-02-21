import { is, PredicateType } from "jsr:@core/unknownutil@3.18.1";

export const isItem = is.ObjectOf({
  issue: is.ObjectOf({
    id: is.Number,
    description: is.UnionOf([
      is.String,
      is.Undefined,
    ]),
  }),
  endpoint: is.String,
  apiKey: is.String,
});

export type Item = PredicateType<typeof isItem>;

export const mayHasCommand = is.ObjectOf({
  command: is.OptionalOf(is.String),
});
