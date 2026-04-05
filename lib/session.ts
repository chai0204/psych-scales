import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export type Session =
  | { role: "admin" }
  | { role: "guest"; tokenId: string };

export async function signSession(data: Session, expiresIn: string = "7d"): Promise<string> {
  return new SignJWT(data as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
