import { describe, expect, it } from "vitest";
import {
  validateApplicantEmail,
  validateApplicantName,
  validateApplicationForm,
  validateCoverNote,
  validateResumeUrl,
} from "./applyValidation";

describe("applyValidation", () => {
  it("rejects empty name and email", () => {
    expect(validateApplicantName("  ")).toBe("Name is required");
    expect(validateApplicantEmail("")).toBe("Email is required");
  });

  it("rejects invalid email", () => {
    expect(validateApplicantEmail("not-an-email")).toBe(
      "Enter a valid email address",
    );
  });

  it("accepts valid email", () => {
    expect(validateApplicantEmail("user@example.com")).toBeNull();
  });

  it("rejects resume URL without http(s)", () => {
    expect(validateResumeUrl("ftp://files.example.com/cv.pdf")).toBe(
      "Resume URL must start with http:// or https://",
    );
  });

  it("accepts https resume URL", () => {
    expect(validateResumeUrl("https://example.com/resume.pdf")).toBeNull();
  });

  it("rejects cover note over limit", () => {
    expect(validateCoverNote("x".repeat(5001))).toMatch(/too long/);
  });

  it("validates full form", () => {
    expect(
      validateApplicationForm({
        name: "Alex",
        email: "alex@example.com",
        resumeUrl: "https://example.com/cv",
        coverNote: "",
      }),
    ).toBeNull();
  });
});
