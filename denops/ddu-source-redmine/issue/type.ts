import { as, is, type Predicate } from "jsr:@core/unknownutil@4.3.0";

export type Item = {
  issue: {
    id: number;
    subject: string;
    description: string | undefined;
  };
  endpoint: string;
  apiKey: string;
};

export const isIssue = is.ObjectOf({
  id: is.Number,
  subject: is.String,
  description: is.UnionOf([
    is.String,
    is.Undefined,
  ]),
}) satisfies Predicate<Item["issue"]>;

export const isItem = is.ObjectOf({
  endpoint: is.String,
  apiKey: is.String,
  issue: isIssue,
}) satisfies Predicate<Item>;

export const mayHasCommand = is.ObjectOf({
  command: as.Optional(is.String),
});

export type Params = Record<PropertyKey, never>;
