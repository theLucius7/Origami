# Gmail OAuth: Detailed Setup

This page explains: **how to connect a Gmail account into Origami**.

This is not GitHub sign-in:

- **GitHub sign-in**: lets you enter the Origami app
- **Gmail OAuth**: lets Origami access your Gmail mailbox

If your goal right now is:

> “I can already sign in to Origami. Now I want Gmail to actually connect.”

this is the page you want.

---

## What should you have at the end of this step?

If you start with the simplest environment-variable setup, you should end up with these values in `.env`:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

And you must also make sure:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

is correct, because the Google OAuth redirect URI depends on it.

You can think of this step as:

> create a Web OAuth app in Google Cloud Console so Origami can launch the Gmail authorization flow, then copy the Client ID and Client Secret back into `.env`.

---

## Which two places will you keep switching between?

For this step, you mainly switch between **two places**:

### Place A: Google Cloud Console

This is where you will:

- create or choose the project
- enable the Gmail API
- configure the OAuth consent screen
- create the OAuth client ID
- copy the Client ID and Client Secret

### Place B: the `.env` file in the Origami project

This is where you will fill:

```txt
NEXT_PUBLIC_APP_URL=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```

The simplest way to remember it is:

> **Google Cloud Console generates the Gmail OAuth values. `.env` receives them.**

---

## Official reference

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

## Which Gmail scopes does Origami currently request?

Based on the current code, Origami mainly requests:

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

Related code:

- `src/lib/providers/gmail.ts`

You do not need to memorize every scope detail. The useful practical version is:

- `gmail.modify` = reading / changing mail state
- `gmail.send` = sending mail
- `userinfo.email` = identifying the current Google account

---

## Which configuration method should you pick first?

### Option A: env-backed default Gmail app (recommended for the first run)

Put these into `.env`:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

Then Origami uses that app as the default Gmail OAuth app.

### Option B: DB-backed Gmail app

If you do not want Gmail OAuth credentials in environment variables, you can first sign in to Origami and then create a DB-managed OAuth app in `/accounts`.

### What do I recommend for the first setup?

**Start with option A.**

Because it has:

- fewer variables
- a shorter path
- easier debugging

---

## Before you start, write this checklist down

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

> Strong recommendation: use one Google Cloud project for local and another one for production.

---

## If the UI does not look exactly like this page

Google Cloud Console changes its UI frequently. Focus on these keywords:

- `Google Cloud Console`
- `APIs & Services`
- `Gmail API`
- `Google Auth platform`
- `Branding`
- `Audience`
- `Data Access`
- `OAuth client ID`
- `Web application`

If your screen looks different from the guide, that does not automatically mean you are in the wrong place. Often it just means Google changed the UI again.

---

## User click script: create the Gmail OAuth app from scratch

### Step 1: open Google Cloud Console

Open:

- <https://console.cloud.google.com/>

### What should you see now?

You should already be inside Google Cloud Console and usually see:

- the project selector at the top
- the top-left menu
- the search bar

If you already have multiple Google Cloud projects, first make sure you are looking at the one you want to use for Gmail.

---

### Step 2: create or switch to a dedicated project

If you do not already have a project, click in this order:

1. the project selector at the top
2. **New Project**
3. enter the project name
4. create it and switch into it

Recommended project names:

- local: `Origami Gmail Local`
- production: `Origami Gmail Production`

### What should you see now?

After switching successfully, the project name at the top should now be the one you just created.

If the old project name is still shown, you have not switched yet.

---

### Step 3: enable the Gmail API

In the console, click through this path:

1. **APIs & Services**
2. **Library**
3. search for `Gmail API`
4. open it
5. click **Enable**

Official docs:

- <https://developers.google.com/workspace/guides/enable-apis>

### What should you see now?

After enabling it, you should usually see:

- the `Gmail API` page
- a state that shows it is already enabled, not still waiting to be enabled

If the page still looks like “not enabled yet”, this step is not finished.

---

### Step 4: configure the OAuth consent screen

This step is critical. Without it, Google OAuth usually will not work correctly.

A common path is:

1. **Google Auth platform**
2. **Branding**
3. **Audience**
4. **Data Access**

Official docs:

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

#### 4.1 What should I fill in Branding?

Use something like:

- **App name**: `Origami Gmail Local` / `Origami Gmail Production`
- **User support email**: your email
- **Developer contact email**: your email

The practical reason is simple: later, on the authorization screen, you can recognize your own app immediately.

#### 4.2 Which Audience should I choose?

##### If this is just personal self-hosting / testing

Choose:

- **External**

