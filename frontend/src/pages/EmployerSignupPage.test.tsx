import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postJson, setEmployerToken } from "../api";
import type { EmployerAuthResponse } from "../types/employerAuth";
import EmployerSignupPage from "./EmployerSignupPage";

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
    token: "jwt-token-456",
    user: {
      id: "user-2",
      email: "new@acme.com",
      name: "Alex Kim",
    },
    organization: {
      id: "org-2",
      name: "Acme Corp",
      slug: "acme-corp",
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployerSignupPage />
    </MemoryRouter>,
  );
}

async function fillSignupForm(
  user: ReturnType<typeof userEvent.setup>,
  opts: {
    email?: string;
    password?: string;
    name?: string;
    organizationName?: string;
    organizationSlug?: string;
  } = {},
) {
  const {
    email = "new@acme.com",
    password = "password123",
    name = "Alex Kim",
    organizationName = "Acme Corp",
    organizationSlug = "acme-corp",
  } = opts;

  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  if (name) {
    await user.type(screen.getByLabelText(/your name/i), name);
  }
  await user.type(screen.getByLabelText("Company / organization name"), organizationName);
  await user.type(screen.getByLabelText("URL slug"), organizationSlug);
}

describe("EmployerSignupPage", () => {
  beforeEach(() => {
    vi.mocked(postJson).mockReset();
    vi.mocked(setEmployerToken).mockReset();
    navigateMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("creates an account and redirects to the job board", async () => {
    vi.mocked(postJson).mockResolvedValue(mockAuthResponse());

    const user = userEvent.setup();
    renderPage();
    await fillSignupForm(user);

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith("/auth/employers/signup", {
        email: "new@acme.com",
        password: "password123",
        name: "Alex Kim",
        organizationName: "Acme Corp",
        organizationSlug: "acme-corp",
      });
    });
    expect(setEmployerToken).toHaveBeenCalledWith("jwt-token-456");
    expect(navigateMock).toHaveBeenCalledWith("/employers/jobs", { replace: true });
  });

  it("normalizes the organization slug before submitting", async () => {
    vi.mocked(postJson).mockResolvedValue(mockAuthResponse());

    const user = userEvent.setup();
    renderPage();
    await fillSignupForm(user, { organizationSlug: "  Foo Bar!!  " });

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith(
        "/auth/employers/signup",
        expect.objectContaining({ organizationSlug: "foo-bar" }),
      );
    });
  });

  it("shows an error when signup fails", async () => {
    vi.mocked(postJson).mockRejectedValue(new Error("Email already registered"));

    const user = userEvent.setup();
    renderPage();
    await fillSignupForm(user);

    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
    expect(setEmployerToken).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("links to the login page", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/employers/login",
    );
  });
});
