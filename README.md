# traders

## Supabase shared 소분 모집 setup

The browser app uses Supabase Auth plus shared Postgres tables and RPC functions for group rounds, reservations, cancellations, and the waitlist. To enable cross-user data, open the project's **SQL Editor**, run [`supabase-setup.sql`](./supabase-setup.sql) once, then reload the app.

Members join an open round as pending. The database confirms every participant only when the round reaches its full portion count. Confirmed rows appear in each member's cart and receive a QR; pending rows have no QR and are shown under My Page. The app polls shared state every seven seconds. When a round is full, members can join the waitlist or start another round for the same product; waitlisted members are promoted in order when a new round starts or a participant cancels.
