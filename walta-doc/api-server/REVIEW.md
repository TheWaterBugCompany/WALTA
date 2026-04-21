# Waterbug Blitz API — Developer Review

**Audience:** the mobile-app developer whose phone app submits sampling data to
this API, and any downstream data-portal integrator.

**Scope:** this review describes the application **as it runs on `master`
today**, not the in-progress upgrade branch. Where a planned upgrade will
address a finding, it is tagged **[upgrade]**. No application code was
changed while producing this review.

**Stack snapshot:**

| Piece | Version |
|---|---|
| PHP | 8.3 |
| Laravel framework | `^12.17` (live) |
| Laravel Passport | `^12.4` |
| Laravel Socialite | `^5.17` |
| Laravel UI (auth scaffolding) | `^4.6` |
| Intervention Image | **v2** (`\Image::make()`, `->widen()`, `->orientate()`, `->encode()`) |
| doctrine/dbal | `^3.5` |
| league/csv | `^9.7` |
| phpoffice/phpspreadsheet | **not installed** — masterlist importers are commented out pending upgrade |
| guzzlehttp/guzzle | `^7.8` |
| Routing style | **classic** — `App\Providers\RouteServiceProvider` still present and registered in `bootstrap/providers.php` |

The app is served by a PHP 8.3 FPM/CLI stack behind nginx in production and
via the local Herd dev host in development. Latest master commit on review:
`43dcfd7 Merge branch 'release/2.0.7'`.

---

## 1. Overview

Waterbug Blitz is a citizen-science programme where volunteers collect
macroinvertebrates from Australian waterways and record them via a phone
app. This repo is the Laravel backend for that app. Responsibilities:

1. Receive sampling submissions (location, habitat breakdown, observed
   creatures with counts, photos, and photos of **unknown** creatures) from
   the phone app over a Passport-secured `/v1` JSON API.
2. Provide creature reference data + per-sample SIGNAL / SIGNAL2 / River
   Detectives scores back to the phone app.
3. Serve an admin web UI (Vue SPA mounted in Blade) for volunteer
   coordinators to review and correct samples, identify unknown creatures,
   and mark samples as `reviewed`.
4. Expose a **separate** `/data/v1` endpoint that the public Waterbug Blitz
   website polls nightly to pull reviewed data into its public map.

**What this repo is *not*:** the public map. That lives in the separate
`waterbug_blitz` public-site repo as a classic PHP site that polls this API,
stores per-state `creature_samples_{state}_wbb` rows, clusters them into
site codes, and computes its own **site-visit** SIGNAL grades. See §8.

---

## 2. Data flow

```
                ┌─────────────────────┐
                │   Volunteer phone   │
                │        app          │
                └──────────┬──────────┘
                           │
        1. Client credentials (bootstrap, no user yet)
           POST /v1/token/create        → user token (email+password)
           POST /v1/token/create/social → user token (oauth_network)
           POST /v1/user/create         → create account + user token
                           │
                           │ 2. Thereafter: Bearer <personal access token>
                           │    (scope=none; auth:api guard)
                           ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │                    /v1/*  (routes/api.php)                        │
   │           prefix 'v1' + middleware 'api' (throttle 60/min)        │
   │                                                                   │
   │  SampleController        → samples, habitats, pivoted creatures   │
   │  UnknownSampledCreature  → photo-only rows pending ID             │
   │  PhotoController         → upload/view JPEG ≤ 4 MB                │
   │  CreatureController      → reference data (read only)             │
   │  ScoreController         → SIGNAL/SIGNAL2/RD reference (read only)│
   │  UserController          → self-profile read/update               │
   └──────────┬────────────────────────────────────────────────────────┘
              │  Eloquent (MySQL)
              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  samples ──1──┬──► habitat (1:1, habitats.sample_id)            │
   │   reviewed    ├──► sampled_creatures (1:N)                      │
   │   corrected   │      │                                          │
   │               │      ├─ creature_id NOT NULL → pivot to creatures│
   │               │      └─ creature_id IS NULL  → "unknown" row   │
   │               │         (created via /unknownCreatures POST)    │
   │               └──► photos (morphMany, photoable_type='App\Sample')│
   │  sampled_creatures ──► photos (morphMany,                       │
   │                                photoable_type='App\SampledCreature')│
   │  creatures (seeded reference)──► scores (hasMany by 'type')     │
   └─────────────────────────────────────────────────────────────────┘
              ▲                                     ▲
              │ 3. Admin opens /admin               │
              │    web + auth + admin middleware    │
              │                                     │
   ┌──────────┴─────────────────────┐               │
   │     /admin/*                   │               │
   │   (routes/admin.php,           │               │
   │    prefix 'admin')             │               │
   │                                │               │
   │   Blade + Vue SPA              │               │
   │   ReviewController              │               │
   │   AdminController               │               │
   │                                 │               │
   │   PATCH /admin/samples/{id}    │               │
   │     sets reviewed=1,            │               │
   │     corrected=0|1,              │               │
   │     updates sampled_creatures   │               │
   └──────────────────┬──────────────┘               │
                      │ reviewed=1 is the publish gate
                      ▼                              │
                                                     │
   ┌──────────────────────────────────────────────┐  │
   │   Public Waterbug Blitz map site             │  │
   │   (separate repo: waterbug_blitz)            │  │
   │                                              │  │
   │  4a. cron/import_waterbug_api.php (nightly): │  │
   │      POST /v1/token/create/server            │  │
   │        grant_type=client_credentials         │  │
   │        scope=data-api                        │  │
   │        → Passport client_credentials token   │  │
   │                                              │  │
   │  4b. GET  /data/v1/sampledCreatures/summary  │──┘
   │      (middleware: client:data-api)           │
   │      → flat rows where samples.reviewed=1    │
   │                                              │
   │  4c. truncate + repopulate                   │
   │      creature_samples_{state}_wbb            │
   │  4d. cluster lat/lng → wbb_{state}_N sites   │
   │  4e. cron/regenerate_signal_data.php         │
   │      → site_visit_score materialised view    │
   │  4f. ajax/geo.ajax.php → GeoJSON to map      │
   │      (pins coloured by SIGNAL band)          │
   └──────────────────────────────────────────────┘
```

