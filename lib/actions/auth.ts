"use server";

import { signIn } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ratelimit from "../ratelimit";
import { workflowClient } from "../workflow";
import config from "../config";

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">
) => {
  const { email, password } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) redirect("/too-fast");

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error) {
    console.log(error, "SignIn Error");
    return { success: false, error: "Error signing in" };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { fullName, email, password, universityId, universityCard } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) redirect("/too-fast");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: "User already exists" };
  }

  const hasedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hasedPassword,
      universityCard,
    });

    await workflowClient.trigger({
      url: `${config.env.prodApiEndpoint}/api/workflows/onboarding`,
      body: { email, fullName },
    });

    await signInWithCredentials({ email, password });

    return { success: true };
  } catch (error) {
    console.log(error, "SignUp Error");
    return { success: false, error: "Error signing up" };
  }
};
