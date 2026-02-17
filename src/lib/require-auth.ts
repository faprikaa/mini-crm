"use server";

import { auth } from "@/lib/auth";

export async function requireAuth() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}
