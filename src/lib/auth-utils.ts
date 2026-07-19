import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Returns the signed-in user's id, or redirects to login.
 * Use in server components and server actions that load/mutate user data.
 * Never trust a client-supplied userId — always call this instead.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  return userId;
}
