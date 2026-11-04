// A hit's file, as the preview knows it.

import { readTextFile } from "herdr";

import { fileLines } from "./lines.js";
import { settle } from "./settle.js";
import { FileTokens, languageOf } from "./syntax.js";

/** What the preview knows of a hit's file: { state, lines, tokens } with lines once Read. */
export const FileState = Object.freeze({
  Reading: "reading",
  Read: "read",
  Unreadable: "unreadable",
});

/** Reads a file into its lines; Unreadable when it is absent or the read fails. */
export const readFile = async (path, machine) => {
  const text = await settle(readTextFile(path, { on: machine }));
  if (text === null || text instanceof Error) return { state: FileState.Unreadable };
  const lines = fileLines(text);
  return { state: FileState.Read, lines, tokens: new FileTokens(lines, languageOf(path)) };
};
