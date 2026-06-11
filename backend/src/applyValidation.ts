const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateApplicantEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  if (trimmed.length > 320) return "Email is too long";
  if (!emailPattern.test(trimmed)) return "Enter a valid email address";
  return null;
}

export function validateApplicantName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required";
  if (trimmed.length > 200) return "Name is too long";
  return null;
}

export function validateResumeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Resume URL is required";
  if (trimmed.length > 2048) return "Resume URL is too long";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Resume URL must start with http:// or https://";
    }
  } catch {
    return "Enter a valid resume URL";
  }
  return null;
}

export function validateCoverNote(note: string): string | null {
  if (note.length > 5000) return "Cover note is too long (max 5000 characters)";
  return null;
}
