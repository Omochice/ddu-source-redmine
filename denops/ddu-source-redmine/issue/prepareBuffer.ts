import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.8.1/deps.ts";

type BufType =
  | ""
  | "nofile"
  | "nowrite"
  | "acwrite"
  | "quickfix"
  | "help"
  | "terminal"
  | "prompt"
  | "popup";

type BufHidden =
  | ""
  | "hide"
  | "unload"
  | "delete"
  | "wipe";

export type BufferOption = {
  buftype?: BufType;
  bufhidden?: BufHidden;
  swapfile?: boolean;
  filetype?: string;
};

export async function prepareBuffer(
  denops: Denops,
  bufname: string,
  opts?: BufferOption,
): Promise<number> {
  const bufnr = await fn.bufadd(denops, bufname);
  await fn.bufload(denops, bufnr);
  await fn.setbufvar(denops, bufnr, "&buftype", opts?.buftype ?? "");
  await fn.setbufvar(denops, bufnr, "&bufhidden", opts?.bufhidden ?? "");
  await fn.setbufvar(denops, bufnr, "&swapfile", opts?.swapfile ?? false);
  if (opts?.filetype !== undefined) {
    await fn.setbufvar(denops, bufnr, "&filetype", opts.filetype);
  }
  await fn.deletebufline(denops, bufnr, 1, "$");

  return bufnr;
}
