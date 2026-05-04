import { describe, it } from "jsr:@std/testing@1.0.9/bdd";
import { expect } from "jsr:@std/expect@1.0.19";
import { parseDescription } from "./mod.ts";

describe("parseDescription", () => {
  describe("with valid YAML frontmatter (parsed by std)", () => {
    it("returns a plain string description", () => {
      const text = "---\ndescription: hello\n---\nbody\n";
      expect(parseDescription(text)).toBe("hello");
    });

    it("returns a literal block scalar with its trailing newline", () => {
      const text = "---\ndescription: |\n  foo\n  bar\n---\n";
      expect(parseDescription(text)).toBe("foo\nbar\n");
    });

    it("returns a folded block scalar joined with spaces", () => {
      const text = "---\ndescription: >\n  foo\n  bar\n---\n";
      expect(parseDescription(text)).toBe("foo bar\n");
    });

    it("returns a quoted string with quotes stripped", () => {
      const text = '---\ndescription: "with: colon"\n---\n';
      expect(parseDescription(text)).toBe("with: colon");
    });

    it("returns empty when frontmatter has no description", () => {
      const text = "---\nname: foo\n---\n";
      expect(parseDescription(text)).toBe("");
    });

    it("returns empty when description is not a string", () => {
      const text = "---\ndescription:\n  - a\n  - b\n---\n";
      expect(parseDescription(text)).toBe("");
    });

    it("returns empty when text has no frontmatter", () => {
      expect(parseDescription("just a body, no frontmatter")).toBe("");
    });
  });

  describe("with invalid YAML frontmatter (handled by fallback)", () => {
    it("recovers a plain description when another field has invalid YAML", () => {
      const text = [
        "---",
        "description: Validate implementation",
        "allowed-tools: Bash, Glob, Grep, Read, LS",
        "argument-hint: [feature-name] [task-numbers]",
        "---",
        "",
      ].join("\n");
      expect(parseDescription(text)).toBe("Validate implementation");
    });

    it("recovers a literal block description (`|`) past an invalid field", () => {
      const text = [
        "---",
        "description: |",
        "  foo",
        "  bar",
        "argument-hint: [a] [b]",
        "---",
        "",
      ].join("\n");
      expect(parseDescription(text)).toBe("foo\nbar");
    });

    it("recovers a folded block description (`>`) past an invalid field", () => {
      const text = [
        "---",
        "description: >",
        "  foo",
        "  bar",
        "argument-hint: [a] [b]",
        "---",
        "",
      ].join("\n");
      expect(parseDescription(text)).toBe("foo bar");
    });

    it("strips surrounding double quotes", () => {
      const text = [
        "---",
        'description: "quoted value"',
        "argument-hint: [a] [b]",
        "---",
      ].join("\n");
      expect(parseDescription(text)).toBe("quoted value");
    });

    it("strips surrounding single quotes", () => {
      const text = [
        "---",
        "description: 'quoted value'",
        "argument-hint: [a] [b]",
        "---",
      ].join("\n");
      expect(parseDescription(text)).toBe("quoted value");
    });

    it("returns empty when fallback finds no description line", () => {
      const text = [
        "---",
        "argument-hint: [a] [b]",
        "allowed-tools: Bash",
        "---",
      ].join("\n");
      expect(parseDescription(text)).toBe("");
    });
  });
});
