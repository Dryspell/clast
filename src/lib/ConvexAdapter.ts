// @ts-nocheck

import type {
	Adapter,
	AdapterAccount,
	AdapterAuthenticator,
	AdapterSession,
	AdapterUser,
	VerificationToken,
} from "@auth/core/adapters";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { FunctionArgs, FunctionReference } from "convex/server";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

type User = AdapterUser & { id: Id<"users"> };
type Session = AdapterSession & { userId: Id<"users"> };
type Account = AdapterAccount & { userId: Id<"users"> };
type Authenticator = AdapterAuthenticator & { userId: Id<"users"> };

export const ConvexAdapter: Adapter = {
	async createAuthenticator(authenticator: Authenticator) {
		await callMutation(api.authAdapter.createAuthenticator, {
			authenticator,
		});
		return authenticator;
	},
	async createSession(session: Session) {
		const id = await callMutation(api.authAdapter.createSession, {
			session: toDB(session),
		});
		return { ...session, id };
	},
	async createUser({ id: _, ...user }: User) {
		const id = await callMutation(api.authAdapter.createUser, {
			user: toDB(user),
		});
		return { ...user, id };
	},
	async createVerificationToken(verificationToken: VerificationToken) {
		await callMutation(api.authAdapter.createVerificationToken, {
			verificationToken: toDB(verificationToken),
		});
		return verificationToken;
	},
	async deleteSession(sessionToken) {
		return maybeSessionFromDB(
			await callMutation(api.authAdapter.deleteSession, {
				sessionToken,
			})
		);
	},
	async deleteUser(id: Id<"users">) {
		return maybeUserFromDB(
			await callMutation(api.authAdapter.deleteUser, { id })
		);
	},
	async getAccount(providerAccountId, provider) {
		const accountDoc = await callQuery(api.authAdapter.getAccount, {
			provider,
			providerAccountId,
		});
		if (!accountDoc) return null;
		// Strip Convex-specific metadata to satisfy the AdapterAccount shape.
		// Convex docs contain `_id` and `_creationTime` fields that are not part of
		// `AdapterAccount`. Remove them before returning.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _id, _creationTime, ...adapterAccount } = accountDoc as any;
		return adapterAccount as AdapterAccount;
	},
	async getAuthenticator(credentialID) {
		return await callQuery(api.authAdapter.getAuthenticator, {
			credentialID,
		});
	},
	async getSessionAndUser(sessionToken) {
		const result = await callQuery(api.authAdapter.getSessionAndUser, {
			sessionToken,
		});
		if (result === null) {
			return null;
		}
		const { user, session } = result;
		return { user: userFromDB(user), session: sessionFromDB(session) };
	},
	async getUser(id: Id<"users">) {
		return maybeUserFromDB(
			await callQuery(api.authAdapter.getUser, { id })
		);
	},
	async getUserByAccount({ provider, providerAccountId }) {
		return maybeUserFromDB(
			await callQuery(api.authAdapter.getUserByAccount, {
				provider,
				providerAccountId,
			})
		);
	},
	async getUserByEmail(email) {
		return maybeUserFromDB(
			await callQuery(api.authAdapter.getUserByEmail, { email })
		);
	},
	async linkAccount(account: Account) {
		await callMutation(api.authAdapter.linkAccount, { account });
		return undefined;
	},
	async listAuthenticatorsByUserId(userId: Id<"users">) {
		return await callQuery(api.authAdapter.listAuthenticatorsByUserId, {
			userId,
		});
	},
	async unlinkAccount({ provider, providerAccountId }) {
		return (
			(await callMutation(api.authAdapter.unlinkAccount, {
				provider,
				providerAccountId,
			})) ?? undefined
		);
	},
	async updateAuthenticatorCounter(credentialID, newCounter) {
		return await callMutation(api.authAdapter.updateAuthenticatorCounter, {
			credentialID,
			newCounter,
		});
	},
	async updateSession(session: Session) {
		return await callMutation(api.authAdapter.updateSession, {
			session: toDB(session),
		});
	},
	async updateUser(user: User) {
		await callMutation(api.authAdapter.updateUser, { user: toDB(user) });
		return user;
	},
	async useVerificationToken({ identifier, token }) {
		return maybeVerificationTokenFromDB(
			await callMutation(api.authAdapter.useVerificationToken, {
				identifier,
				token,
			})
		);
	},
} as any;

/// Helpers

function callQuery<Query extends FunctionReference<"query">>(
	query: Query,
	args: Omit<FunctionArgs<Query>, "secret">
) {
	return fetchQuery(query, addSecret(args) as any);
}

function callMutation<Mutation extends FunctionReference<"mutation">>(
	mutation: Mutation,
	args: Omit<FunctionArgs<Mutation>, "secret">
) {
	return fetchMutation(mutation, addSecret(args) as any);
}

if (process.env.CONVEX_AUTH_ADAPTER_SECRET === undefined) {
	throw new Error("Missing CONVEX_AUTH_ADAPTER_SECRET environment variable");
}

function addSecret(args: Record<string, any>) {
	return { ...args, secret: process.env.CONVEX_AUTH_ADAPTER_SECRET! };
}

function maybeUserFromDB(user: Doc<"users"> | null) {
	if (user === null) {
		return null;
	}
	return userFromDB(user);
}

function userFromDB(user: Doc<"users">) {
	return {
		id: user._id,
		email: user.email ?? "",
		emailVerified: maybeDate(user.emailVerified),
		name: user.name ?? user.displayName ?? null,
		image: user.image ?? null,
	};
}

function maybeSessionFromDB(session: Doc<"sessions"> | null) {
	if (session === null) {
		return null;
	}
	return sessionFromDB(session);
}

function sessionFromDB(session: Doc<"sessions">) {
	return {
		sessionToken: session.sessionToken,
		userId: session.userId,
		expires: new Date(session.expires),
	};
}

function maybeVerificationTokenFromDB(
	verificationToken: Doc<"verificationTokens"> | null
) {
	if (verificationToken === null) {
		return null;
	}
	return verificationTokenFromDB(verificationToken);
}

function verificationTokenFromDB(verificationToken: Doc<"verificationTokens">) {
	return {
		identifier: verificationToken.identifier,
		token: verificationToken.token,
		expires: new Date(verificationToken.expires),
	};
}

function maybeDate(value: number | undefined) {
	return value === undefined ? null : new Date(value);
}

function toDB<T extends object>(
	obj: T
): {
	[K in keyof T]: T[K] extends Date
		? number
		: null extends T[K]
		? undefined
		: T[K];
} {
	const result: any = {};
	for (const key in obj) {
		const value = obj[key];
		result[key] =
			value instanceof Date
				? value.getTime()
				: value === null
				? undefined
				: value;
	}
	return result;
}
