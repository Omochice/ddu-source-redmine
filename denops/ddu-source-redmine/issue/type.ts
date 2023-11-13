import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";

export const isIssue = is.ObjectOf({
  id: is.Number,
  description: is.OneOf([
    is.String,
    is.Undefined,
  ]),
  endpoint: is.String,
  apiKey: is.String,
});

export type Issue = PredicateType<typeof isIssue>;
