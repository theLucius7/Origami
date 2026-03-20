import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  return auth.api.signInSocial({
    headers: new Headers(request.headers),
    body: {
      provider: "github",
      callbackURL: "/",
      errorCallbackURL: "/login",
    },
    asResponse: true,
  });
}
