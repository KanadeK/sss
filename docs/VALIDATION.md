# Validation

## Reference solar case

The test suite includes the published NREL SPA example:

- latitude: 39.742476° N
- longitude: 105.1786° W
- local time: 2003-10-17 12:30:30 at UTC−07:00
- reference zenith: 50.11162°
- reference azimuth: 194.34024°

SillCast's compact model is required to stay within the documented coarse tolerance of
that high-precision SPA reference. It is not presented as a reimplementation of the full
NREL SPA.

## Geometry fixtures

Deterministic tests cover:

- a centered ray through a south-facing rectangular aperture;
- a sun ray behind the wall;
- a sun below the horizon;
- a ray above or beside the aperture;
- lateral movement under an oblique azimuth;
- adjacent interval merging and 24:00 closure.

## Time-zone fixtures

The suite verifies:

- London UTC+0 in winter and UTC+1 in summer;
- local-noon conversion on a daylight-saving date;
- invalid calendar dates and invalid IANA zones;
- leap-year day counts.

## Product-level checks

`npm run check` includes:

1. formatting;
2. linting;
3. strict type checking;
4. unit, integration, and UI tests with coverage thresholds;
5. browser and package production builds;
6. a real CLI run against the Tokyo example;
7. an HTTP request to the production preview and its generated JavaScript asset;
8. a static check for accidental remote font or analytics references.

See [RELEASE.md](RELEASE.md) for the release gate.
