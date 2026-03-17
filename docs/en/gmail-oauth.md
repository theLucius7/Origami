# Gmail OAuth: Detailed Setup

This page explains: **how to connect Gmail accounts into Origami**.

This is not GitHub sign-in.  
GitHub sign-in gets you into the Origami app; Gmail OAuth gives Origami permission to access a Gmail mailbox.

## Which Gmail scopes does Origami currently request?

Based on the current code, Origami mainly requests:

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

Related code:

- `src/lib/providers/gmail.ts`

Official scope reference:

- <https://developers.google.com/workspace/gmail/api/auth/scopes>

## Two ways to configure Gmail OAuth

### Option A: env-backed default Gmail app (recommended first)

Put these into `.env`:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

Then all Gmail authorization in Origami can use that default app.

### Option B: DB-backed Gmail app

If you do not want Gmail OAuth credentials in environment variables, you can first sign in to Origami with GitHub and then create a database-managed OAuth app inside `/accounts`.

**For the first deployment, start with option A.**  
It is the easiest to debug.

## Official references

- Enable Google Workspace APIs  
  <https://developers.google.com/workspace/guides/enable-apis>
- Configure OAuth consent  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- Create access credentials  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail API Node.js quickstart  
  <https://developers.google.com/workspace/gmail/api/quickstart/nodejs>
- Gmail API scopes  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

## Baby-step guide: create a Gmail OAuth app from scratch

### Step 1: open Google Cloud Console

Open:

- <https://console.cloud.google.com/>

### Step 2: create or choose a Google Cloud project

If you do not have one yet:

1. click the project selector at the top
2. click **New Project**
3. create a name such as:
   - `Origami Gmail Local`
   - `Origami Gmail Production`
4. switch into that project

> Recommended: use separate Google Cloud projects for local and production.

### Step 3: enable the Gmail API

Console path:

- **APIs & Services** → **Library**

Search for:

- `Gmail API`

Then click:

- **Enable**

Official docs:

- <https://developers.google.com/workspace/guides/enable-apis>

### Step 4: configure the OAuth consent screen

This is essential. Without it, Google OAuth will not work correctly.

In Google’s newer UI, you will usually see:

- **Google Auth platform** → **Branding**
- **Audience**
- **Data Access**

Official docs:

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

#### Which Audience should I choose?

##### Case 1: personal self-hosted use / testing

Most common setup:

- choose **External**
- add your own Google account under **Test users**

This is usually the best fit for a self-hosted personal tool.

##### Case 2: only inside your own Google Workspace organization

If you truly use it only inside one Workspace organization, you can consider:

- **Internal**

But this only makes sense if you actually have that organization context.

#### What should I put into the consent screen?

Suggested values:

- **App name**: `Origami Gmail Local` / `Origami Gmail Production`
- **User support email**: your email
- **Developer contact email**: your email
- **Scopes / Data Access**: add the Gmail scopes Origami needs

### Step 5: create an OAuth Client ID

Official docs:

- <https://developers.google.com/workspace/guides/create-credentials>

Create:

- **OAuth client ID**
- choose **Web application** as the application type

> Do not choose Desktop app. Origami is a server-side web app.

#### What redirect URI should I use?

It must exactly match Origami:

- local: `http://localhost:3000/api/oauth/gmail`
- production: `https://your-domain/api/oauth/gmail`

This is one of the easiest places to make a mistake.

After creation, copy:

- Client ID → `GMAIL_CLIENT_ID`
- Client Secret → `GMAIL_CLIENT_SECRET`

## `.env` examples

Local:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

Production:

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

## Step 6: connect Gmail inside Origami

1. run Origami
2. finish GitHub sign-in first
3. open `/accounts`
4. choose Add Gmail account
5. if you configured the default env app, Origami will use that app directly
6. complete the Google consent flow
7. return to Origami

## What matters most about Google verification?

Many people get intimidated here, but personal self-hosted use is often simpler than it looks.

### If you only use it yourself for testing

A common pattern is:

- keep the app in testing mode
- set Audience to External
- add your own Google account as a test user

That is usually enough for self-use.

### If you want to publish it for many outside users

Then you need to read Google’s requirements around sensitive and restricted scopes much more carefully.  
Origami requests `gmail.modify`, which is a higher-privilege scope.

For a self-hosted single-user tool, the natural path is usually:

- your own project
- your own Google account
- your own account listed as a test user

## Common problems

### 1. `redirect_uri_mismatch`

Almost always check this first:

- the redirect URI in Google OAuth Client
- `NEXT_PUBLIC_APP_URL`
- the actual callback path `/api/oauth/gmail`

All three must line up.

### 2. the consent page opens, but authorization does not return correctly

Usually still a redirect URI problem, or you used the local client id in production, or the reverse.

### 3. you see “app not verified” or testing restrictions

Check:

- whether the app is External
- whether the Google account you are using is included in Test users

### 4. authorization succeeded, but sending later says permission is missing

Check that the granted scopes include:

- `gmail.send`
- `gmail.modify`

Origami’s sending and parts of write-back depend on those scopes.

## What I recommend in practice

If you want the safest Gmail setup:

1. separate Google Cloud projects for local and production
2. one Web OAuth client per environment
3. keep redirect URIs environment-specific
4. for personal use, use External + Test users
5. start with the env-backed default app before moving to DB-managed apps

## What to read next

- [Outlook OAuth detailed setup](/en/outlook-oauth)
- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
