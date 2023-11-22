import {
  Actions,
  BaseKind,
  DduItem,
  NoFilePreviewer,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { update } from "../ddu-source-redmine/issue/actions/update.ts";
import { note } from "../ddu-source-redmine/issue/actions/note.ts";
import { updateDescription } from "../ddu-source-redmine/issue/actions/updateDescription.ts";
import { openBrowser } from "../ddu-source-redmine/issue/actions/open.ts";
import { isItem, type Item } from "../ddu-source-redmine/issue/type.ts";

export const kindName = "redmine_issue" as const;

export type ActionData = Item;

type Params = Record<PropertyKey, never>;

const actions: Actions<Params> = {
  note,
  update,
  updateDescription,
  openBrowser,
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override async getPreviewer(
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> {
    if (!isItem(args.item.action)) {
      return await Promise.resolve(undefined);
    }

    const description = (args.item.action.issue.description ?? "").trim();
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
