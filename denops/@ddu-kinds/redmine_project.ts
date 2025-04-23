import {
  ActionCallback,
  ActionFlags,
  Actions,
  BaseKind,
  DduItem,
  NoFilePreviewer,
} from "https://deno.land/x/ddu_vim@v4.2.0/types.ts";
import { openBrowser } from "../ddu-source-redmine/project/actions/open.ts";
import { createIssue } from "../ddu-source-redmine/project/actions/createIssue.ts";
import { isItem, type Item } from "../ddu-source-redmine/project/type.ts";
import { Denops } from "jsr:@denops/std@7.5.0";
import { join } from "jsr:@std/url@0.225.1/join";

export const kindName = "redmine_project" as const;

export type ActionData = Item;

type Params = Record<PropertyKey, never>;

const actions: Actions<Params> = {
  sample: () => {
    console.log("sample");
    return ActionFlags.None;
  },
  createIssue,
  openBrowser,
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override getPreviewer = async (
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> => {
    if (!isItem(args.item.action)) {
      return await Promise.resolve(undefined);
    }

    return await Promise.resolve({
      kind: "nofile",
      contents: args.item.action.project.description.split(/\r?\n/),
      filetype: "markdown",
    });
  };

  override params = (): Params => ({});
}
