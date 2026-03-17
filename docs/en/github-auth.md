# GitHub Auth: Detailed Setup

This page explains one thing only: **how to configure sign-in for Origami itself**.

This is different from mailbox OAuth:

- **GitHub Auth**: signing in to the Origami app itself
- **Gmail / Outlook OAuth**: connecting mailbox accounts into Origami

If your goal right now is:

> “I want Origami to open, and I want GitHub sign-in to work.”

start with this page.

---

## What should you have at the end of this step?

After finishing the GitHub part, you should have these values in `.env`:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

What they mean:

- `NEXT_PUBLIC_APP_URL`: where you open Origami
- `GITHUB_CLIENT_ID`: the GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: the GitHub OAuth App Client Secret
- `GITHUB_ALLOWED_LOGIN`: restrict sign-in to one GitHub login; **strongly recommended for public deployments**
- `AUTH_SECRET`: the signing secret for the login session; if omitted, Origami falls back to `ENCRYPTION_KEY`

You can think of this step as:

> create a GitHub OAuth App that allows Origami to use GitHub sign-in, then copy the values GitHub gives you back into `.env`.

---

## Which two places will you keep switching between?

For this step, you mostly switch between **two places**:

### Place A: GitHub settings

This is where you will:

- create the OAuth App
- fill Homepage URL
- fill Authorization callback URL
- get the Client ID
- generate the Client Secret

### Place B: the `.env` file in the Origami project

This is where you will paste the values into:

```txt
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ALLOWED_LOGIN=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
```

So the simplest way to remember it is:

> **GitHub settings generate the values. `.env` receives the values.**

---

## Official reference

- GitHub Docs: Creating an OAuth app  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

---

## Before you start, write this checklist down

It helps a lot to write the exact values in a note before clicking around.

### Local development

```txt
Origami URL
http://localhost:3000

GitHub Homepage URL
http://localhost:3000

GitHub Authorization callback URL
http://localhost:3000/api/auth/github/callback

Allowed GitHub login
your-github-login
```

### Production

```txt
Origami URL
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/auth/github/callback

Allowed GitHub login
your-github-login
```

> Strong recommendation: use **one GitHub OAuth App for local** and **another one for production**.

---

## If the UI does not look exactly like this page

GitHub changes labels from time to time, but these keywords are the ones that matter:

- `Settings`
- `Developer settings`
- `OAuth Apps`
- `New OAuth App`
- `Register a new application`

If one button looks slightly different, trust the sidebar and page title more than the exact wording in this guide.

---

## Which setup pattern should you use?

### Pattern A: local development only

If you just want to test GitHub sign-in locally, use:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### Pattern B: one app for local, one app for production (recommended)

Recommended names:

1. `Origami Local`
2. `Origami Production`

This avoids:

- mixing callback URLs
- mixing secrets
- future confusion about which app belongs to which environment

### Pattern C: public single-user deployment

If your Origami instance is reachable on the public internet, also set:

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

That prevents someone else from claiming the owner binding first.

---

## User click script: create the GitHub OAuth App from scratch

Think of the next part as: **just click through it**.

### Step 1: open the GitHub OAuth App page

In GitHub, click in this order:

1. your avatar in the top-right
2. **Settings**
3. **Developer settings** in the left sidebar
4. **OAuth Apps**
5. **New OAuth App**

If this is your first time creating one, the button may say:

- **Register a new application**

That is still the same entry point.

### What should you see now?

You should be on a form page that contains fields like:

- Application name
- Homepage URL
- Application description
- Authorization callback URL

If you do not see those fields, you are not on the right page yet.

---

### Step 2: fill in the form

This is the practical version of “what exactly should I put here?”

#### 1) What should I put in Application name?

Use:

- local: `Origami Local`
- production: `Origami Production`

#### 2) What should I put in Homepage URL?

Use the real address where you open Origami:

- local: `http://localhost:3000`
- production: `https://mail.example.com`

#### 3) What should I put in Application description?

Optional. You can simply use:

```txt
Single-user inbox app login for Origami
```

#### 4) What should I put in Authorization callback URL?

This is the most important field.

- local: `http://localhost:3000/api/auth/github/callback`
- production: `https://mail.example.com/api/auth/github/callback`

### The easiest mistake here

A lot of people put the home page URL here. That is wrong.

The correct format is always:

```txt
<APP_URL>/api/auth/github/callback
```

