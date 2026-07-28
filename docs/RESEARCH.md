# Opportunity and competitor research

Research date: **2026-07-28**

## Exclusion check

This project was selected after excluding the user's previously discussed repository
directions, including repository/issue architecture mapping, agent security, MCP
generation, pre-push and `.gitignore` inspection, log sanitization, PNG transparency,
cursor design, subtitle checking, subscription auditing, PDF preflight/redaction, and
map/Minecraft generation.

SillCast moves into a different domain: small-scale indoor solar geometry for everyday
home placement.

## Search method

Searches covered combinations of:

- `indoor sunlight planner window plant`
- `houseplant sunlight calculator window orientation`
- `room sun exposure open source`
- `indoor direct sunlight calculator GitHub`
- `solar ray window room heatmap`

The goal was not to claim that no related software exists. It was to check whether a
mature open-source project already owns the exact workflow: **one measured window + one
indoor target point + exact direct-sun intervals + room heatmap**.

## Related projects

| Project                                                                     | What it does                                                 | Gap SillCast addresses                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| [Plant-it](https://github.com/MDeLuise/plant-it)                            | Self-hosted plant collection and care activity tracking      | Records care; does not solve window-aperture geometry         |
| [Home Assistant Plant Monitor](https://github.com/Olen/homeassistant-plant) | Uses physical sensors for DLI, moisture, VPD, and thresholds | Measures after placement and requires sensors                 |
| [ShadeMap download tool](https://github.com/U-Shift/shademap-download-tool) | Exports outdoor urban shadow/sun layers                      | Outdoor geography, not a measured indoor point                |
| [Open Garden Planner](https://github.com/cofade/open-garden-planner)        | CAD-like outdoor garden planning                             | Garden layout rather than sun rays through a window           |
| [pvlib-python](https://github.com/pvlib/pvlib-python)                       | Professional photovoltaic solar modeling                     | Powerful low-level library, not the household indoor workflow |

Searches did not find a mature direct substitute. The nearest capabilities are spread
across plant trackers, outdoor shadow maps, sensor dashboards, and engineering libraries.

## Why the idea can attract attention

1. **Immediate visual payoff:** the room heatmap communicates the answer in one screenshot.
2. **Broad non-developer audience:** plants, desks, pets, photography, and furniture.
3. **Trustable privacy story:** coordinates never need to reach a server.
4. **Shareable examples:** seasonal “where the sun lands” comparisons work well in
   gardening, home-automation, interior-design, and data-visualization communities.
5. **Credible extension path:** obstructions, multiple windows, floor plans, measured
   calibration, and Home Assistant integration can be added without changing the core
   value proposition.

Stars are never guaranteed. The repository is designed to earn them by being complete,
useful, visually clear, and technically inspectable at v0.1.0.

## Technical sources

- [NOAA general solar-position equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)
- [NOAA calculation details](https://gml.noaa.gov/grad/solcalc/calcdetails.html)
- [NREL Solar Position Algorithm report](https://docs.nlr.gov/docs/fy08osti/34302.pdf)
- [W3C Geolocation specification](https://www.w3.org/TR/geolocation/)
- [MDN `Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
