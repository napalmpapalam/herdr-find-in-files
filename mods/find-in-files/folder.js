// The repo of the focused terminal: where the search runs.

import { exec, focused, home, panes, spaces } from "herdr";

import { settle } from "./settle.js";

/** Returns the git root of the focused terminal's folder, and the machine it is on. */
export const findRoot = async () => {
  const { cwd, machine } = focusedFolder();
  const git = await settle(exec("git", ["rev-parse", "--show-toplevel"], { cwd, on: machine }));

  // Outside a repo, or without git, the search runs in the terminal's folder.
  const isRepo = !(git instanceof Error) && !git.code;
  return { root: isRepo ? git.stdout.trim() : cwd, machine };
};

const focusedFolder = () => {
  const focus = focused();
  const tabTerminals = panes().filter((p) => p.tab === focus?.tab && p.terminal && p.cwd);
  const terminal = tabTerminals.find((p) => p.focused) ?? tabTerminals[0];
  const space = spaces().find((s) => s.id === focus?.space) ?? spaces().find((s) => s.active);
  const cwd = focus?.cwd || terminal?.cwd || space?.folder || home();
  return { cwd, machine: machineOf(focus, space) };
};

// A remote terminal's address is "<machine>/<id>".
const machineOf = (focus, space) => {
  const address = focus?.shown ?? focus?.terminal;
  if (!address) return space?.machine ?? null;
  return address.includes("/") ? address.split("/")[0] : null;
};
