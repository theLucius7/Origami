# Outlook OAuth: Detailed Setup

This page explains: **how to connect Outlook / Microsoft 365 accounts into Origami**.

This is separate from GitHub sign-in.  
GitHub sign-in gets you into Origami; Outlook OAuth gives Origami permission to access the Outlook mailbox.

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

## One important detail first: the default env Outlook app uses `tenant=common`

The environment-variable-backed default Outlook app currently uses:

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

That makes it more suitable for:

- personal Outlook / Hotmail / Live accounts
- multi-tenant scenarios where you do not want to hardcode one single tenant yet

If you only want one specific organizational tenant, the cleaner path is usually:

- finish GitHub sign-in first
- create a **DB-backed Outlook OAuth app** in `/accounts`
- set the tenant explicitly there

## Two ways to configure Outlook OAuth

### Option A: env-backed default Outlook app (recommended first)

Put these into `.env`:

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

### Option B: DB-backed Outlook app

If later you need:

- different tenants
- multiple apps across environments
- more explicit app management

then use a DB-managed Outlook app inside Origami.

## Official references

- Register an app in Microsoft Entra  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Add a redirect URI  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- Add / manage credentials  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

## Baby-step guide: create an Outlook OAuth app from scratch

### Step 1: open Microsoft Entra admin center

Open:

- <https://entra.microsoft.com>

### Step 2: register the application

Go to:

- **Entra ID** → **App registrations** → **New registration**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### What should I use for Name?

Use something environment-specific:

- `Origami Outlook Local`
- `Origami Outlook Production`

#### Which Supported account types should I choose?

This is one of the most confusing parts.

##### If you want to use the default env-backed Outlook app

A broader option usually makes more sense, for example:

- **Accounts in any organizational directory and personal Microsoft accounts**

That lines up better with the default `tenant=common` behavior.

##### If you only want one company / organization tenant

You can absolutely narrow the app down.  
But in that case, a DB-backed Outlook app inside Origami is usually the cleaner long-term choice.

### Step 3: add a Web redirect URI

After registration, go to:

- **Manage** → **Authentication**
- **Add a platform**
- choose **Web**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

#### What redirect URI should I use?

- local: `http://localhost:3000/api/oauth/outlook`
- production: `https://your-domain/api/oauth/outlook`

It must be exact, including `/api/oauth/outlook`.

### Step 4: create the client secret

Go to:

- **Certificates & secrets**
- **New client secret**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

Save these values:

- Application (client) ID → `OUTLOOK_CLIENT_ID`
- Client secret Value → `OUTLOOK_CLIENT_SECRET`

> Important: the client secret value is usually shown only once.

### Step 5: add Microsoft Graph permissions

Go to:

- **API permissions**
- **Add a permission**
- **Microsoft Graph**
- **Delegated permissions**

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

### Step 6: do I need Grant admin consent?

That depends on your tenant policy.

Common cases:

- **personal Microsoft account / self-testing**: user consent is often enough
- **company or school tenant**: you may also need an admin to click **Grant admin consent**

If users get blocked by tenant policy, this is often where you need to look.

### Step 7: put the values into `.env`

Local:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Production:

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 8: connect Outlook inside Origami

1. run Origami
2. finish GitHub sign-in first
3. open `/accounts`
4. add an Outlook account
5. complete the Microsoft consent flow
6. return to Origami

## Common problems

### 1. `AADSTS50011` / redirect URI mismatch

This is the classic one. Check first:

- the Web redirect URI in Entra
- `NEXT_PUBLIC_APP_URL`
- Origami’s actual callback path `/api/oauth/outlook`

All of them must match.

### 2. Microsoft sign-in works, but returning to Origami fails

Check:

- whether local and production client ids were mixed up
- whether the client secret was copied incorrectly
- whether the redirect URI forgot `/api/oauth/outlook`

### 3. sending later reports missing permission

Make sure these permissions are present:

- `Mail.Send`
- `Mail.ReadWrite`

Origami’s send and write-back flows rely on them.

### 4. personal Microsoft accounts cannot authorize

Usually check your **Supported account types** first.  
If you want Outlook.com / Hotmail support but configured the app for a single organization only, you will likely run into strange issues.

### 5. users in a company tenant cannot complete consent

That is often a tenant-policy or admin-consent issue, not necessarily an Origami bug.

## What I recommend in practice

If you want the safest Outlook setup:

1. separate app registrations for local and production
2. use the env-backed default app only for the simplest path
3. if a specific tenant matters, prefer a DB-backed Outlook app
4. keep redirect URIs clearly environment-specific
5. add all required permissions before testing inside Origami

## What to read next

- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
