# Geometry and solar model

## Coordinate system

Azimuth is measured clockwise from true north:

- north = 0°
- east = 90°
- south = 180°
- west = 270°

The window's azimuth points from the room toward outdoors. While standing inside and
looking through the window:

- target `depthM` is perpendicular distance into the room;
- target `lateralM` is positive to your right;
- all heights are measured above the floor.

## Solar position

`src/core/solar.ts` uses a compact approximation derived from Jean Meeus's astronomical
algorithms. It calculates:

1. days since Julian day J2000;
2. solar mean anomaly;
3. equation-of-center correction and ecliptic longitude;
4. solar declination and right ascension;
5. local sidereal time and hour angle;
6. geometric altitude and azimuth.

The result is intentionally geometric. Atmospheric refraction is not added because
SillCast is determining ray/aperture intersection, and near-horizon observations are
already dominated by unmodeled outdoor obstructions.

NOAA states that its related sunrise/sunset calculations are theoretically accurate to
about a minute between ±72° latitude, with observed times varying because of atmospheric
conditions. SillCast therefore reports its sampling resolution and does not present
sub-minute certainty.

## Window intersection

Let:

- \(\mathbf{n}\) be the horizontal outward normal of the window;
- \(\mathbf{r}\) be horizontal window-right;
- \(\mathbf{s}\) be the unit vector from the target to the sun;
- \(d\) be target depth.

The ray reaches the window plane only when:

\[
\mathbf{s}\cdot\mathbf{n} > 0
\]

The travel parameter to the plane is:

\[
t = \frac{d}{\mathbf{s}\cdot\mathbf{n}}
\]

The aperture coordinates are:

\[
x_w = x_t + t(\mathbf{s}\cdot\mathbf{r})
\]

\[
z_w = z_t + t s_z
\]

The point receives direct geometric sun when:

\[
-\frac{w}{2} \le x_w \le \frac{w}{2}
\]

and:

\[
z_{sill} \le z_w \le z_{sill}+h
\]

The “aperture-weighted exposure” integrates
\(\mathbf{s}\cdot\mathbf{n}\) over direct samples. It is a relative geometric measure,
not irradiance, lux, PPFD, or DLI.

## Sampling

The selected date is sampled in local wall-clock time using its IANA time zone. Adjacent
positive samples are merged into intervals. Interval boundaries carry uncertainty of up
to the chosen step.

On daylight-saving transition days, individual local samples resolve the applicable
offset. On normal days, one verified daily offset is reused for speed.

## Deliberate v0.1 limits

- one vertical rectangular window;
- one point target;
- clear external horizon;
- no exterior or interior obstruction meshes;
- no glass optical properties;
- no diffuse skylight, reflection, clouds, or artificial lighting;
- no compass/magnetic-declination correction.

These limits are displayed in the app and exports. They must not be silently removed from
documentation when new features are added.
