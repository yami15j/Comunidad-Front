# Community frontend

Run this React application against the community API. Authentication uses real API accounts; the backend remains responsible for authorization.

## Run locally

1. Use Node.js 22 or newer and run `npm install` in this directory.
2. Set `VITE_API_URL=http://localhost:3000` in a local `.env.local` if needed. The same address is the default. Never put server credentials or service keys in Vite variables.
3. Start the backend, then run `npm run dev` and open the address Vite prints.

## Support workflow

Students can open **Soporte** to create tickets, read their own conversations, and reply. Accounts with backend role `soporte` land on **Mesa de soporte**, which shows available tickets and tickets assigned to that account. Support users must claim an available ticket before reading or replying. Only the assigned support account can close it.

Closing requires confirmation and permanently deletes the conversation. Closed tickets cannot receive messages or reopen. Ticket lists and conversations refresh every three seconds. Failed requests display an error and allow retry. A failed ticket request does not turn a successful login into a login error. An expired session returns to login and removes the conversation from the screen.

Support accounts load tickets and their profile without requesting courses, videos, or live sessions. Admin and mentor pages remain restricted to their existing roles. Account roles are assigned through the backend, never selected at login.

Live-session schedules still display course, date, and duration. Embedded provider access is unavailable until a new integration is configured.

## Verify

Run `npm test` for the dependency-free access, API contract, resource-isolation, and session-expiry regression tests. Run `npm run lint` and `npm run build` using this project's installed dependencies. For a browser smoke test, sign in with an existing student account, create a ticket, sign in with an existing support account, claim it, exchange replies, and confirm closure removes its messages. Use provisioned account details locally; do not commit credentials.