The single publication gate between a sampling submission and the public
map is `samples.reviewed`. Phone-app users cannot see or set it. Only an
authenticated admin can flip it via `PATCH /admin/samples/{id}`
(`AdminController::updateSample`, line 45).

---

## 3. Routing overview

Routes are composed in the old-style `App\Providers\RouteServiceProvider`:

| Route file | Prefix | Middleware | Purpose |
|---|---|---|---|
| `routes/api.php` | `v1` | `api` (throttle 60/min) + per-route `auth:api` or `client:create-users` | Phone-app REST API |
| `routes/data-api.php` | `data/v1` | `client:data-api` (Passport client-credentials with `data-api` scope) | Public-portal read pipeline |
| `routes/admin.php` | `admin` | `web` + `auth` + `admin` | Admin UI + admin JSON endpoints |
| `routes/web.php` | (none) | `web` | Public redirects, Swagger host page, public photo viewer, `Auth::routes(['register' => false])` |

Route-binding patterns applied globally in `RouteServiceProvider::boot()`:

```php
Route::pattern('creature',               '[1-9][0-9]*');
Route::pattern('photo',                  '[1-9][0-9]*');
Route::pattern('sample',                 '[1-9][0-9]*');
Route::pattern('unknownSampledCreature', '[1-9][0-9]*');
Route::pattern('sampledCreature',        '[1-9][0-9]*');
Route::pattern('score',                  '[1-9][0-9]*');
Route::pattern('direction',              'first|next|prev');
Route::bind('unknownSampledCreature', fn ($v) =>
    \App\SampledCreature::whereNull('creature_id')->findOrFail($v));
```

The numeric `creature` pattern is important: it means the literal-segment
routes `/v1/creatures/riverdetectives` and `/v1/creatures/search` declared
*after* `/v1/creatures/{creature}` in `routes/api.php` are **not shadowed**
by `{creature}` (the pattern prevents non-numeric matches). The app
functions correctly despite the declaration order looking suspicious.

---

## 4. API surface for the phone app

All paths are under **`/v1`**. Throttle is the Laravel 12 default 60/min
per authenticated user (per IP if unauthenticated) — set in
`RouteServiceProvider::boot` via `RateLimiter::for('api', ...)`.

### 4.1 Token issuance / account bootstrap

| Method | URI | Controller | Auth |
|---|---|---|---|
| POST | `/v1/user/create`            | `UserController@store`                       | `client:create-users` |
| POST | `/v1/user/create/social`     | `UserController@store('social')`             | `client:create-users` |
| POST | `/v1/token/create`           | `TokenController@issueLocalUserAccessToken`  | `client:create-users` |
| POST | `/v1/token/create/social`    | `TokenController@issueSocialUserAccessToken` | `client:create-users` |
| POST | `/v1/password/email`         | `Auth\ForgotPasswordController@sendResetLinkEmailViaAPI` | `client:create-users` |
| POST | `/v1/token/create/server`    | `TokenController@issueServerAccessToken`     | **none — see §9** |

`client:create-users` = a Passport **client-credentials** grant token that
holds the `create-users` scope. The phone app must ship with a pre-issued
`client_id` / `client_secret` bound to that scope (scopes are defined in
`AppServiceProvider::bootAuth()`).

### 4.2 User-token endpoints (middleware `auth:api`)

