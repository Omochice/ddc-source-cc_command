import { describe, it } from "jsr:@std/testing@1/bdd";
import { expect } from "jsr:@std/expect@1";
import { findSlashCommandStart } from "./complete-position.ts";

describe("findSlashCommandStart", () => {
  it("returns 0 when the line begins with a slash", () => {
    expect(findSlashCommandStart("/")).toBe(0);
    expect(findSlashCommandStart("/he")).toBe(0);
    expect(findSlashCommandStart("/help")).toBe(0);
  });

  it("returns the position of a slash that follows whitespace", () => {
    expect(findSlashCommandStart("  /he")).toBe(2);
    expect(findSlashCommandStart("\t/x")).toBe(1);
    expect(findSlashCommandStart("foo /bar")).toBe(4);
  });

  it("returns -1 when the line is empty", () => {
    expect(findSlashCommandStart("")).toBe(-1);
  });

  it("returns -1 when no slash precedes the cursor", () => {
    expect(findSlashCommandStart("hel")).toBe(-1);
    expect(findSlashCommandStart("foo bar")).toBe(-1);
  });

  it("returns -1 when the slash is part of a path-like token", () => {
    expect(findSlashCommandStart("src/foo")).toBe(-1);
    expect(findSlashCommandStart("a/b/c")).toBe(-1);
  });

  it("returns -1 when the trailing token contains whitespace after the slash", () => {
    expect(findSlashCommandStart("/help ")).toBe(-1);
    expect(findSlashCommandStart("/help world")).toBe(-1);
  });

  it("matches the slash nearest to the cursor when multiple are eligible", () => {
    expect(findSlashCommandStart("/foo /bar")).toBe(5);
  });
});
