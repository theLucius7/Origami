# GitHub Auth Detailed Setup

This page covers one thing only: **how to configure GitHub sign-in for a production Origami instance**.

It is for signing in to Origami itself, not for connecting Gmail or Outlook accounts.

## What this page helps you get

By the time you finish this page, you should have:

- a GitHub OAuth App dedicated to Origami sign-in
- the correct **Homepage URL**
- the correct **Authorization callback URL**
- a working `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- a clear `GITHUB_ALLOWED_LOGIN`

## Final `.env` values you need

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

## Official reference

- GitHub: creating an OAuth App  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## Write this cheat sheet first

```txt
Production app URL
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/better-auth/callback/github

Allowed GitHub login
your-github-login
```

> `mail.example.com` is only an example. Replace it with your real production domain everywhere.
>
> Do not create your real production OAuth App around a temporary `*.vercel.app` domain unless you are prepared to update everything later.

## Where you will switch back and forth

### Place A: GitHub settings

You will:

- create an OAuth App
- set Homepage URL
- set Authorization callback URL
- generate a Client Secret

### Place B: your Origami `.env`

You will fill back:

```txt
NEXT_PUBLIC_APP_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ALLOWED_LOGIN=
AUTH_SECRET=
```

## Click-by-click setup

### 1. Open the GitHub OAuth App page

In GitHub, click:

1. your avatar
2. **Settings**
3. **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

### 2. Fill the OAuth App form

#### Application name

```txt
Origami Production
```

#### Homepage URL

```txt
https://mail.example.com
```

#### Application description

Optional, for example:

```txt
Single-user inbox login for Origami
```

#### Authorization callback URL

This must be exactly:

```txt
https://mail.example.com/api/better-auth/callback/github
```

The most common mistake is putting the homepage URL here. The correct value must include `/api/better-auth/callback/github`.

### 3. Register the application

Click:

- **Register application**

### 4. Generate the Client Secret

On the app details page, click:

- **Generate a new client secret**

Then copy:

1. **Client ID**
2. **Client Secret**

> The full Client Secret is often only shown clearly when it is created. Copy it immediately.

## Now go back to `.env`

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=generate-a-random-32-byte-secret
```

If you do not have `AUTH_SECRET` yet, generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Check before testing

Make sure:

- `NEXT_PUBLIC_APP_URL` is your production domain
- the GitHub **Homepage URL** matches it
- the GitHub **Authorization callback URL** equals `<APP_URL>/api/better-auth/callback/github`
- `GITHUB_ALLOWED_LOGIN` is a GitHub login, not an email address
- `AUTH_SECRET` is not empty

## How to verify it works

After deployment, open:

```txt
https://mail.example.com/login
```

Expected flow:

1. click GitHub sign-in
2. go to the GitHub consent page
3. approve access
4. return to Origami
5. land on `/setup` on first install
6. finish setup and enter the app

For extra confidence, also test:

1. sign out and sign back in again
2. confirm the owner account can still enter normally
3. confirm unrelated GitHub accounts cannot accidentally claim the instance

## Common errors

### 1. callback error right after clicking GitHub sign-in

Check these first:

- `NEXT_PUBLIC_APP_URL`
- GitHub Homepage URL
- GitHub Authorization callback URL

All three must match the same production domain.

### 2. the login page opens, but you still cannot sign in

Check:

```txt
GITHUB_ALLOWED_LOGIN=
```

If it is set, only that GitHub login can complete sign-in.

### 3. everything looks correct, but it still fails

Compare these three values side by side:

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

The only correct callback is:

```txt
<APP_URL>/api/better-auth/callback/github
```

### 4. sign-in broke after you changed the production domain

That is usually not an Origami bug. It usually means the GitHub OAuth App still points at the old domain.

### 5. the wrong owner claimed the instance on first install

That is usually not an OAuth App issue either. It means the first initialization flow was completed with the wrong GitHub account, and you typically need to clear the install record before re-initializing.

## One-line acceptance test

If the intended GitHub account can sign into Origami and land in `/setup` or the app, while other accounts cannot accidentally enter, this configuration is basically done.