| Method | URI | Controller | Notes |
|---|---|---|---|
| GET | `/v1/user`                            | `UserController@show`           | Returns `$request->user()`. |
| PUT | `/v1/user`                            | `UserController@update`         | Updates `name`, `group`, `survey_consent`, `share_name_consent`. |
| PUT | `/v1/user/password`                   | `UserController@updatePassword` | Appears to be unused by the phone app. The live password-reset flow is `POST /v1/password/email` → emailed reset link → Laravel's built-in web reset form (`Auth\ResetPasswordController` + `ResetsPasswords` trait), which does save correctly. This controller method itself is missing a `$user->save()` call — see §9 #1. |
| GET | `/v1/creatures`                       | `CreatureController@index`      | Full list (ids + display names). |
| GET | `/v1/creatures/riverdetectives`       | `CreatureController@rdIndex`    | Subset with non-empty `rd_name`. |
| GET | `/v1/creatures/search?query=`         | `CreatureController@search`     | Case-sensitive `LIKE %q%` against `alt_name`, `common_name`, `rd_name`, `ala_name`. |
| GET | `/v1/creatures/{creature}`            | `CreatureController@show`       | Numeric id (route-pattern enforced). |
| GET | `/v1/samples`                         | `SampleController@index`        | Every sample the user has ever submitted. **No pagination — see §10**. |
| POST | `/v1/samples`                        | `SampleController@store`        | Creates sample + habitat + `creatures[]` pivot rows. |
| GET | `/v1/samples/{sample}`                | `SampleController@show`         | 404 if the sample belongs to another user. |
| PUT | `/v1/samples/{sample}`                | `SampleController@update`       | Partial update (sample + habitat + creature counts). |
| GET | `/v1/samples/{sample}/creatures`      | `SampleController@getSampleCreatures` | Pivot rows (known creatures only). |
| GET | `/v1/samples/{sample}/photos`         | `PhotoController@getSamplePhotos` | Morph photos on the Sample itself. |
| POST | `/v1/samples/{sample}/photos`        | `PhotoController@storeSamplePhoto` | JPEG ≤ 4 MB; resized. |
| GET | `/v1/samples/{sample}/creatures/{creature}/photos`  | `PhotoController@getSampledCreaturePhotos` | Photos for a specific known creature in the sample. |
| POST | `/v1/samples/{sample}/creatures/{creature}/photos` | `PhotoController@storeSampledCreaturePhoto` | JPEG ≤ 4 MB; resized. |
| GET | `/v1/samples/{sample}/unknownCreatures` | `SampleController@getUnknownSampledCreatures` | Rows where `creature_id IS NULL`. |
| POST | `/v1/samples/{sample}/unknownCreatures` | `SampleController@storeUnknownSampledCreature` | Requires `photo`; creates the pivot row + photo atomically. |
| PUT | `/v1/unknownSampledCreatures/{id}`    | `UnknownSampledCreatureController@updateUnknownSampledCreature` | Assign `creature_id`, update count, replace photo. `{id}` binding filters `creature_id IS NULL`. |
| DELETE | `/v1/unknownSampledCreatures/{id}` | `UnknownSampledCreatureController@deleteUnknownSampledCreature` | Cascades photos. |
| GET | `/v1/photos/{photo}`                  | `PhotoController@show`           | Returns the Photo model JSON (owner-filtered). |
| GET | `/v1/photos/{photo}/view`             | `PhotoController@view`           | Streams JPEG bytes via Intervention. Admins see any; users see only their own. |
| GET | `/v1/scores/{scoring_method}`         | `ScoreController@index`          | `scoring_method ∈ {alt, order, riverdetectives}`. |
| GET | `/v1/scores/{score}`                  | `ScoreController@show`           | Numeric id. |

### 4.3 Public photo endpoint (no token)

Mounted on `web.php`, no auth:

| GET | `/photos/{photo}/view` | `PhotoController@public_view` | Only serves photos morph-attached to a `SampledCreature` whose parent `Sample.reviewed = 1`. |

---

## 5. Data-portal API (not for the phone app)

Mounted under **`/data/v1`** with middleware `client:data-api` — i.e. a
Passport client-credentials token scoped `data-api`, no user context.

| Method | URI | Controller |
|---|---|---|
| GET | `/data/v1/sampledCreatures/summary` | `ReadDataController::sampledCreaturesSummary` |
| GET | `/data/v1/photos/{photo}/view`      | `PhotoController::view` (same controller method as `/v1`) |

`sampledCreaturesSummary` returns a flat row per `sampled_creatures` row
where the parent `Sample.reviewed = true`, joined to `creatures` (for
`epa_code`, `alt_name`) and to a `MIN(photos.id)`-per-photoable sub-select.
The `photoable_type` filter is a literal backslash-escaped string:

```php
->leftJoin(DB::Raw(
  "(SELECT MIN(id) as id, photoable_id FROM photos
    WHERE photoable_type LIKE 'App\\\\\\\\SampledCreature'
    GROUP BY photoable_id) as photos"), ...)
```

That hard-coded `App\\\\\\\\SampledCreature` is the landmine for any future
namespace reshuffle — see §8.3 and §13.

---

## 6. Admin UI (not for the phone app)

Mounted under `/admin`, middleware `web` + `auth` + `admin` (alias for
`App\Http\Middleware\IsAdmin`). Integrators should never call these from
the phone app.

Noteworthy admin endpoints:

- `PATCH /admin/samples/{id}` — `AdminController::updateSample` — sets
  `reviewed`, `corrected`, `notes`, `complete`; updates creature counts and
  re-assigns `creature_id` on pivot rows when a volunteer's pick was wrong.
- `DELETE /admin/samples/{id}` — `SampleController::delete` — admin-only
  hard delete (cascades photos via iteration, then habitat, then pivots).
- `GET /admin/creatures/search?query=…` — `AdminController::creatureSearch`
  — boolean-mode `MATCH … AGAINST` full-text search. **SQL injection
  vector — see §9**.
- `GET /admin/report/samples/users` — per-user submitted/reviewed/corrected
  counts.
- `GET /admin/report/samples/user/{user}/detail` — monthly per-user
  submission breakdown.
- `GET /admin/photos/{photo}/view` — admin-side photo viewer (same
  controller method as `/v1`).
- Masterlist importers (`import`, `importALTScores`, `importOrderScores`,
  `importRDScores`) are **commented out** in both `routes/admin.php` and
  `AdminController.php`. Comment reads *"CH-5350 … use a vulnerable
  phpoffice reader object, upgrade phpoffice to 2.3.0 in future to fix."*
  — see **[upgrade]** tag in §13.

---

## 7. Data model

