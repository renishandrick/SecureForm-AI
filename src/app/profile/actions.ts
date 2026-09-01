"use server";

import { getUserProfile, saveUserProfile } from "@/lib/store";
import { revalidatePath } from "next/cache";
import { UserProfile } from "@/types";

export async function updateProfileAction(profile: UserProfile) {
  await saveUserProfile(profile);
  revalidatePath("/profile");
}
