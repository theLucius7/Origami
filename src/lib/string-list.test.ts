import { describe, expect, it } from "vitest";
import { parseStoredStringList } from "./string-list";

describe("parseStoredStringList", () => {
  it("parses stored JSON string arrays", () => {
    expect(parseStoredStringList('["a@example.com","b@example.com"]')).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("filters non-string values", () => {
    expect(parseStoredStringList('["a@example.com",1,null,true]')).toEqual([
      "a@example.com",
    ]);
  });

  it("returns an empty list for invalid input", () => {
    expect(parseStoredStringList(null)).toEqual([]);
    expect(parseStoredStringList("not-json")).toEqual([]);
  });
});