All models live in the flat `App\` namespace (not `App\Models\`). This is
an intentional pre-L8 layout preserved through every upgrade because the
downstream public portal filters `photoable_type` as a literal string on
that namespace.

### 7.1 `Sample` — `samples` table

| Column | Type | Writable from `/v1`? | Notes |
|---|---|---|---|
| `id`              | PK int | no | |
| `user_id`         | FK users | server-assigned | From `$request->user()->id`. |
| `sample_date`     | timestamp | POST only | Must arrive as strict `\DateTime::ATOM`. Mutator converts to UTC. |
| `lat`, `lng`      | decimal(10,7) | POST only | Validated by `App\Rules\Lat` / `Lng`. Uniqueness enforced over `(user_id, lat, lng, sample_date)`. |
| `scoring_method`  | string | POST only | Enum: `alt` \| `order` \| `riverdetectives`. |
| `survey_type`     | string | yes | Enum: `mayfly` \| `quick` \| `detailed`. |
| `waterbody_type`  | string | yes | Enum: `river` \| `wetland` \| `lake`. |
| `waterbody_name`  | string | yes | |
| `nearby_feature`  | string null | yes | |
| `notes`           | text null | yes | |
| `complete`        | bool null | yes | |
| `reviewed`        | bool (indexed) | **admin only** | Publication gate. |
| `corrected`       | bool (indexed) | **admin only** | Set when admin edited creature IDs. |
| `score` (appended)          | float | computed | See §8.1. |
| `weighted_score` (appended) | float null | computed | Only for `scoring_method='alt'`. |

**Always eager-loaded** (`protected $with = ['sampledCreatures','habitat','photos']`).
Every sample payload already contains the full graph.

### 7.2 `Habitat` — `habitats` table

1:1 with `Sample` via `Sample.hasOne(Habitat)`. Columns
`boulder`, `gravel`, `sand_or_silt`, `leaf_packs`, `wood`,
`aquatic_plants`, `open_water`, `edge_plants` are `nullable int between 0
and 100`. No timestamps. `$touches = ['sample']`.

### 7.3 `SampledCreature` — `sampled_creatures` table

Dual-role table:

- `creature_id IS NOT NULL` → pivot row between `Sample` and `Creature`.
- `creature_id IS NULL` → "unknown creature" submission awaiting admin ID.

Migration `2019_03_20_045018_allow_unknown_sampled_creature.php` relaxed
the column to nullable to enable the second role. `$fillable = ['count',
'creature_id']`. No timestamps. `$touches = ['sample']`.

### 7.4 `Photo` — `photos` table (polymorphic)

| Column | Notes |
|---|---|
| `filename` | `md5("{id}_{date('Ymdhis')}")` — note `h` is **12-hour** in `date()`, so two uploads one hour apart can collide; md5 with the `id` makes actual collisions vanishingly unlikely. |
| `extension`, `mimetype`, `filesize`, `original_filename`, `user_id` | Server-computed from the upload. Extension is always `jpeg`/`jpg` because validation pins `mimes:jpeg`. |
| `photoable_id` / `photoable_type` | Points at `App\Sample` or `App\SampledCreature`. **Hidden from JSON** (`$hidden`). |

Side effects: deleting a `Photo` fires **both** `PhotoDeleting` event *and*
the `PhotoObserver::deleting` observer. **Both** call
`Storage::delete("{filename}.{extension}")`. See §9 — this is a
near-duplicate side effect.

Photos are written to the configured default disk (`FILESYSTEM_DRIVER`,
default `local` = `storage/app/`).

### 7.5 `Creature`, `Score`

- `Creature`: search targets `alt_name`, `common_name`, `rd_name`,
  `ala_name`, `epa_code`; taxonomy fields
  `phylum..species`; `parent_id` self-FK. `$fillable = ['epa_code']`
  (everything else is seeded reference data). Has a computed `photos`
  accessor that returns photos from the **sample context** the Creature
  was loaded in (via the pivot alias `sampled_creature`), and `null` when
  queried standalone — always runs on every serialisation whether useful
  or not (see §10).
- `Score`: `creature_id` FK, `type` ∈ `{alt, order, riverdetectives}`,
  `score` float, `name` hidden.

### 7.6 `User`

`$fillable` does **not** include `is_admin` — server-set only. See §9
about the misnamed accessor.

Mutators on `share_name_consent`, `survey_consent`, `group` cast to `int`.
`setOauthNetworkAttribute` silently coerces to `null` when the submitted
value is not in `ALLOWED_OAUTH_NETWORKS`.

---

## 8. SIGNAL score pipeline

Two independent score-generation paths, for different audiences.

### 8.1 Per-sample score (this API, for the phone app)

`App\Sample` auto-appends two computed attributes to every JSON response:

- **`score`** (`getScoreAttribute`) — average of `scores.score` across the
  sample's creatures, where `scores.type = sample.scoring_method`. One
  query, three joins (`samples → sampled_creatures → creatures → scores`).
  Always returns a float; returns `0.0` (not null) when there are no
  matching score rows.
- **`weighted_score`** (`getWeightedScoreAttribute`) — **only for
  `scoring_method = 'alt'`**. For each pivot row, count is bucketed into
  a weight:

  | count | weight |
  |---|---|
  | ≤ 2   | 1 |
  | ≤ 5   | 2 |
  | ≤ 10  | 3 |
  | ≤ 20  | 4 |
  | > 20  | 5 |

  `weighted_score = Σ(score × weight) / Σ(weight)` rounded to 2 dp.
  Returns `null` for non-ALT scoring methods or when there are no scored
  creatures.

Both accessors run on every serialisation — including `GET /v1/samples`
which lists every sample the user has ever submitted — with no caching
(§10).

### 8.2 Per-site score (public portal repo)

Lives in the separate public-site repo. At a high level:

1. `cron/import_waterbug_api.php` nightly:
   - `POST /v1/token/create/server` with `client_id` / `client_secret` /
     `scope=data-api` → client-credentials token.
   - `GET /data/v1/sampledCreatures/summary` → flat rows.
   - Truncates `creature_samples_{state}_wbb` (per state) and repopulates.
   - Calls `generate_waterbug_site_codes()` to cluster lat/lng into
     per-state `wbb_{state}_N` sites. **Site codes are regenerated every
     run and are not stable across nights** — see §8.4 and the planned
     upgrade in §13.
2. `cron/regenerate_signal_data.php` — CLI — rebuilds the `site_visit_score`
   materialised view, grouping creatures by EPA-code prefix (first 2
   digits for order-level, first 4 for family, full for ALT).
3. `ajax/geo.ajax.php` serves GeoJSON to the public map, coloured by
   `signal_grade` band.


### 8.3 Portal-side bugs surfaced during review

Although the public-site repo is outside this review's scope, the
following bugs in its score/site generation were noted during the previous
review pass and remain relevant because they affect what the phone-app
developer sees on the map. They are summarised here for context and
categorised by display visibility (the public site currently renders only
`signal_weighted_alt` on pin colour + `signal_alt` in the popup; a further
reduction is planned in the next upgrade):

- **[displayed]** `order_abundance` / `family_abundance` drops the first
  creature (initialises to 0 instead of current abundance in the `else`
  branch).
- **[displayed]** `signal_alt` numerator sums only ALT-graded creatures
  but divides by the full `num_alt_taxa` → score is diluted.
- **[displayed]** `geo.ajax.php` band thresholds start at `> 0`, so score
  exactly 0 is uncoloured.
- **[displayed]** Pin colour uses unweighted `signal_grade` while the
  popup shows weighted — inconsistent at band boundaries.
- **[pipeline]** Visits with no ALT grade are dropped entirely
  (`$alt_total_score == 0` early-returns), losing order/family scores for
  RiverDetectives-only submissions.
- **[pipeline]** Import date format uses lowercase `h` (12-hour, no AM/PM)
  — AM and PM visits on the same day collide into one record.
- **[pipeline]** `empty_waterbug_tables()` truncates before the payload is
  validated — an empty or errored API response wipes existing WBB data.
- **[pipeline]** `$valid_count` is undefined when the token fetch fails.
- **[stored-only]** `signal_family` column is actually populated with the
  order-level grade (copy-paste from the order block).
- **[stored-only]** `total_*_weighted_grade` columns are bound to the
  weight rather than the weighted sum.
- **[stored-only]** Dead line `$num_order_taxa = count($order_grade)`
  before the populating loop.
- **[stored-only]** `order_grade` / `family_grade` are last-writer-wins —
  no `MIN()` as the spec implied.

Priority: fix the four `[displayed]` items before any display-set
reduction; fix `[pipeline]` items regardless; treat `[stored-only]` as
opportunistic or drop them with the columns during simplification.

---

## 9. Broken / incomplete (live today)

Severity key: **P1** = data loss / silent breakage hitting real users,
**P2** = security smell, **P3** = cosmetic / dead code / no observed
impact but worth tidying.

Each P3 finding below was re-verified to confirm it has **no observed
impact today**. They are listed so they don't re-surface as "bugs" next
time someone reads the code, not because they need fixing.

| # | File:line | Severity | Issue | Notes |
|---|---|---|---|---|
| 1 | `UserController.php:133-151` | **P3** | `updatePassword` hashes the password and assigns `$user->password`, but **never calls `$user->save()`**. | Originally flagged P1, **downgraded** and confirmed: the live password-reset flow goes through `POST /v1/password/email` → emailed link → Laravel's built-in web reset form (`ResetsPasswords` trait), which saves correctly. `PUT /v1/user/password` appears to be unused by the phone app — password changes in the field have been confirmed to persist. Worth fixing the `save()` or deleting the route, but no user impact today. |
| 2 | `Admin/AdminController.php:95-111` | **P2** | `creatureSearch` interpolates the admin's query string directly into a heredoc SQL `MATCH … AGAINST` and wraps with `Creature::whereRaw("id in ($sql)")`. | Admin-and-auth-gated, so not externally exploitable — a signed-in admin would have to go out of their way to abuse it. Genuine finding, but practical risk is low because the ops-model already trusts the admins. Fix: bind the search term through `DB::raw` bindings or migrate to `whereFullText()`. |
| 3 | `routes/api.php:78` + `TokenController::issueServerAccessToken` | **P3** | `POST /v1/token/create/server` is declared outside both middleware groups. No throttle, no IP allowlist. | This is intentional — the public-portal cron calls it nightly to mint a client-credentials token. The `client_id`/`client_secret` pair **is** the auth (that's how the OAuth2 client-credentials grant is meant to work), so "no middleware" is not an auth bypass by itself. The only real concern is a missing rate limit: an attacker with the `client_id` could brute-force the secret without being throttled. Worth wrapping in `throttle:10,1` when convenient. Not a live incident. |
| 4 | `User.php:67,76` | **P3** | Accessor/mutator are misnamed — `getIsAdmin($value)` / `setIsAdmin($value)` rather than `getIsAdminAttribute` / `setIsAdminAttribute`. Neither is invoked by Eloquent. | **Zero impact today.** `$user->is_admin` returns the raw DB int and every consuming site uses `== 1` loose comparison (`IsAdmin` middleware, `SampleController::delete`, `PhotoController::view`), so the admin check is correct. The methods are dead code and only a code-review trap. |
| 5 | `config/auth.php` | **P2** | File only declares `guards.api`. Framework defaults fill in `defaults.guard = web`, `guards.web.provider = users` and `providers.users.model = App\Models\User` — but that class does **not** exist in this repo (the model is `App\User`). Verified via `auth()->guard('web')->getProvider()->createModel()` which throws *"Class `\App\Models\User` not found"*. | **The phone-app `auth:api` path is unaffected** (Passport has its own user resolution) — that's why the API keeps serving traffic. **Session-based admin login via `Auth::routes()` cannot currently resolve a user** through the provider, so admin web login either breaks at the guard step or relies on a deploy-server-only config override not in the repo. Worth confirming on the actual server. Fix: restore `providers.users = ['driver' => 'eloquent', 'model' => App\User::class]` explicitly. |
| 6 | `Traits/SocialUser.php:88-92` | **P3** | On `GuzzleHttp\ClientException` inside `fetchSocialUser`, the trait `response()->json(...)->send()` *and then returns the response*. Callers (`verifySocialUser`, `populateRequestWithSocialData`) then dereference that response as if it were a Socialite user DTO. | Only triggers when a social OAuth token is invalid/expired. The `->send()` does flush a JSON error to the client, so the end user sees a reasonable error; the subsequent `(array) $response` + Validator call just logs a mess server-side. Minimal user impact — originally flagged P2, **downgraded**. |
| 7 | `Photo.php:23` + `PhotoObserver.php:13` + `Events/PhotoDeleting.php:21` | **P3** | Photo delete has **two** registered listeners that both call `Storage::delete(...)` with the same key. | **Idempotent and no observed impact** — second delete is a no-op. Consolidate at next touch. `PhotoDeleting` also performs the file delete inside the event constructor rather than in a listener, which rules out future async handling but doesn't break anything today. |
| 8 | `AppServiceProvider.php:39` | **P3** | `// Passport::routes(); // TODO: WBUGS-56` | Just a stale comment. Safe to delete whenever convenient. |
| 9 | `Admin/ReviewController.php:65` | **P3** | `// TODO: review from user reports should only be available if there are unreviewed samples` | UX paper-cut — admin can land on an empty review screen. No data impact. |
| 10 | `SampleController.php:131-153` | **P3** | `delete` iterates children and deletes them individually; the `// $sample->photos()->delete()` comments suggest an earlier bulk-delete attempt was abandoned. | **Works correctly** — flagged only because the stubbed comment trail is confusing. No live issue. |
| 11 | Empty resource-stub methods (`index/create/edit/update/destroy`) across `UserController`, `PhotoController`, `UnknownSampledCreatureController` | **P3** | Empty `//` bodies. | **Dead code, not wired to any route**, so cannot be invoked. Scaffold leftovers from older Laravel resource-controller generation. Zero impact. |

