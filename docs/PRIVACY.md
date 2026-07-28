# Privacy

SillCast is intentionally local-first.

## Data that can exist

- latitude and longitude entered by the user;
- window and room measurements;
- a selected date and IANA time zone;
- calculated samples and summaries;
- optional CSV/JSON files created by the user.

## Where it stays

The web app calculates in the browser. The current scenario is stored in that browser's
local storage so a refresh does not erase work. It is not synchronized.

The production bundle has:

- no backend;
- no account;
- no analytics;
- no advertising;
- no remote fonts;
- no map tiles;
- no weather, geocoding, or solar API;
- no telemetry endpoint.

## Browser location

SillCast calls the standard Geolocation API only after **Use my location** is clicked.
The browser controls the permission prompt. The returned coordinates are written into the
same local form and are not transmitted by SillCast.

## Clearing data

Clear the site's storage in browser settings, or remove the `sillcast-v1` local-storage
entry in developer tools. Downloaded exports are normal files under the user's control.
