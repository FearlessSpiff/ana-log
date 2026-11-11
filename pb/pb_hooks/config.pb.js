/// <reference path="../pb_data/types.d.ts" />

// Configure Google as the only login method from environment variables on
// every start, so the container is configured without clicking through the
// admin UI. Unset variables leave the current settings untouched.
onBootstrap((e) => {
  e.next();

  // DEV_MODE=1 keeps password login enabled and creates a fixed test user,
  // matching the "Dev login" button of the Vite dev server. Never set it in
  // production.
  const dev = $os.getenv("DEV_MODE") === "1";
  if (dev) {
    const email = "dev@ana-log.local";
    const users = e.app.findCollectionByNameOrId("users");
    users.passwordAuth.enabled = true;
    e.app.save(users);

    let user;
    try {
      user = e.app.findAuthRecordByEmail("users", email);
    } catch {
      user = new Record(users);
      user.setEmail(email);
      user.setVerified(true);
    }
    user.setPassword("devpassword");
    e.app.save(user);
    console.log(`DEV_MODE: password login enabled, test user ${email} / devpassword`);
  }

  const clientId = $os.getenv("GOOGLE_CLIENT_ID");
  const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    console.log("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set, skipping OAuth2 config");
    return;
  }

  const users = e.app.findCollectionByNameOrId("users");
  users.passwordAuth.enabled = dev;
  users.oauth2.enabled = true;
  users.oauth2.providers = [{ name: "google", clientId, clientSecret }];
  e.app.save(users);

  const appUrl = $os.getenv("APP_URL");
  if (appUrl) {
    const settings = e.app.settings();
    settings.meta.appURL = appUrl;
    settings.meta.appName = "ana-log";
    e.app.save(settings);
  }
});

// Optional allowlist: ALLOWED_EMAILS="me@gmail.com,friend@gmail.com". When
// unset, any Google account can sign up.
onRecordAuthWithOAuth2Request((e) => {
  const allowed = ($os.getenv("ALLOWED_EMAILS") || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const email = (e.oAuth2User?.email || "").toLowerCase();
  if (allowed.length && !allowed.includes(email)) {
    throw new ForbiddenError("This account is not allowed to use ana-log.");
  }
  e.next();
}, "users");
