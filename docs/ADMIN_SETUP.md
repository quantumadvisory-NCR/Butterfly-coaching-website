# Admin setup guide

How to create the first administrator, add your team, and keep access secure.

## The first administrator

A new site has no accounts. The first one is created through a one-time setup screen that is protected by a secret token, so nobody else can claim your site.

1. **Find the setup token.** It is the value of `ADMIN_SETUP_TOKEN` in the site's environment settings (in `.env.local` on a development machine, or your hosting provider's environment variables in production). If it is empty, set it to a long random value first:

   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```

2. **Open** `https://your-site/admin/`. Because there are no accounts yet, you are taken to **Create the owner account**.
3. **Enter** the setup token, your name, your email and a password of at least 12 characters with a letter and a number.
4. You are signed in as the **Owner**.

After this, the setup screen is closed permanently. It only ever works while the site has zero accounts. You can now remove `ADMIN_SETUP_TOKEN` from the environment if you wish.

## Roles

| Role | Can do |
|---|---|
| **Editor** | Pages, programmes, faculty, testimonials, FAQs, blog, resources, media uploads; read enquiries, change their status and add notes |
| **Administrator** | Everything an editor can, plus settings, navigation, redirects, CSV exports, and deleting pages, media, enquiries and subscribers |
| **Owner** | Everything, plus managing users and reading the audit log |

Give each person the lowest role that lets them do their job. Most content contributors only need **Editor**.

Permissions are enforced on the server for every screen and every action. Hiding a menu item is a convenience, not the protection: typing an address directly is refused in the same way.

## Adding a team member

1. **Users > Add a team member.**
2. Enter their name, email and role, and a temporary password.
3. Send them the password through a secure channel (not in the same email as the web address).
4. Ask them to change it straight away under **their name > Change password**.

## Resetting a password

- **Someone else's:** Users > **Reset password** next to their name. Set a new temporary password and share it securely.
- **Your own:** your name (bottom of the menu) > **Change password**.
- **You are the only owner and are locked out:** open your Supabase project, go to **Authentication > Users**, find your account and choose **Send password recovery** or set a new password there. In local development mode, run `npm run db:reset` to start again (this clears all content) or delete the row from `local_credentials`.

There is no "forgot password" email on the sign-in screen. For a small team, owner-led resets are simpler and remove one route for attack.

## When someone leaves

1. Users > **Deactivate** stops them signing in immediately while keeping the record.
2. **Delete** removes the account. Their past changes stay in the audit log.

The system always keeps at least one active owner. You cannot remove or demote the last one, and you cannot change your own role.

## Security practices

- Use a unique, long password for the admin. A password manager is ideal.
- Review **Audit log** from time to time: it records sign-ins (including failed ones), every content change and every data export.
- Sign-in is rate limited: after repeated failures, further attempts are refused for 15 minutes.
- Only administrators and owners can export enquiries or subscribers, and every export is logged.
- For stronger protection, enable multi-factor authentication for your Supabase project's dashboard account, which controls the database itself.

## Which mode am I in?

**Settings > Connections** and the dashboard's **Setup status** show whether the site is connected to Supabase or running in local development mode. A yellow banner appears across the admin in local mode. Never run the live site in local mode: data would live only on that one machine.
