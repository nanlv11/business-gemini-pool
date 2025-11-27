import { Handlers } from "$fresh/server.ts";
import { getSessionToken, destroySession, clearSessionCookie } from "../../../lib/auth.ts";

export const handler: Handlers = {
  POST(req, _ctx) {
    const token = getSessionToken(req);
    if (token) {
      destroySession(token);
    }

    const headers = new Headers({ Location: "/login" });
    clearSessionCookie(headers);

    return new Response(null, {
      status: 302,
      headers,
    });
  },
};
