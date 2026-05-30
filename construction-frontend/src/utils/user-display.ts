export type DisplayUser = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export function getUserDisplayName(user: DisplayUser) {
  const fullName = [user.firstName, user.lastName]
    .map((namePart) => namePart?.trim())
    .filter(Boolean)
    .join(" ");

  return fullName || user.email;
}
