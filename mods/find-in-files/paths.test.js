import { describe, expect, test } from "bun:test";

import { parsePatterns, pathFlags } from "./paths.js";

describe("paths", () => {
  describe("parsePatterns", () => {
    test("should give no globs for an empty field", () => {
      expect(parsePatterns("")).toEqual([]);
    });

    test("should split on commas, trim the parts and drop the empty ones", () => {
      expect(parsePatterns(" *.js ,, *.ts, ")).toEqual(["*.js", "*.ts"]);
    });

    test("should keep a comma inside braces in its part", () => {
      expect(parsePatterns("*.{js,ts},*.md")).toEqual(["*.{js,ts}", "*.md"]);
    });

    test("should keep a comma inside nested braces in its part", () => {
      expect(parsePatterns("{a,{b,c}}.js,d")).toEqual(["{a,{b,c}}.js", "d", "**/d/**"]);
    });

    test("should remove a leading ./", () => {
      expect(parsePatterns("./src/**")).toEqual(["src/**"]);
    });

    test("should match a plain name as a file or a folder at any depth", () => {
      expect(parsePatterns("lib")).toEqual(["lib", "**/lib/**"]);
    });

    test("should match a plain path as a file or a folder from the root", () => {
      expect(parsePatterns("src/lib")).toEqual(["src/lib", "src/lib/**"]);
    });

    test("should drop a trailing / from a plain name", () => {
      expect(parsePatterns("src/, a/b//")).toEqual(["src", "**/src/**", "a/b", "a/b/**"]);
    });

    test("should keep a trailing / on a glob", () => {
      expect(parsePatterns("src/*/")).toEqual(["src/*/"]);
    });

    test.each([["*.js"], ["a?.js"], ["[ab].js"], ["{a,b}"]])(
      "should keep the glob %s as it is",
      (glob) => {
        expect(parsePatterns(glob)).toEqual([glob]);
      },
    );
  });

  describe("pathFlags", () => {
    test("should give no flags when both fields are empty", () => {
      expect(pathFlags({ include: "", exclude: "" })).toEqual([]);
    });

    test("should put the excludes with ! after the includes", () => {
      const flags = pathFlags({ include: "*.js", exclude: "test" });

      expect(flags).toEqual(["--glob", "*.js", "--glob", "!test", "--glob", "!**/test/**"]);
    });

    test("should give a flag for each part of each field", () => {
      const flags = pathFlags({ include: "src, *.js", exclude: "*.min.js" });

      expect(flags).toEqual([
        "--glob",
        "src",
        "--glob",
        "**/src/**",
        "--glob",
        "*.js",
        "--glob",
        "!*.min.js",
      ]);
    });
  });
});
