# GitHub Auth: Detailed Setup

This page explains one thing only: **how to configure sign-in for Origami itself**.

This is separate from mailbox OAuth:

- **GitHub Auth** = signing in to the Origami app
- **Gmail / Outlook OAuth** = connecting mailbox accounts into Origami

If you only want to get Origami open and usable first, do this page before anything else.

## Environment variables you will eventually set

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

What they mean:

- `NEXT_PUBLIC_APP_URL`: the URL where you open Origami
- `GITHUB_CLIENT_ID`: the GitHub OAuth App client id
- `GITHUB_CLIENT_SECRET`: the GitHub OAuth App client secret
- `GITHUB_ALLOWED_LOGIN`: restrict sign-in to one GitHub login; **strongly recommended for public deployments**
- `AUTH_SECRET`: signing key for the session cookie; falls back to `ENCRYPTION_KEY` if omitted

## Official reference

- GitHub Docs: Creating an OAuth app  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## The simplest mental model

Think of the GitHub OAuth App as telling GitHub:

> “When a user clicks Sign in on my Origami site, send the result back to this exact callback URL.”

For Origami, the most important value is:

```txt
Authorization callback URL = <your app URL>/api/auth/github/callback
```

Examples:

- Local: `http://localhost:3000/api/auth/github/callback`
- Production: `https://mail.example.com/api/auth/github/callback`

## Which setup pattern should I choose?

### Pattern A: local development only

The simplest possible setup:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

In the GitHub OAuth App:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`

### Pattern B: one OAuth App for local and one for production (recommended)

Recommended app names:

1. `Origami Local`
2. `Origami Production`

This avoids:

- changing callback URLs back and forth
- accidentally mixing production secrets into local envs
- later confusion about which client id belongs to which environment

### Pattern C: public single-user deployment (best practice)

Also set:

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

This prevents someone else from claiming the installation owner first.

## Baby-step guide: create a GitHub OAuth App from scratch

### Step 1: open the GitHub OAuth Apps page

Click through:

1. your GitHub avatar in the top-right
2. **Settings**
3. **Developer settings** in the left sidebar
4. **OAuth Apps**
5. **New OAuth App**

If you have never created one before, the button may say **Register a new application**.

### Step 2: fill in the form

#### Application name

Use something environment-specific:

- `Origami Local`
- `Origami Production`

#### Homepage URL

Use the URL where you open Origami:

- local: `http://localhost:3000`
- production: `https://mail.example.com`

#### Application description

Optional. Something simple like:

```txt
Single-user inbox app login for Origami
```

#### Authorization callback URL

This is the critical field, and it must be exact:

- local: `http://localhost:3000/api/auth/github/callback`
- production: `https://mail.example.com/api/auth/github/callback`

**Do not forget the `/api/auth/github/callback` path.**

### Step 3: register the application

Click **Register application**.

After registration, you will immediately see:

- Client ID

You still need to generate the secret separately.

### Step 4: generate the client secret

On the app detail page, click:

- **Generate a new client secret**

Copy the two values into Origami:

- Client ID → `GITHUB_CLIENT_ID`
- Client Secret → `GITHUB_CLIENT_SECRET`

> Important: the full client secret is usually shown only once.

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

## Step 6: run Origami

```bash
npm run dev
```

Open:

- `http://localhost:3000`

You should see the GitHub sign-in button.

## Step 7: first-owner binding

On the first successful login:

1. Origami checks whether the installation already has an owner
2. if not, it writes the current GitHub user into `app_installation`
3. then it sends you to `/setup`
4. after setup, future sign-ins are checked against that owner account

### One very important detail

After the first binding, Origami checks the stored:

- **GitHub user id**

not just the login text.

So:

- renaming your GitHub login usually does **not** lock you out
- switching to a completely different GitHub account does

## Common problems

### 1. callback error right after clicking sign-in

Check first:

- is `NEXT_PUBLIC_APP_URL` correct?
- does the GitHub OAuth App Homepage URL match the environment?
- is the callback URL exactly `/api/auth/github/callback`?
- did you accidentally use production credentials locally, or vice versa?

### 2. the login page opens, but I still cannot enter

Look at `GITHUB_ALLOWED_LOGIN`:

- if it is set, only that GitHub login can pass this step
- in many cases this is not a bug, it is the intended security restriction

### 3. I am the owner, but I still cannot sign in

Make sure you are signing in with the same GitHub account that originally claimed the installation.

### 4. I bound the wrong owner during first setup

You usually need to clear the `app_installation` record and initialize the app again.

If you are unsure, back up the database first.

## What I recommend in practice

If you ask me for the safest setup, I would recommend:

1. one GitHub OAuth App for local
2. one GitHub OAuth App for production
3. always set `GITHUB_ALLOWED_LOGIN` for public deployments
4. set `AUTH_SECRET` explicitly instead of reusing `ENCRYPTION_KEY` long-term

## What to read next

After GitHub sign-in works, continue with:

- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)
