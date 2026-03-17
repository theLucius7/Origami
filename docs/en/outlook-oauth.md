# Outlook OAuth Detailed Setup

This page covers **how to connect Outlook / Microsoft 365 to a production Origami instance**.

GitHub sign-in gets you into Origami. Outlook OAuth lets Origami access the mailbox.

## Final `.env` values you need

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## Official reference

- Register an Entra application  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Add a redirect URI  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- Manage client secrets  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

## Scopes Origami currently requests

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

## Write this cheat sheet first

```txt
Production app URL
https://mail.example.com

Microsoft Redirect URI
https://mail.example.com/api/oauth/outlook

App registration name
Origami Outlook Production
```

## Where you will switch back and forth

### Place A: Microsoft Entra admin center

You will:

- register an app
- configure Authentication
- create a Client Secret
- add Microsoft Graph permissions

### Place B: your Origami `.env`

You will fill back:

```txt
NEXT_PUBLIC_APP_URL=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

## Click-by-click setup

### 1. Open Microsoft Entra Admin Center

Open:

- <https://entra.microsoft.com>

### 2. Register the application

Click:

1. **Entra ID**
2. **App registrations**
3. **New registration**

Recommended name:

```txt
Origami Outlook Production
```

For broad compatibility, choose a supported account type that includes both organizational and personal Microsoft accounts.

### 3. Add the Web redirect URI

Click:

1. **Manage**
2. **Authentication**
3. **Add a platform**
4. choose **Web**

The redirect URI must be exactly:

```txt
https://mail.example.com/api/oauth/outlook
```

The most common mistakes are:

- using the homepage URL instead of the callback
- forgetting `/api/oauth/outlook`
- using a domain that does not match `NEXT_PUBLIC_APP_URL`

### 4. Create the Client Secret

Click:

1. **Certificates & secrets**
2. **New client secret**

Then save:

- Application (client) ID
- Client secret Value

### 5. Add Microsoft Graph permissions

Click:

1. **API permissions**
2. **Add a permission**
3. **Microsoft Graph**
4. **Delegated permissions**

Add:

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

If your tenant requires it, also handle **Grant admin consent** here.

## Now go back to `.env`

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

## Check before testing

Make sure:

- the current app registration is the correct one
- the Web redirect URI equals `<APP_URL>/api/oauth/outlook`
- the client id and secret in `.env` come from this app
- `Mail.Read`, `Mail.ReadWrite`, and `Mail.Send` are present in Graph permissions

## How to verify it works

After deployment:

1. sign in to Origami
2. open `/accounts`
3. choose to add an Outlook account
4. complete the Microsoft consent flow
5. return to Origami

Expected result:

- the Outlook account appears in `/accounts`
- sync works
- reading works
- sending works

## Common errors

### 1. `AADSTS50011` / redirect URI mismatch

Check these first:

- the Web redirect URI in Entra
- `NEXT_PUBLIC_APP_URL`
- the actual callback `/api/oauth/outlook`

### 2. Microsoft sign-in succeeds, but the return to Origami fails

Usually the client id, client secret, or redirect URI is wrong.

### 3. sending fails with missing permission errors

Check that these permissions are present:

- `Mail.Send`
- `Mail.ReadWrite`

### 4. authorization is blocked inside an organization

That is often a tenant policy or admin consent issue, not an Origami issue.
