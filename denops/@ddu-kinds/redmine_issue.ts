import {
  Actions,
  BaseKind,
  DduItem,
  NoFilePreviewer,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import type { Context as ConnectionContext } from "https://deno.land/x/deno_redmine@0.6.0/context.ts";
import type { Issue } from "https://deno.land/x/deno_redmine@0.6.0/issues/type.ts";
import { is } from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";
import { update } from "../ddu-source-redmine/issue/actions/update.ts";
import { note } from "../ddu-source-redmine/issue/actions/note.ts";

export const kindName = "redmine_issue" as const;

export type ActionData = ConnectionContext & Pick<Issue, "description" | "id">;

type Params = Record<PropertyKey, never>;

const isIssue = is.ObjectOf({
  id: is.Number,
  description: is.OneOf([
    is.String,
    is.Undefined,
  ]),
  endpoint: is.String,
  apiKey: is.String,
});

const actions: Actions<Params> = {
  note,
  update,
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override async getPreviewer(
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> {
    if (!isIssue(args.item.action)) {
      return await Promise.resolve(undefined);
    }

    const description = (args.item.action.description ?? "").trim();
    return await Promise.resolve({
      kind: "nofile",
      contents: description === ""
        ? ["--THIS ISSUE DOESNOT HAVE DESCRIPTION--"]
        : description.split(/\r?\n/),
      filetype: "markdown",
    });
  }
  override params(): Params {
    return {};
  }
}
