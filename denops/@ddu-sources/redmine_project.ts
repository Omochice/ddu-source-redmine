import {
  type DduOptions,
  type Item,
  type SourceOptions,
} from "jsr:@shougo/ddu-vim@11.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@11.1.0/source";
import type { Denops } from "jsr:@denops/std@8.2.0";
import { fetchList } from "jsr:@omochice/redmine@2.0.1/result/projects/list";
import type { Project } from "jsr:@omochice/redmine@2.0.1/throwable/projects/type";
import { type ActionData, kindName } from "../@ddu-kinds/redmine_project.ts";

type Context = {
  endpoint: string;
  apiKey: string;
};
type Params = Context;

export class Source extends BaseSource<Params> {
  override kind = kindName;

  gather(
    args: {
      denops: Denops;
      input: string;
      options: DduOptions;
      sourceOptions: SourceOptions;
      sourceParams: Params;
    },
  ): ReadableStream<Item<ActionData>[]> {
    const ctx = {
      endpoint: args.sourceParams.endpoint,
      apiKey: args.sourceParams.apiKey,
    } as const satisfies Context;

    const projectMapPromise = fetchProjectMap(ctx);

    return new ReadableStream({
      async start(controller) {
        const projectMap = await projectMapPromise;
        const paths: string[] = [];
        if (args.sourceOptions.path === "") {
          paths.push("/");
        } else if (!Array.isArray(args.sourceOptions.path)) {
          paths.push(args.sourceOptions.path);
        } else if (args.sourceOptions.path.length === 0) {
          paths.push("/");
        } else {
          // NOTE: path has 1 element at least
          paths.push(...args.sourceOptions.path);
        }
        const projects = projectMap.get(paths.at(-1)!);
        if (projects == null) {
          controller.close();
          return;
        }
        controller.enqueue(projects.map((project) => {
          const treePath = [...paths, `${project.id}`];
          return {
            word: project.name,
            isTree: projectMap.has(`${project.id}`),
            treePath,
            action: {
              ...ctx,
              project,
            },
          };
        }));
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

type ProjectMap = Map<string, Project[]>;

async function fetchProjectMap(ctx: Context): Promise<ProjectMap> {
  const result = await fetchList(ctx);
  if (result.isErr()) {
    throw new Error("Failed to fetch projects", { cause: result.error });
  }
  const projects: Project[] = result.value;
  return new Map(
    Object.entries(Object.groupBy(projects, (p) => p.parent?.id ?? "/"))
      .map(([k, v]) => [k, v?.toSorted((p) => p.id) ?? []]),
  );
}
