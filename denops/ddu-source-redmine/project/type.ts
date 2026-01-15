import { as, is, type Predicate } from "jsr:@core/unknownutil@4.3.0";

export type Project = {
  id: number;
  name: string;
  description?: string;
  identifier: string;
};

export const isProject = is.ObjectOf({
  id: is.Number,
  name: is.String,
  description: as.Optional(is.String),
  identifier: is.String,
}) satisfies Predicate<Project>;

export type Item = {
  project: Project;
  endpoint: string;
  apiKey: string;
};

export const isItem = is.ObjectOf({
  endpoint: is.String,
  apiKey: is.String,
  project: isProject,
});

export type Params = Record<PropertyKey, never>;
