import { bufhidden, buftype, swapfile } from "jsr:@denops/std@7.5.0/option";
import { batch } from "jsr:@denops/std@7.5.0/batch";
import type { Denops } from "jsr:@denops/std@7.5.0";
import * as fn from "jsr:@denops/std@7.5.0/function";
import { define } from "jsr:@denops/std@7.5.0/autocmd";

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

type BufferOption = {
  buftype?: BufType;
  bufhidden?: BufHidden;
  swapfile?: boolean;
};

async function prepareBuffer(
  denops: Denops,
  bufname: string,
  opts?: BufferOption,
): Promise<number> {
  const bufnr = await fn.bufadd(denops, bufname);
  await batch(denops, async (d) => {
    await fn.bufload(d, bufnr);
    await buftype.setBuffer(d, bufnr, opts?.buftype ?? "");
    await bufhidden.setBuffer(d, bufnr, opts?.bufhidden ?? "");
    await swapfile.setBuffer(d, bufnr, opts?.swapfile ?? false);
    await fn.deletebufline(d, bufnr, 1, "$");
  });
  return bufnr;
}

export async function prepareUnwritableBuffer(
  denops: Denops,
  bufname: string,
): Promise<number> {
  const bufnr = await prepareBuffer(denops, bufname, {
    buftype: "acwrite",
    bufhidden: "delete",
    swapfile: false,
  });
  await define(
    denops,
    "BufWriteCmd",
    bufname,
    `call setbufvar(${bufnr}, '&modified', 0)`,
    {
      nested: true,
    },
  );
  return bufnr;
}