Then add your own Google account under:

- **Test users**

##### If you only use it inside your own Google Workspace organization

Then you can consider:

- **Internal**

but only if that is really your situation.

#### 4.3 How should I think about Data Access / Scopes?

The goal is not to learn every Google API.

The goal is simply to make sure this app can request the Gmail scopes Origami actually needs:

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

---

### Step 5: create the OAuth Client ID

Now click through the credentials flow:

1. find the create credentials entry point
2. choose **OAuth client ID**
3. choose **Web application** as the application type

Official docs:

- <https://developers.google.com/workspace/guides/create-credentials>

> Do not choose Desktop app. Origami is a server-side web app.

### What should I put in Redirect URI?

It must exactly match Origami:

- local: `http://localhost:3000/api/oauth/gmail`
- production: `https://your-domain/api/oauth/gmail`

### The easiest mistakes here

- using the production domain while doing local development
- leaving `localhost` in a production app
- forgetting `/api/oauth/gmail`

The only correct format is:

```txt
<APP_URL>/api/oauth/gmail
```

### What should you see now?

After creation, Google will show you:

- the Client ID
- the Client Secret

Copy them immediately.

---

## Now go back to `.env`: which lines should you fill?

Switch back to the `.env` file in the Origami project and fill:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### The simplest way to think about those 3 lines

- `NEXT_PUBLIC_APP_URL`: where I open Origami
- `GMAIL_CLIENT_ID`: the public app identifier Google gave me
- `GMAIL_CLIENT_SECRET`: the app secret Google gave me

---

## After editing `.env`, verify these items immediately

Check them one by one:

- Are you in the correct Google Cloud project?
- Is `Gmail API` already **Enabled**?
- Is the consent screen configured?
- If this is personal use, did you choose **External**?
- Is your Google account listed under **Test users**?
- Is the OAuth client type really **Web application**?
- Is the redirect URI exactly `<APP_URL>/api/oauth/gmail`?
- Do `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` come from that exact client?

If these are all correct, Gmail OAuth is usually in good shape.

---

## Next: go back to Origami and verify Gmail connection

Now run Origami:

```bash
npm run dev
```

Then:

1. finish GitHub sign-in first
2. open `/accounts`
3. choose Add Gmail account
4. the browser jumps to Google authorization
5. you should see the app name you configured
6. choose your Google account and approve
7. Google sends you back to Origami

### What should you see now?

The ideal result is:

- a new Gmail account appears in `/accounts`
- sync works
- reading works
- sending works
- write-back can work when enabled

If that whole chain works, Gmail OAuth is basically correct.

---

## What matters most about Google verification?

A lot of people get intimidated here, but for single-user self-hosted use it is usually simpler than it looks.

### If you only use it yourself for testing

Usually this is enough:

- keep the app in testing mode
- set Audience to **External**
- add your own Google account to **Test users**

### If you want to publish it for many outside users

Then you need to read Google’s rules around sensitive and restricted scopes much more carefully. Origami requests `gmail.modify`, which raises the review burden a lot.

So for a self-hosted project like Origami, my practical advice is:

> first get it working with your own project, your own account, and yourself as the test user.

---

## Most common problems, and how to find them fast

### 1. `redirect_uri_mismatch`

Always check these three first:

- the redirect URI in the Google OAuth client
- `NEXT_PUBLIC_APP_URL`
- the actual callback path `/api/oauth/gmail`

All three must match exactly.

### 2. the consent page opens, but authorization does not return correctly

That is usually still a redirect URI problem, or you used the wrong client for local vs production.

### 3. you see “app not verified” or testing restrictions

Check:

- is the app **External**?
- is the Google account you are using listed in **Test users**?

### 4. authorization succeeded, but sending later says permission is missing

Check the scopes:

- `gmail.send`
- `gmail.modify`

Origami’s send flow and part of its write-back logic depend on those.

### 5. the API is enabled, but it still does not work

Go back and recheck these three:

- are you in the correct project?
- is the consent screen actually complete?
- is the OAuth client type really **Web application**?

Very often, the problem is not the Gmail API itself. It is an incomplete OAuth app setup.

---

## What I recommend in practice

If you ask me for the safest Gmail setup, I would recommend:

1. **separate Google Cloud projects for local and production**
2. **one Web OAuth client per environment**
3. **keep redirect URIs environment-specific**
4. **for personal use, choose External + Test users**
5. **for the first run, use the env-backed default app**

That is the least confusing path for most users.

---

## What to read next

After Gmail works, continue with:

1. [Outlook OAuth detailed setup](/en/outlook-oauth)
2. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
