import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postJson, setEmployerToken } from "../api";
import type { EmployerAuthResponse } from "../types/employerAuth";
import EmployerLoginPage from "./EmployerLoginPage";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    postJson: vi.fn(),
    setEmployerToken: vi.fn(),
  };
});

function mockAuthResponse(): EmployerAuthResponse {
  return {
    token: "jwt-token-123",
    user: {
      id: "user-1",
      email: "employer@acme.com",
      name: "Jane Doe",
    },
    organization: {
      id: "org-1",
      name: "Acme Corp",
      slug: "acme-corp",
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployerLoginPage />
    </MemoryRouter>,
  );
}

describe("EmployerLoginPage", () => {
  beforeEach(() => {
    vi.mocked(postJson).mockReset();
    vi.mocked(setEmployerToken).mockReset();
    navigateMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("logs in with email and password", async () => {
    vi.mocked(postJson).mockResolvedValue(mockAuthResponse());

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Email"), "employer@acme.com");
    await user.type(screen.getByLabelText("Password"), "secret-pass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith("/auth/employers/login", {
        email: "employer@acme.com",
        password: "secret-pass",
      });
    });
    expect(setEmployerToken).toHaveBeenCalledWith("jwt-token-123");
    expect(navigateMock).toHaveBeenCalledWith("/employers/jobs", { replace: true });
  });

  it("shows an error when login fails", async () => {
    vi.mocked(postJson).mockRejectedValue(new Error("Invalid credentials"));

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Email"), "wrong@acme.com");
    await user.type(screen.getByLabelText("Password"), "bad");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(setEmployerToken).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("links to the signup page", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/employers/signup",
    );
  });
});