### Not bugs (clarifications vs. previous reviews)

- **`/v1/creatures/{creature}` is not shadowing `/riverdetectives` or
  `/search`.** The global pattern `[1-9][0-9]*` constrains `{creature}` to
  digits; literal-segment routes match first on non-numeric paths.
- **All `PhotoController` upload/fetch methods exist.** The four
  `/samples/{sample}/photos` + `/samples/{sample}/creatures/{creature}/photos`
  methods (`getSamplePhotos`, `storeSamplePhoto`, `getSampledCreaturePhotos`,
  `storeSampledCreaturePhoto`) are implemented in
  `PhotoController.php` (lines 110-213) and wired in `routes/api.php`.
  Earlier reviews against the upgrade branch reported them missing —
  they are not missing on master.

---

## 10. Phone-app integration gotchas

The things that will bite the mobile developer.

1. **Photo upload is JPEG-only at 4 MB max.** Validation in every upload
   route: `'photo' => 'required|mimes:jpeg|max:4096'`. Modern phones
   default to **HEIC** (≈ 6 MB). The phone app **must** convert to JPEG
   and downsize client-side before upload. There is no HEIC decoder
   server-side (GD driver is configured in `config/image.php`).
2. **Every sample response carries the full graph.** `Sample` has
   `$with = ['sampledCreatures','habitat','photos']`. Fine for single-item
   responses; expensive for `GET /v1/samples` (see next point).
