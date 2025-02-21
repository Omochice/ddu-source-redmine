import { as, is, type Predicate } from "jsr:@core/unknownutil@4.3.0";

export type Item = {
  issue: {
    id: number;
    description: string | undefined;
  };
  endpoint: string;
  apiKey: string;
};

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
}) satisfies Predicate<Item>;

export const mayHasCommand = is.ObjectOf({
  command: as.Optional(is.String),
});
