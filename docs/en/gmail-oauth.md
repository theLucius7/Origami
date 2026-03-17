# Gmail OAuth: Detailed Setup

This page explains: **how to connect a Gmail account into Origami**.

This is not GitHub sign-in:

- **GitHub sign-in**: lets you enter the Origami app
- **Gmail OAuth**: lets Origami access your Gmail mailbox

If your current goal is:

> “I can already sign in to Origami. Now I want Gmail to actually connect.”

this is the page you want.

---

## First, what do you need in the end?

If you start with the simplest environment-variable setup, you eventually need these values in `.env`:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

You will usually also have:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

because the Google OAuth redirect URI must match your Origami address.

---

## Which Gmail scopes does Origami currently request?

Based on the current code, Origami mainly requests:

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

Related code:

- `src/lib/providers/gmail.ts`

Official scope reference:

- <https://developers.google.com/workspace/gmail/api/auth/scopes>

---

## Two configuration methods: know which one you want first

### Option A: env-backed default Gmail app (recommended for the first run)

Put these into `.env`:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

Then Origami uses that app as the default Gmail OAuth app.

### Option B: DB-backed Gmail app

If you do not want Gmail OAuth credentials in environment variables, you can first sign in to Origami with GitHub and then create a database-managed OAuth app in `/accounts`.

### What do I recommend for the first setup?

**Start with option A.**

Because it has:

- the fewest moving parts
- the shortest flow
- the easiest debugging path

Once Gmail works, you can move to DB-managed apps later if you want.

---

## Official references

- Enable Google Workspace APIs  
  <https://developers.google.com/workspace/guides/enable-apis>
- Configure OAuth consent screen  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- Create access credentials  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail API Node.js quickstart  
  <https://developers.google.com/workspace/gmail/api/quickstart/nodejs>
- Gmail API scopes  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

---

## Before you start, write these values down

### Local development

```txt
App URL
http://localhost:3000

Google OAuth Redirect URI
http://localhost:3000/api/oauth/gmail

Project name
Origami Gmail Local

App name on consent screen
Origami Gmail Local
```

### Production

```txt
App URL
https://mail.example.com

Google OAuth Redirect URI
https://mail.example.com/api/oauth/gmail

Project name
Origami Gmail Production

App name on consent screen
Origami Gmail Production
```

> Practical advice: use **one Google Cloud project for local** and **another one for production**.

---

## If the UI does not look exactly like this page

Google Cloud Console changes more often than almost any other admin UI. Focus on these keywords:

- `Google Cloud Console`
- `APIs & Services`
- `Gmail API`
- `Google Auth platform`
- `Branding`
- `Audience`
- `Data Access`
- `OAuth client ID`
- `Web application`

If your screen looks different from this guide, it does not automatically mean you are in the wrong place. Quite often it just means Google changed the UI again.

---

## Baby-step guide: create a Gmail OAuth app from scratch

### Step 1: open Google Cloud Console

Open:

- <https://console.cloud.google.com/>

---

### Step 2: create or choose a Google Cloud project

If you do not already have one:

1. click the project selector at the top
2. click **New Project**
3. choose a clear name such as:
   - `Origami Gmail Local`
   - `Origami Gmail Production`
4. create it and switch into that project

> Recommended: use separate projects for local and production.

---

### Step 3: enable the Gmail API

Console path:

- **APIs & Services** → **Library**

Then search for:

- `Gmail API`

Open it and click:

- **Enable**

Official docs:

- <https://developers.google.com/workspace/guides/enable-apis>

### At this point, only one thing matters

In this project, **Gmail API must already be Enabled**.

---

### Step 4: configure the OAuth consent screen

This step is essential. Without it, Google OAuth usually will not work correctly.

In Google’s newer UI, the common path is something like:

- **Google Auth platform** → **Branding**
- **Audience**
- **Data Access**

Official docs:

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

### 4.1 What should I put in Branding?

Recommended values:

- **App name**: `Origami Gmail Local` / `Origami Gmail Production`
- **User support email**: your email
- **Developer contact email**: your email

These mostly help you recognize which app you are authorizing later.

### 4.2 Which Audience should I choose?

#### Case 1: personal self-hosted use / testing

This is the most common case:

- choose **External**
- add your own Google account under **Test users**

That is usually the best fit for a self-hosted personal tool.