3. **`GET /v1/samples` has no pagination.** It returns every sample ever
   submitted by the authenticated user as a single array — plus the full
   graph — plus the `score` / `weighted_score` accessor queries. For
   power users this will scale linearly into the hundreds.
4. **Score accessors are not memoised.** `getScoreAttribute` and
   `getWeightedScoreAttribute` each run their own DB query on every
   serialisation. For a 50-sample list endpoint that's 100 extra
   queries. If you need to poll, poll `/v1/samples/{sample}` instead.
5. **`sample_date` must be strict ATOM.** `date_format:\DateTime::ATOM`
   is exact. Serialisers that drop the colon in the TZ offset or emit a
   literal `Z` will fail validation.
6. **Uniqueness on `(user_id, lat, lng, sample_date)` is 7-dp exact.**
   1 m GPS jitter will create a second row. If the phone app retries on
   flaky networks, add client-side dedupe.
7. **Throttle is 60 req/min** per user. Batch submission flows must
   back-off on HTTP 429.
8. **`count` on sampled creatures is unbounded.**
   `'creatures.*.count' => 'required|int'` — negatives and INT_MAX are
   accepted. Validate locally.
9. **`PUT /v1/unknownSampledCreatures/{id}.creature_id` is `sometimes`.**
   Calling `PUT` with only a count leaves the creature unidentified.
10. **`photoable_id` / `photoable_type` are hidden from `/v1/photos/{id}`
    JSON.** You cannot determine which `Sample` or `SampledCreature` a
    given `Photo` is attached to from a Photo show response. Track the
    association client-side at upload time.
11. **`PUT /v1/user/password` appears unused.** The endpoint exists but
    has no `save()` call — §9 #1. The working password-reset flow is
    `POST /v1/password/email` → emailed reset link → web reset form.
    Don't wire the phone app against `PUT /v1/user/password` without
    fixing it first.
