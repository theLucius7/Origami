# Outlook OAuth: Detailed Setup

This page explains: **how to connect Outlook / Microsoft 365 mailboxes into Origami**.

This is different from GitHub sign-in:

- **GitHub sign-in**: gets you into Origami
- **Outlook OAuth**: gives Origami access to your Outlook mailbox

If your goal right now is:

> “I can already sign in to Origami. Now I want Outlook / Microsoft 365 to actually connect.”

this is the page you want.

---

## What should you have at the end of this step?

If you start with the simplest environment-variable setup, you should end up with these values in `.env`:

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

And you must also make sure:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

is correct, because the Microsoft OAuth redirect URI depends on it.

You can think of this step as:

> create a Web app in Microsoft Entra so Origami can start the Outlook / Microsoft 365 authorization flow, then copy the Client ID and Client Secret back into `.env`.

---

## Which two places will you keep switching between?

For this step, you mainly switch between **two places**:

### Place A: Microsoft Entra admin center

This is where you will:

- register the app
- configure Authentication
- create the Client Secret
- add Microsoft Graph permissions
- grant admin consent if your tenant requires it

### Place B: the `.env` file in the Origami project

This is where you will fill:

```txt
NEXT_PUBLIC_APP_URL=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

The simplest way to remember it is:

> **Microsoft Entra generates the Outlook OAuth values. `.env` receives them.**

---

## Official reference

- Register an app in Microsoft Entra  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Add a redirect URI  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- Add / manage client secrets  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

---

## Which Microsoft scopes does Origami currently request?

Based on the current code, Origami requests:

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

Related code:

- `src/lib/providers/outlook.ts`

You do not need to memorize every detail. The practical version is:

- `Mail.Read` / `Mail.ReadWrite` = reading mail and write-back
- `Mail.Send` = sending mail
- `offline_access` = refresh tokens

---

## One important thing first: the default env Outlook app uses `tenant=common`

The current env-backed default Outlook app uses:

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

That makes it more suitable for:

- personal Outlook / Hotmail / Live accounts
- multi-tenant cases where you do not want to hardcode a single organization tenant yet

If you want to lock everything to one specific organization tenant, a cleaner path is usually:

- finish GitHub sign-in first
- create a **DB-backed Outlook OAuth app** in `/accounts`
- set the tenant explicitly there

---

## Which configuration method should you pick first?

### Option A: env-backed default Outlook app (recommended for the first run)

Put these into `.env`:

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

### Option B: DB-backed Outlook app

If you later need:

- different tenants
- multiple apps across environments
- more detailed app management

then you can create a DB-managed Outlook app inside Origami.

### What do I recommend for the first setup?

**Start with option A.**

Because it has:

- fewer variables
- the shortest path
- the easiest debugging story

---

## Before you start, write this checklist down

### Local development

```txt
App URL
http://localhost:3000

Microsoft Redirect URI
http://localhost:3000/api/oauth/outlook

App registration name
Origami Outlook Local
```

### Production

```txt
App URL
https://mail.example.com

Microsoft Redirect URI
https://mail.example.com/api/oauth/outlook

App registration name
Origami Outlook Production
```

> Strong recommendation: use separate app registrations for local and production.

---

## If the UI does not look exactly like this page

Microsoft Entra also changes labels and menu positions. Focus on these keywords:

- `Microsoft Entra admin center`
- `App registrations`
- `New registration`
- `Authentication`
- `Certificates & secrets`
- `API permissions`
- `Delegated permissions`
- `Grant admin consent`

Sometimes even the `Entra ID` label changes slightly. As long as you are still inside the app registration area, you are usually in the right place.

---

## User click script: create the Outlook OAuth app from scratch

### Step 1: open Microsoft Entra admin center

Open:

- <https://entra.microsoft.com>

### What should you see now?

You should already be inside the Microsoft Entra admin area and usually see:

- the left sidebar
- a search bar
- tenant / directory information

If you manage multiple tenants, make sure you are currently inside the one where you want to create this app.

---

### Step 2: register the application

Click through this path:

1. **Entra ID**
2. **App registrations**
3. **New registration**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### What should I put in Name?

Use:

- local: `Origami Outlook Local`
- production: `Origami Outlook Production`

#### Which Supported account types should I choose?

This is where people usually hesitate.

##### If you want to use the env-backed default Outlook app

A broader option usually makes more sense, such as:

- **Accounts in any organizational directory and personal Microsoft accounts**

because the default env app uses `tenant=common`.

##### If you only want one company / organization tenant

You can narrow it down. But in that case, a DB-backed Outlook app inside Origami is usually the cleaner long-term choice.

### What should you see now?

After registration succeeds, you should land on the application detail page and see things like:

- Application (client) ID
- Authentication in the sidebar
- Certificates & secrets in the sidebar
- API permissions in the sidebar

---

### Step 3: add the Web Redirect URI

Now click through this path:

1. **Manage**
2. **Authentication**
3. **Add a platform**
4. choose **Web**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

### What should I put in Redirect URI?

It must match Origami exactly:

- local: `http://localhost:3000/api/oauth/outlook`
- production: `https://your-domain/api/oauth/outlook`

