import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";

export const isItem = is.ObjectOf({
  issue: is.ObjectOf({
    id: is.Number,
    description: is.OneOf([
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
