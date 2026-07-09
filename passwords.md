# Seeded Credentials

Use these after running `npm run db:reset` from `backend/` and then `npm run seed:demo`.

## Demo Accounts

| Email                      | Password        | Role                   | Notes |
| -------------------------- | --------------- | ---------------------- | ----- |
| admin@mint.gov             | admin123        | Admin                  | Main demo admin login |
| coordinator.aau@aau.edu.et | uni123          | University Coordinator | Main demo university login |
| kidus.kebede@mint.gov      | super123        | Supervisor             | Main demo supervisor login |
| abebe.alemu@aau.edu.et     | alemuugr2026001 | Student                | Created by `seed-demo-auth.js` |

## Shared Seed Passwords

- Admin users in the main seed use `admin123`.
- Supervisors in the main seed use `super123`.
- University coordinators in the main seed use `uni123`.
- Seeded student passwords are generated from the father-name proxy plus the registration number, normalized to lowercase without punctuation.

## Example Main-Seed Accounts

| Email                    | Password | Role |
| ------------------------ | -------- | ---- |
| abebe.kebede@mint.gov    | admin123 | Admin |
| tigist.mengistu@mint.gov | admin123 | Admin |
| coordinator@ju.edu.et    | uni123   | University Coordinator |
| abebe.kebede@aau.edu.et  | super123 | Supervisor |

## Notes

- If you only ran `npm run db:reset`, use the main-seed accounts above.
- If you also ran `npm run seed:demo`, the four demo accounts above are the fastest way to recheck the current UI flows.