#### Case 2: only inside your own Google Workspace organization

Then you can consider:

- **Internal**

but only if that is really your situation.

### 4.3 How should I think about Data Access / Scopes?

The goal is not to enable every Google API in the world.

The goal is simply to make sure your OAuth app can request the scopes Origami actually needs:

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

---

### Step 5: create an OAuth Client ID

Official docs:

- <https://developers.google.com/workspace/guides/create-credentials>

Create:

- **OAuth client ID**
- application type = **Web application**

> Do not choose Desktop app. Origami is a server-side web app.

### What redirect URI should I use?

It must exactly match Origami:

- local: `http://localhost:3000/api/oauth/gmail`
- production: `https://your-domain/api/oauth/gmail`

This is one of the easiest places to make a mistake.

If you are doing local development now, do not leave the production domain here. If you are doing production now, do not leave `localhost` here.

After creation, copy:

- Client ID → `GMAIL_CLIENT_ID`
- Client Secret → `GMAIL_CLIENT_SECRET`

---

## `.env` examples

### Local

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### Production

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

---

## After configuration, verify these items in order

Check them one by one:

- Are you in the correct Google Cloud project?
- Is **Gmail API** already **Enabled**?
- Is the consent screen configured?
- If you are doing personal self-hosting, did you choose **External**?
- Is your Google account listed under **Test users**?
- Is the OAuth client type **Web application**?
- Is the redirect URI exactly `<APP_URL>/api/oauth/gmail`?
- Do `.env` values `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` come from that exact client?

If these eight items are correct, Gmail OAuth is usually fine.

---

## Step 6: connect Gmail inside Origami

1. run Origami
2. finish GitHub sign-in first
3. open `/accounts`
4. choose Add Gmail account
5. if the default env app is configured, Origami will use it directly
6. complete the Google authorization flow
7. return to Origami

---

## What matters most about Google verification?

A lot of people get intimidated here, but for single-user self-hosted use it is often much simpler than it looks.

### If you only use it yourself for testing

A common and very normal pattern is:

- keep the app in testing mode
- set Audience to **External**
- add your own Google account as a **Test user**

That is usually enough for self-use.

### If you want to publish it for many outside users

Then you need to read Google’s requirements around sensitive and restricted scopes much more carefully. Origami requests `gmail.modify`, which is a higher-privilege scope.

For a self-hosted single-user tool, my advice is very simple:

> start with your own project, your own account, and yourself listed as a test user.

---

## How should you verify that it really works?

Run through this chain once:

1. click “Add Gmail account” in Origami
2. the browser jumps to Google authorization
3. you can see the app name you configured
4. choose your account and approve
5. Google sends you back to Origami
6. `/accounts` shows the new Gmail account
7. sync, read, send, or write-back features work normally

If that whole chain works, Gmail OAuth is basically configured correctly.

---

## Most common problems, and how to recognize them quickly

### 1. `redirect_uri_mismatch`

Always check these three first:

- the redirect URI in your Google OAuth client
- `NEXT_PUBLIC_APP_URL`
- the actual callback path `/api/oauth/gmail`

All three must line up.

### 2. the consent page opens, but authorization does not return correctly

This is usually still a redirect URI problem, or a local-vs-production client mix-up.

### 3. you see “app not verified” or testing restrictions

Check:

- whether the app is **External**
- whether the Google account you are using is listed in **Test users**

### 4. authorization succeeded, but sending later says permission is missing

Check the scopes:

- `gmail.send`
- `gmail.modify`

Origami’s send flow and parts of write-back depend on those scopes.

### 5. I enabled the API, but it still does not work

Recheck these often-missed parts:

- are you looking at the correct project?
- is the consent screen actually complete?
- is the OAuth client type really **Web application**?

A lot of the time, the problem is not “Gmail API is disabled”; it is the OAuth app layer still being incomplete.

---

## What I recommend in practice

If you ask me for the safest Gmail setup, I would recommend:

1. separate Google Cloud projects for local and production
2. one Web OAuth client per environment
3. keep redirect URIs clearly environment-specific
4. for personal use, use **External + Test users**
5. start with the env-backed default app before moving to DB-managed apps

This is the lowest-friction path and the easiest to debug.

---

## What to read next

- [Outlook OAuth detailed setup](/en/outlook-oauth)
- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
