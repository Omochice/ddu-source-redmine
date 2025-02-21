import {
  BaseSource,
  DduOptions,
  Item,
  SourceOptions,
} from "jsr:@shougo/ddu-vim@5.0.0/types";
import type { Denops } from "jsr:@denops/std@7.4.0";
import { listIssues } from "https://deno.land/x/deno_redmine@v0.10.0/issues/list.ts";
import type { Issue } from "https://deno.land/x/deno_redmine@v0.10.0/issues/type.ts";
import type { Context } from "https://deno.land/x/deno_redmine@v0.10.0/context.ts";
import { type ActionData, kindName } from "../@ddu-kinds/redmine_issue.ts";

type Params = Context & { onlyAsignedTo?: "me" | number };

export class Source extends BaseSource<Params> {
  kind = kindName;

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
          assignedToId: args.sourceParams.onlyAsignedTo,
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
