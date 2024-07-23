import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";

export type Project = {
  id: number;
  name: string;
  children?: Project[];
};

export type Item = {
  endpoint: string;
  apiKey: string;
  project: Project;
};
