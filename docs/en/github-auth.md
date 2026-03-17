# GitHub Auth: Detailed Setup

This page explains one thing only: **how to configure sign-in for Origami itself**.

This is different from mailbox OAuth:

- **GitHub Auth**: signing in to the Origami app itself
- **Gmail / Outlook OAuth**: connecting mailbox accounts into Origami

If your immediate goal is:

> “I just want Origami to open and let me sign in successfully.”

start with this page.

---

## First, what do you need in the end?

You will eventually put these values into `.env`:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

What they mean:

- `NEXT_PUBLIC_APP_URL`: the address where you open Origami
- `GITHUB_CLIENT_ID`: the GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: the GitHub OAuth App Client Secret
- `GITHUB_ALLOWED_LOGIN`: restrict login to one GitHub account; **strongly recommended for public deployments**
- `AUTH_SECRET`: the signing secret for the login session; if omitted, Origami falls back to `ENCRYPTION_KEY`

A minimal local example looks like this:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

---

## Official reference

- GitHub Docs: Creating an OAuth app  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

---

## The plain-English mental model

A GitHub OAuth App is basically how you tell GitHub:

> “When someone clicks Sign in on my Origami site, send the login result back to this callback URL.”

For Origami, the most important field is:

```txt
Authorization callback URL = <your app URL>/api/auth/github/callback
```

Examples:

- Local: `http://localhost:3000/api/auth/github/callback`
- Production: `https://mail.example.com/api/auth/github/callback`

If this field is wrong, you will usually get stuck on “login returns with an error” or “callback failed”.

---

## Before you start, write these values down

It helps a lot to write the exact values in a note first so you do not keep flipping between screens and copying the wrong thing.

### Local development

```txt
App URL
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
App URL
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/auth/github/callback

Allowed GitHub login
your-github-login
```

> Practical advice: use **one OAuth App for local** and **another one for production**.

---

## If the UI does not look exactly like this page

GitHub changes button labels and layouts from time to time, but these keywords are the ones that matter:

- `Settings`
- `Developer settings`
- `OAuth Apps`
- `New OAuth App` or `Register a new application`

If one button label looks slightly different, trust the page title and sidebar location more than the exact wording in this guide.

---

## Which setup pattern should you choose?

### Pattern A: local development only

If you just want the simplest local setup:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

In the GitHub OAuth App, use:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`

### Pattern B: one OAuth App for local, one for production (recommended)

Recommended app names:

1. `Origami Local`
2. `Origami Production`

This avoids:

- constantly changing callback URLs
- mixing production secrets into local env files
- later confusion about which client ID belongs to which environment

### Pattern C: public single-user deployment (best practice)

Also set:

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

This prevents somebody else from claiming the installation owner first.

---

## Baby-step guide: create a GitHub OAuth App from scratch

### Step 1: open the GitHub OAuth Apps page

Click through:

1. your GitHub avatar in the top-right
2. **Settings**
3. **Developer settings** in the left sidebar
4. **OAuth Apps**
5. **New OAuth App**

If you have never created one before, the button may say:

- **Register a new application**

That is the same entry point.

---

### Step 2: fill in the form

You will see several fields. Fill them like this.

#### 1) Application name

Use an environment-specific name:

- `Origami Local`
- `Origami Production`

#### 2) Homepage URL

Use the URL where you normally open Origami:

- local: `http://localhost:3000`
- production: `https://mail.example.com`

#### 3) Application description

Optional. You can simply write:

```txt
Single-user inbox app login for Origami
```

#### 4) Authorization callback URL

This is the most important field and it must be exact:

- local: `http://localhost:3000/api/auth/github/callback`
- production: `https://mail.example.com/api/auth/github/callback`

**Do not forget `/api/auth/github/callback`.**

If you only put the home page URL here, login will usually fail.

---

### Step 3: register the application

Click:

- **Register application**

After that, you will immediately see:

- Client ID

The secret still has to be generated separately.

---

### Step 4: generate the Client Secret

On the app detail page, click:

- **Generate a new client secret**

Now save these two values:

- Client ID → `GITHUB_CLIENT_ID`
- Client Secret → `GITHUB_CLIENT_SECRET`

> Important: the full Client Secret is often shown only once.

---

## Step 5: put the values into `.env`

Local example:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

If you do not have `AUTH_SECRET` yet, generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### At this point, verify these five things carefully

- Is `NEXT_PUBLIC_APP_URL` the real URL where you open the site?
- Does the GitHub OAuth App **Homepage URL** match it?
- Is the GitHub OAuth App **Authorization callback URL** exactly `<APP_URL>/api/auth/github/callback`?
- Is `GITHUB_ALLOWED_LOGIN` your GitHub login, not your email address?
- Did you set `AUTH_SECRET` to a random value?

---

## Step 6: run Origami

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

You should see the GitHub sign-in button.

---

## Step 7: what happens during first-owner binding?

On the first successful login, Origami does this:

1. checks whether the installation already has an owner
2. if not, stores the current GitHub user in `app_installation`
3. sends you to `/setup`
4. after setup, future sign-ins are checked against that owner account

### One very important detail

After the first binding, Origami checks the stored:

- **GitHub user id**

not just the login text.

That means:

- changing your GitHub login usually does **not** lock you out
- using a completely different GitHub account does

---

## How should you verify that it really works?

Run through this shortest possible path:

1. open the Origami sign-in page
2. click GitHub sign-in
3. the browser jumps to GitHub authorization
4. approve the authorization
5. GitHub sends you back to Origami
6. first-time setup goes to `/setup`
7. after setup you can open the home page or `/accounts`

If this whole chain works, GitHub Auth is basically configured correctly.

---

## Most common problems, and how to recognize them quickly

### 1. callback error right after clicking sign-in

Check these first:

- is `NEXT_PUBLIC_APP_URL` correct?
- does the GitHub OAuth App **Homepage URL** match the current environment?
- is the **Authorization callback URL** exactly `/api/auth/github/callback`?
- did you accidentally use local credentials in production, or the other way around?

### 2. the login page opens, but I still cannot get in

Look at `GITHUB_ALLOWED_LOGIN`:

- if you set it, only that GitHub login can pass
- this is usually not a bug; it is the intended security restriction

### 3. I am the owner, but I still cannot sign in

Make sure you are using the same GitHub account that claimed the installation during first setup.

### 4. I bound the wrong owner during first setup

Usually you need to clear the `app_installation` record and initialize the app again.

If you are not sure, back up the database first.

### 5. the callback values look close enough, but it still fails

Write these three lines down and compare them character by character:

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

The callback must be exactly:

```txt
<APP_URL>/api/auth/github/callback
```

A lot of the time, the logic is fine and the problem is just one missing path segment.

---

## What I recommend in practice

If you ask me for the safest setup, I would recommend:

1. one GitHub OAuth App for local
2. one GitHub OAuth App for production
3. always set `GITHUB_ALLOWED_LOGIN` for public deployments
4. set `AUTH_SECRET` explicitly instead of reusing `ENCRYPTION_KEY` for session signing long-term

That is the lowest-friction and easiest-to-debug setup.

---

## What to read next

After GitHub sign-in works, continue with:

- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)