### The easiest mistakes here

- using the production domain while doing local development
- leaving `localhost` in a production app
- forgetting `/api/oauth/outlook`

The only correct format is:

```txt
<APP_URL>/api/oauth/outlook
```

---

### Step 4: create the Client Secret

Click through this path:

1. **Certificates & secrets**
2. **New client secret**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

Now save these two values:

- Application (client) ID
- Client secret Value

They go back into `.env` like this:

```txt
OUTLOOK_CLIENT_ID=<Application (client) ID>
OUTLOOK_CLIENT_SECRET=<Client secret Value>
```

> Important: the full client secret value is usually shown only once. Copy it immediately.

---

### Step 5: add Microsoft Graph permissions

Click through this path:

1. **API permissions**
2. **Add a permission**
3. **Microsoft Graph**
4. **Delegated permissions**

Then add the permissions Origami needs:

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

Official reference:

- <https://learn.microsoft.com/en-us/graph/permissions-reference>

### What are you really checking here?

Not “do I understand all of Microsoft Graph?”

What matters is simply this:

> the app has the delegated permissions Origami needs.

---

### Step 6: decide whether you also need Grant admin consent

This depends on your tenant policy.

Common cases:

- **personal Microsoft account / your own testing**: user consent is often enough
- **company or school tenant**: an admin may need to click **Grant admin consent**

If authorization is blocked by organization policy, come back and check this first.

---

## Now go back to `.env`: which lines should you fill?

Switch back to the `.env` file in the Origami project and fill:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### The simplest way to think about those 3 lines

- `NEXT_PUBLIC_APP_URL`: where I open Origami
- `OUTLOOK_CLIENT_ID`: the app identifier Microsoft gave me
- `OUTLOOK_CLIENT_SECRET`: the app secret Microsoft gave me

---

## After editing `.env`, verify these items immediately

Check them one by one:

- Are you looking at the correct app registration?
- Are the **Supported account types** right for your use case?
- Does **Authentication** contain the exact redirect URI `<APP_URL>/api/oauth/outlook`?
- Do `OUTLOOK_CLIENT_ID` and `OUTLOOK_CLIENT_SECRET` come from that exact app?
- Does **API permissions** include `Mail.Read`, `Mail.ReadWrite`, and `Mail.Send`?
- If you are in an organization tenant, do you also need admin consent?

If these are all correct, Outlook OAuth usually works.

---

## Next: go back to Origami and verify Outlook connection

Now run Origami:

```bash
npm run dev
```

Then:

1. finish GitHub sign-in first
2. open `/accounts`
3. choose Add Outlook account
4. the browser jumps to Microsoft sign-in / consent
5. choose the account and approve
6. Microsoft sends you back to Origami

### What should you see now?

The ideal result is:

- a new Outlook account appears in `/accounts`
- sync works
- reading works
- sending works
- write-back can work when enabled

If that whole chain works, Outlook OAuth is basically correct.

---

## Most common problems, and how to find them fast

### 1. `AADSTS50011` / redirect URI mismatch

This is the classic one. Always check these three first:

- the Web redirect URI in Entra
- `NEXT_PUBLIC_APP_URL`
- the actual callback path `/api/oauth/outlook`

All three must match exactly.

### 2. Microsoft sign-in works, but returning to Origami fails

Check:

- did you mix up local and production Client IDs?
- was the Client Secret copied incorrectly?
- did you forget `/api/oauth/outlook` in the redirect URI?

### 3. sending later reports missing permission

Make sure these permissions are present:

- `Mail.Send`
- `Mail.ReadWrite`

Origami’s send and write-back flows depend on them.

### 4. personal Microsoft accounts cannot authorize

Check **Supported account types** first.

If you want Outlook.com / Hotmail support but configured the app for a single organization only, you will run into strange problems.

### 5. users in a company tenant cannot complete consent

That is often a tenant-policy or admin-consent issue, not necessarily an Origami bug.

### 6. I only want one tenant, but the default env app feels awkward

That is not your imagination. The default env app uses `tenant=common`.

If you really want to hard-bind one organization tenant, it is usually cleaner to:

- switch to a DB-backed Outlook app
- set the tenant explicitly inside Origami

---

## What I recommend in practice

If you ask me for the safest Outlook setup, I would recommend:

1. **separate app registrations for local and production**
2. **use the env-backed default app only for the simplest path**
3. **if a specific tenant matters, prefer a DB-backed Outlook app**
4. **keep redirect URIs environment-specific**
5. **add the permissions first, then test inside Origami**

That is the least confusing path for most users.

---

## What to read next

After Outlook works, continue with:

1. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
2. [GitHub Auth detailed setup](/en/github-auth)
3. [Gmail OAuth detailed setup](/en/gmail-oauth)
