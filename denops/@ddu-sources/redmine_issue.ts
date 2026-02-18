import {
  type DduOptions,
  type Item,
  type SourceOptions,
} from "jsr:@shougo/ddu-vim@11.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@11.1.0/source";
import type { Denops } from "jsr:@denops/std@8.2.0";
import { listIssues } from "jsr:@omochice/redmine@2.0.1/result/issues/list";
import type { Issue } from "jsr:@omochice/redmine@2.0.1/throwable/issues/type";
import { type ActionData, kindName } from "../@ddu-kinds/redmine_issue.ts";
import type { Context } from "../ddu-source-redmine/issue/type.ts";

type Params = Context & { onlyAssignedTo?: "me" | number };

export class Source extends BaseSource<Params> {
  override kind = kindName;

  gather(args: {
    denops: Denops;
    options: DduOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    input: string;
  }): ReadableStream<Item<ActionData>[]> {
    const connectionContext = {
      endpoint: args.sourceParams.endpoint,
      apiKey: args.sourceParams.apiKey,
    } as const;

    return new ReadableStream({
      async start(controller) {
        const issues = await listIssues(connectionContext, {
          assignedToId: args.sourceParams.onlyAssignedTo,
        });
        if (!issues.isOk()) {
          controller.close();
          return;
        }
        controller.enqueue(
          issues.value.map((issue) => convertToItem(issue, connectionContext)),
        );

        controller.close();
      },
    });
  }

  params(): Params {
    return {
      endpoint: "",
      apiKey: "",
    };
  }
}

function convertToItem(issue: Issue, context: Context): Item<ActionData> {
  return {
    word: `#${issue.id} ${issue.subject}`,
    action: {
      ...context,
      issue,
    },
  };
}
