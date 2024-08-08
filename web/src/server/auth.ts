import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    idToken: string;
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: ({ token, account, ...rest }) => {
      if (account?.id_token) {
        token.idToken = account.id_token;
      }

      return {
        ...token,
        ...rest,
      };
    },
    session: ({ session, token }) => ({
      ...session,
      idToken: token.idToken,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
  providers: [
    CognitoProvider({
      issuer: env.COGNITO_ISSUER,
      clientId: env.COGNITO_CLIENT_ID,
      clientSecret: env.COGNITO_CLIENT_SECRET,
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
