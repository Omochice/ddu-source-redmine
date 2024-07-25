import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";

const isProject = is.ObjectOf({
  id: is.Number,
  name: is.String,
  description: is.String,
});

export type Project = PredicateType<typeof isProject>;

export const isItem = is.ObjectOf({
  endpoint: is.String,
  apiKey: is.String,
  project: isProject,
});

export type Item = PredicateType<typeof isItem>;
