

declare module "better-auth/adapters/prisma" {
  export function prismaAdapter(...args: any[]): any;
}

declare module "better-auth/node" {
  export function toNodeHandler(...args: any[]): any;
  export function fromNodeHeaders(...args: any[]): any;
}

declare module "better-auth/plugins/email-otp" {
  export function emailOTP(...args: any[]): any;
}
