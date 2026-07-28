# Security policy

## Supported versions

Only the latest tagged release receives security fixes.

## Reporting

Please use GitHub's private vulnerability reporting feature for this repository. Do not
open a public issue containing location data, private scenario exports, or an unpatched
vulnerability.

Include:

- affected version or commit;
- exact reproduction steps;
- expected and observed behavior;
- impact;
- a minimal fixture with personal coordinates removed.

## Data boundary

The production web app has no backend and makes no application-initiated network request.
The optional browser Geolocation API is invoked only after a user click. Scenario
coordinates are stored only in browser local storage and user-created exports.

Dependencies are development/build dependencies and are audited in CI.
