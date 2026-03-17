# GitHub Auth Detailed Setup

This page covers one thing only: **how to configure GitHub sign-in for a production Origami instance**.

It is for signing in to Origami itself, not for connecting Gmail or Outlook accounts.

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
https://mail.example.com/api/auth/github/callback

Allowed GitHub login
your-github-login
```

> `mail.example.com` is only an example. Replace it with your real production domain everywhere.

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
https://mail.example.com/api/auth/github/callback
```

The most common mistake is putting the homepage URL here. The correct value must include `/api/auth/github/callback`.

### 3. Register the application

Click:

- **Register application**

### 4. Generate the Client Secret

On the app details page, click:

- **Generate a new client secret**

Then copy:

1. **Client ID**
2. **Client Secret**

## Now go back to `.env`

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

If you do not have `AUTH_SECRET` yet, generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Check before testing

Make sure:

- `NEXT_PUBLIC_APP_URL` is your production domain
- the GitHub **Homepage URL** matches it
- the GitHub **Authorization callback URL** equals `<APP_URL>/api/auth/github/callback`
- `GITHUB_ALLOWED_LOGIN` is a GitHub login, not an email address
- `AUTH_SECRET` is not empty

## How to verify it works

After deployment, open:

```txt
https://mail.example.com/login
```

The expected flow is:

1. click GitHub sign-in
2. go to the GitHub consent page
3. approve access
4. return to Origami
5. land on `/setup` on first install
6. finish setup and enter the app

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
<APP_URL>/api/auth/github/callback
```