12. **`config/cors.php` does not exist.** The app leans on Laravel 12's
    permissive package default. Not a problem for mobile clients; will
    bite a browser-based client.
13. **Photo deletion is file-system-coupled and immediate.** Both the
    `PhotoDeleting` event and the `PhotoObserver::deleting` observer
    delete the backing file the moment the DB row is deleted. A failed
    transaction after photo deletion cannot be rolled back.

---

## 11. Environment / deployment

### 11.1 Environment variables actually read by the application

Beyond Laravel/DB defaults. Sourced from `.env.example` and a code sweep of
`env(`:

| Variable | Default | Purpose |
|---|---|---|
| `OAUTH_CLIENT_CREDENTIAL_ID` | `1` | Used by `TokenController::issueServerAccessToken` as the `client_id`. Must match a Passport client row configured for `client_credentials`. |
| `ALLOWED_OAUTH_NETWORKS` | `google,facebook,twitter` | Comma-separated whitelist for the `oauth_network` column. Values outside the list are silently nulled. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | — | Socialite driver. |
| `TWITTER_KEY` / `TWITTER_SECRET` / `TWITTER_REDIRECT_URI` | — | Socialite driver. (Facebook credentials are **not** in `.env.example` despite being in the default `ALLOWED_OAUTH_NETWORKS` list.) |
| `MAX_IMAGE_DIMENSION` | `1280` | Longest side of resized JPEG. Applied via `->widen()` + `->heighten()` + `->orientate()`. |
| `RESIZE_MEMORY_LIMIT` | `256M` (env example), `128M` (fallback) | `ini_set('memory_limit', ...)` in `PhotoController::__construct`. |
| `PER_PAGE` | `10` | Admin paginator default. |
| `PAGINATION_QUANTITIES` | `10,30,50` | Admin page-size dropdown. |
| `FILESYSTEM_DRIVER` | `local` | Default disk — photos live on it. Switch to `s3` + `AWS_*` for production. |
| `APP_URL` | `http://localhost` | Used by `PublicController::swagger` to substitute `[BASE_URL]` → `<APP_URL>/v1` in `storage/swagger.yaml`. |

### 11.2 Storage paths

- **Photos:** `storage/app/{md5filename}.{extension}` on the `local` disk.
  No sharding — flat directory. Will need a prefix/sharding scheme at
  volume.
- **Swagger spec:** `storage/swagger.yaml`, served at `GET /swagger` with
  `[BASE_URL]` substituted at request time.
- **Passport keys:** `storage/oauth-private.key`, `storage/oauth-public.key`
  — committed to the repo today (fine for dev; rotate and gitignore for
  production).

### 11.3 Email

- **One** code path triggers outbound email to real users:
  `POST /v1/password/email` → `Auth\ForgotPasswordController@sendResetLinkEmailViaAPI`
  → `Password::broker()->sendResetLink(...)` — the built-in Laravel
  password-reset email to any `users.email`.
- Nothing else in the app calls `Mail::`, `->notify()` or
  `sendEmailVerificationNotification()`. Registration, sample submission,
  review notifications: all silent.

### 11.4 Log noise — recurring `OAuthServerException` entries

The production `laravel.log` repeatedly shows lines of the form:

```
prod.ERROR: The resource owner or authorization server denied the request.
{"exception":"[object] (League\\OAuth2\\Server\\Exception\\OAuthServerException(code: 9) …
  at …/vendor/league/oauth2-server/src/Exception/OAuthServerException.php:243)"}
```

**What it means.** `code: 9` in `league/oauth2-server` is the
`accessDenied()` exception, thrown from
`ResourceServer::validateAuthenticatedRequest()` whenever a request hits
a route inside `auth:api` (i.e. anything in `routes/api.php` under the
Passport-guarded group, or `routes/data-api.php`) with a bearer token
that is **missing, malformed, expired, revoked, or signed with a key
that doesn't match `storage/oauth-public.key`**. Passport re-throws it
and Laravel's exception handler renders a `401 Unauthorized` JSON body
to the client — **and also writes a full stack trace to the log at
`ERROR` level**. The 401 response itself is correct behaviour; only the
log level is wrong.

**Not a live incident.** Every observed occurrence correlates with a
client-side token problem, not a server fault:

1. Phone app holding an access token past its TTL (Passport default =
   1 year for password grant, but any value configured in
   `AuthServiceProvider` applies) and retrying before the refresh-token
   flow completes.
2. Users who signed out on one device while another device still has
   the old token cached — every background sync from the stale device
   produces one of these lines.
3. The public-portal cron (see §5) hitting `/data/v1/...` with an
   expired client-credentials token between its nightly re-mint cycles.
4. Unauthenticated probes / scanners hitting `/v1/*` URLs with no
   `Authorization` header at all. `ResourceServer` still raises the
   same `accessDenied` exception, so scanner traffic inflates the
   count.

None of these indicate the Passport keys are wrong or that the server
is rejecting valid tokens — if that were the case, **every** request
would fail and the phone app would be unusable. It isn't.

**Why it's noisy.** Laravel's default `ExceptionHandler::$dontReport`
list does not include `League\OAuth2\Server\Exception\OAuthServerException`
or Passport's wrapper, so routine 401s get logged at `ERROR` just like
genuine server faults. There is no custom `report()` override in
`App\Exceptions\Handler` to downgrade them. Result: the signal-to-noise
ratio of `laravel.log` is dominated by client-auth failures, which
makes real errors harder to spot and can trip log-volume alerts.

