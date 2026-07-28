# Release gate and repair loop

## v0.1.0 acceptance

A release is allowed only when all of the following are true:

- the planner returns non-empty real calculations for every included example;
- the CLI and browser use the same core functions;
- formatting, lint, strict types, tests, coverage, and builds pass;
- the built preview responds over HTTP and its JavaScript asset loads;
- CSV and JSON export tests pass;
- no production remote font, analytics, or application API is present;
- package and web archives are created with SHA-256 checksums;
- the commit author is `KanadeK` with the GitHub noreply address;
- there is no Codex/OpenAI/ChatGPT/AI-assistant co-author trailer;
- `v0.1.0` points to the tested `main` commit;
- GitHub Actions CI and Pages deployment are green.

Run:

```bash
npm ci
npm run check
npm run package:release
(cd release && sha256sum -c SHA256SUMS)
```

## Failure repair loop

Do not skip, weaken, or mark a failed gate as “expected.”

1. Stop at the first failing command.
2. Record its exact output.
3. Classify it as environment, formatting, lint, type, unit/integration, build, runtime,
   package, or remote-CI failure.
4. Make the smallest root-cause fix.
5. Rerun the failing command alone.
6. Add a regression test when behavior was wrong.
7. Rerun `npm run check` from the start.
8. Recreate release assets; never reuse assets from a failed commit.
9. Push `main`; the idempotent release workflow creates the version tag and
   GitHub Release after rerunning the full gate.
10. Verify SHA, tag target, author identity, CI, Pages, and release URLs.

If the failure depends on unavailable external authority—GitHub authentication,
repository permission, or Pages settings—stop the publication step and report the exact
blocker. Never claim publication succeeded from local files alone.

## Publication commands

With authenticated GitHub CLI:

```bash
git config user.name "KanadeK"
git config user.email "121669563+KanadeK@users.noreply.github.com"
git init -b main
git add .
git commit -m "Release SillCast v0.1.0"
gh repo create KanadeK/sss --public --source=. --remote=origin --push \
  --description "Local-first indoor direct-sun planner for windows, plants, desks, and pet spots."
```

The release workflow is triggered by `main`, a matching `v*` tag, or a manual
dispatch. It first checks whether the package version already has a release, so
normal pushes remain idempotent. For a new version it creates the tag and
attaches the npm package, static web ZIP, and checksum file. A mismatched
manually pushed tag fails before publishing.
