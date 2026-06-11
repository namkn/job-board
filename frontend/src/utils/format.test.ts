import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDt } from "./format";

describe("formatDt", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates to Date#toLocaleString for a valid ISO string", () => {
    const spy = vi
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("Apr 15, 2026, 10:30:00 AM");

    expect(formatDt("2026-04-15T14:30:00.000Z")).toBe(
      "Apr 15, 2026, 10:30:00 AM",
    );
    expect(spy).toHaveBeenCalled();
  });

  it("returns a string for any parseable input", () => {
    const result = formatDt("2026-01-01T00:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
