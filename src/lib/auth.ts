import { auth, currentUser } from "@clerk/nextjs/server";

function hasAdminClaim(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== "object") return false;
  const claims = sessionClaims as Record<string, unknown>;
  const candidates = [
    claims.publicMetadata,
    claims.public_metadata,
    claims.metadata,
  ];

  return (
    claims.admin === true ||
    candidates.some(
      (value) =>
        value &&
        typeof value === "object" &&
        (value as Record<string, unknown>).admin === true,
    )
  );
}

export async function getAdminUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const isAdmin =
    hasAdminClaim(sessionClaims) || user.publicMetadata.admin === true;

  return isAdmin ? user : null;
}
