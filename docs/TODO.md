# TODO

## Cross-platform dev start

The dev setup works only on macOS and Linux. `scripts/dev-db.sh` is a Bash
script, so Windows cannot run it without WSL or Git Bash.

Goal: one command starts the dev environment on Windows, macOS, and Linux.

Proposal:
- Replace `scripts/dev-db.sh` with `scripts/dev.ts`. Run it with `tsx`, which
  is already a devDependency. Node is already required, so this adds no new
  tool. (Python is also possible, but it adds a second runtime.)
- The script does the same steps as `dev-db.sh`: fill `.env.local` secrets,
  run `docker compose up --wait`, migrate, seed, then start `next dev`.
- Expose it as `npm run up` and `npm run down`. Do not use `make`, because
  Windows does not include `make`.

Done when:
- `npm run up` starts the DB and the app on all three platforms.
- `npm run down` stops the DB and removes the volume.
- README shows only the new commands.
