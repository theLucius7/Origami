import { describe, expect, it } from "vitest";
import { parseSearchQuery } from "./search-query-parser";

describe("parseSearchQuery", () => {
  it("parses structured search operators", () => {
    const parsed = parseSearchQuery(
      "from:张三 subject:发票 is:unread is:done account:gmail invoice"
    );

    expect(parsed.fromTerms).toEqual(["张三"]);
    expect(parsed.subjectTerms).toEqual(["发票"]);
    expect(parsed.accountTerms).toEqual(["gmail"]);
    expect(parsed.flags.read).toBe(false);
    expect(parsed.flags.done).toBe(true);
    expect(parsed.textTerms).toEqual(["invoice"]);
  });

  it("supports quoted values as single tokens", () => {
    const parsed = parseSearchQuery("subject:'月度 发票' from:\"ACME Corp\"");

    expect(parsed.subjectTerms).toEqual(["月度 发票"]);
    expect(parsed.fromTerms).toEqual(["ACME Corp"]);
  });
});
