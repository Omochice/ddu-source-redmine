import { ResultAsync } from "npm:neverthrow@8.2.0";
import { list as listIssuesOrThrow } from "jsr:@omochice/redmine@3.2.0/issues/list";
import { update as updateIssueOrThrow } from "jsr:@omochice/redmine@3.2.0/issues/update";
import type { ListIssueQuery } from "jsr:@omochice/redmine@3.2.0/issues/type";
import { list as listProjectsOrThrow } from "jsr:@omochice/redmine@3.2.0/projects/list";

export type {
  Issue,
  UpdateIssueQuery,
} from "jsr:@omochice/redmine@3.2.0/issues/type";
export type { Project } from "jsr:@omochice/redmine@3.2.0/projects/type";

type Context = Parameters<typeof listIssuesOrThrow>[0];

/** List every issue visible to the given context. */
export const listIssues = ResultAsync.fromThrowable(
  (context: Context, option: ListIssueQuery = {}) =>
    Array.fromAsync(listIssuesOrThrow(context, option)),
);

/** List every project visible to the given context. */
export const listProjects = ResultAsync.fromThrowable(
  (context: Context) => Array.fromAsync(listProjectsOrThrow(context)),
);

/** Update the properties of a single issue. */
export const updateIssue = ResultAsync.fromThrowable(updateIssueOrThrow);
