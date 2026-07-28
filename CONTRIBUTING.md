# Contributing

Thanks for improving SillCast.

## Before opening a pull request

1. Open or reference an issue for model changes.
2. Keep the solar engine deterministic and offline.
3. Add a test for every geometry, time-zone, parsing, or export behavior change.
4. Do not market geometric direct-sun time as illuminance, DLI, or a weather forecast.
5. Run the full gate:

```bash
npm ci
npm run check
```

## Commit and pull-request style

- Use focused commits with imperative summaries.
- Explain the user-visible effect and model impact.
- Include the exact validation commands and results.
- Add or update `docs/MODEL.md` when assumptions change.

## Good first contributions

- Additional measured validation fixtures.
- Accessible color and keyboard improvements.
- More example scenarios in both hemispheres.
- Obstruction primitives proposed with a documented coordinate system and tests.

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
