import { createClient } from "./supabase-server";
import { redirect } from "next/navigation";
import { cache } from "react";

// Cache the user for the duration of the request
export const getUser = cache(async () => {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting user:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
});

export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

// Cache the session for the duration of the request
export const getSession = cache(async () => {
  const supabase = createClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
});

// Get user profile data
export async function getUserProfile() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();

  try {
    // You can add profile fetching logic here if you have a profiles table
    // For now, return user metadata
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      created_at: user.created_at,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Check if user has specific permissions (example for future use)
export async function hasPermission(permission: string) {
  const user = await getUser();

  if (!user) {
    return false;
  }

  // Add your permission logic here
  // For now, all authenticated users have all permissions
  return true;
}
