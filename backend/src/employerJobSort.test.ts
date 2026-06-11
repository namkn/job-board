import { describe, expect, it } from "vitest";
import { employerJobOrderBy, isEmployerJobSort } from "./employerJobSort.js";

describe("employerJobSort", () => {
  it("accepts known sort values", () => {
    expect(isEmployerJobSort("createdDesc")).toBe(true);
    expect(isEmployerJobSort("viewCountDesc")).toBe(true);
    expect(isEmployerJobSort("applicationCountDesc")).toBe(true);
    expect(isEmployerJobSort("invalid")).toBe(false);
  });

  it("builds orderBy for each sort", () => {
    expect(employerJobOrderBy("createdDesc")).toEqual([
      { createdAt: "desc" },
      { id: "desc" },
    ]);
    expect(employerJobOrderBy("viewCountDesc")).toEqual([
      { viewCount: "desc" },
      { id: "desc" },
    ]);
    expect(employerJobOrderBy("applicationCountDesc")).toEqual([
      { applications: { _count: "desc" } },
      { id: "desc" },
    ]);
  });
});
