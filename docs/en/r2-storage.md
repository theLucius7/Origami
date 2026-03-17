# Cloudflare R2 / Bucket Detailed Setup

This page covers one thing only: **how to configure attachment storage for a production Origami instance**.

Origami stores attachments in Cloudflare R2 instead of the database.

## Final `.env` values you need

```txt
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## Official reference

- Create an R2 bucket  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- R2 API tokens / S3 auth  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Find your Cloudflare Account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

## Write this cheat sheet first

```txt
Cloudflare Account ID = ...
Bucket name = origami-attachments-prod
R2 endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## Where you will switch back and forth

### Place A: Cloudflare Dashboard

You will:

- find the Account ID
- create the bucket
- create an R2 API token
- copy the Access Key ID and Secret Access Key

### Place B: your Origami `.env`

You will fill back:

```txt
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
```

## Click-by-click setup

### 1. Open Cloudflare Dashboard

Open:

- <https://dash.cloudflare.com/>

Make sure you are in the correct Cloudflare account.

### 2. Find the Account ID

Locate:

- **Account ID**

Save it as:

```txt
R2_ACCOUNT_ID=<your Account ID>
```

Then derive the endpoint:

```txt
R2_ENDPOINT=https://<your Account ID>.r2.cloudflarestorage.com
```

### 3. Open R2 and create the bucket

Open:

- **R2 Object Storage**

Create a bucket named:

```txt
origami-attachments-prod
```

The important part here is simply:

1. the bucket was created successfully
2. you keep the exact bucket name

### 4. Create the R2 API token

Open:

- **Manage R2 API tokens**

Create a key pair for the bucket. The minimum recommended permission set for Origami is:

- **Object Read & Write**

The scope should include the target bucket.

### 5. Save the Access Key and Secret Access Key

Cloudflare will show:

- **Access Key ID**
- **Secret Access Key**

Copy both immediately.

## Now go back to `.env`

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

## Check before testing

Make sure:

- `R2_ACCOUNT_ID` is the Account ID you copied
- `R2_ENDPOINT` equals `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_BUCKET_NAME` exactly matches the bucket you created
- the access key and secret were not swapped
- the token includes **Object Read & Write**
- the token scope includes the target bucket

## How to verify it works

After deployment, test this flow inside Origami:

1. open compose
2. upload a small attachment
3. complete the send or save flow
4. open the message details and try downloading the attachment

Expected result:

- upload succeeds
- send or save succeeds
- attachment download works

## Common errors

### 1. `R2_ENDPOINT` is wrong

The correct format is only:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 2. the access key and secret were swapped

Check:

- `R2_ACCESS_KEY_ID` is not `R2_SECRET_ACCESS_KEY`

### 3. the token lacks object read/write permission

If the permission is too small, attachment upload usually fails.

### 4. the bucket name is wrong

Check that `R2_BUCKET_NAME` exactly matches the bucket name shown in Cloudflare.

### 5. the Account ID belongs to a different Cloudflare account

This is a classic mismatch when multiple accounts exist.
