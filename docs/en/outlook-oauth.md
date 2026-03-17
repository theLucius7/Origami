# Outlook OAuth: Detailed Setup

This page explains: **how to connect Outlook / Microsoft 365 mailboxes into Origami**.

This is different from GitHub sign-in:

- **GitHub sign-in**: gets you into Origami
- **Outlook OAuth**: gives Origami access to your Outlook mailbox

If your current goal is:

> “I can already sign in to Origami. Now I want Outlook or Microsoft 365 to actually connect.”

this is the page you want.

---

## First, what do you need in the end?

If you start with the simplest environment-variable setup, you eventually need these values in `.env`:

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

You will usually also have:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

because the Microsoft OAuth redirect URI must match your Origami address.

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

---

## One important detail first: the default env Outlook app uses `tenant=common`

The current environment-variable-backed default Outlook app uses:

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

That makes it more suitable for:

- personal Outlook / Hotmail / Live accounts
- multi-tenant scenarios where you do not want to hardcode a single organization tenant

If you want to lock everything to one specific organization tenant, the cleaner path is usually:

- finish GitHub sign-in first
- create a **DB-backed Outlook OAuth app** in `/accounts`
- set the tenant explicitly there

---

## Two configuration methods

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
- more explicit app management

use a DB-managed Outlook app inside Origami.

### What do I recommend for the first setup?

**Start with option A.**

Because it has:

- the shortest path
- the fewest variables
- the easiest debugging story

---

## Official references

- Register an app in Microsoft Entra  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Add a redirect URI  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- Add / manage credentials  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

---

## Before you start, write these values down

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

> Practical advice: use separate app registrations for local and production.

---

## If the UI does not look exactly like this page

Microsoft Entra changes names and menu positions too. Focus on these keywords:

- `Microsoft Entra admin center`
- `App registrations`
- `New registration`
- `Authentication`
- `Certificates & secrets`
- `API permissions`
- `Delegated permissions`
- `Grant admin consent`

Sometimes even `Entra ID` labels vary a bit. As long as you are in the app registration area, you are usually in the right place.

---

## Baby-step guide: create an Outlook OAuth app from scratch

### Step 1: open Microsoft Entra admin center

Open:

- <https://entra.microsoft.com>

---

### Step 2: register the application

Go to:

- **Entra ID** → **App registrations** → **New registration**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### What should I use for Name?

Use an environment-specific name:

- `Origami Outlook Local`
- `Origami Outlook Production`

#### Which Supported account types should I choose?

This is one of the easiest places to hesitate.

##### If you want to use the env-backed default Outlook app

A broader choice usually makes more sense, such as:

- **Accounts in any organizational directory and personal Microsoft accounts**

That matches the default `tenant=common` behavior better.

##### If you only want one company / organization tenant

You can absolutely narrow the app down. But in that case, a DB-backed Outlook app inside Origami is usually the cleaner long-term choice.

---

### Step 3: add a Web redirect URI

After registration, go to:

- **Manage** → **Authentication**
- **Add a platform**
- choose **Web**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

### What redirect URI should I use?

It must exactly match Origami:

- local: `http://localhost:3000/api/oauth/outlook`
- production: `https://your-domain/api/oauth/outlook`

It must include `/api/oauth/outlook` exactly.

---

### Step 4: create the Client Secret

Go to:

- **Certificates & secrets**
- **New client secret**

Official docs:

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

Save these values:

- Application (client) ID → `OUTLOOK_CLIENT_ID`
- Client secret Value → `OUTLOOK_CLIENT_SECRET`

> Important: the full client secret value is usually shown only once.

---

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

### The goal on this page is simple

You do not need to learn every Graph permission.

You only need to make sure:

> this app has at least the delegated permissions that Origami needs.

---

### Step 6: do I need Grant admin consent?

That depends on your tenant policy.

Common cases:

- **personal Microsoft account / self-testing**: user consent is often enough
- **company or school tenant**: an admin may need to click **Grant admin consent**

If user consent gets blocked by organization policy, this is one of the first places to check.

---

## Step 7: put the values into `.env`

### Local

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Production

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## After configuration, verify these items in order

Check them one by one:

- Are you looking at the correct app registration?
- Are the **Supported account types** correct for your use case?
- Does **Authentication** contain the exact Web redirect URI `<APP_URL>/api/oauth/outlook`?
- Do `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` come from that exact app?
- Does **API permissions** include `Mail.Read`, `Mail.ReadWrite`, and `Mail.Send`?
- If you are in an organization tenant, do you also need admin consent?

If these items are correct, Outlook OAuth usually works.

---

## Step 8: connect Outlook inside Origami

1. run Origami
2. finish GitHub sign-in first
3. open `/accounts`
4. add an Outlook account
5. complete the Microsoft authorization flow
6. return to Origami

---

## How should you verify that it really works?

Run through this chain once:

1. click “Add Outlook account” in Origami
2. the browser jumps to Microsoft sign-in / consent
3. choose the account and approve
4. Microsoft sends you back to Origami
5. `/accounts` shows the new Outlook account
6. sync, read, send, or write-back features work normally

If this whole chain works, Outlook OAuth is basically configured correctly.

---

## Most common problems, and how to recognize them quickly

### 1. `AADSTS50011` / redirect URI mismatch

This is the classic one. Check these first:

- the Web redirect URI in Entra
- `NEXT_PUBLIC_APP_URL`
- Origami’s actual callback path `/api/oauth/outlook`

All of them must match.

### 2. Microsoft sign-in works, but returning to Origami fails

Check:

- whether local and production client IDs were mixed up
- whether the client secret was copied incorrectly
- whether the redirect URI forgot `/api/oauth/outlook`

### 3. sending later reports missing permission

Make sure these permissions are present:

- `Mail.Send`
- `Mail.ReadWrite`

Origami’s send and write-back flows rely on them.

### 4. personal Microsoft accounts cannot authorize

Usually check **Supported account types** first.

If you want Outlook.com / Hotmail support but configured the app for a single organization only, you will run into strange issues.

### 5. users in a company tenant cannot complete consent

That is often a tenant-policy or admin-consent issue, not necessarily an Origami bug.

### 6. I only want one tenant, but the default env app feels awkward

That is not your imagination. The default env app uses `tenant=common`.

If you really want to hard-bind one organization tenant, the cleaner path is usually:

- use a DB-backed Outlook app
- set the tenant explicitly inside Origami

---

## What I recommend in practice

If you ask me for the safest Outlook setup, I would recommend:

1. separate app registrations for local and production
2. use the env-backed default app only for the simplest path
3. if a specific tenant matters, prefer a DB-backed Outlook app
4. keep redirect URIs clearly environment-specific
5. add all required permissions before testing inside Origami

This is the least confusing path in the long run.

---

## What to read next

- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