which means you **must include `/api/auth/github/callback`**.

---

### Step 3: click the register button

Once the fields are correct, click:

- **Register application**

That takes you to the app detail page.

### What should you see now?

Usually you should see:

- the app name
- the Client ID
- a button for generating the secret

At this point, **the Client Secret is not shown yet** because you have not generated it.

---

### Step 4: generate the Client Secret

On the detail page, click:

- **Generate a new client secret**

GitHub will show a new secret.

Now immediately save these two values:

1. **Client ID**
2. **Client Secret**

They go back into `.env` like this:

```txt
GITHUB_CLIENT_ID=<Client ID>
GITHUB_CLIENT_SECRET=<Client Secret>
```

> Important: the full Client Secret is often shown only once. Copy it immediately.

---

## Now go back to `.env`: which lines should you fill?

Switch back to the `.env` file in the Origami project root and fill:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

### The simplest way to think about those 5 lines

- `NEXT_PUBLIC_APP_URL`: where I open Origami
- `GITHUB_CLIENT_ID`: the app ID GitHub gave me
- `GITHUB_CLIENT_SECRET`: the app secret GitHub gave me
- `GITHUB_ALLOWED_LOGIN`: only allow my own GitHub login
- `AUTH_SECRET`: a random value for signing the login cookie

If you do not have `AUTH_SECRET` yet, generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## After editing `.env`, verify these items immediately

Check them one by one:

- Does `NEXT_PUBLIC_APP_URL` match the real URL where you will open the site?
- Does the GitHub **Homepage URL** match it?
- Is the GitHub **Authorization callback URL** exactly `<APP_URL>/api/auth/github/callback`?
- Is `GITHUB_ALLOWED_LOGIN` a GitHub login, not an email address?
- Is `AUTH_SECRET` a random non-empty value?

If these are all correct, the GitHub part is usually stable.

---

## Next: go back to Origami and verify login

From the project directory, run:

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

### What should you see now?

You should see:

- the Origami sign-in page
- a GitHub sign-in button

After clicking GitHub sign-in, this should happen:

1. the browser jumps to GitHub authorization
2. you approve it
3. GitHub sends you back to Origami
4. first-time setup enters `/setup`
5. after setup, you land on the home page or `/accounts`

---

## What does first-owner binding actually mean?

On the first successful login, Origami does this:

1. checks whether an owner is already bound
2. if not, writes the current GitHub user into `app_installation`
3. sends you to `/setup`
4. after that, future sign-ins are checked against that owner account

### One very important detail

Later checks are based on:

- **GitHub user id**

not just the login text.

That means:

- changing your GitHub login usually does **not** lock you out
- switching to a completely different GitHub account does

---

## Most common problems, and how to find them fast

### 1. callback error right after clicking GitHub sign-in

Check these four things first:

- is `NEXT_PUBLIC_APP_URL` correct?
- is the GitHub **Homepage URL** correct?
- is the **Authorization callback URL** exactly `/api/auth/github/callback`?
- did you accidentally use local credentials in production or the other way around?

### 2. the login page opens, but I still cannot get in

Look at:

```txt
GITHUB_ALLOWED_LOGIN=
```

If you set it, only that GitHub login can pass. That is usually not a bug; it is the intended security restriction.

### 3. I am the owner, but I still cannot sign in

Make sure you are using the **same GitHub account that originally claimed the installation**.

### 4. I bound the wrong owner the first time

Usually you need to clear the `app_installation` record and initialize the app again.

If you are unsure, back up the database first.

### 5. everything looks correct, but it still fails

Write these three lines down and compare them character by character:

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

The only correct callback is:

```txt
<APP_URL>/api/auth/github/callback
```

A lot of the time, the issue is not logic. It is just one missing path segment.

---

## What I recommend in practice

If you ask me for the safest setup, I would recommend:

1. **one GitHub OAuth App for local**
2. **one GitHub OAuth App for production**
3. **always set `GITHUB_ALLOWED_LOGIN` for public deployments**
4. **set `AUTH_SECRET` explicitly instead of reusing `ENCRYPTION_KEY` long-term for session signing**

That is the simplest setup with the least confusion later.

---

## What to read next

After GitHub sign-in works, continue with:

1. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
2. [Gmail OAuth detailed setup](/en/gmail-oauth)
3. [Outlook OAuth detailed setup](/en/outlook-oauth)
