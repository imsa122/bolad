/**
 * Edge-compatible JWT utilities using `jose` library
 * Used in middleware (Edge Runtime) instead of jsonwebtoken
 */
import { jwtVerify, SignJWT } from 'jose';
import type { JWTPayload } from '@/types';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
};

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