**Recommended fix (low risk, no behaviour change for clients).** Add
`OAuthServerException` (and optionally
`Laravel\Passport\Exceptions\OAuthServerException`, the Passport
subclass) to `$dontReport` in `App\Exceptions\Handler`, **or** override
`report()` to log them at `info` / `warning` level with just the
message + the bearer-token prefix, not the full stack. The 401
response to the client is produced by `render()` and is unaffected.

**Don't** start suppressing these without first eyeballing a day's
worth: if the same `client_id` or the same user-id appears thousands
of times per hour you've probably got a phone-app build in the field
that isn't honouring token expiry / refresh correctly, and **that** is
worth a ticket. Today's rate is consistent with background stale-token
chatter, not a bug.

**P3** — pure log hygiene, no user-visible or data-integrity impact.

---

## 12. Swagger / OpenAPI spec drift

`storage/swagger.yaml` (v0.3.2) served at `GET /swagger` with `[BASE_URL]`
substituted to `<APP_URL>/v1` at request time. **Every path registered in
`routes/api.php` is documented** — no missing endpoints. What the spec
*does* drift on is request validation rules and response shape. Items
below matter for anyone code-generating a client from the spec.

### 12.1 Documented-but-wrong request rules

1. **`SampleCreateData.required` lists `habitat` and `complete`.** Neither
   is actually required by `SampleController::store`:
   - `habitat.*` is `nullable|int|between:0,100` — you can omit the whole
     `habitat` object.
   - `complete` is `nullable|boolean` — optional.
   A client that trusts the spec will bloat every submission with a
   wasted habitat block and a placeholder `complete` value.
2. **`SampleUpdateData.required` lists `id`.** The id travels in the URL
   (`/samples/{sample}`); the update controller never reads a body `id`
   and doesn't require it. Spec artefact — remove.
3. **`LocalUserData` omits `name` from its required list** but
   `UserController::store` validates `'name' => 'required|max:255'` for
   non-social registration. A spec-compliant request with no `name` will
   422.
4. **`SocialUserData` marks `email` required in the request body.**
   `UserController::store($userType='social')` pulls `email` (and `name`)
   from the OAuth provider via
   `SocialUser::populateRequestWithSocialData()`. Clients **should not**
   send `email` — they send `oauth_token` + `oauth_network` and the
   server fills in the rest.
5. **`UnknownSampledCreatureCreateData` isn't valid OpenAPI.** The
   `allOf` branch declares `count: required: true` and
   `photo: required: true` outside a `properties:` wrapper and without
   using the top-level `required` array. Generators either silently drop
   the requirement or fail to parse. The server actually requires both
   (`'count' => 'required|int'`, `'photo' => 'required|mimes:jpeg|max:4096'`).

### 12.2 Documented-but-wrong response shape

6. **`SampleData` is missing `reviewed` and `corrected`.** Both columns
   have no `$hidden` entry on `App\Sample`, so every sample response
   (including `GET /v1/samples/{id}` to the phone-app user) emits them.
   The phone app will see two boolean fields the spec doesn't describe.
7. **`PhotoData.mimetime` is a typo.** The model attribute (and DB column)
   is `mimetype`; clients deserialising strictly by key will miss it.
8. **`CreatureData` documents `ala_guid`** as a required field. The
   `creatures` table does not have that column (not in any migration, not
   set by the commented-out importer). Field never appears on responses.
9. **`SampledCreatureData` has `photos_count` but not `photos`.** Actual
   `UnknownSampledCreatureController::updateUnknownSampledCreature` and
   `SampleController::storeUnknownSampledCreature` both call
   `->load('photos')` before returning, so responses carry a full
   `photos` array of `PhotoData` alongside the scalar `photos_count`.
   Missing from the schema.
10. **`POST /v1/samples/{sample}/unknownCreatures` documents a `201`**
    response, but the controller just `return $unknownSampledCreature;`
    which Laravel serialises as **`200 OK`**. Status-code mismatch.
11. **`PUT /v1/samples/{sample}` declares no `422` response** even though
    `validateRelatedModelData()` and the inline validator can both
    throw `ValidationException`. Add `422` for parity with `POST /samples`.

### 12.3 Undocumented behaviour

12. **Rate limiting.** `RouteServiceProvider::boot` sets 60 req/min per
    authenticated user (else per-IP). The spec doesn't mention throttling
    or the `429 Too Many Requests` response.
13. **Always-eager-loaded relations.** `App\Sample` declares
    `$with = ['sampledCreatures', 'habitat', 'photos']`, so every
    sample response (single, list, post-create) already contains the
    full graph. Clients that build separate requests for
    `/samples/{sample}/photos` etc. because the spec shows them as
    separate endpoints are paying double.
14. **`score` / `weighted_score` are server-computed accessors**, not
    columns. The spec documents them correctly on `SampleData` but
    doesn't explain they are re-derived on every serialisation from
    `scores.score` joined through `sampled_creatures`.

### 12.4 Not mismatches (checked & clean)

- All 30 route-path/method combinations exist in both places.
- `/v1/creatures/{creature}` ordering vs `/riverdetectives` + `/search`
  is safe due to the `[1-9][0-9]*` route pattern (see §3) — the spec
  ordering is fine.
- `UnknownSampledCreatureData.creature_id` being "always null" is
  enforced by the route binding (`whereNull('creature_id')`).
- `SampledCreatureData.photos_count` matches the `withCount('photos')`
  on `Sample.sampledCreatures()`.

Net: the spec is **structurally complete** but needs a validation-
versus-docs reconciliation pass. Suggest it go into the same grooming
session as any phone-app client bump.



