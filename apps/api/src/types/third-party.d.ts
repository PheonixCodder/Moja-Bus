declare module "compression" {
  import type { RequestHandler } from "express";

  function compression(): RequestHandler;

  export default compression;
}

declare module "jsonwebtoken" {
  export interface JwtPayload {
    sub?: string;
    role?: string;
    tokenKind?: string;
    iat?: number;
    exp?: number;
  }

  export interface SignOptions {
    subject?: string;
    expiresIn?: string | number;
  }

  export function sign(
    payload: string | object | Buffer,
    secret: string,
    options?: SignOptions,
  ): string;

  export function verify(token: string, secret: string): string | JwtPayload;

  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
  };

  export default jwt;
}
