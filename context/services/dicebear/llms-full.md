# DiceBear documentation

> DiceBear is a free, open source avatar library and avatar API with 61 avatar styles, 19 of them animated. Avatars are generated deterministically from a seed: the same seed always produces the same SVG.

Current release: **10.7.0**. The HTTP API serves it under `https://api.dicebear.com/10.x/`.

DiceBear is not a JavaScript library with wrappers around it. There are seven
native cores, and they are held to byte-identical output: the same style, seed
and options produce the same SVG in all of them. Only the syntax for passing
the options differs. Six of the seven are recent, so a model that has not read
this file is likely to claim they do not exist: PHP shipped in 10.0.0, Python
in 10.1.0, Rust and Go in 10.2.0, Dart in 10.3.0, C# in 10.7.0.

- JavaScript: `@dicebear/core` + `@dicebear/styles` (10.7.0), https://www.dicebear.com/integrations/javascript/
- PHP: `dicebear/core` + `dicebear/styles` (^10.0), https://www.dicebear.com/integrations/php/
- Python: `dicebear-core` + `dicebear-styles` (10.7.0), https://www.dicebear.com/integrations/python/
- Rust: `dicebear-core` + `dicebear-styles` (10.7.0), https://www.dicebear.com/integrations/rust/
- Go: `github.com/dicebear/dicebear-go/v10` + `github.com/dicebear/styles/v10` (v10), https://www.dicebear.com/integrations/go/
- Dart: `dicebear_core` + `dicebear_styles` (10.7.0), https://www.dicebear.com/integrations/dart/
- C#: `DiceBear.Core` + `DiceBear.Styles` (10.7.0), https://www.dicebear.com/integrations/csharp/
- CLI: `dicebear` (10.7.0), https://www.dicebear.com/integrations/cli/
- Converter: `@dicebear/converter` (10.7.0), https://www.dicebear.com/integrations/javascript/converter/

Older API versions (`5.x` through `9.x`) are still served for backwards
compatibility, so a URL built from them keeps working and an outdated answer
looks correct. Write `10.x` for new code.

The pre-v10 JavaScript API no longer exists: `createAvatar()`,
`@dicebear/collection` and individual style packages such as
`@dicebear/lorelei` were all removed in 10.0.0. The other six cores have no
pre-v10 form at all, so any older-looking API attributed to them is invented.
In every core, an option named after a component ends in `Variant`
(`eyesVariant`, not `eyes`). The outdated patterns are listed at
https://www.dicebear.com/start/for-ai-assistants/.

This file holds every documentation page. The prose comes first, then a compact
list of the 61 avatar styles, then one section per style with its
license, its loading snippet in all seven languages, and its full option table.

---

Source: https://www.dicebear.com/start/

# Your first avatar

You don't need to install anything. Every DiceBear avatar has a URL, and any
`<img>` tag can show it:

```html
<img src="https://api.dicebear.com/10.x/lorelei/svg?seed=Alice" alt="avatar" />
```

Two things in that URL shape the avatar: the style, here `lorelei`, and the
`seed`. The style sets the look, the seed picks a unique avatar within it, and
the same seed always returns the same result. `Alice` gets the same face today,
tomorrow, and on every device. Type something into the field below, watch four
styles react, and click a tile to see its URL:

That's the whole idea. Use a username or user ID as the seed and every person in
your app gets a stable avatar, without uploads and without storing images.

## Pick a style

The four styles above are a taste of 61, drawn by different artists,
from minimal geometric marks to fully illustrated characters and robots. No
other avatar library offers a collection like it, and switching is one word in
the URL:

```html
<img src="https://api.dicebear.com/10.x/bottts/svg?seed=Alice" alt="avatar" />
```

Take a stroll through the [style gallery](https://www.dicebear.com/styles/): every style has its own
page with live previews, and somewhere in there is the one that fits your
project.

## Make it yours

Styles come with options. Some are shared by all of them, like background color,
flip, and scale, and most styles add their own on top, like hair, eyes, or
accessories. Options ride along in the URL as query parameters:

```html
<img
  src="https://api.dicebear.com/10.x/lorelei/svg?seed=Alice&flip=true&backgroundColor=b6e3f4"
  alt="avatar"
/>
```

You'll find each style's options on its page in the gallery. Or skip the
reading: the [Playground](https://www.dicebear.com/playground/) lets you click a configuration together
and copy the finished URL.

## Generate avatars in your own code

If you'd rather create avatars locally, without a request to the API, use one of
the libraries. In JavaScript:

```
npm install @dicebear/core @dicebear/styles
```

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, { seed: 'Alice' });

const svg = avatar.toString();
```

The same libraries exist for PHP, Python, Rust, Go, Dart, and C#, all with the
same behavior: the seed `Alice` renders the same avatar in every language.
Unsure which route fits your project? The
[integration picker](https://www.dicebear.com/start/pick-your-integration/) sorts it out in three
questions.

## Where to next?

- Want motion? 19 styles [animate](https://www.dicebear.com/animated-avatars/) with
  plain CSS and play in a normal `<img>` tag.
- Read up on [options](https://www.dicebear.com/customize/options/) like size, background, and flip.
- Building with a framework? There are guides for
  [React](https://www.dicebear.com/integrations/javascript/react/),
  [Vue](https://www.dicebear.com/integrations/javascript/vue/),
  [Svelte](https://www.dicebear.com/integrations/javascript/svelte/), and more.

---

Source: https://www.dicebear.com/start/for-ai-assistants/

# DiceBear for AI assistants

Coding assistants write DiceBear from memory, and that memory mostly predates
version 10. The block below is the fix: paste it into your project and the
assistant has the current package for your language, the shape of the API, and
the address to look options up at.

## Rules for your project

Assistants read a rules file from the repository they work in, usually
`AGENTS.md`. Everything an assistant needs is in this one block:

```md
## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + github.com/dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    npm install @dicebear/collection             ->  npm install @dicebear/styles
    npm install @dicebear/lorelei                ->  npm install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.
```

If your assistant can fetch URLs, one sentence covers most of what the block
says:

> Read https://www.dicebear.com/llms.txt before you write DiceBear code.

## Seven libraries, identical output

DiceBear is not a JavaScript library with wrappers around it. Seven native cores
are held to byte-identical output, so the same style, seed and options produce
the same SVG in each. Only the syntax for passing the options differs.

| Library                                 | Packages                                                | Since  |
| --------------------------------------- | ------------------------------------------------------- | ------ |
| [JavaScript](https://www.dicebear.com/integrations/javascript/) | `@dicebear/core`, `@dicebear/styles`                    | 10.0.0 |
| [PHP](https://www.dicebear.com/integrations/php/)               | `dicebear/core`, `dicebear/styles`                      | 10.0.0 |
| [Python](https://www.dicebear.com/integrations/python/)         | `dicebear-core`, `dicebear-styles`                      | 10.1.0 |
| [Rust](https://www.dicebear.com/integrations/rust/)             | `dicebear-core`, `dicebear-styles`                      | 10.2.0 |
| [Go](https://www.dicebear.com/integrations/go/)                 | `github.com/dicebear/dicebear-go/v10`, `.../styles/v10` | 10.2.0 |
| [Dart](https://www.dicebear.com/integrations/dart/)             | `dicebear_core`, `dicebear_styles`                      | 10.3.0 |
| [C#](https://www.dicebear.com/integrations/csharp/)             | `DiceBear.Core`, `DiceBear.Styles`                      | 10.7.0 |

Six of the seven shipped during 2026, which puts them outside most training
data. That is why the block above names them explicitly: without it, an
assistant will tell you there is no DiceBear library for your language and hand
you JavaScript.

Each [style page](https://www.dicebear.com/styles/) carries the loading snippet for all seven languages,
so one page covers whichever you are working in.

## Machine-readable sources

| Address                                  | Contents                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `https://www.dicebear.com/llms.txt`      | Index of the documentation, current package versions, and every avatar style                           |
| `https://www.dicebear.com/llms-full.txt` | Every page in one file: guides first, then all styles with their option tables (about half a megabyte) |
| Any page URL plus `index.md`             | That single page as Markdown                                                                           |

The Markdown version of a page sits next to its HTML, so appending `index.md` to
the address is enough:

```
https://www.dicebear.com/integrations/http-api/index.md
```

Each page also links to its Markdown version from the header, so you do not have
to edit the address yourself.

Option names are what assistants invent most often, and the API answers that
question directly, without a page to parse:

```
https://api.dicebear.com/10.x
https://api.dicebear.com/10.x/<styleName>/options.json
https://api.dicebear.com/10.x/<styleName>/definition.json
```

The version root lists the available style names.
[`options.json`](https://www.dicebear.com/integrations/http-api/#style-definition-and-options) describes
every option a style takes, including its type, its range, and the exact enum
values. The same table is printed on each [style page](https://www.dicebear.com/styles/).

## Why the old calls need spelling out

**How an outdated call passes for a working one**

The HTTP API drops a query parameter it does not recognize. `radius=50` returns
a square avatar, `eyes=variant01` returns whatever eyes the seed picked, and
neither reports a problem. Versions `5.x` through `9.x` are still served, so a
URL built for the old API keeps working. `@dicebear/collection` is still on npm
at its last 9.x release, so that install succeeds as well.

The one exception is the retired `avatars.dicebear.com` host, which answers
`410 Gone`.

Nothing here is a defect you need to work around. Old versions stay available on
purpose, and dropping unknown parameters is what keeps a URL from breaking when
a style changes. The combination is only a problem when the code was written
from memory rather than from the current docs, which is why the block above
lists the pairs explicitly.

**What changed in 10.0.0**

Every option named after a component gained a `Variant` suffix, so `eyes` became
`eyesVariant`. The avatar styles moved out of individual packages and into
`@dicebear/styles` as JSON definitions, and `createAvatar()` was replaced by the
`Style` and `Avatar` classes. The
[changelog](https://github.com/dicebear/dicebear/blob/10.x/CHANGELOG.md) has the
full list, and the [JavaScript library page](https://www.dicebear.com/integrations/javascript/)
documents the current classes.

## Crawling and training

The [robots.txt](https://www.dicebear.com/robots.txt) allows assistants and
their crawlers; only the site notice is excluded. The documentation is
[MIT licensed](https://github.com/dicebear/dicebear/blob/10.x/LICENSE); the
avatar styles are not, and each one carries [its own license](https://www.dicebear.com/licenses/).

---

Source: https://www.dicebear.com/start/pick-your-integration/

# Pick your integration

DiceBear runs as an API, as a library in seven languages, as a CLI, and as a
browser-based editor. They all produce identical avatars from the same seed, so
this is not a decision you can get wrong, and you can switch later without your
avatars changing. It's only a question of what fits your project best.

Three questions narrow it down:

**Can you point an `<img>` tag at a URL?** Then the
[HTTP API](https://www.dicebear.com/integrations/http-api/) is the shortest path. It's free, needs no
installation, and works from any language and platform.

**Do you want avatars generated on your own infrastructure?** Use a library.
Your user data stays on your systems and there's no external request per avatar.
Pick your language below.

**Do you need image files rather than running code?** The
[CLI](https://www.dicebear.com/integrations/cli/) exports batches to SVG, PNG, JPEG, and more. And for a
single avatar, say a default profile picture for your app, the
[Editor](https://editor.dicebear.com) is the no-code way.

## The libraries

| Language   | Package(s)                                 | Guide                                   |
| ---------- | ------------------------------------------ | --------------------------------------- |
| JavaScript | `@dicebear/core` + `@dicebear/styles`      | [JS library](https://www.dicebear.com/integrations/javascript/) |
| PHP        | `dicebear/core` + `dicebear/styles`        | [PHP library](https://www.dicebear.com/integrations/php/)       |
| Python     | `dicebear-core` + `dicebear-styles`        | [Python library](https://www.dicebear.com/integrations/python/) |
| Rust       | `dicebear-core` + `dicebear-styles`        | [Rust library](https://www.dicebear.com/integrations/rust/)     |
| Go         | `dicebear/dicebear-go` + `dicebear/styles` | [Go library](https://www.dicebear.com/integrations/go/)         |
| Dart       | `dicebear_core` + `dicebear_styles`        | [Dart library](https://www.dicebear.com/integrations/dart/)     |
| C#         | `DiceBear.Core` + `DiceBear.Styles`        | [C# library](https://www.dicebear.com/integrations/csharp/)     |

Frameworks build on these: guides exist for
[React](https://www.dicebear.com/integrations/javascript/react/),
[React Native](https://www.dicebear.com/integrations/javascript/react-native/),
[Vue](https://www.dicebear.com/integrations/javascript/vue/),
[Svelte](https://www.dicebear.com/integrations/javascript/svelte/),
[Angular](https://www.dicebear.com/integrations/javascript/angular/),
[Next.js](https://www.dicebear.com/integrations/javascript/next-js/),
[Nuxt](https://www.dicebear.com/integrations/javascript/nuxt/), [Flutter](https://www.dicebear.com/integrations/dart/flutter/),
[Unity](https://www.dicebear.com/integrations/csharp/unity/), and [Godot](https://www.dicebear.com/integrations/csharp/godot/).

## Still unsure?

Start with the [HTTP API](https://www.dicebear.com/integrations/http-api/). It requires the least setup,
and because every integration renders the same avatars, moving to a library
later is a refactor, not a redesign.

---

Source: https://www.dicebear.com/start/what-is-dicebear/

# What is DiceBear?

DiceBear generates avatars. You give it a seed, it gives you an SVG image, and
the same seed always returns the same image. That one property makes it useful
for user profiles: use the username or user ID as the seed and every person in
your app has a consistent avatar without ever uploading a picture.

The look comes from [avatar styles](https://www.dicebear.com/styles/). There are 61 of them,
drawn by different artists, ranging from abstract shapes to illustrated
characters and robots. That collection is what sets DiceBear apart: no other
avatar library has one like it, and all of it is one word in your code or URL
away. Every style has options such as background color, flip, or scale, and most
add their own, like hair, eyes, or accessories. So an avatar is the answer to
three questions: which style, which seed, which options. Curious what happens
under the hood? [How avatars are made](https://www.dicebear.com/understand/how-avatars-are-made/) walks
through it.

## Where it runs

Anywhere, in practice. Libraries for JavaScript, PHP, Python, Rust, Go, Dart,
and C# generate avatars directly in your code. The free HTTP API serves them by
URL for everything else. A CLI covers batch exports, and the
[Editor](https://editor.dicebear.com) works without any code at all. The
[integration picker](https://www.dicebear.com/start/pick-your-integration/) helps you choose. Whatever
you pick, results match: the seed `Alice` renders the same avatar in every
library and on the API.

## Privacy

The libraries generate avatars entirely on your infrastructure, so no data about
your users leaves your systems. If you want the URL-based workflow with the same
control, the HTTP API is open source and
[self-hostable](https://www.dicebear.com/recipes/self-host-the-http-api/).

## Free and open source

The DiceBear code is MIT licensed. The avatar styles carry licenses chosen by
their artists, and the [license overview](https://www.dicebear.com/licenses/) shows all of them in one
place.

---

Source: https://www.dicebear.com/integrations/cli/

# CLI

With the CLI you can generate large numbers of avatars in a single run.

## Installation

Make sure you have [Node.js](https://nodejs.org/en/) (version 22 or higher) and
npm installed.

```
npm install dicebear --global
```

## Upgrade

For the latest features and avatar styles, make sure you update the CLI
regularly.

```
npm install dicebear --global
```

## Usage

### Create an avatar

Replace `<style>` with an avatar style name (lowercase, kebab-case for
multi-word styles, e.g. `lorelei`, `pixel-art`, `adventurer-neutral`) and
`[outputPath]` with a target directory. If `[outputPath]` is omitted, the
current directory is used as target directory.

```
dicebear <style> [outputPath]
```

For example, to create an avatar with the [lorelei](https://www.dicebear.com/styles/lorelei/) avatar
style, use the following command:

```
dicebear lorelei ./avatars
```

The avatar will be saved as `lorelei-0.svg` in the `./avatars` directory.

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

### Create multiple avatars

You can also create multiple avatars at once with the `--count` option. Replace
`<count>` with the number of avatars to create.

```
dicebear <style> [outputPath] --count <count>
```

For example, to create 100 avatars:

```
dicebear lorelei ./avatars --count 100
```

This generates files named `lorelei-0.svg`, `lorelei-1.svg`, ...,
`lorelei-99.svg`.

> [!WARNING]
> The `seed` option has no effect in combination with the `count` option. If
> `count` is greater than `1`, random values are generated and used as `seed` to
> make the avatars differ from each other.

> [!TIP] Performance
> The CLI uses parallel processing based on your CPU cores, so large batches of
> avatars generate quickly.

### Output formats

You can create avatars in various formats using the `--format` option:

| Format | Description                        |
| ------ | ---------------------------------- |
| `svg`  | Scalable Vector Graphics (default) |
| `png`  | PNG image                          |
| `jpg`  | JPEG image                         |
| `jpeg` | JPEG image (alias for jpg)         |
| `webp` | WebP image                         |
| `avif` | AVIF image                         |
| `json` | JSON with avatar metadata          |

Example:

```
dicebear lorelei ./avatars --format png
```

#### Controlling the output image size

`--size` controls the output dimensions (width and height in pixels) for all
formats. The default is `512`. For rasterized formats (PNG, JPEG, WebP, AVIF)
the value is capped at `2048`.

```
dicebear lorelei ./avatars --format png --size 256
```

#### Adding Exif metadata

When creating PNG, JPEG, WebP, or AVIF images, you can include Exif metadata:

```
dicebear lorelei ./avatars --format png --exif
```

#### Saving JSON alongside images

You can save a JSON file with avatar metadata alongside each image:

```
dicebear lorelei ./avatars --format png --json
```

This creates both `lorelei-0.png` and `lorelei-0.json` for each avatar.

### Passing style options

Each avatar style has its own customization options. To see all available
options for a specific style, use `--help`:

```
dicebear lorelei --help
```

Example output:

```
dicebear lorelei [outputPath]

Generate "lorelei" avatar(s)

Options:
      --version            Show version number                         [boolean]
      --help               Show help                                   [boolean]
      --count              Defines how many avatars to create.          [number]
      --format                [string] [choices: "svg", "png", "jpg", ...]
      --exif               Include Exif Metadata                       [boolean]
      --json               Save JSON file in addition to image file    [boolean]
      --seed                                                            [string]
      --flip                                                            [string]
      --rotate                                                          [number]
      --scale                                                           [number]
      --borderRadius                                                    [number]
      --size                                                            [number]
      --backgroundColor                                                  [array]
      --translateX                                                      [number]
      --translateY                                                      [number]
      --idRandomization                                                [boolean]
      --title                                                           [string]
      --fontFamily                                                      [string]
      --fontWeight                                                      [number]
      ... (style-specific options)
```

Example with options:

```
dicebear lorelei ./avatars --backgroundColor b6e3f4,c0aede,d1d4f9 --size 128
```

### Output file naming

Files are named using the pattern `{style}-{index}.{format}`:

- `lorelei-0.svg`
- `lorelei-1.png`
- `avataaars-0.webp`

The index starts at 0 and increments for each avatar created.

> [!WARNING] File overwrite protection
> The CLI will **not** overwrite existing files. If a file already exists at the
> target path, an error will be thrown. Make sure to use an empty directory or
> remove existing files before generating new avatars.

### License banner

Before generating avatars, the CLI displays a license banner with information
about the style's creator and license:

```
----------------------------------------------------------------
Lorelei by Lisa Wischofsky
Homepage: https://www.instagram.com/lischi_art/
Source: https://www.figma.com/community/file/1198749693280469639
License: CC0 1.0 - https://creativecommons.org/publicdomain/zero/1.0/
----------------------------------------------------------------
```

### Show help

For general help and a list of all available styles:

```
dicebear --help
```

```
dicebear <command>

Commands:
  dicebear adventurer [outputPath]          Generate "adventurer" avatar(s)
  dicebear adventurer-neutral [outputPath]  Generate "adventurer-neutral" avatar(s)
  dicebear avataaars [outputPath]           Generate "avataaars" avatar(s)
  dicebear avataaars-neutral [outputPath]   Generate "avataaars-neutral" avatar(s)
  dicebear big-ears [outputPath]            Generate "big-ears" avatar(s)
  dicebear big-ears-neutral [outputPath]    Generate "big-ears-neutral" avatar(s)
  dicebear big-smile [outputPath]           Generate "big-smile" avatar(s)
  dicebear bottts [outputPath]              Generate "bottts" avatar(s)
  dicebear bottts-neutral [outputPath]      Generate "bottts-neutral" avatar(s)
  dicebear croodles [outputPath]            Generate "croodles" avatar(s)
  dicebear croodles-neutral [outputPath]    Generate "croodles-neutral" avatar(s)
  dicebear dylan [outputPath]               Generate "dylan" avatar(s)
  dicebear fun-emoji [outputPath]           Generate "fun-emoji" avatar(s)
  dicebear glass [outputPath]               Generate "glass" avatar(s)
  dicebear icons [outputPath]               Generate "icons" avatar(s)
  dicebear identicon [outputPath]           Generate "identicon" avatar(s)
  dicebear initial-face [outputPath]        Generate "initial-face" avatar(s)
  dicebear initials [outputPath]            Generate "initials" avatar(s)
  dicebear lorelei [outputPath]             Generate "lorelei" avatar(s)
  dicebear lorelei-neutral [outputPath]     Generate "lorelei-neutral" avatar(s)
  dicebear micah [outputPath]               Generate "micah" avatar(s)
  dicebear miniavs [outputPath]             Generate "miniavs" avatar(s)
  dicebear notionists [outputPath]          Generate "notionists" avatar(s)
  dicebear notionists-neutral [outputPath]  Generate "notionists-neutral" avatar(s)
  dicebear open-peeps [outputPath]          Generate "open-peeps" avatar(s)
  dicebear personas [outputPath]            Generate "personas" avatar(s)
  dicebear pixel-art [outputPath]           Generate "pixel-art" avatar(s)
  dicebear pixel-art-neutral [outputPath]   Generate "pixel-art-neutral" avatar(s)
  dicebear rings [outputPath]               Generate "rings" avatar(s)
  dicebear shape-grid [outputPath]          Generate "shape-grid" avatar(s)
  dicebear shapes [outputPath]              Generate "shapes" avatar(s)
  dicebear thumbs [outputPath]              Generate "thumbs" avatar(s)
  dicebear toon-head [outputPath]           Generate "toon-head" avatar(s)

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Custom styles

You can use any JSON [definition file](https://www.dicebear.com/create-styles/definition-schema/) as a
style, including your own custom styles or styles exported from the
[Figma plugin](https://www.dicebear.com/create-styles/with-figma/).

Just pass the path to the JSON file instead of a style name:

```
dicebear ./my-style.json ./avatars
```

All available options are automatically detected from the definition. Use
`--help` to see them:

```
dicebear ./my-style.json --help
```

Generate multiple avatars in PNG format:

```
dicebear ./my-style.json ./avatars --count 20 --format png
```

### Compressing a definition file

Definition files exported from the [Figma plugin](https://www.dicebear.com/create-styles/with-figma/)
are already compressed on export. A definition you wrote or edited by hand is
not, and its path data usually has a lot of room left. `--optimize` runs the
same [svgo](https://github.com/svg/svgo) pass over every element tree in the
file and rewrites it in place:

```
dicebear ./my-style.json --optimize
```

```
  my-style.json   25.5 KB -> 22.1 KB (-12.8%)
```

Use `--optimize-precision` to control how many decimals path and transform data
keep. The default is `3`. Lower values compress harder at the cost of accuracy:

```
dicebear ./my-style.json --optimize --optimize-precision 1
```

`--optimize-check` reports whether the file is optimized without writing
anything, and exits with a non-zero status if it is not. This is what you want
in continuous integration:

```
dicebear ./my-style.json --optimize-check
```

Colors, component references, dynamic values, element ids, CSS classes and the
contents of `<style>` elements all survive unchanged, and component `width` and
`height` are never touched. The CLI verifies this on every run and refuses to
write the file if anything moved, so an optimized definition renders the same
avatars as before.

> [!NOTE]
> Optimizing always rewrites the file in place, so `[outputPath]` is ignored. Copy
> the file first if you want to keep the original around. Built-in styles have no
> definition file of their own and cannot be optimized.

## Examples

### Generate a single avatar with a specific seed

```
dicebear avataaars ./avatars --seed "john-doe"
```

### Generate 50 PNG avatars with custom background

```
dicebear bottts ./avatars --count 50 --format png --backgroundColor b6e3f4
```

### Generate avatars with JSON metadata

```
dicebear pixel-art ./avatars --count 10 --format webp --json
```

### Generate initials avatar

```
dicebear initials ./avatars --seed "Alice"
```

## Troubleshooting

### "File already exists" error

The CLI does not overwrite existing files. Either:

- Use an empty output directory
- Delete existing files before regenerating

### Avatar style not found

Style names are lowercase, with hyphens for multi-word styles (e.g. `pixel-art`,
`adventurer-neutral`). Run `dicebear --help` to see all available styles.

### Permission denied

Make sure you have write permissions to the output directory. On Unix systems,
you may need to adjust directory permissions or use `sudo` for global
installation.

---

Source: https://www.dicebear.com/integrations/csharp/

# C# avatar library

Generate avatars in C#, from web backends to games. The library targets
`netstandard2.0` and `net8.0`, so it runs on .NET 8 and newer and on .NET
Framework 4.6.1 and newer. The API mirrors the
[JavaScript library](https://www.dicebear.com/integrations/javascript/), and the output is
byte-identical: the same seed and style produce the same SVG in every DiceBear
library.

Game engines have their own guides. In [Godot](https://www.dicebear.com/integrations/csharp/godot/) the
library runs only on a .NET build of the engine.
[Unity](https://www.dicebear.com/integrations/csharp/unity/) ships neither a NuGet client nor a runtime
SVG renderer, so you have to add both yourself.

## Installation

You need two packages: the core library `DiceBear.Core` and the avatar style
definitions `DiceBear.Styles`.

```sh
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

The styles package embeds every style in the assembly. Like the Go module there
is no per-style opt-in, so a project that ships it carries the whole collection.
Where that matters, skip the package and load the one definition you need from a
file.

## Usage

We use the avatar style [lorelei](https://www.dicebear.com/styles/lorelei/) in our example. You can find
more avatar styles [here](https://www.dicebear.com/styles/). Each style is exposed as a raw-JSON string
(e.g. `Styles.Lorelei`) that you hand to `Style.Parse`.

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Lorelei);

var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "John",
    // ... other options
});

Console.WriteLine(avatar.ToSvg());
```

`Style.Parse` decodes and validates the raw JSON string. If you already hold a
decoded definition as a `JsonNode`, pass it to the `Style` constructor instead.

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
always produces the same avatar:

```csharp
var first = new Avatar(style, new JsonObject { ["seed"] = "user-123" });
var second = new Avatar(style, new JsonObject { ["seed"] = "user-123" });

// first.ToSvg() == second.ToSvg()
```

## Types

### `Style`

A validated, immutable wrapper around a style definition. Build it once from the
definition JSON, then reuse it when generating multiple avatars. Invalid
definitions throw a `StyleValidationException`.

```csharp
var style = Style.Parse(Styles.Lorelei);

var alice = new Avatar(style, new JsonObject { ["seed"] = "Alice" });
var bob = new Avatar(style, new JsonObject { ["seed"] = "Bob" });
```

### `Avatar`

The main class for generating avatars. The constructor takes a `Style` and an
optional `JsonObject` of options. Invalid options throw an
`OptionsValidationException`, circular color references a
`CircularColorReferenceException`. Omitting the options is the same as passing
an empty object.

```csharp
var avatar = new Avatar(style, new JsonObject
{
    // ... options
});
```

`Avatar.FromJson(style, optionsJson)` takes the options as raw JSON text, which
is convenient when they arrive from a request body or a config file.

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input.

```csharp
var descriptor = new OptionsDescriptor(style).ToJson();
```

## Methods

### `ToSvg()` / `ToString()`

**Return type:** `string`

Returns the avatar as SVG in XML format. `ToString()` returns the same string,
so an `Avatar` can be used directly in string interpolation.

```csharp
var avatar = new Avatar(style, new JsonObject { ["seed"] = "Alice" });

var svg = avatar.ToSvg();
// or
svg = avatar.ToString();
```

### `ToJson()`

**Return type:** `string` (a JSON object with the keys `svg` and `options`)

Returns the SVG and the resolved options as JSON text.

```csharp
var avatar = new Avatar(style, new JsonObject { ["seed"] = "Alice" });

var result = avatar.ToJson();

// result → {"svg":"<svg>...</svg>","options":{"flip":"none",...}}
```

The resolved options are also available directly as a `JsonObject` via
`avatar.ResolvedOptions()`.

### `ToDataUri()`

**Return type:** `string`

Returns the avatar as [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme).

```csharp
var avatar = new Avatar(style, new JsonObject { ["seed"] = "Alice" });

var dataUri = avatar.ToDataUri();

// <img src="{dataUri}" alt="Avatar" />
```

## Errors

Invalid input throws instead of returning a result type, which is what a .NET
caller expects. The other language libraries name these types `ValidationError`
after their own conventions.

| Exception                         | Thrown when                                 |
| --------------------------------- | ------------------------------------------- |
| `StyleValidationException`        | A style definition violates the schema      |
| `OptionsValidationException`      | The options violate the schema              |
| `CircularColorReferenceException` | A color in the definition references itself |

Both validation exceptions carry the individual field failures in `Details`,
each with the failing JSON pointer and the schema keyword that rejected it.

## Core options

These options are the same across every DiceBear core. See
[Core options](https://www.dicebear.com/customize/options/) for the full reference. Here are the options
in C# syntax:

```csharp
var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "Alice",
    ["flip"] = "horizontal", // "none", "horizontal", "vertical", "both"
    ["rotate"] = 10, // -360 to 360, or a [min, max] range
    ["scale"] = 0.9, // 0 to 10 (1 = original), or a [min, max] range
    ["borderRadius"] = 50, // 0-50 (50 = circle)
    ["size"] = 128,
    ["translateX"] = 0, // -1000 to 1000 (percent of canvas width)
    ["translateY"] = 0, // -1000 to 1000 (percent of canvas height)
    ["idRandomization"] = true,
    ["title"] = "User Avatar",
    ["fontFamily"] = "Arial", // or new JsonArray("Arial", "Helvetica")
    ["fontWeight"] = 700, // 1-1000
    ["backgroundColor"] = new JsonArray("#b6e3f4", "#c0aede"),
    ["backgroundColorFill"] = "solid", // "solid", "linear", "radial"
});
```

Dynamic component and color options also work the same way. See
[Dynamic component options](https://www.dicebear.com/customize/options/#dynamic-component-options) for
all available patterns.

## Examples

### Rendering in ASP.NET Core

An endpoint that returns the SVG directly:

```csharp
app.MapGet("/avatar/{seed}", (string seed) =>
{
    var avatar = new Avatar(style, new JsonObject { ["seed"] = seed });

    return Results.Content(avatar.ToSvg(), "image/svg+xml");
});
```

Build the `Style` once at startup and keep it in a field or a singleton service.
Validating and decomposing a definition is the expensive part, while rendering
an avatar from an existing `Style` is cheap.

### Avatar with custom background

```csharp
var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "Alice",
    ["backgroundColor"] = new JsonArray("#b6e3f4", "#c0aede", "#d1d4f9"),
});
```

### Fixed size avatar

```csharp
var style = Style.Parse(Styles.Bottts);

var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "robot-42",
    ["size"] = 128,
    ["borderRadius"] = 50, // circular avatar
});
```

### Avatar with transformations

```csharp
var style = Style.Parse(Styles.Avataaars);

var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "Jane",
    ["flip"] = "horizontal",
    ["rotate"] = 10,
    ["scale"] = 0.9,
    ["translateY"] = 5,
});
```

### Multiple avatars on the same page

When rendering multiple avatars on the same page, use `idRandomization` to
prevent SVG ID conflicts:

```csharp
foreach (var seed in new[] { "alice", "bob", "charlie" })
{
    var avatar = new Avatar(style, new JsonObject
    {
        ["seed"] = seed,
        ["idRandomization"] = true,
    });

    Console.WriteLine(avatar.ToSvg());
}
```

### Weighted variant selection

A weighted object makes some variants more likely than others. The lorelei style
selects `happy01` or `happy02` mouths twice as often as `sad01` here:

```csharp
var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "Alice",
    ["mouthVariant"] = new JsonObject
    {
        ["happy01"] = 2,
        ["happy02"] = 2,
        ["sad01"] = 1,
    },
});
```

---

Source: https://www.dicebear.com/integrations/csharp/godot/

# Godot avatar library: using DiceBear with Godot

Godot renders SVG through `Image.LoadSvgFromString`, so an avatar becomes a
texture without any extra dependency. Where the SVG comes from depends on which
build you run. A .NET build can generate it in the game with the
[C# library](https://www.dicebear.com/integrations/csharp/), and any build can fetch a finished avatar
from the [HTTP API](https://www.dicebear.com/integrations/http-api/) with `HTTPRequest`.

The C# library keeps everything local, so it works offline and sends no
requests. The HTTP API needs no packages and is the only option in the standard
build, which runs GDScript alone.

## With the C# library

Add the core library and the style definitions to your project's `.csproj`:

```sh
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

`Image.LoadSvgFromString` takes the SVG text, and `ImageTexture.CreateFromImage`
turns the result into something a `Sprite2D` can draw:

```csharp
using Godot;
using System.Text.Json.Nodes;
using DiceBear;

public partial class AvatarSprite : Sprite2D
{
    public override void _Ready()
    {
        var style = Style.Parse(Styles.Lorelei);

        var svg = new Avatar(style, new JsonObject
        {
            ["seed"] = "John",
            ["size"] = 128,
            // ... other options
        }).ToSvg();

        var image = new Image();
        image.LoadSvgFromString(svg);

        Texture = ImageTexture.CreateFromImage(image);
    }
}
```

Parse the style once and keep it in a field or an autoload. Validating and
decomposing a definition is the expensive part, while rendering an avatar from
an existing `Style` is cheap.

For the full API and the options each style accepts, see the
[C# library reference](https://www.dicebear.com/integrations/csharp/).

### Sizing the texture

The `size` option sets the `width` and `height` of the SVG, and Godot rasterizes
at that resolution. Without it the avatar carries only a `viewBox`, and Godot
falls back to those dimensions. Every style brings its own, so pass `size`
instead of relying on them.

The second argument of `LoadSvgFromString` scales on top of that. Passing `4.0`
to a 128 px avatar gives you a 512 px texture:

```csharp
image.LoadSvgFromString(svg, 4.0f);
```

Rasterize at the size you actually draw, since a texture larger than the sprite
spends memory on detail nobody sees.

### Shipping single definitions

`DiceBear.Styles` embeds every style in the assembly, so a project that ships it
carries the whole collection. To keep the export small, skip the package and add
the definitions you use as project assets:

```csharp
using var file = FileAccess.Open(
    "res://avatars/lorelei.json",
    FileAccess.ModeFlags.Read);

var style = Style.Parse(file.GetAsText());
```

The default export setting, "Export all resources in the project", packs those
JSON files into the PCK, and `FileAccess` reads them in an exported game the
same way.

Style definitions are on [npm](https://www.npmjs.com/package/@dicebear/styles)
and in the
[styles repository](https://github.com/dicebear/styles/tree/main/src).

## With the HTTP API

`HTTPRequest` fetches a finished avatar, and this path works in the standard
build too:

```gdscript
extends Sprite2D

@export var seed_value := "John"

func _ready() -> void:
	var request := HTTPRequest.new()
	add_child(request)
	request.request_completed.connect(_on_request_completed)

	var query := "?seed=%s&size=128" % seed_value.uri_encode()
	request.request("https://api.dicebear.com/10.x/lorelei/svg" + query)

func _on_request_completed(
	result: int,
	code: int,
	_headers: PackedStringArray,
	body: PackedByteArray,
) -> void:
	if result != HTTPRequest.RESULT_SUCCESS or code != 200:
		push_error("Avatar request failed")
		return

	var image := Image.new()
	image.load_svg_from_buffer(body, 1.0)

	texture = ImageTexture.create_from_image(image)
```

The response arrives as bytes, so `load_svg_from_buffer` is the one to use.
Every option is a query parameter. See the
[HTTP API reference](https://www.dicebear.com/integrations/http-api/) for the full list.

## What the renderer leaves out

Godot's SVG renderer ignores `<text>`, so a style that draws its avatar from
letters comes out as a plain colored square.

Blur renders, but a `clip-path` around blurred content is ignored. With a
`borderRadius` the blur spills past the rounded edge instead of being cut off.
The spill is faint, so whether it shows depends on what sits behind the avatar.

Masks, blend modes, gradients and nested references all draw the way they do in
a browser.

---

Source: https://www.dicebear.com/integrations/csharp/unity/

# Unity avatar library: using DiceBear with Unity

You can bring DiceBear avatars into Unity two ways. The
[HTTP API](https://www.dicebear.com/integrations/http-api/) returns finished PNGs that
`UnityWebRequestTexture` loads into a texture, and the
[C# library](https://www.dicebear.com/integrations/csharp/) generates the SVG inside the game.

The HTTP API needs no packages and works on every build target. The C# library
keeps everything local, so it works offline. It also asks more of you: Unity
ships neither a NuGet client nor a runtime SVG renderer, and the renderer you
end up adding covers less of SVG than the styles use. Read
[what the renderer leaves out](#what-the-renderer-leaves-out) before you build
on it.

## With the HTTP API

Request the `png` format and hand the URL to `UnityWebRequestTexture`:

```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

public class UserAvatar : MonoBehaviour
{
    public string seed = "John";
    public RawImage target;

    private IEnumerator Start()
    {
        var url = "https://api.dicebear.com/10.x/lorelei/png"
            + "?seed=" + UnityWebRequest.EscapeURL(seed)
            + "&size=128";

        using (var request = UnityWebRequestTexture.GetTexture(url))
        {
            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError(request.error);
                yield break;
            }

            target.texture = DownloadHandlerTexture.GetContent(request);
        }
    }
}
```

For a `SpriteRenderer` instead of a UI element, wrap the texture in a sprite:

```csharp
var texture = DownloadHandlerTexture.GetContent(request);

GetComponent<SpriteRenderer>().sprite = Sprite.Create(
    texture,
    new Rect(0, 0, texture.width, texture.height),
    new Vector2(0.5f, 0.5f));
```

The PNG format is capped at 256 × 256 pixels. Every option is a query parameter,
and the [HTTP API reference](https://www.dicebear.com/integrations/http-api/) has the full list. If you
would rather not depend on our servers, you can
[host the API yourself](https://www.dicebear.com/recipes/self-host-the-http-api/).

## With the C# library

### Installing the packages

DiceBear ships on NuGet, and Unity has no NuGet client of its own. Add
[NuGetForUnity](https://github.com/GlitchEnzo/NuGetForUnity) through the package
manager, using "Add package from git URL":

```
https://github.com/GlitchEnzo/NuGetForUnity.git?path=/src/NuGetForUnity
```

Then install `DiceBear.Core` and `DiceBear.Styles` from the NuGet window. That
pulls in System.Text.Json and the JSON Schema validator as well. Both DiceBear
packages target `netstandard2.0`, so leave the API compatibility level at .NET
Standard 2.1 in the player settings.

Rendering the SVG needs Unity's Vector Graphics renderer. Unity 6.3 and newer
ship it as a built-in module, where the package on top of it only adds sprite
editor and UGUI support. Before 6.3 the package is the renderer itself. It is
experimental and hidden from the package list, so add it to
`Packages/manifest.json` by hand:

```json
"com.unity.vectorgraphics": "2.0.0-preview.25"
```

### Preparing the SVG

Unity's SVG parser reads two things differently from what DiceBear writes, and
until both are fixed up the avatar comes out as a bare background. These members
belong in the component below:

```csharp
using System.Text.RegularExpressions;

private static readonly Regex RootTag = new Regex("^<svg[^>]*>");
private static readonly Regex InternalHref = new Regex(" href=\"#([^\"]+)\"");

private static string ForVectorGraphics(string svg)
{
    // The parser looks for the older xlink:href form on <use>.
    svg = InternalHref.Replace(svg, " href=\"#$1\" xlink:href=\"#$1\"");

    // It also loses the fill of shapes behind a nested <use> when the root
    // element carries fill="none".
    return RootTag.Replace(svg, root => root.Value
        .Replace("<svg ", "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\" ")
        .Replace(" fill=\"none\"", ""), 1);
}
```

Every official style paints its shapes explicitly, so dropping the root `fill`
changes nothing else.

### Rendering the avatar

`SVGParser` reads the string and `VectorUtils` turns the result into a sprite:

```csharp
using System.IO;
using System.Text.Json.Nodes;
using DiceBear;
using Unity.VectorGraphics;
using UnityEngine;

public class UserAvatar : MonoBehaviour
{
    public string seed = "John";

    private static readonly Style AvatarStyle = Style.Parse(Styles.Lorelei);

    private void Start()
    {
        var svg = new Avatar(AvatarStyle, new JsonObject
        {
            ["seed"] = seed,
            ["size"] = 128,
            // ... other options
        }).ToSvg();

        var scene = SVGParser.ImportSVG(new StringReader(ForVectorGraphics(svg)));

        var geometry = VectorUtils.TessellateScene(scene.Scene, new VectorUtils.TessellationOptions
        {
            StepDistance = 1.0f,
            MaxCordDeviation = 0.25f,
            MaxTanAngleDeviation = 0.05f,
            SamplingStepSize = 0.01f,
        });

        GetComponent<SpriteRenderer>().sprite = VectorUtils.BuildSprite(
            geometry, 100.0f, VectorUtils.Alignment.Center, Vector2.zero, 128);
    }
}
```

Parse the style once and keep it in a static field. Validating and decomposing a
definition is the expensive part, while rendering an avatar from an existing
`Style` is cheap. For the full API and the options each style accepts, see the
[C# library reference](https://www.dicebear.com/integrations/csharp/).

Styles with a gradient background need the package's gradient material on the
renderer. A solid `backgroundColor` avoids that.

### Trimming the build

`DiceBear.Styles` embeds every style in the assembly. To keep the build small,
skip the package and load the one definition you ship from `Resources`:

```csharp
var definition = Resources.Load<TextAsset>("lorelei");
var style = Style.Parse(definition.text);
```

Definitions are on [npm](https://www.npmjs.com/package/@dicebear/styles) and in
the [styles repository](https://github.com/dicebear/styles/tree/main/src). Save
one as `Assets/Resources/lorelei.txt` so Unity imports it as a `TextAsset`.

If avatars render in the editor but fail in a player build, check the managed
stripping level. The schema validator works through reflection, and stripping
removes the types it looks up.

## What the renderer leaves out

Unity's parser implements a subset of SVG. It handles `<clipPath>`, which is
what `borderRadius` uses, and leaves out `<text>`, `<filter>`, blend modes and
per-pixel masking. The
[package manual](https://docs.unity3d.com/Packages/com.unity.vectorgraphics@2.0/manual/index.html)
goes into more detail.

A good number of avatar styles use one of those, so render the ones you ship and
look at them before you build on this. The HTTP API rasterizes on the server, so
none of this applies there.

---

Source: https://www.dicebear.com/integrations/dart/

# Dart avatar library

Generate avatars in Dart (3.4 or higher) and in
[Flutter apps](https://www.dicebear.com/integrations/dart/flutter/), with no external service involved.
The API mirrors the [JavaScript library](https://www.dicebear.com/integrations/javascript/), and the
output is byte-identical: the same seed and style produce the same SVG in every
DiceBear library.

## Installation

You need two packages: the core library `dicebear_core` and the avatar style
definitions `dicebear_styles`. Each style is a string constant in its own
library, so a compiled app only embeds the styles it imports.

```sh
dart pub add dicebear_core
dart pub add dicebear_styles
```

In a Flutter project, use `flutter pub add` instead.

## Usage

We use the avatar style [lorelei](https://www.dicebear.com/styles/lorelei/) in our example. You can find
more avatar styles [here](https://www.dicebear.com/styles/). Each style is exposed as a raw-JSON string
(e.g. `lorelei` from `package:dicebear_styles/lorelei.dart`) that you hand to
`Style.parse`.

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/lorelei.dart';

void main() {
  final style = Style.parse(lorelei);

  final avatar = Avatar(style, {
    'seed': 'John',
    // ... other options
  });

  print(avatar.svg);
}
```

`Style.parse` decodes and validates the raw JSON string. If you already hold a
decoded definition (a `Map<String, Object?>`), pass it to the default
`Style(...)` constructor instead.

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
always produces the same avatar:

```dart
final avatar1 = Avatar(style, {'seed': 'user-123'});
final avatar2 = Avatar(style, {'seed': 'user-123'});

// avatar1.svg == avatar2.svg
```

## Types

### `Style`

A validated, immutable wrapper around a style definition. Build it once from the
decoded definition JSON, then reuse it when generating multiple avatars. Invalid
definitions throw a `StyleValidationError`.

```dart
final style = Style.parse(lorelei);

final avatar1 = Avatar(style, {'seed': 'Alice'});
final avatar2 = Avatar(style, {'seed': 'Bob'});
```

### `Avatar`

The main class for generating avatars. The constructor takes a `Style` and an
optional map of options (invalid options throw an `OptionsValidationError`,
circular color references a `CircularColorReferenceError`). Omitting the options
map is the same as passing an empty one.

```dart
final avatar = Avatar(style, {
  // ... options
});
```

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input.

```dart
final descriptor = OptionsDescriptor(style).toJson();
```

## Methods

### `svg` / `toString()`

**Return type:** `String`

Returns the avatar as SVG in XML format. `toString()` returns the same string,
so an `Avatar` can be used directly in string contexts (string interpolation,
`print`).

```dart
final avatar = Avatar(style, {'seed': 'Alice'});

var svg = avatar.svg;
// or
svg = avatar.toString();
```

### `toJson()`

**Return type:** `Map<String, Object?>` (with keys `svg` and `options`)

Returns the SVG and the resolved options as a JSON-encodable map. Pass it to
`jsonEncode` for the serialized form.

```dart
final avatar = Avatar(style, {'seed': 'Alice'});

final result = jsonEncode(avatar.toJson());

// result → {"svg":"<svg>...</svg>","options":{"flip":"none",...}}
```

The resolved options are also available directly as a map via
`avatar.resolvedOptions`.

### `toDataUri()`

**Return type:** `String`

Returns the avatar as [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme).

```dart
final avatar = Avatar(style, {'seed': 'Alice'});

final dataUri = avatar.toDataUri();

// <img src="{dataUri}" alt="Avatar" />
```

## Core options

These options are the same across every DiceBear core. See
[Core options](https://www.dicebear.com/customize/options/) for the full reference. Here are the options
in Dart syntax:

```dart
final avatar = Avatar(style, {
  'seed': 'Alice',
  'flip': 'horizontal', // 'none', 'horizontal', 'vertical', 'both'
  'rotate': 10, // -360 to 360, or [min, max] range
  'scale': 0.9, // 0 to 10 (1 = original), or [min, max] range
  'borderRadius': 50, // 0-50 (50 = circle)
  'size': 128,
  'translateX': 0, // -1000 to 1000 (percent of canvas width)
  'translateY': 0, // -1000 to 1000 (percent of canvas height)
  'idRandomization': true,
  'title': 'User Avatar',
  'fontFamily': 'Arial', // or ['Arial', 'Helvetica']
  'fontWeight': 700, // 1-1000
  'backgroundColor': ['#b6e3f4', '#c0aede'],
  'backgroundColorFill': 'solid', // 'solid', 'linear', 'radial'
});
```

Dynamic component and color options also work the same way. See
[Dynamic component options](https://www.dicebear.com/customize/options/#dynamic-component-options) for
all available patterns.

## Examples

### Rendering in Flutter

The library has no Flutter dependency; it returns plain strings. To display an
avatar in a Flutter widget tree, render the SVG string with a package such as
[`flutter_svg`](https://pub.dev/packages/flutter_svg):

```dart
final avatar = Avatar(style, {'seed': 'Alice', 'size': 128});

// In your build method, with package:flutter_svg
SvgPicture.string(avatar.svg, width: 128, height: 128);
```

### Avatar with custom background

```dart
final avatar = Avatar(style, {
  'seed': 'Alice',
  'backgroundColor': ['#b6e3f4', '#c0aede', '#d1d4f9'],
});
```

### Fixed size avatar

```dart
import 'package:dicebear_styles/bottts.dart';

final style = Style.parse(bottts);

final avatar = Avatar(style, {
  'seed': 'robot-42',
  'size': 128,
  'borderRadius': 50, // circular avatar
});
```

### Avatar with transformations

```dart
import 'package:dicebear_styles/avataaars.dart';

final style = Style.parse(avataaars);

final avatar = Avatar(style, {
  'seed': 'Jane',
  'flip': 'horizontal',
  'rotate': 10,
  'scale': 0.9,
  'translateY': 5,
});
```

### Multiple avatars on the same page

When rendering multiple avatars on the same page, use `idRandomization` to
prevent SVG ID conflicts:

```dart
final style = Style.parse(lorelei);

for (final seed in ['alice', 'bob', 'charlie']) {
  final avatar = Avatar(style, {
    'seed': seed,
    'idRandomization': true,
  });
  print(avatar.svg);
}
```

### Weighted variant selection

A weighted map makes some variants more likely than others. The lorelei style
selects `happy01` or `happy02` mouths twice as often as `sad01` here:

```dart
final avatar = Avatar(style, {
  'seed': 'Alice',
  'mouthVariant': {'happy01': 2, 'happy02': 2, 'sad01': 1},
});
```

---

Source: https://www.dicebear.com/integrations/dart/flutter/

# Flutter avatar library: using DiceBear with Flutter

You can generate DiceBear avatars in Flutter two ways. Use the
[Dart library](https://www.dicebear.com/integrations/dart/) with an SVG renderer to build avatars on the
device, or use the [HTTP API](https://www.dicebear.com/integrations/http-api/) with Flutter's built-in
`Image.network` to load ready-made PNGs.

The HTTP API needs no extra packages and is the quickest to set up. The Dart
library keeps everything local, so it works offline and sends no requests.

## With the Dart library

Add the core library, the style definitions, and an SVG renderer. We use
[flutter_svg](https://pub.dev/packages/flutter_svg) to draw the SVG string.

```sh
flutter pub add dicebear_core dicebear_styles flutter_svg
```

```dart
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/lorelei.dart';

// Parse the style once and reuse it.
final style = Style.parse(lorelei);

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, this.seed = 'Alice'});

  final String seed;

  @override
  Widget build(BuildContext context) {
    final avatar = Avatar(style, {
      'seed': seed,
      'size': 128,
      // ... other options
    });

    return SvgPicture.string(
      avatar.svg,
      width: 128,
      height: 128,
    );
  }
}
```

`Avatar(style, {...}).svg` returns the SVG as a string, which
`SvgPicture.string` renders directly. For the full API and the options each
style accepts, see the [Dart library reference](https://www.dicebear.com/integrations/dart/).

## With the HTTP API

The HTTP API returns finished images, so you need no extra packages. Request the
`png` format and pass the URL to `Image.network`.

```dart
import 'package:flutter/material.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, this.seed = 'Alice'});

  final String seed;

  @override
  Widget build(BuildContext context) {
    final url = Uri.https('api.dicebear.com', '/10.x/lorelei/png', {
      'seed': seed,
      'size': '128',
      // ... other options
    });

    return Image.network(
      url.toString(),
      width: 128,
      height: 128,
    );
  }
}
```

Every option is a query parameter. See the
[HTTP API reference](https://www.dicebear.com/integrations/http-api/) for the full list.

---

Source: https://www.dicebear.com/integrations/go/

# Go avatar library

Generate avatars right in your Go services (1.23 or higher), with no external
service involved. The API mirrors the
[JavaScript library](https://www.dicebear.com/integrations/javascript/), and the output is
byte-identical: the same seed and style produce the same SVG in every DiceBear
library.

## Installation

You need two modules: the core library `github.com/dicebear/dicebear-go/v10` and
the avatar style definitions `github.com/dicebear/styles/v10`. The module path
carries the major version, so import it with the `/v10` suffix.

```sh
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

## Usage

We use the avatar style [lorelei](https://www.dicebear.com/styles/lorelei/) in our example. You can find
more avatar styles [here](https://www.dicebear.com/styles/). Each style is exposed as a raw-JSON string
(e.g. `styles.Lorelei`) that you pass to `NewStyle`.

```go
package main

import (
	"fmt"

	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

func main() {
	style, err := dicebear.NewStyle([]byte(styles.Lorelei))
	if err != nil {
		panic(err)
	}

	avatar, err := dicebear.NewAvatar(style, map[string]any{
		"seed": "John",
		// ... other options
	})
	if err != nil {
		panic(err)
	}

	svg := avatar.SVG()
	fmt.Println(svg)
}
```

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
always produces the same avatar:

```go
avatar1, _ := dicebear.NewAvatar(style, map[string]any{"seed": "user-123"})
avatar2, _ := dicebear.NewAvatar(style, map[string]any{"seed": "user-123"})

// avatar1.SVG() == avatar2.SVG()
```

## Types

### `Style`

A validated, immutable wrapper around a style definition. Build it once with
`NewStyle` (from the definition's JSON bytes), then reuse it when generating
multiple avatars.

```go
style, err := dicebear.NewStyle(definitionJSON)
if err != nil {
	panic(err)
}

avatar1, _ := dicebear.NewAvatar(style, map[string]any{"seed": "Alice"})
avatar2, _ := dicebear.NewAvatar(style, map[string]any{"seed": "Bob"})
```

### `Avatar`

The main type for generating avatars. `NewAvatar` takes a `*Style` and a
`map[string]any` of options, and returns `(*Avatar, error)` (invalid options and
circular color references surface as an `error`). A `nil` options map is treated
as empty.

```go
avatar, err := dicebear.NewAvatar(style, map[string]any{
	// ... options
})
```

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input.

```go
descriptor := dicebear.NewOptionsDescriptor(style).ToJSON()
```

## Methods

### `SVG()` / `String()`

**Return type:** `string`

Returns the avatar as SVG in XML format. `Avatar` also implements
`fmt.Stringer`, so it can be used directly in string contexts (`fmt.Println`,
`fmt.Sprintf`).

```go
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "Alice"})

svg := avatar.SVG()
// or
svg = avatar.String()
```

### `JSON()`

**Return type:** `[]byte` (JSON with keys `svg` and `options`), `error`

Returns the SVG and the resolved options as JSON.

```go
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "Alice"})

result, _ := avatar.JSON()

// result → {"svg":"<svg>...</svg>","options":{"flip":"none",...}}
```

The resolved options are also available directly as a map via
`avatar.ResolvedOptions()`.

### `DataURI()`

**Return type:** `string`

Returns the avatar as [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme).

```go
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "Alice"})

dataURI := avatar.DataURI()

// <img src="{dataURI}" alt="Avatar" />
```

## Core options

These options are the same across every DiceBear core. See
[Core options](https://www.dicebear.com/customize/options/) for the full reference. Here are the options
in Go syntax:

```go
avatar, _ := dicebear.NewAvatar(style, map[string]any{
	"seed":                "Alice",
	"flip":                "horizontal",            // "none", "horizontal", "vertical", "both"
	"rotate":              10,                       // -360 to 360, or [min, max] range
	"scale":               0.9,                      // 0 to 10 (1 = original), or [min, max] range
	"borderRadius":        50,                       // 0-50 (50 = circle)
	"size":                128,
	"translateX":          0,                        // -1000 to 1000 (percent of canvas width)
	"translateY":          0,                        // -1000 to 1000 (percent of canvas height)
	"idRandomization":     true,
	"title":               "User Avatar",
	"fontFamily":          "Arial",                  // or []string{"Arial", "Helvetica"}
	"fontWeight":          700,                      // 1-1000
	"backgroundColor":     []string{"#b6e3f4", "#c0aede"},
	"backgroundColorFill": "solid",                  // "solid", "linear", "radial"
})
```

Dynamic component and color options also work the same way. See
[Dynamic component options](https://www.dicebear.com/customize/options/#dynamic-component-options) for
all available patterns.

## Examples

### Avatar with custom background

```go
avatar, _ := dicebear.NewAvatar(style, map[string]any{
	"seed":            "Alice",
	"backgroundColor": []string{"#b6e3f4", "#c0aede", "#d1d4f9"},
})
```

### Fixed size avatar

```go
style, _ := dicebear.NewStyle([]byte(styles.Bottts))

avatar, _ := dicebear.NewAvatar(style, map[string]any{
	"seed":         "robot-42",
	"size":         128,
	"borderRadius": 50, // circular avatar
})
```

### Avatar with transformations

```go
style, _ := dicebear.NewStyle([]byte(styles.Avataaars))

avatar, _ := dicebear.NewAvatar(style, map[string]any{
	"seed":       "Jane",
	"flip":       "horizontal",
	"rotate":     10,
	"scale":      0.9,
	"translateY": 5,
})
```

### Multiple avatars on the same page

When rendering multiple avatars on the same page, use `idRandomization` to
prevent SVG ID conflicts:

```go
style, _ := dicebear.NewStyle([]byte(styles.Lorelei))

for _, seed := range []string{"alice", "bob", "charlie"} {
	avatar, _ := dicebear.NewAvatar(style, map[string]any{
		"seed":            seed,
		"idRandomization": true,
	})
	fmt.Println(avatar.SVG())
}
```

### Weighted variant selection

```go
avatar, _ := dicebear.NewAvatar(style, map[string]any{
	"seed":     "Alice",
	"topVariant": map[string]any{"short01": 2, "short02": 2, "long01": 1},
})
```

---

Source: https://www.dicebear.com/integrations/http-api/

# HTTP API: generate SVG avatars via URL

Our HTTP API is the simplest way to use DiceBear as a profile picture API or
avatar placeholder API. No authentication is required.

## Usage

Use the following address and replace `<styleName>` with your preferred avatar
style. Style names are lowercase, with hyphens for multi-word styles, e.g.
`lorelei`, `pixel-art`, `adventurer-neutral`. Every official
[avatar style](https://www.dicebear.com/styles/) is supported.

```
https://api.dicebear.com/10.x/<styleName>/svg
```

### A few examples

- `https://api.dicebear.com/10.x/pixel-art/svg`
- `https://api.dicebear.com/10.x/lorelei/svg`

### Generate a consistent avatar from a user ID

Use a stable identifier as the `seed` and every user gets the same avatar on
every visit. A user ID works well, and the same seed always returns the same
image. That makes it a good default avatar for people who haven't uploaded a
photo yet, since the picture stays the same across pages and sessions.

```
https://api.dicebear.com/10.x/lorelei/svg?seed=user-8f3a2c
```

- `https://api.dicebear.com/10.x/lorelei/svg?seed=user-8f3a2c`

If the seed contains spaces or other special characters, URL-encode it first.

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Listing available styles

To discover which avatar styles an instance supports, send a request to the
version root. It returns the available style names as JSON, sorted
alphabetically:

```
https://api.dicebear.com/10.x
```

```json
{
  "styles": ["adventurer", "adventurer-neutral", "avataaars", "..."]
}
```

> [!NOTE]
> This endpoint is available from version `10.x` onwards. Earlier versions do not
> support listing styles.

## Style definition and options

Each style also exposes two metadata endpoints. They are handy for building
tooling on top of the API, such as avatar editors:

```
https://api.dicebear.com/10.x/<styleName>/definition.json
https://api.dicebear.com/10.x/<styleName>/options.json
```

`definition.json` returns the raw style definition, the same JSON that is
shipped with the style's npm package.

`options.json` describes every option the style accepts as query parameter,
including field types, allowed enum values, and value ranges. An excerpt for
[Pixel Art](https://www.dicebear.com/styles/pixel-art/):

```json
{
  "seed": { "type": "string" },
  "flip": {
    "type": "enum",
    "values": ["none", "horizontal", "vertical", "both"],
    "list": true
  },
  "backgroundColor": { "type": "color", "list": true },
  "hairVariant": {
    "type": "enum",
    "values": ["long01", "long02", "...", "short24"],
    "list": true,
    "weighted": true
  },
  "hairProbability": { "type": "number", "min": 0, "max": 100 }
}
```

> [!NOTE]
> These endpoints are available from version `10.x` onwards. On self-hosted
> instances they are disabled by default. See the
> [self-hosting guide](https://www.dicebear.com/recipes/self-host-the-http-api/#optional-style-metadata-endpoints).

## Options

All [core options](https://www.dicebear.com/customize/options/) (such as `seed`, `flip`, `rotate`,
`scale`, `borderRadius`, `backgroundColor`, and `tags`) are available as
[query parameters](https://en.wikipedia.org/wiki/Query_string). Style-specific
options are listed on each [avatar style page](https://www.dicebear.com/styles/). For example:

- `https://api.dicebear.com/10.x/pixel-art/svg?seed=John`
- `https://api.dicebear.com/10.x/pixel-art/svg?seed=Jane`

> [!TIP]
> If you want to pass more options, you connect them with a `&` as usual with
> query strings.

> [!WARNING]
> The options `idRandomization`, `fontFamily`, `fontWeight`, and `title` are not
> supported by our public HTTP API. You can enable them by
> [hosting your own instance](https://www.dicebear.com/recipes/self-host-the-http-api/).

### Array options

Array values are separated by a comma. For example, the URL could look like this
if you want to provide the PRNG with several hair styles in addition to the
seed. Note that the avatar styles provide different options. In this example, we
use the [Pixel Art](https://www.dicebear.com/styles/pixel-art/) avatar style.

- `https://api.dicebear.com/10.x/pixel-art/svg?seed=John&hairVariant=short01,short02,short03,short04,short05`
- `https://api.dicebear.com/10.x/pixel-art/svg?seed=Jane&hairVariant=long01,long02,long03,long04,long05`

The [`tags`](https://www.dicebear.com/customize/tags/) filter is an array too. Separate the tags with a
comma and prefix a tag with `!` to exclude it:

```
https://api.dicebear.com/10.x/planets/svg?seed=John&tags=animation
```

### Enum options

Enum values are passed as strings. For example, the `flip` option accepts
`none`, `horizontal`, `vertical`, or `both`:

- `https://api.dicebear.com/10.x/lorelei/svg?flip=horizontal`
- `https://api.dicebear.com/10.x/lorelei/svg?flip=none`

## File format

PNG, JPG, WebP and AVIF use the
[Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans) font and currently
supports the following subsets: `cyrillic`, `cyrillic-ext`, `devanagari`,
`greek`, `greek-ext`, `japanese`, `korean`, `latin`, `latin-ext`,
`simplified-chinese`, `thai` and `vietnamese`.

- `https://api.dicebear.com/10.x/bottts/svg`
- `https://api.dicebear.com/10.x/bottts/png`
- `https://api.dicebear.com/10.x/bottts/jpg`
- `https://api.dicebear.com/10.x/bottts/webp`
- `https://api.dicebear.com/10.x/bottts/avif`

## Versioning

You can set the version in the URL. Just replace the `10.x` from the previous
examples with the one you want.

| Version | Status     | End of Life    |
| ------- | ---------- | -------------- |
| `10.x`  | **Active** | None           |
| `9.x`   | **Active** | None           |
| `8.x`   | Deprecated | April 30, 2028 |
| `7.x`   | Deprecated | April 30, 2028 |
| `6.x`   | Deprecated | April 30, 2028 |
| `5.x`   | Deprecated | April 30, 2028 |

> [!WARNING]
> Versions 5.x to 8.x will reach End of Life on April 30, 2028. After that date,
> the HTTP API for these versions will be shut down and no longer available.
> Please upgrade to the latest version. See the
> [announcement](https://github.com/orgs/dicebear/discussions/491) for details.

> [!NOTE]
> You can [host the API yourself](https://www.dicebear.com/recipes/self-host-the-http-api/) to keep using
> discontinued versions after their End of Life.

## Self-hosted avatar API

Need a private or commercial setup? You can
[host the Avatar API yourself](https://www.dicebear.com/recipes/self-host-the-http-api/) for full
control over availability, rate limits, and data privacy.

## Fair use & rate limits

Our API is free to use for non-commercial purposes, but please use it
responsibly. We reserve the right to block abusive users.

We currently limit requests per second to **50 for SVG** and **10 for PNG, JPG,
WebP, and AVIF**. Exceeding the limit returns HTTP `429 Too Many Requests`. We
reserve the right to change these limits at any time without notice.

For commercial use or higher limits, please
[set up your own instance](https://www.dicebear.com/recipes/self-host-the-http-api/). We're happy to
answer questions: open a
[discussion](https://github.com/orgs/dicebear/discussions) on GitHub.

## Changes and availability

Please be aware that we reserve the right to update the API at any time. While
we will do our best to maintain backwards compatibility, we cannot guarantee
this. Even though we try to always return the same avatar, the design and
especially the source code may change. Additionally, we cannot guarantee that
the API will always be available. If you need consistent access to the API, we
recommend setting up [your own instance](https://www.dicebear.com/recipes/self-host-the-http-api/).

---

Source: https://www.dicebear.com/integrations/javascript/

# JavaScript avatar library

Generate avatars right where you need them: in the browser, in
[Node.js](https://nodejs.org/en/) (version 22 or higher), or at build time. The
library is written in [TypeScript](https://www.typescriptlang.org/), and it
renders the same avatar for the same seed as every other DiceBear integration,
so you can start here and change your mind later. Working in a different
language? [Pick your integration](https://www.dicebear.com/start/pick-your-integration/) lists them all.

## Installation

You need two packages: the core library `@dicebear/core` and the avatar style
definitions `@dicebear/styles`.

```
npm install @dicebear/core @dicebear/styles
```

> [!TIP]
> Both packages are pure
> [ESM](https://developer.mozilla.org/en-US/Web/JavaScript/Guide/Modules). If your
> tooling complains about `require()`,
> [Sindre Sorhus](https://github.com/sindresorhus) wrote a helpful
> [guide to ESM packages](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Usage

We use the avatar style [lorelei](https://www.dicebear.com/styles/lorelei/) in our example. You can find
more avatar styles [here](https://www.dicebear.com/styles/).

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {
  seed: 'John',
  // ... other options
});

const svg = avatar.toString();
```

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!TIP]
> If you'd like to integrate the library into a framework, check out our guides
> for [Angular](https://www.dicebear.com/integrations/javascript/angular/),
> [React](https://www.dicebear.com/integrations/javascript/react/),
> [React Native](https://www.dicebear.com/integrations/javascript/react-native/),
> [Vue](https://www.dicebear.com/integrations/javascript/vue/) or
> [Svelte](https://www.dicebear.com/integrations/javascript/svelte/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
will always produce the same avatar, which is useful for user profiles:

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

// These will always produce the same avatar
const avatar1 = new Avatar(style, { seed: 'user-123' });
const avatar2 = new Avatar(style, { seed: 'user-123' });

avatar1.toString() === avatar2.toString(); // true
```

## Classes

### `Avatar`

The main class for generating avatars. Pass a `Style` instance and optional
options.

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {

  // ... options
});
```

### `Style`

An immutable wrapper around a style definition.

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

const avatar1 = new Avatar(style, { seed: 'Alice' });
const avatar2 = new Avatar(style, { seed: 'Bob' });
```

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input. See [Access Style Options](https://www.dicebear.com/customize/style-options/) for
details.

## Methods

### `.toString()`

**Return type:** `string`

Returns the avatar as SVG in XML format.

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {
  // ... options
});

const svg = avatar.toString();
```

### `.toJSON()`

**Return type:** `{ svg: string, options: StyleOptions }`

Returns an object with the SVG and the resolved options that were used to
generate the avatar.

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {
  seed: 'John',
  // ... other options
});

const json = avatar.toJSON();

// Example output:
// {
//   svg: '<svg>...</svg>',
//   options: {
//     seed: 'John',
//     // ... resolved options
//   }
// }
```

### `.toDataUri()`

**Return type:** `string`

Returns the avatar as [data uri](https://en.wikipedia.org/wiki/Data_URI_scheme).
This is useful for embedding the avatar directly in HTML or CSS.

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {
  seed: 'John',
  // ... other options
});

const dataUri = avatar.toDataUri();

// Use in HTML
// <img src={dataUri} alt="Avatar" />
```

## Options

Every DiceBear core understands the same options. The full reference, including
the background, per-component, and per-color options, lives on the
[Core options](https://www.dicebear.com/customize/options/) page. The examples below show how to pass
them in JavaScript.

## Examples

### Avatar with custom background

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {
  seed: 'John',
  backgroundColor: ['#b6e3f4', '#c0aede', '#d1d4f9'],
  // ... other options
});
```

### Fixed size avatar

```js
import { Style, Avatar } from '@dicebear/core';
import bottts from '@dicebear/styles/bottts.json' with { type: 'json' };

const style = new Style(bottts);
const avatar = new Avatar(style, {
  seed: 'robot-42',
  size: 128,
  borderRadius: 50, // circular avatar
  // ... other options
});
```

### Avatar with transformations

```js
import { Style, Avatar } from '@dicebear/core';
import avataaars from '@dicebear/styles/avataaars.json' with { type: 'json' };

const style = new Style(avataaars);
const avatar = new Avatar(style, {
  seed: 'Jane',
  flip: 'horizontal',
  rotate: 10,
  scale: 0.9,
  translateY: 5,
  // ... other options
});
```

### Multiple avatars on the same page

When inlining multiple avatars into the same document (e.g. dropping the SVG
markup into the page rather than using `<img src={dataUri}>`), use
`idRandomization` to suffix each SVG's internal IDs and avoid `<defs>` /
`url(#…)` collisions:

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const users = ['alice', 'bob', 'charlie'];

const avatars = users.map((user) =>
  new Avatar(style, {
    seed: user,
    idRandomization: true,
    // ... other options
  }).toString(),
);
```

The suffix is drawn from `Math.random()` (**not** from the DiceBear PRNG), so
two avatars rendered with the same seed get different IDs. This also means the
rendered SVG is no longer deterministic; only the visual output is. Skip
`idRandomization` for snapshot tests, SSR/hydration, or anywhere you depend on
identical markup. When you only embed avatars via `<img>` (data URI or HTTP API)
the IDs live inside isolated documents and ID randomization is unnecessary.

### Weighted variant selection

You can influence the PRNG to prefer certain variants by passing a weight map.
Variants not listed in the map are excluded; weights of `0` exclude that variant
unless **every** mapped variant has weight `0`, in which case the PRNG falls
back to an unweighted pick across them:

```js
import { Style, Avatar } from '@dicebear/core';
import avataaars from '@dicebear/styles/avataaars.json' with { type: 'json' };

const style = new Style(avataaars);
const avatar = new Avatar(style, {
  seed: 'John',
  topVariant: { short01: 2, short02: 2, long01: 1 },
  // ... other options
});
```

## Accessibility

By default the generated `<svg>` element is `aria-hidden="true"`, so assistive
technology skips it. This is the right default for purely decorative avatars
next to a username.

When the avatar conveys identity on its own (e.g. it is the only thing in a
link, or has no visible label), set the `title` option. The renderer emits
`role="img" aria-label="…"` on the root element **and** a `<title>` child, so
screen readers announce the value:

```js
const avatar = new Avatar(style, {
  seed: 'Alice',
  title: 'Avatar for Alice',
});
```

If you embed the SVG inside an `<img>` (via `toDataUri()`), use the `<img>`
element's `alt` attribute instead. The SVG's internal `title` is not read by
assistive technology when the SVG is loaded as an image.

## TypeScript

The library is fully typed. You can import types for better IDE support:

```ts
import { Avatar, Style } from '@dicebear/core';
import type { StyleOptions, StyleDefinition } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);
const avatar = new Avatar(style, {
  seed: 'John',
  backgroundColor: ['#b6e3f4'],
  // ... other options
});
```

When importing a style definition as JSON, TypeScript infers the literal types
of the definition, providing autocomplete for component and color option names.

## Convert to other formats

Need PNG, JPEG, or other formats? Check out the
[Converter](https://www.dicebear.com/integrations/javascript/converter/) package.

---

Source: https://www.dicebear.com/integrations/javascript/angular/

# Angular avatar library: using DiceBear with Angular

DiceBear can be integrated into Angular components using Signals (Angular 17+)
or the `OnChanges` lifecycle hook. Use the JavaScript library for client-side
SVG avatar generation, or the HTTP API as a simple `<img>` source with no
additional dependencies.

## With the JS library

```typescript [Angular 17+]
import { Component, input, computed } from '@angular/core';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

@Component({
  selector: 'app-avatar',
  template: `<img [src]="avatarUrl()" alt="Avatar" />`,
})
export class AvatarComponent {
  seed = input('Alice');

  avatarUrl = computed(() =>
    new Avatar(style, {
      seed: this.seed(),
      size: 128,
      // ... other options
    }).toDataUri(),
  );
}
```

```typescript [Angular 16 and earlier]
import { Component, Input, OnChanges } from '@angular/core';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<img [src]="avatarUrl" alt="Avatar" />`,
})
export class AvatarComponent implements OnChanges {
  @Input() seed: string = 'Alice';
  avatarUrl: string = '';

  ngOnChanges() {
    this.avatarUrl = new Avatar(style, {
      seed: this.seed,
      size: 128,
      // ... other options
    }).toDataUri();
  }
}
```

## With the HTTP API

```typescript [Angular 17+]
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  template: `<img [src]="avatarUrl()" alt="Avatar" />`,
})
export class AvatarComponent {
  seed = input('Alice');

  avatarUrl = computed(() => {
    const url = new URL('https://api.dicebear.com/10.x/lorelei/svg');
    url.searchParams.set('seed', this.seed());
    url.searchParams.set('size', '128');
    // ... other options
    return url.href;
  });
}
```

```typescript [Angular 16 and earlier]
import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<img [src]="avatarUrl" alt="Avatar" />`,
})
export class AvatarComponent implements OnChanges {
  @Input() seed: string = 'Alice';
  avatarUrl: string = '';

  ngOnChanges() {
    const url = new URL('https://api.dicebear.com/10.x/lorelei/svg');
    url.searchParams.set('seed', this.seed);
    url.searchParams.set('size', '128');
    // ... other options
    this.avatarUrl = url.href;
  }
}
```

---

Source: https://www.dicebear.com/integrations/javascript/converter/

# Converter

Sometimes you need the avatar in a different format than SVG. For this we have
created a package called `@dicebear/converter` which can convert the avatar to
PNG, JPEG, WebP, and AVIF.

## Installation

```
npm install @dicebear/converter
```

> [!TIP]
> You don't need to install the core library `@dicebear/core` to use the converter
> package. While it is optimized for DiceBear, it can also be used with SVGs from
> other sources.

## Usage

Although the converter can be used without the core library, we use it in our
example to create the avatar.

```js
import { toPng } from '@dicebear/converter';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

const avatar = new Avatar(style, {
  seed: 'Alice',
  // ... other options
});

const png = toPng(avatar);
const dataUri = await png.toDataUri();
```

## Supported formats

| Format | Function | Browser | Node.js | Notes                                 |
| ------ | -------- | ------- | ------- | ------------------------------------- |
| PNG    | `toPng`  | Yes     | Yes     | Full support                          |
| JPEG   | `toJpeg` | Yes     | Yes     | Full support                          |
| WebP   | `toWebp` | Yes\*   | Yes     | Unsupported browsers fall back to PNG |
| AVIF   | `toAvif` | Yes\*   | Yes     | Unsupported browsers fall back to PNG |

\* WebP is supported in all modern browsers. AVIF support varies; check
[caniuse.com](https://caniuse.com/avif) for current browser compatibility.

## Methods

### `toPng(svg, options)`

**Return type:** Object with [.toDataUri()](#todatauri) and
[.toArrayBuffer()](#toarraybuffer) methods.

Converts the avatar from SVG to PNG. Expects an SVG `string` or an `object` with
`toString` method as first argument. Expects an optional `options` argument of
type `object`. See [options](#options) for more information.

```js
import { toPng } from '@dicebear/converter';

const svg = '<svg>...</svg>';

const png = toPng(svg, {
  // ... options
});
```

### `toJpeg(svg, options)`

**Return type:** Object with [.toDataUri()](#todatauri) and
[.toArrayBuffer()](#toarraybuffer) methods.

Converts the avatar from SVG to JPEG. Expects an SVG `string` or an `object`
with `toString` method as first argument. Expects an optional `options` argument
of type `object`. See [options](#options) for more information.

```js
import { toJpeg } from '@dicebear/converter';

const svg = '<svg>...</svg>';

const jpeg = toJpeg(svg, {
  // ... options
});
```

### `toWebp(svg, options)`

**Return type:** Object with [.toDataUri()](#todatauri) and
[.toArrayBuffer()](#toarraybuffer) methods.

Converts the avatar from SVG to WebP. Expects an SVG `string` or an `object`
with `toString` method as first argument. Expects an optional `options` argument
of type `object`. See [options](#options) for more information.

```js
import { toWebp } from '@dicebear/converter';

const svg = '<svg>...</svg>';

const webp = toWebp(svg, {
  // ... options
});
```

> [!WARNING] Limited browser support
> This function uses an HTML canvas element in the browser and is dependent on the
> browser being able to export the canvas as WebP. If the browser does not support
> WebP, PNG is used as a fallback. See
> [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
> for browser compatibility.

### `toAvif(svg, options)`

**Return type:** Object with [.toDataUri()](#todatauri) and
[.toArrayBuffer()](#toarraybuffer) methods.

Converts the avatar from SVG to AVIF. Expects an SVG `string` or an `object`
with `toString` method as first argument. Expects an optional `options` argument
of type `object`. See [options](#options) for more information.

```js
import { toAvif } from '@dicebear/converter';

const svg = '<svg>...</svg>';

const avif = toAvif(svg, {
  // ... options
});
```

> [!WARNING] Limited browser support
> This function uses an HTML canvas element in the browser and is dependent on the
> browser being able to export the canvas as AVIF. If the browser does not support
> AVIF, PNG is used as a fallback. See
> [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
> for browser compatibility.

### `.toDataUri()`

**Return type:** `Promise<string>`

Returns the image as a
[data URI](https://en.wikipedia.org/wiki/Data_URI_scheme). This is useful for
embedding the image directly in HTML or CSS.

```js
import { toPng } from '@dicebear/converter';

const svg = '<svg>...</svg>';

const png = toPng(svg, {
  // ... options
});
const dataUri = await png.toDataUri();

// Use in HTML: <img src={dataUri} alt="Avatar" />
```

### `.toArrayBuffer()`

**Return type:** `Promise<ArrayBuffer>`

Converts the image to an
[ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).
This is useful for saving files or sending binary data.

```js
import { toPng } from '@dicebear/converter';

const svg = '<svg>...</svg>';

const png = toPng(svg, {
  // ... options
});
const buffer = await png.toArrayBuffer();
```

## Options

| Option        | Type       | Default | Environment       | Description                               |
| ------------- | ---------- | ------- | ----------------- | ----------------------------------------- |
| `size`        | `number`   | `512`   | Browser + Node.js | Output image size in pixels (max: `2048`) |
| `fonts`       | `string[]` | `[]`    | Node.js           | Paths to custom font files                |
| `includeExif` | `boolean`  | `false` | Node.js           | Include metadata in output image          |

### size

**Type:** `number`

**Default:** `512`

**Maximum:** `2048`

Controls the width and height of the rasterized output image in pixels. The
output is always square. Values above `2048` are clamped to `2048`. Invalid
values (`NaN`, `<= 0`, `Infinity`) fall back to `512`.

```js
import { toPng } from '@dicebear/converter';

const png = toPng(svg, {
  size: 128,
});
```

### fonts

**Type:** `string[]`

**Default:** `[]`

An array of paths to font files which should be used to render the avatar. If
not set, the system fonts will be used. This is particularly useful for the
[initials](https://www.dicebear.com/styles/initials/) style or other styles that render text.

```js
import { toPng } from '@dicebear/converter';

const png = toPng(svg, {
  fonts: ['/path/to/custom-font.ttf'],
});
```

### includeExif

**Type:** `boolean`

**Default:** `false`

If set to `true`, the converter will try to read the metadata from the SVG and
add it to the output image as Exif metadata. This is useful for preserving
license and attribution information.

The converter extracts the avatar style title, source URL, creator name,
license, and copyright notice from the SVG and embeds them as Exif fields.

```js
import { toPng } from '@dicebear/converter';

const png = toPng(svg, {
  includeExif: true,
});
```

> [!WARNING]
> This uses an `exiftool` singleton which needs to be exited manually when your
> application terminates. See the
> [exiftool-vendored documentation](https://www.npmjs.com/package/exiftool-vendored)
> for more information.
>
> ```js
> import { exiftool } from 'exiftool-vendored';
>
> // When your application exits:
> await exiftool.end();
> ```

## Examples

### Convert DiceBear avatar to PNG

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };
import { toPng } from '@dicebear/converter';

const style = new Style(lorelei);

const avatar = new Avatar(style, {
  seed: 'Alice',
  backgroundColor: ['#b6e3f4'],
});

const png = toPng(avatar);
const dataUri = await png.toDataUri();

// Use in browser
document.querySelector('img').src = dataUri;
```

### Save avatar to file (Node.js)

```js
import { Style, Avatar } from '@dicebear/core';
import bottts from '@dicebear/styles/bottts.json' with { type: 'json' };
import { toPng } from '@dicebear/converter';
import { writeFile } from 'node:fs/promises';

const style = new Style(bottts);

const avatar = new Avatar(style, {
  seed: 'robot-42',
});

const png = toPng(avatar);
const buffer = await png.toArrayBuffer();

await writeFile('avatar.png', Buffer.from(buffer));
```

### Convert with Exif metadata (Node.js)

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };
import { toPng } from '@dicebear/converter';
import { exiftool } from 'exiftool-vendored';
import { writeFile } from 'node:fs/promises';

const style = new Style(lorelei);

const avatar = new Avatar(style, {
  seed: 'Alice',
});

const png = toPng(avatar, {
  includeExif: true,
});

const buffer = await png.toArrayBuffer();
await writeFile('avatar.png', Buffer.from(buffer));

// Important: Close exiftool when done
await exiftool.end();
```

### Use with custom fonts (Node.js)

```js
import { Style, Avatar } from '@dicebear/core';
import initials from '@dicebear/styles/initials.json' with { type: 'json' };
import { toPng } from '@dicebear/converter';

const style = new Style(initials);

const avatar = new Avatar(style, {
  seed: 'Alice',
});

const png = toPng(avatar, {
  fonts: ['/path/to/Roboto-Bold.ttf'],
});

const dataUri = await png.toDataUri();
```

### Convert with a custom size

```js
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };
import { toPng } from '@dicebear/converter';

const style = new Style(lorelei);

const avatar = new Avatar(style, { seed: 'Alice' });

const png = toPng(avatar, { size: 128 });
const dataUri = await png.toDataUri();
```

### Convert any SVG (without DiceBear)

```js
import { toPng } from '@dicebear/converter';

const svg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="red" />
  </svg>
`;

const png = toPng(svg);
const dataUri = await png.toDataUri();
```

## TypeScript

The library is fully typed:

```ts
import { toPng, toJpeg, toWebp, toAvif } from '@dicebear/converter';
import type { Options, Result } from '@dicebear/converter';

const options: Options = {
  includeExif: true,
};

const result: Result = toPng(svg, options);
const buffer: ArrayBuffer = await result.toArrayBuffer();
```

## Rendering with resvg yourself

`toPng` and the other conversion functions handle this for you. If you drive
[resvg](https://github.com/yisibl/resvg-js) directly instead, run the SVG
through `normalizeMaskType` first:

```js
import { normalizeMaskType } from '@dicebear/converter';

const svg = normalizeMaskType(avatar.toString());
```

resvg reads `mask-type` only as a presentation attribute, not from a `style`
declaration. Figma writes the declaration, so official avatar styles carry masks
that resvg would otherwise treat as the `luminance` default and render as fully
hidden. `normalizeMaskType` mirrors the value onto the attribute. If nothing
needs fixing, you get your input back unchanged. When a mask does need fixing,
the function re-emits the SVG from a parsed tree, so formatting details like
quote style may change, while the rendered image stays the same. Browsers honor
both forms, so this only matters when you rasterize.

---

Source: https://www.dicebear.com/integrations/javascript/next-js/

# Next.js avatar library: using DiceBear with Next.js

DiceBear works in every Next.js rendering mode: server components, client
components, and the Pages Router. Server-side generation is the default
recommendation because it produces zero JavaScript on the client and avoids
hydration pitfalls.

## App Router

### Server component (recommended)

In App Router, components are server components by default. Generate the SVG on
the server and inline it as a
[data URI](https://en.wikipedia.org/wiki/Data_URI_scheme), so the avatar needs
no client-side JavaScript.

```tsx
// app/components/UserAvatar.tsx
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

export function UserAvatar({ seed = 'Alice' }: { seed?: string }) {
  const dataUri = new Avatar(style, {
    seed,
    size: 128,
    // ... other options
  }).toDataUri();

  return <img src={dataUri} alt="Avatar" width={128} height={128} />;
}
```

### Client component

Mark the file with `'use client'` and wrap generation in `useMemo` so the avatar
is only re-derived when the seed changes.

```tsx
// app/components/UserAvatarClient.tsx
'use client';

import { useMemo } from 'react';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

export function UserAvatarClient({ seed = 'Alice' }: { seed?: string }) {
  const dataUri = useMemo(
    () =>
      new Avatar(style, {
        seed,
        size: 128,
        // ... other options
      }).toDataUri(),
    [seed],
  );

  return <img src={dataUri} alt="Avatar" width={128} height={128} />;
}
```

> [!WARNING] Hydration & `idRandomization`
> `idRandomization` uses the host's non-seeded RNG, so the server and the client
> will produce different IDs and React will throw a hydration mismatch warning.
> Either:
>
> - Generate the avatar in a server component (no hydration) and don't pass the
>   SVG to a client component, **or**
> - Leave `idRandomization: false` and rely on the deterministic IDs.
>
> If you need ID uniqueness across multiple avatars on the same page, render each
> avatar entirely on the server.

### Route handler (avatar endpoint)

Expose DiceBear behind your own URL. This is useful for caching with custom
`Cache-Control` headers or for restricting which seeds are accepted.

```ts
// app/api/avatar/[seed]/route.ts
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seed: string }> },
) {
  const { seed } = await params;

  const svg = new Avatar(style, { seed, size: 128 }).toString();

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
```

## Pages Router

Pages Router treats every component as client-side by default. Use `useMemo`
exactly like in a plain React app. See the
[React guide](https://www.dicebear.com/integrations/javascript/react/) for the canonical pattern.
Server-side generation through `getServerSideProps` or `getStaticProps` returns
the SVG as a prop, which avoids a client bundle hit.

```tsx
// pages/profile.tsx
import type { GetServerSideProps } from 'next';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

type Props = { avatar: string };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const avatar = new Avatar(style, { seed: 'Alice', size: 128 }).toDataUri();

  return { props: { avatar } };
};

export default function Profile({ avatar }: Props) {
  return <img src={avatar} alt="Avatar" width={128} height={128} />;
}
```

## With the HTTP API

The HTTP API needs no installation and works in both routers. Use a plain
`<img>` tag. Next.js does not pre-process external SVGs by default.

```tsx
export function UserAvatar({ seed = 'Alice' }: { seed?: string }) {
  const src = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(seed)}&size=128`;

  return <img src={src} alt="Avatar" width={128} height={128} />;
}
```

If you want to use `next/image` with the HTTP API, request a raster format (PNG,
WebP, AVIF), since `next/image` does not optimize SVG sources, and add
`api.dicebear.com` to `images.remotePatterns` in `next.config.js`.

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'api.dicebear.com' }],
  },
};
```

```tsx
import Image from 'next/image';

export function UserAvatar({ seed = 'Alice' }: { seed?: string }) {
  const src = `https://api.dicebear.com/10.x/lorelei/png?seed=${encodeURIComponent(seed)}&size=128`;

  return <Image src={src} alt="Avatar" width={128} height={128} />;
}
```

---

Source: https://www.dicebear.com/integrations/javascript/nuxt/

# Nuxt avatar library: using DiceBear with Nuxt

DiceBear works with Nuxt's universal rendering model. The avatar can be
generated on the server during SSR, in a Nitro endpoint, or in a plain client
component. Pick whichever matches the page's
[rendering mode](https://nuxt.com/docs/guide/concepts/rendering).

## With the JS library

### Universal component

Wrap generation in `computed` and the avatar is produced on whichever side the
component renders on. Because the result is a data URI, the markup hydrates
without re-running the renderer on the client.

```vue
<!-- components/UserAvatar.vue -->
<template>
  <img :src="avatar" alt="Avatar" width="128" height="128" />
</template>
```

> [!WARNING] Hydration & `idRandomization`
> `idRandomization` is backed by the host's non-seeded RNG, so the IDs produced
> during SSR will not match the client re-render, and Vue logs a hydration
> mismatch. Keep `idRandomization: false` for SSR'd avatars, or wrap the component
> in `<ClientOnly>` and accept the visual flash.
>
> If you need unique IDs across multiple avatars on the same page, render the
> entire page server-side and skip client hydration of the avatar subtree.

### Nitro endpoint

Expose DiceBear behind your own URL when you want custom caching or seed
validation:

```ts
// server/api/avatar/[seed].get.ts
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

export default defineEventHandler((event) => {
  const seed = getRouterParam(event, 'seed') ?? '';

  setHeader(event, 'Content-Type', 'image/svg+xml');
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');

  return new Avatar(style, { seed, size: 128 }).toString();
});
```

Consume it from any component with `<img :src="`/api/avatar/${seed}`">`.

### Cache with `useAsyncData`

For per-request SSR caching (so the same seed isn't re-rendered when multiple
components ask for it), wrap generation in `useAsyncData`:

```vue
<template>
  <img :src="avatar ?? undefined" alt="Avatar" width="128" height="128" />
</template>
```

## With the HTTP API

The HTTP API needs no installation. The URL is the same on the server and in the
browser, so `<img>` works in any rendering mode:

```vue
<template>
  <img :src="src" alt="Avatar" width="128" height="128" />
</template>
```

---

Source: https://www.dicebear.com/integrations/javascript/react-native/

# React Native avatar library: using DiceBear with React Native

DiceBear can be used in React Native via the JavaScript library with an SVG
renderer, or via the HTTP API's PNG format using the built-in `Image` component.
The API approach requires no SVG library.

## With the JS library

You need an SVG library to render the avatars. In our example we use the package
[react-native-svg](https://www.npmjs.com/package/react-native-svg).

```
npm install react-native-svg
```

```jsx
import { useMemo } from 'react';
import { View } from 'react-native';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };
import { SvgXml } from 'react-native-svg';

const style = new Style(lorelei);

export default function UserAvatar({ seed = 'Alice' }) {
  const avatar = useMemo(() => {
    return new Avatar(style, {
      seed,
      size: 128,
      // ... other options
    }).toString();
  }, [seed]);

  return (
    <View>
      <SvgXml xml={avatar} />
    </View>
  );
}
```

## With the HTTP API

With the HTTP API you can use the PNG format and the built-in `Image` component
without any additional dependencies.

```jsx
import { useMemo } from 'react';
import { Image, View } from 'react-native';

export default function Avatar({ seed = 'Alice' }) {
  const avatar = useMemo(() => {
    const url = new URL('https://api.dicebear.com/10.x/lorelei/png');
    url.searchParams.set('seed', seed);
    url.searchParams.set('size', '128');
    // ... other options
    return url.href;
  }, [seed]);

  return (
    <View>
      <Image source={{ uri: avatar }} style={{ width: 128, height: 128 }} />
    </View>
  );
}
```

---

Source: https://www.dicebear.com/integrations/javascript/react/

# React avatar library: using DiceBear with React

DiceBear works in React via the JS library or the HTTP API. Use `useMemo` to
generate deterministic SVG profile pictures from a seed, or use the HTTP API as
a plain `<img src>` with no additional dependencies.

## With the JS library

```jsx
import { useMemo } from 'react';
import { Style, Avatar } from '@dicebear/core';
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(lorelei);

export default function UserAvatar({ seed = 'Alice' }) {
  const avatar = useMemo(() => {
    return new Avatar(style, {
      seed,
      size: 128,
      // ... other options
    }).toDataUri();
  }, [seed]);

  return <img src={avatar} alt="Avatar" />;
}
```

## With the HTTP API

```jsx
import { useMemo } from 'react';

export default function Avatar({ seed = 'Alice' }) {
  const avatar = useMemo(() => {
    const url = new URL('https://api.dicebear.com/10.x/lorelei/svg');
    url.searchParams.set('seed', seed);
    url.searchParams.set('size', '128');
    // ... other options
    return url.href;
  }, [seed]);

  return <img src={avatar} alt="Avatar" />;
}
```

---

Source: https://www.dicebear.com/integrations/javascript/svelte/

# Svelte avatar library: using DiceBear with Svelte

DiceBear works with both Svelte 4 and Svelte 5. Use `$derived` (Svelte 5) or
reactive statements (Svelte 4) to keep SVG profile pictures in sync with prop
changes, either via the JS library for client-side generation or the HTTP API
for a zero-dependency approach.

## With the JS library

```svelte [Svelte 5]
<img src={avatar} alt="Avatar" />
```

```svelte [Svelte 4]
<img src={avatar} alt="Avatar" />
```

## With the HTTP API

```svelte [Svelte 5]
<img src={src} alt="Avatar" />
```

```svelte [Svelte 4]
<img src={src} alt="Avatar" />
```

---

Source: https://www.dicebear.com/integrations/javascript/vue/

# Vue avatar library: using DiceBear with Vue

Wrap avatar generation in a `computed` property to keep profile pictures in sync
with reactive data. Use the JS library for full control, or the HTTP API for a
dependency-free approach.

## With the JS library

```vue
<template>
  <img :src="avatar" alt="Avatar" />
</template>
```

## With the HTTP API

```vue
<template>
  <img :src="src" alt="Avatar" />
</template>
```

---

Source: https://www.dicebear.com/integrations/php/

# PHP avatar library

Generate avatars on your own server, in plain PHP (8.2 or higher), with no
external service involved. The API mirrors the
[JavaScript library](https://www.dicebear.com/integrations/javascript/), and the output is
byte-identical: the same seed and style produce the same SVG in every DiceBear
library.

## Installation

You need two packages: the core library `dicebear/core` and the avatar style
definitions `dicebear/styles`.

```
composer require dicebear/core dicebear/styles
```

## Usage

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/lorelei.json'));

$avatar = new Avatar($style, [
  'seed' => 'Alice',
  // ... other options
]);

$svg = (string) $avatar;
```

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
will always produce the same avatar:

```php
$avatar1 = new Avatar($style, ['seed' => 'user-123']);
$avatar2 = new Avatar($style, ['seed' => 'user-123']);

(string) $avatar1 === (string) $avatar2; // true
```

## Classes

### `Avatar`

The main class for generating avatars. Pass a `Style` instance and optional
options.

```php
use DiceBear\Avatar;

$avatar = new Avatar($style, [
  // ... options
]);
```

### `Style`

An immutable wrapper around a style definition. Reuse it when generating
multiple avatars from the same style.

```php
use DiceBear\Style;
use DiceBear\Avatar;

$style = new Style($definition);

$avatar1 = new Avatar($style, ['seed' => 'Alice']);
$avatar2 = new Avatar($style, ['seed' => 'Bob']);
```

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input.

```php
use DiceBear\Style;
use DiceBear\OptionsDescriptor;

$descriptor = new OptionsDescriptor(new Style($definition));
$fields = $descriptor->toJSON();
```

## Methods

### `__toString()` / `toString()`

**Return type:** `string`

Returns the avatar as SVG in XML format. The `__toString()` magic method allows
using the avatar directly in string contexts.

```php
$avatar = new Avatar($style, ['seed' => 'Alice']);

$svg = (string) $avatar;
// or
$svg = $avatar->toString();
```

### `toJSON()`

**Return type:** `array{svg: string, options: array}`

Returns an associative array with the SVG and the resolved options.

```php
$avatar = new Avatar($style, ['seed' => 'Alice']);

$json = $avatar->toJSON();

// $json['svg']     → '<svg>...</svg>'
// $json['options'] → ['seed' => 'Alice', ...]
```

### `toDataUri()`

**Return type:** `string`

Returns the avatar as [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme).

```php
$avatar = new Avatar($style, ['seed' => 'Alice']);

$dataUri = $avatar->toDataUri();

// <img src="<?= $dataUri ?>" alt="Avatar" />
```

## Core options

These options are the same across every DiceBear core. See
[Core options](https://www.dicebear.com/customize/options/) for the full reference. Here are the options
in PHP syntax:

```php
$avatar = new Avatar($style, [
  'seed' => 'Alice',
  'flip' => 'horizontal',          // 'none', 'horizontal', 'vertical', 'both'
  'rotate' => 10,                  // -360 to 360, or [min, max] range
  'scale' => 0.9,                  // 0 to 10 (1 = original), or [min, max] range
  'borderRadius' => 50,            // 0-50 (50 = circle)
  'size' => 128,
  'translateX' => 0,               // -1000 to 1000 (percent of canvas width)
  'translateY' => 0,               // -1000 to 1000 (percent of canvas height)
  'idRandomization' => true,
  'title' => 'User Avatar',
  'fontFamily' => 'Arial',         // or ['Arial', 'Helvetica']
  'fontWeight' => 700,             // 1-1000
  'backgroundColor' => ['#b6e3f4', '#c0aede'],
  'backgroundColorFill' => 'solid', // 'solid', 'linear', 'radial'
]);
```

Dynamic component and color options also work the same way. See
[Dynamic component options](https://www.dicebear.com/customize/options/#dynamic-component-options) for
all available patterns.

## Examples

### Avatar with custom background

```php
$avatar = new Avatar($style, [
  'seed' => 'Alice',
  'backgroundColor' => ['#b6e3f4', '#c0aede', '#d1d4f9'],
]);
```

### Fixed size avatar

```php
$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/bottts.json'));

$avatar = new Avatar($style, [
  'seed' => 'robot-42',
  'size' => 128,
  'borderRadius' => 50, // circular avatar
]);
```

### Avatar with transformations

```php
$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/avataaars.json'));

$avatar = new Avatar($style, [
  'seed' => 'Jane',
  'flip' => 'horizontal',
  'rotate' => 10,
  'scale' => 0.9,
  'translateY' => 5,
]);
```

### Multiple avatars on the same page

When rendering multiple avatars on the same page, use `idRandomization` to
prevent SVG ID conflicts:

```php
$users = ['alice', 'bob', 'charlie'];

$avatars = array_map(function (string $user) use ($style) {
  return (string) new Avatar($style, [
    'seed' => $user,
    'idRandomization' => true,
  ]);
}, $users);
```

### Weighted variant selection

```php
$avatar = new Avatar($style, [
  'seed' => 'Alice',
  'topVariant' => ['short01' => 2, 'short02' => 2, 'long01' => 1],
]);
```

---

Source: https://www.dicebear.com/integrations/python/

# Python avatar library

Generate avatars right in your Python code (3.10 or higher), with no external
service involved. The API mirrors the
[JavaScript library](https://www.dicebear.com/integrations/javascript/), and the output is
byte-identical: the same seed and style produce the same SVG in every DiceBear
library.

## Installation

You need two packages: the core library `dicebear-core` and the avatar style
definitions `dicebear-styles`.

```bash
pip install dicebear-core dicebear-styles
```

## Usage

We use the avatar style [lorelei](https://www.dicebear.com/styles/lorelei/) in our example. You can find
more avatar styles [here](https://www.dicebear.com/styles/).

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("lorelei.json").read_text("utf-8")
)

avatar = Avatar(style, {
    "seed": "John",
    # ... other options
})

svg = avatar.to_string()
```

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
will always produce the same avatar:

```python
avatar1 = Avatar(style, {"seed": "user-123"})
avatar2 = Avatar(style, {"seed": "user-123"})

avatar1.to_string() == avatar2.to_string()  # True
```

## Classes

### `Avatar`

The main class for generating avatars. Pass a `Style` instance and optional
options.

```python
from dicebear import Avatar

avatar = Avatar(style, {
    # ... options
})
```

### `Style`

An immutable wrapper around a style definition. Reuse it when generating
multiple avatars from the same style.

```python
from dicebear import Avatar, Style

style = Style(definition)

avatar1 = Avatar(style, {"seed": "Alice"})
avatar2 = Avatar(style, {"seed": "Bob"})
```

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input.

```python
from dicebear import OptionsDescriptor, Style

descriptor = OptionsDescriptor(Style(definition))
fields = descriptor.to_json()
```

## Methods

### `to_string()` / `str(avatar)`

**Return type:** `str`

Returns the avatar as SVG in XML format. The `__str__` method allows using the
avatar directly in string contexts.

```python
avatar = Avatar(style, {"seed": "Alice"})

svg = avatar.to_string()
# or
svg = str(avatar)
```

### `to_json()`

**Return type:** `dict` with keys `svg` and `options`

Returns a dict with the SVG and the resolved options.

```python
avatar = Avatar(style, {"seed": "Alice"})

result = avatar.to_json()

# result["svg"]     → '<svg>...</svg>'
# result["options"] → {"seed": "Alice", ...}
```

### `to_data_uri()`

**Return type:** `str`

Returns the avatar as [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme).

```python
avatar = Avatar(style, {"seed": "Alice"})

data_uri = avatar.to_data_uri()

# <img src="{data_uri}" alt="Avatar" />
```

## Core options

These options are the same across every DiceBear core. See
[Core options](https://www.dicebear.com/customize/options/) for the full reference. Here are the options
in Python syntax:

```python
avatar = Avatar(style, {
    "seed": "Alice",
    "flip": "horizontal",            # "none", "horizontal", "vertical", "both"
    "rotate": 10,                    # -360 to 360, or [min, max] range
    "scale": 0.9,                    # 0 to 10 (1 = original), or [min, max] range
    "borderRadius": 50,              # 0-50 (50 = circle)
    "size": 128,
    "translateX": 0,                 # -1000 to 1000 (percent of canvas width)
    "translateY": 0,                 # -1000 to 1000 (percent of canvas height)
    "idRandomization": True,
    "title": "User Avatar",
    "fontFamily": "Arial",           # or ["Arial", "Helvetica"]
    "fontWeight": 700,               # 1-1000
    "backgroundColor": ["#b6e3f4", "#c0aede"],
    "backgroundColorFill": "solid",  # "solid", "linear", "radial"
})
```

Dynamic component and color options also work the same way. See
[Dynamic component options](https://www.dicebear.com/customize/options/#dynamic-component-options) for
all available patterns.

## Examples

### Avatar with custom background

```python
avatar = Avatar(style, {
    "seed": "Alice",
    "backgroundColor": ["#b6e3f4", "#c0aede", "#d1d4f9"],
})
```

### Fixed size avatar

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("bottts.json").read_text("utf-8")
)

avatar = Avatar(style, {
    "seed": "robot-42",
    "size": 128,
    "borderRadius": 50,  # circular avatar
})
```

### Avatar with transformations

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("avataaars.json").read_text("utf-8")
)

avatar = Avatar(style, {
    "seed": "Jane",
    "flip": "horizontal",
    "rotate": 10,
    "scale": 0.9,
    "translateY": 5,
})
```

### Multiple avatars on the same page

When rendering multiple avatars on the same page, use `idRandomization` to
prevent SVG ID conflicts:

```python
from dicebear import Avatar, Style

style = Style(definition)
users = ["alice", "bob", "charlie"]

avatars = [
    Avatar(style, {"seed": user, "idRandomization": True}).to_string()
    for user in users
]
```

### Weighted variant selection

```python
avatar = Avatar(style, {
    "seed": "Alice",
    "topVariant": {"short01": 2, "short02": 2, "long01": 1},
})
```

---

Source: https://www.dicebear.com/integrations/rust/

# Rust avatar library

Generate avatars natively in Rust (1.80 or higher), with no external service
involved. The API mirrors the [JavaScript library](https://www.dicebear.com/integrations/javascript/),
and the output is byte-identical: the same seed and style produce the same SVG
in every DiceBear library.

## Installation

You need two crates: the core library `dicebear-core` and the avatar style
definitions `dicebear-styles` (each style sits behind a feature of the same
name). Options are passed as a `serde_json::Value`, so add `serde_json` too.

```sh
cargo add dicebear-core serde_json
cargo add dicebear-styles --features lorelei
```

## Usage

We use the avatar style [lorelei](https://www.dicebear.com/styles/lorelei/) in our example. You can find
more avatar styles [here](https://www.dicebear.com/styles/).

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::LORELEI)?;

let avatar = Avatar::new(&style, json!({
    "seed": "John",
    // ... other options
}))?;

let svg = avatar.to_svg();
```

Each avatar style comes with several options. You can find them on the details
page of each [avatar style](https://www.dicebear.com/styles/).

> [!NOTE]
> The avatar styles come from many creators, and each creator chooses the license
> for their own style. The [license overview](https://www.dicebear.com/licenses/) lists them all in one
> place.

## Deterministic avatars

The `seed` option is the key to generating deterministic avatars. The same seed
always produces the same avatar:

```rust
let avatar1 = Avatar::new(&style, json!({ "seed": "user-123" }))?;
let avatar2 = Avatar::new(&style, json!({ "seed": "user-123" }))?;

assert_eq!(avatar1.to_svg(), avatar2.to_svg());
```

## Types

### `Style`

A validated, immutable wrapper around a style definition. Build it once with
`Style::from_str` (from a JSON string) or `Style::from_value` (from a
`serde_json::Value`), then reuse it when generating multiple avatars.

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(definition_json)?;

let avatar1 = Avatar::new(&style, json!({ "seed": "Alice" }))?;
let avatar2 = Avatar::new(&style, json!({ "seed": "Bob" }))?;
```

### `Avatar`

The main type for generating avatars. `Avatar::new` takes a `&Style` and a
`serde_json::Value` of options, and returns `Result<Avatar, Error>` (invalid
options and circular color references surface as an `Error`).

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let avatar = Avatar::new(&style, json!({
    // ... options
}))?;
```

### `OptionsDescriptor`

Describes all valid options for a given style. Useful for building UIs or
validating user input.

```rust
use dicebear_core::{OptionsDescriptor, Style};

let descriptor = OptionsDescriptor::new(&style).to_json();
```

## Methods

### `to_svg()` / `to_string()`

**Return type:** `&str` / `String`

Returns the avatar as SVG in XML format. `Avatar` also implements `Display`, so
it can be used directly in string contexts (`format!`, `println!`,
`.to_string()`).

```rust
let avatar = Avatar::new(&style, json!({ "seed": "Alice" }))?;

let svg = avatar.to_svg();
// or
let svg = avatar.to_string();
```

### `to_json()`

**Return type:** `serde_json::Value` with keys `svg` and `options`

Returns a value with the SVG and the resolved options.

```rust
let avatar = Avatar::new(&style, json!({ "seed": "Alice" }))?;

let result = avatar.to_json();

// result["svg"]     → "<svg>...</svg>"
// result["options"] → { "seed": "Alice", ... }
```

### `to_data_uri()`

**Return type:** `String`

Returns the avatar as [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme).

```rust
let avatar = Avatar::new(&style, json!({ "seed": "Alice" }))?;

let data_uri = avatar.to_data_uri();

// <img src="{data_uri}" alt="Avatar" />
```

## Core options

These options are the same across every DiceBear core. See
[Core options](https://www.dicebear.com/customize/options/) for the full reference. Here are the options
in Rust syntax:

```rust
let avatar = Avatar::new(&style, json!({
    "seed": "Alice",
    "flip": "horizontal",            // "none", "horizontal", "vertical", "both"
    "rotate": 10,                    // -360 to 360, or [min, max] range
    "scale": 0.9,                    // 0 to 10 (1 = original), or [min, max] range
    "borderRadius": 50,              // 0-50 (50 = circle)
    "size": 128,
    "translateX": 0,                 // -1000 to 1000 (percent of canvas width)
    "translateY": 0,                 // -1000 to 1000 (percent of canvas height)
    "idRandomization": true,
    "title": "User Avatar",
    "fontFamily": "Arial",           // or ["Arial", "Helvetica"]
    "fontWeight": 700,               // 1-1000
    "backgroundColor": ["#b6e3f4", "#c0aede"],
    "backgroundColorFill": "solid",  // "solid", "linear", "radial"
}))?;
```

Dynamic component and color options also work the same way. See
[Dynamic component options](https://www.dicebear.com/customize/options/#dynamic-component-options) for
all available patterns.

## Examples

### Avatar with custom background

```rust
let avatar = Avatar::new(&style, json!({
    "seed": "Alice",
    "backgroundColor": ["#b6e3f4", "#c0aede", "#d1d4f9"],
}))?;
```

### Fixed size avatar

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BOTTTS)?;

let avatar = Avatar::new(&style, json!({
    "seed": "robot-42",
    "size": 128,
    "borderRadius": 50, // circular avatar
}))?;
```

### Avatar with transformations

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::AVATAAARS)?;

let avatar = Avatar::new(&style, json!({
    "seed": "Jane",
    "flip": "horizontal",
    "rotate": 10,
    "scale": 0.9,
    "translateY": 5,
}))?;
```

### Multiple avatars on the same page

When rendering multiple avatars on the same page, use `idRandomization` to
prevent SVG ID conflicts:

```rust
let style = Style::from_str(dicebear_styles::LORELEI)?;

let avatars: Vec<String> = ["alice", "bob", "charlie"]
    .iter()
    .map(|seed| {
        Avatar::new(&style, json!({ "seed": seed, "idRandomization": true }))
            .map(|a| a.to_svg().to_string())
    })
    .collect::<Result<_, _>>()?;
```

### Weighted variant selection

```rust
let avatar = Avatar::new(&style, json!({
    "seed": "Alice",
    "topVariant": { "short01": 2, "short02": 2, "long01": 1 },
}))?;
```

---

Source: https://www.dicebear.com/customize/gender/

# How do I set a gender?

DiceBear has no single `gender` switch, but you can shape any avatar to look
more masculine or feminine. Every feature is its own option you can set
directly, so you pick the traits that fit the look you want, such as the hair or
facial hair, and leave out the rest. An upcoming release adds descriptive
variant tags that turn the common cases into a one-liner.

## Find and apply the options

The [Playground](https://www.dicebear.com/playground/) shows a preview for every option value and lets
you combine them, with the avatar updating as you go. Every
[avatar style page](https://www.dicebear.com/styles/) lists the same options as a static reference, also
with previews, so you can look them up at any time. If you would rather not
write any code, the [Editor](https://editor.dicebear.com) lets you browse styles
and adjust options visually.

Once you know which options you want, pass them as
[query parameters in the HTTP API](https://www.dicebear.com/integrations/http-api/#options) or as
options in the [JS library](https://www.dicebear.com/integrations/javascript/) and the other libraries.
The Avataaars style, for example, lets you turn facial hair off with
`facialHairProbability=0`:

```
https://api.dicebear.com/10.x/avataaars/svg?seed=Casey&facialHairProbability=0
```

The options differ from style to style, so check the style page for the one you
use.

## Filter by tags

> [!WARNING] The character tags are not available yet
> No DiceBear style carries tags such as `hairLength` or `facialHair` today, so
> the filters in this section have no effect for now. Until they ship, set the
> per-feature options described above.

An upcoming release tags the character styles' variants with descriptive labels
such as `hairLength:long` or `headwear:headscarf`. The
[`tags`](https://www.dicebear.com/customize/tags/) option keeps only the variants you choose, which will
often be the quickest way to lean on the features that read as more masculine or
feminine. For example, keep long hair and leave out facial hair:

```js
const avatar = new Avatar(style, {
  seed: 'Casey',
  tags: ['hairLength:long', '!facialHair'],
});
```

The same filter works as a query parameter in the HTTP API:

```
https://api.dicebear.com/10.x/adventurer/svg?seed=Casey&tags=hairLength:long,!facialHair
```

Tags and the per-feature options work together, so you can combine a tag filter
with options such as `facialHairProbability`. See
[Filter variants with tags](https://www.dicebear.com/customize/tags/) for how the filter behaves and
which tags are already available.

## Share and reuse option sets

If you put together a set of options you like, share it under
[Show and tell](https://github.com/orgs/dicebear/discussions/categories/show-and-tell)
in our GitHub Discussions. Other people can then build on your work and adapt it
to their own needs, and you can reuse combinations that others have already
shared.

## Why there is no dedicated gender option

Every DiceBear option names something that is drawn: a hairstyle, a beard,
glasses, a hat. None of those features belongs to a gender. Whether long hair, a
headscarf, or earrings reads as masculine or feminine is a matter of convention,
and conventions differ by culture and by personal taste.

A `male`/`female` switch would have to settle on one such convention for
everyone. DiceBear is used all over the world, in every kind of project, so a
fixed mapping would be wrong for a good part of that audience, and the library
would be the one deciding what a man or a woman looks like. That call belongs to
your project, not to us.

Facial hair is the feature that comes closest to a signal, and it still says
little. People grow a beard or shave it for reasons of taste, culture, and
religion, so its presence describes the drawing rather than the person.

No option is tied to a gender unless the style's designer deliberately built it
that way. The options describe features such as hair or glasses, and what you
make of them is up to you.

---

Source: https://www.dicebear.com/customize/options/

# Core options

These options are the same across every DiceBear core: the JavaScript, PHP,
Python, Rust, Go, Dart, and C# libraries, and the
[HTTP API](https://www.dicebear.com/integrations/http-api/). Only the way you pass them differs from one
language to the next, so each library page shows that in its own syntax. The
names, types, defaults, and behavior below do not change.

They apply to every avatar style. Where the type lists `[min, max]`, you may
pass either a fixed value or a two-element tuple. The PRNG samples a value from
the tuple's range.

| Option            | Type                                             | Default       | Description                                                                                                                  |
| ----------------- | ------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `seed`            | `string`                                         | `''`          | Seed for deterministic generation                                                                                            |
| `flip`            | `'none' \| 'horizontal' \| 'vertical' \| 'both'` | `'none'`      | Flip the avatar (accepts an array of values to randomize)                                                                    |
| `rotate`          | `number \| [min, max]`                           | `0`           | Rotation in degrees (−360 to 360)                                                                                            |
| `scale`           | `number \| [min, max]`                           | `1`           | Uniform scale factor around the canvas center (0 to 10; `1` is original size)                                                |
| `borderRadius`    | `number \| [min, max]`                           | `0`           | Border radius in percent of the canvas (0 to 50; `50` makes a circle)                                                        |
| `size`            | `integer`                                        | _unset_       | Output size in pixels (1 to 4096); when unset the SVG scales to its container                                                |
| `translateX`      | `number \| [min, max]`                           | `0`           | Horizontal translation in percent of the canvas width (−1000 to 1000)                                                        |
| `translateY`      | `number \| [min, max]`                           | `0`           | Vertical translation in percent of the canvas height (−1000 to 1000)                                                         |
| `idRandomization` | `boolean`                                        | `false`       | Suffix every SVG `id` with a random, non-deterministic value (avoids `url(#…)` collisions when several avatars share a page) |
| `title`           | `string`                                         | _unset_       | Accessible title; when set, the SVG becomes `role="img"` with `<title>`                                                      |
| `fontFamily`      | `string \| string[]`                             | `'system-ui'` | Font family for text-based styles (CSS-style font stack, no quotes)                                                          |
| `fontWeight`      | `integer \| integer[]`                           | `400`         | Font weight for text-based styles (1 to 1000)                                                                                |
| `tags`            | `string \| string[]`                             | _unset_       | Keep only variants matching these [tags](https://www.dicebear.com/customize/tags/) (`category` or `category:value`, prefix with `!` to disallow)     |

## Background options

These options are available for every style, even ones that don't declare a
`background` color group in their definition.

| Option                     | Type                              | Default    | Description                                                        |
| -------------------------- | --------------------------------- | ---------- | ------------------------------------------------------------------ |
| `backgroundColor`          | `string \| string[]`              | _unset_    | Background colors as hex (`#` optional, `#RGB` to `#RRGGBBAA`)     |
| `backgroundColorFill`      | `'solid' \| 'linear' \| 'radial'` | `'solid'`  | Background fill type (accepts an array of values to randomize)     |
| `backgroundColorFillStops` | `integer \| [min, max]`           | `2`        | Number of gradient stops (minimum 2); ignored when fill is `solid` |
| `backgroundColorAngle`     | `number \| [min, max]`            | `0`        | Gradient angle in degrees (−360 to 360)                            |
| `backgroundColorOrder`     | `'random' \| 'fixed'`             | `'random'` | Use the given colors in order (`fixed`) instead of shuffling them  |

## Dynamic component options

For each component in a style (e.g. `eyes`, `mouth`, `hair`), the following
options are available:

| Pattern                  | Type                                        | Description                                            |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------ |
| `{component}Variant`     | `string \| string[] \| { variant: weight }` | Restrict to specific variants, optionally with weights |
| `{component}Probability` | `number`                                    | Visibility probability in percent (0 to 100)           |

A component's rotation, translation, and scale are sampled at render time from
the component definition and are **not** user options: there are no
`{component}Rotate`, `{component}TranslateX`, `{component}TranslateY`, or
`{component}Scale` options.

Component aliases (declared via `extends` in the style definition) do not expose
their own option keys. They share `{source}Variant` and `{source}Probability`
with the component they extend.

## Dynamic color options

For each color group in a style (e.g. `skin`, `hair`) and `background`, the
following options are available:

| Pattern                 | Type                              | Description                                                        |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `{color}Color`          | `string \| string[]`              | Override the palette with hex values (`#` optional)                |
| `{color}ColorFill`      | `'solid' \| 'linear' \| 'radial'` | Fill type (accepts an array of values to randomize)                |
| `{color}ColorFillStops` | `integer \| [min, max]`           | Number of gradient stops (minimum 2); ignored when fill is `solid` |
| `{color}ColorAngle`     | `number \| [min, max]`            | Gradient angle in degrees (−360 to 360)                            |
| `{color}ColorOrder`     | `'random' \| 'fixed'`             | Use the given colors in order (`fixed`) instead of shuffling them  |

With `{color}ColorOrder: 'fixed'`, colors passed via `{color}Color` keep exactly
the order you give them: gradient fills apply them as stops from first to last,
solid fills always use the first color, and the number of gradient stops
defaults to the number of given colors. Without `{color}Color`, `fixed` only
skips the shuffle; the style's palette is deduplicated and used in sorted order.
Constraints in the style definition (`contrastTo`, `notEqualTo`) still apply, so
the result can stay seed-dependent through the referenced color groups.

## Variant tags

When a style tags its variants, the `tags` option filters the variant pool to
the traits you want, across every component at once. A tag is `category` or
`category:value`, such as `animation` or `hairLength:long`. Within one category
the values combine with "or", different categories combine with "and", a bare
category requires the trait, and a leading `!` disallows. See
[Filter variants with tags](https://www.dicebear.com/customize/tags/) for the full rules and the
categories DiceBear's styles use.

---

Source: https://www.dicebear.com/customize/style-options/

# How to programmatically access all available options of an avatar style?

Each avatar style has different options depending on its components and colors.
The `OptionsDescriptor` class lets you discover all available options at
runtime.

## JavaScript

```js
import { Style, OptionsDescriptor } from '@dicebear/core';
import definition from '@dicebear/styles/micah.json' with { type: 'json' };

const style = new Style(definition);
const descriptor = new OptionsDescriptor(style);

console.log(descriptor.toJSON());
```

## PHP

```php
use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\OptionsDescriptor;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/micah.json'));

$descriptor = new OptionsDescriptor($style);

print_r($descriptor->toJSON());
```

## Python

```python
from importlib.resources import files

from dicebear import OptionsDescriptor, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("micah.json").read_text("utf-8")
)

descriptor = OptionsDescriptor(style)

print(descriptor.to_json())
```

## Go

```go
import (
	"fmt"

	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Micah))
descriptor := dicebear.NewOptionsDescriptor(style).ToJSON()

fmt.Println(descriptor)
```

## Dart

```dart
import 'dart:convert';

import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/micah.dart';

final style = Style.parse(micah);
final descriptor = OptionsDescriptor(style);

print(jsonEncode(descriptor.toJson()));
```

## C#

```csharp
using DiceBear;

var style = Style.Parse(Styles.Micah);
var descriptor = new OptionsDescriptor(style).ToJson();

Console.WriteLine(descriptor.ToJsonString());
```

## Field descriptor types

The `toJSON()` method returns a map of option names to field descriptors. Each
descriptor has a `type` and additional properties depending on the type:

| Type      | Properties                            | Example option           |
| --------- | ------------------------------------- | ------------------------ |
| `string`  | `list?`                               | `seed`, `fontFamily`     |
| `number`  | `min?`, `max?`, `list?`               | `fontWeight`             |
| `boolean` |                                       | `idRandomization`        |
| `enum`    | `values`, `list?`, `weighted?`        | `flip`, `*Variant`       |
| `color`   | `list?`, `contrastTo?`, `notEqualTo?` | `*Color`                 |
| `range`   | `min?`, `max?`                        | `rotate`, `borderRadius` |

- `list` indicates the option also accepts an array of values.
- `weighted` (on enum fields) means the option additionally accepts a
  `Record<string, number>` weight map for PRNG selection.
- `contrastTo` (on color fields) names the color group the renderer will
  contrast against, so UIs can flag that this group's selection is
  contrast-driven rather than random. Only set when the style definition
  declares a `contrastTo` constraint on the group.
- `notEqualTo` (on color fields) lists the color groups this group must differ
  from. A UI that picks colors itself has to apply the same rule, because a
  single explicit color per group leaves the renderer nothing to filter. Only
  set when the style definition declares a `notEqualTo` constraint on the group.

Component aliases (declared via `extends` in the definition) do not contribute
their own `${alias}Variant` / `${alias}Probability` entries to the descriptor.
They share their source component's user options.

---

Source: https://www.dicebear.com/customize/tags/

# Filter avatar variants with tags

Avatar styles can describe their variants with **tags**. A tag is a short label
like `animation` or `hairLength:long` that says something about a variant. Tags
only describe, they never change the artwork. They let you narrow the pool of
variants an avatar is drawn from, and they work the same way across every style
that carries them.

## Filter with the `tags` option

`tags` is a [core option](https://www.dicebear.com/customize/options/), so it works everywhere the
avatar is generated. Pass the tags you want to keep:

```js
import { Style, Avatar } from '@dicebear/core';
import planets from '@dicebear/styles/planets.json' with { type: 'json' };

const style = new Style(planets);
const avatar = new Avatar(style, {
  seed: 'John',
  tags: ['animation'],
});
```

In the [HTTP API](https://www.dicebear.com/integrations/http-api/) the same filter is a comma-separated
query parameter:

```
https://api.dicebear.com/10.x/planets/svg?seed=John&tags=animation
```

## How the filter works

A tag token is `category` or `category:value`, optionally prefixed with `!`.
Each token narrows a component's pool of variants:

| Token             | Effect                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `category:value`  | Keeps variants that carry this tag, plus variants with no tag in the category. Several values of one category act as "or". |
| `category`        | Requires the category: drops variants that carry no tag in it. It binds only in components that use the category at all.   |
| `!category:value` | Drops every variant that carries exactly this tag.                                                                         |
| `!category`       | Drops every variant that carries any tag in the category.                                                                  |

A few rules tie the tokens together:

- A category only touches the components that use it, so you change one trait
  and the rest of the avatar stays varied.
- Different categories act as "and", and a disallow (`!`) always wins over an
  allow.
- A per-component variant option is more specific and takes precedence. When you
  set `animationVariant` directly, the `tags` filter is ignored for the
  animation and applies only to the other components.
- Only an unknown category is ignored. An unknown value is not. Because no
  variant matches it, every variant tagged in that category drops out. A typo in
  `hairLenght:long` changes nothing, while a typo in `hairLength:lng` removes
  the hair.

> [!TIP]
> If a filter leaves a component with no matching variants, that component is not
> drawn. Loosen the filter or check the tags the style actually provides on its
> [style page](https://www.dicebear.com/styles/). Passing `tags` to a style that carries no tags does
> nothing.

## The tags DiceBear offers

> [!WARNING] Only the animation tag ships today
> The character categories are not set on any style yet. A filter like
> `mood:positive` or `hairLength:long` has no effect for now.

Right now, DiceBear's own styles carry tags in one place: the opt-in animation
of the animated styles. An upcoming release adds a shared set for the character
styles with mood, hair length, headwear, facial hair, eyewear, and accessory.
Those definitions already live in
[How DiceBear tags variants](https://www.dicebear.com/customize/tags/reference/).

| Category    | Values                     | Found on                                   |
| ----------- | -------------------------- | ------------------------------------------ |
| `animation` | (bare category, no values) | the animation component of animated styles |

The animation is off by default, and the filter controls it like this:

| `tags`       | Result                                              |
| ------------ | --------------------------------------------------- |
| `animation`  | Turns the animation on, at a random speed per seed. |
| `!animation` | Keeps the avatar static, which is also the default. |

For a fixed speed, skip the filter and set the variant directly with the
`animationVariant` option (e.g. `animationVariant: 'slow'`), which is more
specific and always wins.

```js
// Turn on the opt-in animation of an animated style, at a random speed
// per seed.
const avatar = new Avatar(style, {
  seed: 'Alex',
  tags: ['animation'],
});
```

## Custom styles

Tags are not limited to this list. A [custom style](https://www.dicebear.com/create-styles/with-figma/)
can reuse these categories, add its own values, or define entirely different
ones. The only rule is the grammar: a tag is `category` or `category:value`, and
each segment is camelCase (for example `mouthExpression:smug` or
`species:robot`). There is no fixed vocabulary a style has to follow, so pick
the categories that describe your artwork.

---

Source: https://www.dicebear.com/customize/tags/reference/

# How DiceBear tags variants

DiceBear's own styles share one set of tags, so the [`tags`](https://www.dicebear.com/customize/tags/)
filter behaves the same from one style to the next. Today only one category
ships: the `animation` tag of the animated styles. The character categories
further down arrive with an upcoming release.

DiceBear tags each variant by looking at how it renders, not at its name. Names
are not always reliable. A hair variant called `long04` can turn out short once
you look at it, so the rendered shape decides the tag.

A few principles keep the tags consistent:

- Tags only describe. A variant carries the labels that fit what it shows, and
  never a category outside the set below.
- A tag is added only when the trait is clear. An ambiguous or purely decorative
  variant is left untagged rather than guessed. Where a category has a bare
  form, as `headwear` does, the bare tag is still set and only the value is left
  off.
- Most variants carry no tag or one tag. A few carry two, such as hair with a
  visible hat.
- Variant tags only add information, they never remove a variant on their own.
  To leave something out at render time, use the `!` form of the
  [`tags` option](https://www.dicebear.com/customize/tags/). Disallowing lives in the filter, not in the
  data.

The tag grammar is `category` or `category:value`, each segment camelCase and
alphanumeric. A variant holds at most 32 tags.

## Animation

The `animation` category covers the animation component of animated styles. It
is a bare category without values: every animated variant carries the plain
`animation` tag, and the static default variant carries no tag, so the animation
stays off until you ask for it.

- `['animation']` turns the animation on, at a random speed per seed.
- `['!animation']` keeps the avatar static. A disallow wins, so it also
  overrides an `animation` in the same list.

The speed steps are variants, not traits, so they carry no value tags. To pin a
speed, set the `animationVariant` option (e.g. `animationVariant: 'slow'`),
which is more specific than the filter and always wins.

## Planned categories

> [!WARNING] Not shipped yet
> No DiceBear style carries the categories below, so filtering on them has no
> effect for now.

The categories below are the standard set for the character styles. We publish
the definitions ahead of time so custom styles can reuse them and stay
compatible with the filter examples in the docs.

### Mood

The `mood` category covers the parts of the face that carry expression: the
mouth, eyes, eyebrows, and any combined expression component. It has two values,
and a variant gets at most one.

- `negative` for a clearly unfriendly or distressed expression: angry, sad, or
  scared.
- `positive` for everything else, including happy, neutral, surprised, playful,
  and confused faces.

Only a clear negative is tagged `negative`. Anything friendly, neutral, or
ambiguous is `positive`, so filtering on `mood:positive` always leaves a usable
variant and never empties a component. The usual reason to filter mood is to
keep avatars friendly, and `mood:positive` does that.

Mood is deliberately coarse. A finer list of feelings would not survive
filtering, because a specific feeling like "sad" often has no matching variant
for every part of a face, so that part would drop out and the avatar would
render incomplete. Two values keep every filtered face complete.

A part with no expression at all, such as a face mask or a purely graphic shape,
is left without a mood.

### Hair length

The `hairLength` category covers hair components. It is optional and only set
when the length is actually visible.

- `bald` for no hair, or hair shaved to the scalp.
- `short` for hair above the ears, cropped or buzzed.
- `medium` for around ear-to-jaw length.
- `long` for hair past the jaw, shoulder length or longer.

When the hair is gathered or pinned up so the length cannot be read, such as a
bun or a top-knot, the length is left off. A ponytail or pigtails with a visible
hanging tail still gets a length. A variant that is really headwear gets a
`headwear` tag, and a variant showing both hair and a hat may carry both.

The cut and the texture of the hair carry no tags. Whether hair reads as wavy or
curly is a judgment call that would come out differently from one style to the
next, and the filter is there to steer the look in broad strokes, not to pick a
haircut. For a specific hairstyle, set the style's own hair variant option.

### Headwear

The `headwear` category covers anything worn on the head. Every such variant
carries at least the bare `headwear` tag, so `!headwear` removes all of them. A
value comes on top of it when the shape is unmistakable:

- `hat` for a crown with a brim all the way around, such as a sun hat or a
  fedora.
- `cap` for a brim at the front only, such as a baseball or a flat cap.
- `beanie` for a soft, close-fitting hat without a brim.
- `turban` for wrapped cloth that covers the hair and leaves the neck free.
- `headscarf` for wrapped cloth that covers the hair together with the neck or
  the shoulders.
- `headband` for a band alone, with the hair still visible.

The values name the shape of the garment, not the person wearing it. That is why
the two wrapped forms are told apart by the neck, and why the tag says
`headscarf` rather than naming a particular garment: the drawing shows cloth,
and the same cloth means different things to different people.

### Facial hair

The `facialHair` category covers beards, mustaches, and sideburns. Like
`animation` it is a bare category without values: a variant showing any facial
hair carries the plain `facialHair` tag, and a clean-shaven one carries none.

- `['!facialHair']` leaves facial hair out.
- `['facialHair']` drops the untagged variants of the components that use the
  category. Whether such a component is drawn at all is still up to its
  probability.

Where stubble ends and a beard begins is a call that would land differently from
one style to the next, and what the filter is good for is saying yes or no to
facial hair. For a specific beard, set the style's facial hair variant option.

### Eyewear

The `eyewear` category covers glasses.

- `glasses` for clear lenses or spectacles.
- `sunglasses` for filled or dark lenses.

### Accessory

The `accessory` category covers worn extras.

- `earrings` for ear jewelry.
- `mask` for a face covering worn over the mouth or face, such as a medical
  mask. A mask is a worn item, not an expression, so a masked mouth gets
  `accessory:mask` and no `mood`.

## Custom styles

This set is what DiceBear's own styles use, not a rule every style has to
follow. A [custom style](https://www.dicebear.com/create-styles/with-figma/) can reuse these categories,
add its own values, or define entirely different ones. As long as the grammar
holds, you are free to describe your artwork in whatever way fits it best.

---

Source: https://www.dicebear.com/recipes/avatar-placeholder/

# Using DiceBear as an avatar placeholder API

An avatar placeholder replaces the generic default shown when a user hasn't
uploaded a profile picture yet. Instead of a gray silhouette, DiceBear generates
a unique, deterministic SVG avatar from any seed, so every user gets a distinct
picture from the moment they sign up.

## Why DiceBear as a placeholder?

## With the HTTP API

The simplest approach: use a DiceBear API URL as the `src` of an `<img>` tag.
Use a stable identifier as the seed. A numeric user ID works well. For full
options and rate limit details, see the
[HTTP API documentation](https://www.dicebear.com/integrations/http-api/).

- `https://api.dicebear.com/10.x/initials/svg?seed=JD`
- `https://api.dicebear.com/10.x/pixel-art/svg?seed=user-42`

```html
<img
  src="https://api.dicebear.com/10.x/initials/svg?seed=JD"
  alt="User avatar"
  width="48"
  height="48"
/>
```

### Fallback on image error

Combine DiceBear with an `onerror` handler to fall back gracefully when a user's
uploaded photo fails to load:

```html
<img
  src="/uploads/user-123.jpg"
  onerror="this.src='https://api.dicebear.com/10.x/pixel-art/svg?seed=123'; this.onerror=null;"
  alt="User avatar"
/>
```

### Using a user ID as seed

Pass a stable, unique identifier as the seed to ensure each user always gets the
same placeholder:

```js
const userId = 'user-8f3a2c';
const avatarUrl = `https://api.dicebear.com/10.x/thumbs/svg?seed=${encodeURIComponent(userId)}`;
```

- `https://api.dicebear.com/10.x/thumbs/svg?seed=user-8f3a2c`

## With the JavaScript library

Use the JS library for server-side rendering or to embed the SVG directly in
your markup without an additional HTTP request. For full installation and API
details, see the [JavaScript library documentation](https://www.dicebear.com/integrations/javascript/).

```js
import { Style, Avatar } from '@dicebear/core';
import thumbs from '@dicebear/styles/thumbs.json' with { type: 'json' };

const style = new Style(thumbs);

function getPlaceholderAvatar(userId) {
  return new Avatar(style, {
    seed: userId,
    size: 48,
    borderRadius: 50,
  }).toString();
}
```

## With the PHP library

Use the PHP library for server-side rendering without an additional HTTP
request. For full installation and API details, see the
[PHP library documentation](https://www.dicebear.com/integrations/php/).

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/thumbs.json'));

function getPlaceholderAvatar(Style $style, string $userId): string {
  return (string) new Avatar($style, [
    'seed' => $userId,
    'size' => 48,
    'borderRadius' => 50,
  ]);
}
```

## With the Python library

Use the Python library for server-side rendering without an additional HTTP
request. For full installation and API details, see the
[Python library documentation](https://www.dicebear.com/integrations/python/).

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("thumbs.json").read_text("utf-8")
)

def get_placeholder_avatar(user_id: str) -> str:
    return Avatar(style, {
        "seed": user_id,
        "size": 48,
        "borderRadius": 50,
    }).to_string()
```

## With the Rust library

Use the Rust library for server-side rendering without an additional HTTP
request. For full installation and API details, see the
[Rust library documentation](https://www.dicebear.com/integrations/rust/).

```rust
use dicebear_core::{Avatar, Error, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::THUMBS)?;

fn placeholder_avatar(style: &Style, user_id: &str) -> Result<String, Error> {
    let avatar = Avatar::new(style, json!({
        "seed": user_id,
        "size": 48,
        "borderRadius": 50,
    }))?;

    Ok(avatar.to_string())
}
```

## With the Go library

Use the Go library for server-side rendering without an additional HTTP request.
For full installation and API details, see the
[Go library documentation](https://www.dicebear.com/integrations/go/).

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Thumbs))

func placeholderAvatar(style *dicebear.Style, userID string) (string, error) {
	avatar, err := dicebear.NewAvatar(style, map[string]any{
		"seed":         userID,
		"size":         48,
		"borderRadius": 50,
	})
	if err != nil {
		return "", err
	}

	return avatar.SVG(), nil
}
```

## With the Dart library

Use the Dart library for server-side rendering without an additional HTTP
request. For full installation and API details, see the
[Dart library documentation](https://www.dicebear.com/integrations/dart/).

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/thumbs.dart';

final style = Style.parse(thumbs);

String getPlaceholderAvatar(String userId) {
  return Avatar(style, {
    'seed': userId,
    'size': 48,
    'borderRadius': 50,
  }).svg;
}
```

## With the C# library

Use the C# library for server-side rendering without an additional HTTP request.
For full installation and API details, see the
[C# library documentation](https://www.dicebear.com/integrations/csharp/).

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Thumbs);

string GetPlaceholderAvatar(string userId) =>
    new Avatar(style, new JsonObject
    {
        ["seed"] = userId,
        ["size"] = 48,
        ["borderRadius"] = 50,
    }).ToSvg();
```

## Choosing a style

Different styles suit different use cases. Click a style to see all available
options.

## Tip: always define a size

Specify a `size` or CSS dimensions to avoid layout shift while the avatar loads:

```js
// JS library
new Avatar(style, { seed: userId, size: 48, borderRadius: 50 });
```

```php
// PHP library
new Avatar($style, ['seed' => $userId, 'size' => 48, 'borderRadius' => 50]);
```

```python
# Python library
Avatar(style, {"seed": user_id, "size": 48, "borderRadius": 50})
```

```rust
// Rust library
Avatar::new(&style, json!({ "seed": user_id, "size": 48, "borderRadius": 50 }))?;
```

```go
// Go library
dicebear.NewAvatar(style, map[string]any{"seed": userID, "size": 48, "borderRadius": 50})
```

```dart
// Dart library
Avatar(style, {'seed': userId, 'size': 48, 'borderRadius': 50});
```

```csharp
// C# library
new Avatar(style, new JsonObject { ["seed"] = userId, ["size"] = 48, ["borderRadius"] = 50 });
```

```
// HTTP API
https://api.dicebear.com/10.x/thumbs/svg?seed=user-123&size=48&borderRadius=50
```

---

Source: https://www.dicebear.com/recipes/gravatar-default-image/

# DiceBear as Gravatar default avatar

Gravatar shows a default image for everyone without a Gravatar account, and you
can point it at the DiceBear HTTP API, so those people get a friendly generated
avatar instead of the gray silhouette. Gravatar sets a few conditions for
default images:

> 1. ✅ MUST be publicly available (e.g. cannot be on an intranet, on a local
>    development machine, behind HTTP Auth or some other firewall etc). Default
>    images are passed through a security scan to avoid malicious content.
> 2. ✅ MUST be accessible via HTTP or HTTPS on the standard ports, 80 and 443,
>    respectively.
> 3. ⚠️ MUST have a recognizable image extension (jpg, jpeg, gif, png, heic)
> 4. ⚠️ MUST NOT include a querystring (if it does, it will be ignored)

> Source: https://docs.gravatar.com/sdk/images/#default-image

Since Gravatar does not support SVG, we have to use the PNG endpoint.

```js [JavaScript]
const emailHash = encodeURIComponent('00000000000000000000000000000000');
const defaultImage = encodeURIComponent(
  'https://api.dicebear.com/10.x/lorelei/svg'
  'https://api.dicebear.com/10.x/lorelei/png'
);

const gravatarImage = `https://www.gravatar.com/avatar/${emailHash}?d=${defaultImage}`;
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng
```

```php [PHP]
$emailHash = urlencode('00000000000000000000000000000000');
$defaultImage = urlencode(
  'https://api.dicebear.com/10.x/lorelei/svg'
  'https://api.dicebear.com/10.x/lorelei/png'
);

$gravatarImage = sprintf(
  'https://www.gravatar.com/avatar/%s?d=%s',
  $emailHash,
  $defaultImage
);
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng
```

```python [Python]
import urllib.parse

email_hash = urllib.parse.quote("00000000000000000000000000000000")
default_image = urllib.parse.quote(
    "https://api.dicebear.com/10.x/lorelei/svg"
    "https://api.dicebear.com/10.x/lorelei/png"
)

gravatar_image = f"https://www.gravatar.com/avatar/{email_hash}?d={default_image}"
# https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng
```

```go [Go]
import (
	"fmt"
	"net/url"
)

emailHash := url.QueryEscape("00000000000000000000000000000000")
defaultImage := url.QueryEscape(
	"https://api.dicebear.com/10.x/lorelei/svg",
	"https://api.dicebear.com/10.x/lorelei/png",
)

gravatarImage := fmt.Sprintf("https://www.gravatar.com/avatar/%s?d=%s", emailHash, defaultImage)
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng
```

```dart [Dart]
final emailHash = Uri.encodeComponent('00000000000000000000000000000000');
final defaultImage = Uri.encodeComponent(
  'https://api.dicebear.com/10.x/lorelei/svg'
  'https://api.dicebear.com/10.x/lorelei/png'
);

final gravatarImage = 'https://www.gravatar.com/avatar/$emailHash?d=$defaultImage';
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng
```

```csharp [C#]
var emailHash = Uri.EscapeDataString("00000000000000000000000000000000");
var defaultImage = Uri.EscapeDataString(
    "https://api.dicebear.com/10.x/lorelei/svg"
    "https://api.dicebear.com/10.x/lorelei/png"
);

var gravatarImage = $"https://www.gravatar.com/avatar/{emailHash}?d={defaultImage}";
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng
```

Usually we set options in the query string, such as the seed. Since a query
string is not allowed by Gravatar, the [HTTP-API](https://www.dicebear.com/integrations/http-api/)
allows you to specify the options in the path. Just replace the question mark
with a slash and encode the options.

```js [JavaScript]
const emailHash = encodeURIComponent('00000000000000000000000000000000');
const options = `seed=${emailHash}`;
const defaultImage = encodeURIComponent(
  `https://api.dicebear.com/10.x/lorelei/png?${options}`
  `https://api.dicebear.com/10.x/lorelei/png/${encodeURIComponent(options)}`,
);

const gravatarImage = `https://www.gravatar.com/avatar/${emailHash}?d=${defaultImage}`;
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng%2Fseed%253D00000000000000000000000000000000
```

```php [PHP]
$emailHash = urlencode('00000000000000000000000000000000');
$options = sprintf('seed=%s', $emailHash);
$defaultImage = urlencode(
  'https://api.dicebear.com/10.x/lorelei/png?' . $options
  'https://api.dicebear.com/10.x/lorelei/png/' . urlencode($options)
);

$gravatarImage = sprintf(
  'https://www.gravatar.com/avatar/%s?d=%s',
  $emailHash,
  $defaultImage
);
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng%2Fseed%253D00000000000000000000000000000000
```

```python [Python]
import urllib.parse

email_hash = urllib.parse.quote("00000000000000000000000000000000")
options = f"seed={email_hash}"
default_image = urllib.parse.quote(
    f"https://api.dicebear.com/10.x/lorelei/png?{options}"
    f"https://api.dicebear.com/10.x/lorelei/png/{urllib.parse.quote(options)}"
)

gravatar_image = f"https://www.gravatar.com/avatar/{email_hash}?d={default_image}"
# https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng%2Fseed%253D00000000000000000000000000000000
```

```go [Go]
import (
	"fmt"
	"net/url"
)

emailHash := url.QueryEscape("00000000000000000000000000000000")
options := fmt.Sprintf("seed=%s", emailHash)
defaultImage := url.QueryEscape(
	fmt.Sprintf("https://api.dicebear.com/10.x/lorelei/png?%s", options),
	fmt.Sprintf("https://api.dicebear.com/10.x/lorelei/png/%s", url.QueryEscape(options)),
)

gravatarImage := fmt.Sprintf("https://www.gravatar.com/avatar/%s?d=%s", emailHash, defaultImage)
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng%2Fseed%253D00000000000000000000000000000000
```

```dart [Dart]
final emailHash = Uri.encodeComponent('00000000000000000000000000000000');
final options = 'seed=$emailHash';
final defaultImage = Uri.encodeComponent(
  'https://api.dicebear.com/10.x/lorelei/png?$options'
  'https://api.dicebear.com/10.x/lorelei/png/${Uri.encodeComponent(options)}'
);

final gravatarImage = 'https://www.gravatar.com/avatar/$emailHash?d=$defaultImage';
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng%2Fseed%253D00000000000000000000000000000000
```

```csharp [C#]
var emailHash = Uri.EscapeDataString("00000000000000000000000000000000");
var options = $"seed={emailHash}";
var defaultImage = Uri.EscapeDataString(
    $"https://api.dicebear.com/10.x/lorelei/png?{options}"
    $"https://api.dicebear.com/10.x/lorelei/png/{Uri.EscapeDataString(options)}"
);

var gravatarImage = $"https://www.gravatar.com/avatar/{emailHash}?d={defaultImage}";
// https://www.gravatar.com/avatar/00000000000000000000000000000000?d=https%3A%2F%2Fapi.dicebear.com%2F10.x%2Florelei%2Fpng%2Fseed%253D00000000000000000000000000000000
```

---

Source: https://www.dicebear.com/recipes/load-all-styles/

# How to load all avatar styles from `@dicebear/styles`?

The [DiceBear styles repository](https://github.com/dicebear/styles) ships every
official avatar style as a separate JSON file. It is distributed as
[`@dicebear/styles`](https://www.npmjs.com/package/@dicebear/styles) on npm,
[`dicebear/styles`](https://packagist.org/packages/dicebear/styles) on
Packagist, [`dicebear-styles`](https://pypi.org/project/dicebear-styles/) on
PyPI, [`dicebear-styles`](https://crates.io/crates/dicebear-styles) on
crates.io,
[`github.com/dicebear/styles/v10`](https://pkg.go.dev/github.com/dicebear/styles/v10)
as a Go module and [`dicebear_styles`](https://pub.dev/packages/dicebear_styles)
on pub.dev, and
[`DiceBear.Styles`](https://www.nuget.org/packages/DiceBear.Styles) on NuGet.
Most projects only need one or two styles, but sometimes (for a style picker, a
gallery page, or a batch job) you want to load all of them at once.

This guide shows how to do that in Node.js, PHP, Python, Rust, Go, Dart and C#.

## Node.js

In Node.js you can read the styles straight from the installed package on disk.
The package ships its source JSON files under `src/`.

```js
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Avatar } from '@dicebear/core';

const require = createRequire(import.meta.url);
const stylesDir = path.join(
  path.dirname(require.resolve('@dicebear/styles/package.json')),
  'src',
);

const files = (await readdir(stylesDir)).filter((file) =>
  file.endsWith('.json'),
);

const styles = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => {
      const definition = JSON.parse(
        await readFile(path.join(stylesDir, file), 'utf8'),
      );

      return [path.basename(file, '.json'), definition];
    }),
  ),
);

const avatar = new Avatar(styles.lorelei, { seed: 'Alice' });
```

## PHP

PHP can locate the installed package via Composer and iterate over the JSON
files in its `src/` directory.

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Avatar;
use DiceBear\Style;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$files    = glob($basePath . '/src/*.json');

$styles = [];
foreach ($files as $file) {
    $name = basename($file, '.json');

    $styles[$name] = Style::fromJson(file_get_contents($file));
}

$avatar = new Avatar($styles['lorelei'], ['seed' => 'Alice']);
```

## Python

The `dicebear-styles` package ships the definitions as JSON resources under the
`dicebear_styles` import name. Iterate over them with `importlib.resources`.

```python
from importlib.resources import files

from dicebear import Avatar, Style

styles = {
    resource.name.removesuffix(".json"): Style.from_json(
        resource.read_text("utf-8")
    )
    for resource in files("dicebear_styles").iterdir()
    if resource.name.endswith(".json")
}

avatar = Avatar(styles["lorelei"], {"seed": "Alice"})
```

## Rust

The `dicebear-styles` crate embeds each style behind a Cargo feature of the same
name, so a binary only ships the styles it opts into. To load _all_ of them, add
the crate with the `all` feature:

```sh
cargo add dicebear-core serde_json
cargo add dicebear-styles --features all
```

`dicebear_styles::all()` lists every style compiled into the build, and
`dicebear_styles::get(name)` returns its raw JSON definition.

```rust
use std::collections::HashMap;

use dicebear_core::{Avatar, Style};
use serde_json::json;

let mut styles = HashMap::new();
for name in dicebear_styles::all() {
    let definition = dicebear_styles::get(name).expect("style is embedded");
    styles.insert(name, Style::from_str(definition)?);
}

let avatar = Avatar::new(&styles["lorelei"], json!({ "seed": "Alice" }))?;
```

## Go

The `github.com/dicebear/styles/v10` module embeds every style. Unlike the Rust
crate, there is no per-style opt-in, so the whole set is available once the
module is added.

```sh
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

`styles.All()` lists every embedded style and `styles.Get(name)` returns its raw
JSON definition.

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

parsed := map[string]*dicebear.Style{}
for _, name := range styles.All() {
	definition, _ := styles.Get(name)
	style, err := dicebear.NewStyle([]byte(definition))
	if err != nil {
		panic(err)
	}
	parsed[name] = style
}

avatar, _ := dicebear.NewAvatar(parsed["lorelei"], map[string]any{"seed": "Alice"})
```

## Dart

The `dicebear_styles` package ships each style in its own library, so a compiled
app only embeds the styles it imports. To load _all_ of them, import the
umbrella library `package:dicebear_styles/dicebear_styles.dart`, which
re-exports every style:

```sh
dart pub add dicebear_core dicebear_styles
```

`styles.all` lists every embedded style and `styles.get(name)` returns its raw
JSON definition.

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/dicebear_styles.dart' as styles;

final parsed = {
  for (final name in styles.all) name: Style.parse(styles.get(name)!),
};

final avatar = Avatar(parsed['lorelei']!, {'seed': 'Alice'});
```

## C#

The `DiceBear.Styles` package embeds every style in the assembly. Like the Go
module there is no per-style opt-in, so the whole set is available once the
package is added.

```sh
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

`Styles.All()` lists every embedded style and `Styles.Get(name)` returns its raw
JSON definition.

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var parsed = Styles
    .All()
    .ToDictionary(name => name, name => Style.Parse(Styles.Get(name)!));

var avatar = new Avatar(parsed["lorelei"], new JsonObject { ["seed"] = "Alice" });
```

Parsing all 61 definitions up front costs time and memory. If you
only need a handful, reach for the properties instead:
`Style.Parse(Styles.Lorelei)`.

---

Source: https://www.dicebear.com/recipes/self-host-the-http-api/

# Self-hosted avatar API: host DiceBear yourself

The public HTTP API is free and needs no signup, and for most projects that is
all you ever use. Hosting it yourself becomes interesting when you want avatar
requests to stay on your own infrastructure, be it for data control, for your
own rate limits, or because your app runs in a closed network.

You can find the source code for the HTTP API on
[GitHub](https://github.com/dicebear/api). The code is written in TypeScript and
uses the [Fastify](https://www.fastify.io/) framework.

## With Docker

The easiest way to host the HTTP API yourself is to use the docker image. You
can find the image on [Docker Hub](https://hub.docker.com/r/dicebear/api).

```
docker run --tmpfs /run --tmpfs /tmp -p 3000:3000 -i -t dicebear/api:4
```

Or you can use `docker-compose.yml` to configure the HTTP API and start it with
"docker compose up".

```
services:
  dicebear:
    image: dicebear/api:4
    restart: always
    ports:
      - '3000:3000'
    tmpfs:
      - '/run'
      - '/tmp'
```

## Without Docker

If you don't want to use docker, you can also run the HTTP API directly on your
machine. You need to have [Node.js](https://nodejs.org/) installed.

```
git clone git@github.com:dicebear/api.git
cd api

npm install
npm run build
npm start
```

## Optional style metadata endpoints

Besides the avatar endpoints, your instance can expose two metadata endpoints
per style. Both are disabled by default and can be enabled individually with an
environment variable:

```
http://localhost:3000/10.x/<styleName>/definition.json
http://localhost:3000/10.x/<styleName>/options.json
```

- `definition.json` returns the raw
  [style definition](https://www.dicebear.com/create-styles/from-scratch/), the same JSON that is
  shipped with the style package. Enable it with `DEFINITION=1`.
- `options.json` returns a descriptor of all options the style accepts: field
  types, allowed enum values, and value ranges. Options listed in
  `EXCLUDED_OPTIONS` are omitted, so the response always matches what your
  instance actually accepts. Enable it with `OPTIONS=1`.

Both responses are cached according to `CACHE_CONTROL_STYLES`.

## Environment variables

The HTTP API supports the following environment variables:

| Variable                           | Default                                       | Description                                                          |
| ---------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `PORT`                             | `3000`                                        | Port to listen on.                                                   |
| `HOST`                             | `0.0.0.0`                                     | Host to bind to (all IPv4 addresses by default).                     |
| `LOGGER`                           | `0`                                           | Enable request logger (1 = on, 0 = off).                             |
| `WORKERS`                          | `1`                                           | Number of Node.js worker threads.                                    |
| `VERSIONS`                         | `10`                                          | Comma-separated list of supported DiceBear major versions.           |
| `CACHE_CONTROL_AVATARS`            | `31536000`                                    | Cache duration for avatar responses in seconds (1 year).             |
| `CACHE_CONTROL_STYLES`             | `3600`                                        | Cache duration for the styles listing in seconds (1 hour).           |
| `PNG`                              | `1`                                           | Enable the PNG endpoint (1 = on, 0 = off).                           |
| `PNG_SIZE_MIN`                     | `1`                                           | Minimum allowed PNG size in px.                                      |
| `PNG_SIZE_MAX`                     | `256`                                         | Maximum allowed PNG size in px.                                      |
| `PNG_SIZE_DEFAULT`                 | `128`                                         | Default PNG size in px.                                              |
| `PNG_EXIF`                         | `1`                                           | Enable EXIF metadata for PNG (1 = on, 0 = off).                      |
| `JPEG`                             | `1`                                           | Enable the JPEG endpoint (1 = on, 0 = off).                          |
| `JPEG_SIZE_MIN`                    | `1`                                           | Minimum allowed JPEG size in px.                                     |
| `JPEG_SIZE_MAX`                    | `256`                                         | Maximum allowed JPEG size in px.                                     |
| `JPEG_SIZE_DEFAULT`                | `128`                                         | Default JPEG size in px.                                             |
| `JPEG_EXIF`                        | `1`                                           | Enable EXIF metadata for JPEG (1 = on, 0 = off).                     |
| `WEBP`                             | `1`                                           | Enable the WebP endpoint (1 = on, 0 = off).                          |
| `WEBP_SIZE_MIN`                    | `1`                                           | Minimum allowed WebP size in px.                                     |
| `WEBP_SIZE_MAX`                    | `256`                                         | Maximum allowed WebP size in px.                                     |
| `WEBP_SIZE_DEFAULT`                | `128`                                         | Default WebP size in px.                                             |
| `WEBP_EXIF`                        | `1`                                           | Enable EXIF metadata for WebP (1 = on, 0 = off).                     |
| `AVIF`                             | `1`                                           | Enable the AVIF endpoint (1 = on, 0 = off).                          |
| `AVIF_SIZE_MIN`                    | `1`                                           | Minimum allowed AVIF size in px.                                     |
| `AVIF_SIZE_MAX`                    | `256`                                         | Maximum allowed AVIF size in px.                                     |
| `AVIF_SIZE_DEFAULT`                | `128`                                         | Default AVIF size in px.                                             |
| `AVIF_EXIF`                        | `1`                                           | Enable EXIF metadata for AVIF (1 = on, 0 = off).                     |
| `JSON`                             | `1`                                           | Enable the JSON endpoint (1 = on, 0 = off).                          |
| `DEFINITION`                       | `0`                                           | Enable the per-style `definition.json` endpoint (1 = on, 0 = off).   |
| `OPTIONS`                          | `0`                                           | Enable the per-style `options.json` endpoint (1 = on, 0 = off).      |
| `INITIALS_FILTER`                  | `1`                                           | Replace blocked text in rendered avatars with `*` (1 = on, 0 = off). |
| `QUERY_STRING_ARRAY_LIMIT_MIN`     | `20`                                          | Minimum number of values allowed per array parameter.                |
| `EXCLUDED_OPTIONS`                 | `idRandomization,fontFamily,fontWeight,title` | Comma-separated list of option names to exclude.                     |
| `QUERY_STRING_PARAMETER_LIMIT_MIN` | `100`                                         | Minimum number of query string parameters allowed.                   |

---

Source: https://www.dicebear.com/understand/dicebear-vs-alternatives/

# Avatar library comparison

DiceBear is an open source avatar library with [61 styles](https://www.dicebear.com/styles/),
a [free HTTP API](https://www.dicebear.com/integrations/http-api/), and libraries for seven languages.
Each style has a [deep set of options](https://www.dicebear.com/customize/style-options/): you can
recolor the avatar, swap individual features, control the background, and weight
how likely each variant is, so two avatars from the same style can look
completely different. This page compares it with the avatar libraries developers
most often weigh against it, to help you choose the right one for your project.
All of them are good at what they do, and the best choice depends on your stack
and the look you are after.

_This comparison is based on publicly available information and may not reflect
the latest updates. Each tool has its own strengths, so choose what works best
for your project._

## DiceBear vs. Boring Avatars

Boring Avatars is a polished React component with a handful of clean,
gradient-based styles. It installs in seconds and the gradients look great,
which makes it a strong pick for a React app that wants that exact style. The
hosted API is a separate, paid product.

DiceBear comes at it differently: more styles from different artists, no
framework dependency, and a free HTTP API. As a Boring Avatars alternative
DiceBear fits when you want a wider range of looks or you build outside React.

## DiceBear vs. Avvvatars

Avvvatars is a small, tidy React component with two looks: an initials avatar
and a geometric shape. It is light and quick to add, and when those two styles
are all you need it does the job nicely.

DiceBear aims at a different spot, with many more styles, server-side rendering,
and support beyond JavaScript.

## DiceBear vs. Multiavatar

Multiavatar has real charm: one illustrated, multicultural character style,
available in JavaScript, PHP, and Python. If that single look is what you want,
it is a solid choice.

DiceBear covers the same languages and adds Rust, Go, Dart, and C#, plus a
larger set of styles and more output formats. It is the better fit for variety,
while Multiavatar is the one to reach for when you love that specific character
look.

## DiceBear vs. Jdenticon

Jdenticon is a focused, dependency-free library that does geometric identicons
really well. It runs in JavaScript, C#, and PHP, exports SVG and PNG, and has a
small API because identicons are all it does.

DiceBear also has an [Identicon style](https://www.dicebear.com/styles/identicon/) if that is the look
you want, along with many other styles and the HTTP API. When identicons are all
you will ever need, Jdenticon is hard to beat.

## Which avatar library should you choose?

- Choose DiceBear for a range of art styles, deep customization, more than one
  language, several output formats, or self-hosting.
- Choose Boring Avatars for its gradient styles in a React app.
- Choose Avvvatars for a tiny two-style placeholder in React.
- Choose Multiavatar for its illustrated multicultural character look.
- Choose Jdenticon for geometric identicons when that is all the project needs.

You can try any DiceBear style in the [playground](https://www.dicebear.com/playground/), or start with
the [JavaScript](https://www.dicebear.com/integrations/javascript/), [PHP](https://www.dicebear.com/integrations/php/),
[Python](https://www.dicebear.com/integrations/python/), [Rust](https://www.dicebear.com/integrations/rust/),
[Go](https://www.dicebear.com/integrations/go/), [Dart](https://www.dicebear.com/integrations/dart/), or
[C#](https://www.dicebear.com/integrations/csharp/) library.

---

Source: https://www.dicebear.com/understand/how-avatars-are-made/

# How avatars are made

Every DiceBear avatar is an
[SVG](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics) composed at
request time. Nothing is drawn pixel by pixel: an avatar style is a JSON
definition that describes components such as hair, eyes, or mouth, each with a
set of variants and colors. The renderer picks one variant per component,
applies the colors, and assembles the parts into a single SVG. That's cheap
enough to do on every request, and the result scales to any size without losing
sharpness.

## The seed makes it deterministic

The picks are random, but seeded. Your seed is hashed with
[FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)
and the hash initializes a
[Mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)
[PRNG](https://en.wikipedia.org/wiki/Pseudorandom_number_generator). Every
decision the renderer makes, which hair, which eyes, which color, draws from
this generator. Because everything derives from the seed, the same seed walks
through the exact same decisions and produces the exact same avatar, today and
in ten years.

One consequence worth knowing: the PRNG is **not**
[cryptographically secure](https://en.wikipedia.org/wiki/Cryptographically-secure_pseudorandom_number_generator),
and it doesn't try to be. Use seeds to get stable avatars, not to derive
anything secret.

## The same in every language

All DiceBear libraries and the HTTP API implement this pipeline with
byte-identical output. The style definitions are plain JSON that every
implementation consumes as-is, and the PRNG behaves the same everywhere. That is
why you can render avatars in the browser today and move rendering to a Rust
backend later without a single avatar changing.

## Dig deeper

- The [definition schema](https://www.dicebear.com/create-styles/definition-schema/) documents the JSON
  format behind every style.
- [How many unique avatars?](https://www.dicebear.com/understand/how-many-unique-avatars/) does the math
  on the output space per style.
- [Implement DiceBear Core](https://www.dicebear.com/create-styles/implement-dicebear-core/) specifies
  the renderer, in case you want to port it to another language.

---

Source: https://www.dicebear.com/understand/how-many-unique-avatars/

# How many unique avatars are possible per avatar style?

The number below is the size of the seed-driven output space for each style at
its default configuration: how many distinct avatars the seed can produce while
every other option is left untouched. The count mirrors what the renderer
actually does:

- **Variant pick per component.** Each visible component contributes one variant
  choice. Variants with `weight: 0` are excluded because the PRNG never picks
  them (unless every variant has `weight: 0`, in which case the PRNG falls back
  to an unweighted pick across all of them).
- **Probability.** A component whose `probability` is strictly between `0` and
  `100` adds the "not rendered" branch as one extra outcome. A component with
  `probability: 0` collapses to a single (always-absent) outcome.
- **Per-component transforms.** `rotate`, `scale`, and `translate` ranges in the
  definition are sampled with 4-decimal precision per component reference, so a
  `[min, max]` range contributes `round((max - min) × 10000) + 1` distinct
  values.
- **Color palettes.** Color groups are evaluated jointly: `notEqualTo` strips
  the picked hex values of the referenced groups (with the renderer's "fall back
  to full palette when filtering empties" rule), and `contrastTo` reduces to a
  single, deterministic pick.
- **Seed-derived initials.** When a style renders the `initial` or `initials`
  variable, each output letter ranges over the Unicode `\p{L}` category (about
  140,000 distinct uppercased characters), and `initials` emits up to two
  letters per seed.

User-supplied options (custom color palettes, variant allowlists, additional
backgrounds, `flip`, `rotate`, `scale`, `translate`, `borderRadius`, ID
randomization, …) raise the count further beyond what is reported here.

If a number looks wrong, please open a
[discussion](https://github.com/orgs/dicebear/discussions) on GitHub.

---

Source: https://www.dicebear.com/create-styles/definition-schema/

# Definition schema reference

Every DiceBear avatar style is a JSON file that follows the
[DiceBear Definition Schema](https://github.com/dicebear/schema). This page
documents the complete structure of a style definition.

## Overview

A style definition describes everything needed to generate an avatar: the canvas
size, the SVG elements to render, the components that can be randomized, and the
color palettes available. The definition is purely declarative: no code, no
functions. The rendering logic lives in the DiceBear Core implementation.

## Top-level structure

```json
{
  "$schema": "https://...",
  "$id": "https://...",
  "$comment": "Optional comment",
  "meta": { ... },
  "canvas": { ... },
  "components": { ... },
  "colors": { ... },
  "attributes": { ... }
}
```

| Property     | Required | Description                                                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------------------- |
| `$schema`    | No       | URL to the definition schema for editor validation                                          |
| `$id`        | No       | Canonical identifier for this definition (typically the URL it is hosted at, max 256 chars) |
| `$comment`   | No       | Free-text comment, e.g. "Generated by Figma" (max 4096 chars)                               |
| `meta`       | No       | License, creator, and source metadata                                                       |
| `canvas`     | **Yes**  | Canvas dimensions and root element tree                                                     |
| `components` | No       | Named, randomizable SVG components (up to 512 entries)                                      |
| `colors`     | No       | Named color palettes for dynamic coloring (up to 512 entries)                               |
| `attributes` | No       | Global SVG attributes for the root `<svg>` element                                          |

## `meta`

Metadata about the style, used in license comments, the CLI banner, and the
documentation.

```json
{
  "meta": {
    "license": {
      "name": "CC0 1.0",
      "url": "https://creativecommons.org/publicdomain/zero/1.0/",
      "text": "Full license text..."
    },
    "creator": {
      "name": "DiceBear",
      "url": "https://www.dicebear.com"
    },
    "source": {
      "name": "Initials",
      "url": "https://github.com/dicebear/dicebear"
    }
  }
}
```

## `canvas`

Defines the SVG viewport and the root element tree. The `width` and `height`
determine the `viewBox` of the generated SVG.

```json
{
  "canvas": {
    "width": 100,
    "height": 100,
    "elements": [
      { "type": "component", "name": "background" },
      { "type": "component", "name": "face" }
    ]
  }
}
```

| Property   | Type   | Required | Description                                      |
| ---------- | ------ | -------- | ------------------------------------------------ |
| `width`    | number | **Yes**  | Canvas width in pixels (>= 1)                    |
| `height`   | number | **Yes**  | Canvas height in pixels (>= 1)                   |
| `elements` | array  | **Yes**  | Root element tree (up to 1024 top-level entries) |

## Elements

Elements are the building blocks of the SVG. Three types are supported:

### `element`: SVG tag

Renders an SVG element like `<circle>`, `<path>`, `<g>`, etc.

```json
{
  "type": "element",
  "name": "circle",
  "attributes": {
    "cx": "50",
    "cy": "50",
    "r": "40",
    "fill": { "type": "color", "name": "skin" }
  },
  "children": []
}
```

Only
[whitelisted SVG elements](https://github.com/dicebear/schema/blob/main/src/definition.json)
are allowed (e.g. `circle`, `path`, `g`, `rect`, `text`, `defs`, `filter`,
`linearGradient`, `radialGradient`, etc.). Elements like `script`,
`foreignObject`, and `a` are blocked for security.

A node may have at most 1024 children. The element with `name: "defs"` has
special semantics (see [Reusable `<defs>` entries](#reusable-defs-entries)
below).

### `text`: text content

Renders raw text inside an SVG element. Supports variable references.

```json
{
  "type": "text",
  "value": "Hello"
}
```

Or with a variable:

```json
{
  "type": "text",
  "value": { "type": "variable", "name": "initials" }
}
```

Only `initial` and `initials` are accepted in a text `value`. Other variables
(`fontFamily`, `fontWeight`) are only valid in their dedicated attributes (see
[Variable references](#variable-references)).

### `component`: component reference

References a named component defined in the `components` section. The DiceBear
Core will select a variant based on the seed and options.

```json
{
  "type": "component",
  "name": "eyes"
}
```

A component reference can carry its own `attributes` map. They are written
verbatim onto the emitted `<use>` element, which is how you place an instance of
a component on the canvas:

```json
{
  "type": "component",
  "name": "eyes",
  "attributes": {
    "transform": "translate(10 20)"
  }
}
```

A user-supplied `transform` is prepended to the per-component
rotate/translate/scale picked by the renderer, so it acts as the outer
(placement) transform.

### The `<style>` element

`<style>` is supported but is a special case. Its CSS body must be supplied as
one or more `text` children, not as a single string and not via `children`
holding generic elements:

```json
{
  "type": "element",
  "name": "style",
  "children": [
    {
      "type": "text",
      "value": ".dark { fill: #000; }"
    }
  ]
}
```

A `<style>` element may hold at most 64 text children. The CSS body is sanitized
more strictly than ordinary attribute values:

- Known-dangerous `@`-rules (`@import`, `@font-face`, `@document`, `@charset`)
  are rejected. Other at-rules (`@media`, `@keyframes`, `@supports`, `@layer`,
  …) are permitted, but their contents are still passed through the common
  filter described below.

The following are rejected in every CSS body **and every attribute value** (the
shared `filteredString` injection filter):

- External `url(...)` references (local `url(#id)` is fine)
- `expression(...)`, `behavior:`, `-moz-binding`
- `javascript:` and `vbscript:` URI schemes
- Backslash escape sequences

This is a defense-in-depth filter, not a CSS validator: substring matches reject
otherwise-harmless strings that happen to contain a blocked token (e.g. the
literal word `javascript:` in plain text).

### Reusable `<defs>` entries

`<defs>` is whitelisted as an ordinary element, but the renderer treats it
specially: every child of an element named `defs`, anywhere in the tree, is
hoisted into the document-wide `<defs>` block alongside generated gradients,
clip paths, and component bodies. This keeps the rendered SVG to a single
`<defs>` element while letting style authors ship reusable fragments (filters,
gradients, masks, …) and reference them from elsewhere in the tree.

## `components`

Named, randomizable parts of the avatar. Each component defines a set of
variants that the PRNG can choose from.

```json
{
  "components": {
    "eyes": {
      "width": 80,
      "height": 40,
      "probability": 100,
      "rotate": { "min": -10, "max": 10 },
      "scale": { "min": 0.9, "max": 1.1 },
      "translate": {
        "x": { "min": 0, "max": 0 },
        "y": { "min": -5, "max": 5 }
      },
      "variants": {
        "happy": {
          "weight": 1,
          "elements": [...]
        },
        "surprised": {
          "weight": 1,
          "elements": [...]
        }
      }
    }
  }
}
```

| Property      | Type   | Description                                                                                                                   |
| ------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `width`       | number | **Required.** Component canvas width in pixels (>= 1)                                                                         |
| `height`      | number | **Required.** Component canvas height in pixels (>= 1)                                                                        |
| `probability` | number | Optional. Chance the component appears, 0 to 100 (default `100`)                                                              |
| `rotate`      | object | Optional. Rotation range, see [Ranges](#ranges)                                                                               |
| `scale`       | object | Optional. Scale range around the component's center, see [Ranges](#ranges)                                                    |
| `translate`   | object | Optional. `{ x?: Range, y?: Range }` offsets as a percentage of the component's own `width` / `height`, see [Ranges](#ranges) |
| `variants`    | object | **Required.** Named variant definitions (up to 512)                                                                           |

`translate.x` and `translate.y` are expressed as percentages of the component's
own `width` and `height`. A value of `100` shifts the component by its full
width or height; `0` leaves it in place. The example above
(`y: { min: -5, max: 5 }`) therefore means "shift the component vertically by up
to 5 % of its height in either direction".

### Ranges

`rotate`, `scale`, `translate.x`, and `translate.y` all use the same range
object:

```json
{ "min": -10, "max": 10, "step": 5 }
```

| Property | Type   | Description                                                           |
| -------- | ------ | --------------------------------------------------------------------- |
| `min`    | number | **Required.** Lower bound of the range                                |
| `max`    | number | **Required.** Upper bound of the range                                |
| `step`   | number | Optional. Positive value that quantizes the range to `min + i × step` |

For a fixed value, set `min === max`. With `step`, the PRNG samples from
`{ min + i × step | 0 ≤ i ≤ ⌊(max − min) / step⌋ }`, so when `(max − min)` is
not a multiple of `step`, `max` itself is unreachable. Without `step`, the range
is continuous.

The numeric domains differ per field: `rotate` and the inner `step` values are
in degrees (-360 to 360, step ≤ 720), `scale` is 0 to 10 (step ≤ 10), and
`translate.x` / `translate.y` are percentages from -1000 to 1000 (step ≤ 2000).

### Component aliases

A component can be aliased to another component using `extends`. An alias has no
dimensions or variants of its own: it inherits everything from the referenced
component, but renders as an independent, separately-randomized instance. This
is useful when you want the same visual component to appear twice (e.g. left and
right earrings) and have each occurrence pick its own variant.

```json
{
  "components": {
    "earring": {
      "width": 20,
      "height": 20,
      "variants": {
        "stud": { "elements": [...] },
        "hoop": { "elements": [...] }
      }
    },
    "earringLeft":  { "extends": "earring" },
    "earringRight": { "extends": "earring" }
  }
}
```

An alias is a strict reference: `extends` is its **only** allowed property. It
must point to a base component (not another alias) defined in the same
`components` map. Width, height, probability, rotate, scale, translate, and
variants are inherited from the source. Aliases do not expose their own
`${aliasName}Variant` or `${aliasName}Probability` user options. Both are shared
with the source via `${sourceName}Variant` and `${sourceName}Probability`. The
renderer still rolls the PRNG independently per alias, so each occurrence picks
its own variant within the shared constraints. See
[the implementation guide](https://www.dicebear.com/create-styles/implement-dicebear-core/#component-options)
for details.

### Variants

Each variant contains an element tree and an optional weight:

| Property   | Type   | Default | Description                                                  |
| ---------- | ------ | ------- | ------------------------------------------------------------ |
| `elements` | array  | —       | **Required.** SVG element tree for this variant (up to 1024) |
| `weight`   | number | `1`     | Selection weight for the PRNG (0 to 1,000,000)               |

Higher weights make a variant more likely to be selected. A weight of `0`
excludes the variant entirely, unless every variant has weight `0`, in which
case the PRNG falls back to an unweighted pick across all of them.

## `colors`

Named color palettes. The PRNG picks a color from the palette based on the seed.

```json
{
  "colors": {
    "skin": {
      "values": ["#f5d6c3", "#d4a889", "#a67c5b", "#614335"]
    },
    "text": {
      "values": ["#ffffff", "#000000"],
      "contrastTo": "skin"
    },
    "hair": {
      "values": ["#2c1b18", "#b58143", "#d6b370", "#724133"],
      "notEqualTo": ["skin"]
    }
  }
}
```

| Property     | Type     | Description                                                                                    |
| ------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `values`     | string[] | **Required.** Hex colors in `#RGB`, `#RGBA`, `#RRGGBB`, or `#RRGGBBAA` form (1 to 128 entries) |
| `contrastTo` | string   | Optional. Pick the color with highest contrast to this group's selection                       |
| `notEqualTo` | string[] | Optional. Filter out colors already picked by these groups (up to 64 refs)                     |

A definition may declare up to 512 color groups.

### Color constraints

**`contrastTo`** bypasses random selection. Instead, the candidate colors are
sorted by
[WCAG 2.1 contrast ratio](https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)
against the referenced color, and the highest-contrast color is picked. This is
useful for ensuring text readability.

**`notEqualTo`** filters out colors that were already selected for the
referenced color groups. This prevents adjacent parts from having the same
color. Comparison is done on the RGB hex (alpha stripped); if the filter would
leave the candidate list empty, the renderer falls back to the unfiltered list.

The schema does not detect cycles (`a` ⇄ `b` constraints). Renderers resolve
palettes in definition order and throw at render time when a cycle is detected.

## Color references in attributes

Color-bearing attributes (`fill`, `stroke`, `stop-color`, `color`,
`flood-color`, `lighting-color`) accept either a literal CSS color string (named
color, hex, `rgb()`, `oklch()`, `color-mix()`, a local paint server reference
like `url(#id)`, …) or a reference to a named palette:

```json
{
  "fill": { "type": "color", "name": "skin" }
}
```

A palette reference is resolved at render time to the color the PRNG picked for
the `skin` group. Literal strings are not validated as CSS (invalid syntax is
the browser's problem), but the shared injection filter still applies (no
`javascript:`, no external `url(...)`, …).

## Variable references

A handful of properties accept a `{ "type": "variable", "name": "…" }` object in
place of a literal string. Each variable is only valid in a specific spot. The
schema rejects mismatched placements.

| Variable     | Allowed in              | Resolves to                                                 |
| ------------ | ----------------------- | ----------------------------------------------------------- |
| `initial`    | `text` element `value`  | First character of the initials derived from the seed       |
| `initials`   | `text` element `value`  | Full initials (1 to 2 characters) derived from the seed     |
| `fontFamily` | `font-family` attribute | Resolved `fontFamily` user option (defaults to `system-ui`) |
| `fontWeight` | `font-weight` attribute | Resolved `fontWeight` user option (defaults to `400`)       |

```json
{
  "type": "text",
  "value": { "type": "variable", "name": "initials" }
}
```

```json
{
  "attributes": {
    "font-family": { "type": "variable", "name": "fontFamily" },
    "font-weight": { "type": "variable", "name": "fontWeight" }
  }
}
```

## `attributes`

Global SVG presentation attributes applied to the root `<svg>` element.

```json
{
  "attributes": {
    "fill": "none",
    "shape-rendering": "auto"
  }
}
```

Only safe SVG presentation attributes are allowed; event handlers (`onclick`, …)
and namespaced attributes (`xlink:href`, …) are rejected. See the
[schema source](https://github.com/dicebear/schema/blob/main/src/definition.json)
for the complete whitelist.

Two attributes have notable extra rules:

- **`href`** accepts only local fragment refs (`#id`) and embedded raster images
  encoded as `data:image/{png|gif|jpeg|webp|avif};base64,…`. Remote URLs
  (`http(s)://…`) and `<script>`/`xlink:href` patterns are rejected.
- **`style`** is sanitized as a CSS string: the stricter `<style>`-element
  ruleset applies (see [The `<style>` element](#the-style-element)).

## Example: minimal style definition

A complete but minimal definition that renders a colored circle:

```json
{
  "$schema": "https://cdn.hopjs.net/npm/@dicebear/schema@1.0.0/dist/definition.min.json",
  "canvas": {
    "width": 100,
    "height": 100,
    "elements": [
      {
        "type": "element",
        "name": "circle",
        "attributes": {
          "cx": "50",
          "cy": "50",
          "r": "45",
          "fill": { "type": "color", "name": "background" }
        }
      },
      {
        "type": "component",
        "name": "face"
      }
    ]
  },
  "components": {
    "face": {
      "width": 100,
      "height": 100,
      "variants": {
        "smile": {
          "elements": [
            {
              "type": "element",
              "name": "path",
              "attributes": {
                "d": "M 30 60 Q 50 80 70 60",
                "stroke": "#000000",
                "stroke-width": "3",
                "fill": "none"
              }
            }
          ]
        },
        "neutral": {
          "elements": [
            {
              "type": "element",
              "name": "line",
              "attributes": {
                "x1": "35",
                "y1": "65",
                "x2": "65",
                "y2": "65",
                "stroke": "#000000",
                "stroke-width": "3"
              }
            }
          ]
        }
      }
    }
  },
  "colors": {
    "background": {
      "values": ["#f9c74f", "#90be6d", "#43aa8b", "#577590", "#f94144"]
    }
  }
}
```

## Schema package

The schemas live in [`@dicebear/schema`](https://github.com/dicebear/schema) and
ship two files (both JSON Schema **draft-07**):

- **`definition.json`**: validates style definitions
- **`options.json`**: validates the user options passed to `Avatar`

Install via your package manager:

| Ecosystem | Install                              |
| --------- | ------------------------------------ |
| npm       | `npm install @dicebear/schema`       |
| Composer  | `composer require dicebear/schema`   |
| PyPI      | `pip install dicebear-schema`        |
| Cargo     | `cargo add dicebear-schema`          |
| Go        | `go get github.com/dicebear/schema`  |
| pub.dev   | `dart pub add dicebear_schema`       |
| NuGet     | `dotnet add package DiceBear.Schema` |

Or reference the schema directly from a CDN, handy for the `$schema` field of
your style definition so editors like VS Code provide autocomplete and inline
validation:

```
https://cdn.hopjs.net/npm/@dicebear/schema@1.0.0/dist/definition.min.json
https://cdn.hopjs.net/npm/@dicebear/schema@1.0.0/dist/options.min.json
```

The vendored style definitions shipped by DiceBear live in a separate package:
[`@dicebear/styles`](https://www.npmjs.com/package/@dicebear/styles) on npm,
[`dicebear/styles`](https://packagist.org/packages/dicebear/styles) on
Packagist, [`dicebear-styles`](https://pypi.org/project/dicebear-styles/) on
PyPI, [`dicebear-styles`](https://crates.io/crates/dicebear-styles) on
crates.io,
[`github.com/dicebear/styles/v10`](https://pkg.go.dev/github.com/dicebear/styles/v10)
as a Go module, [`dicebear_styles`](https://pub.dev/packages/dicebear_styles) on
pub.dev and [`DiceBear.Styles`](https://www.nuget.org/packages/DiceBear.Styles)
on NuGet.

---

Source: https://www.dicebear.com/create-styles/edit-a-style/

# Edit an avatar style with Figma

Our
[DiceBear Studio](https://www.figma.com/community/plugin/1005765655729342787)
plugin works in both directions. It turns a Figma frame into an avatar style,
and it turns a style definition back into a Figma file. So you can open one of
our styles in Figma, change it, and export your own version of it.

You need two things: the plugin, and the
[definition file](https://www.dicebear.com/create-styles/definition-schema/) of the style you want to
change. Every style page has a Definition button above the preview. The
screenshots below use [Critters](https://www.dicebear.com/styles/critters/).

> [!WARNING]
> Every style has its own license, and the definition names the artist. The import
> copies both into your Figma file, and the export writes them back. So read the
> license before you publish your version. The [licenses](https://www.dicebear.com/licenses/) page lists
> them.

## Step 1

Create an empty Figma design file, then start the plugin.

The file has to be empty. If it already holds color styles or components with
group names, the plugin refuses to import into it.

![Searching for the DiceBear Studio plugin in Figma](https://www.dicebear.com/create-styles/edit-a-style/1.webp)

## Step 2

Click Import and pick your definition file.

The plugin reads the file before it touches your document. If the definition is
broken, you get a list of the problems and nothing is imported.

![The Import button in the bottom left corner of the plugin](https://www.dicebear.com/create-styles/edit-a-style/2.webp)

## Step 3

The import takes a moment. The plugin builds a Figma component for every variant
of every component group, and a big style has a few hundred of them.

![The plugin while it imports](https://www.dicebear.com/create-styles/edit-a-style/3.webp)

## Step 4

When it is done, the plugin shows the settings of your style: the title, the
license, and the settings of every component group. Below that it lists what it
could not import. Read that list. Whatever is on it is missing in Figma, and it
will be missing in your export as well.

![The style settings with the import warnings below them](https://www.dicebear.com/create-styles/edit-a-style/4.webp)

> [!TIP]
> Animations live in a `<style>` element, and Figma has no place for CSS. An
> [animated style](https://www.dicebear.com/animated-avatars/) therefore arrives as a still avatar and
> stays still after the export.

## Step 5

The plugin leaves you on the Avatar page. The frame in the middle is your style.
It holds one instance per component group and stores all the settings. Next to
it is a short guide for whoever opens the file after you.

![The imported avatar frame next to the guide](https://www.dicebear.com/create-styles/edit-a-style/5.webp)

## Step 6

The rest of the style sits on the other pages. Thumbnail holds the cover that
Figma shows for the file, Components holds the parts of the avatar. The palettes
came along as color styles.

![The pages of the imported file and its color styles](https://www.dicebear.com/create-styles/edit-a-style/6.webp)

## Step 7

On the Components page every group is a row, and every variant in it is a
component named `<group>/<variant>`. When DiceBear draws an avatar, it picks one
component per row.

![The Components page with one row per component group](https://www.dicebear.com/create-styles/edit-a-style/7.webp)

## Step 8

Now change the style. Double-click a part of the frame to select it, then pick
another variant from the dropdown in the sidebar, or bind a shape to a different
color style. You can also redraw a component, or draw a new one and name it
after the same pattern.

![A selected part of the avatar and its variant dropdown](https://www.dicebear.com/create-styles/edit-a-style/8.webp)

> [!TIP]
> The layer bound to the `background` palette only exists so the frame looks right
> in Figma. DiceBear paints the background itself, so the export leaves that layer
> out.

## Step 9

Select the frame, start the plugin again, and click Export. You get a definition
file that works right away, without a build step.

Try it with the [CLI](https://www.dicebear.com/integrations/cli/):

```
dicebear ./critters.json ./test-output --count 10
```

[Step 8 of the Figma guide](https://www.dicebear.com/create-styles/with-figma/#step-8) shows how to use
your definition with each of our libraries.

---

Source: https://www.dicebear.com/create-styles/from-scratch/

# Create an avatar style from scratch

We highly recommend our [Figma plugin](https://www.dicebear.com/create-styles/with-figma/) to create an
avatar style. Most of DiceBear's official avatar styles were created with the
plugin. But you can also create an avatar style by writing a JSON
[definition file](https://www.dicebear.com/create-styles/definition-schema/) by hand.

## Minimal example

A minimal style definition with a colored circle:

```json
{
  "canvas": {
    "width": 100,
    "height": 100,
    "elements": [
      {
        "type": "element",
        "name": "circle",
        "attributes": {
          "cx": "50",
          "cy": "50",
          "r": "45",
          "fill": { "type": "color", "name": "background" }
        }
      }
    ]
  },
  "colors": {
    "background": {
      "values": ["#f94144", "#f9c74f", "#90be6d", "#43aa8b", "#577590"]
    }
  }
}
```

Save this as `my-style.json` and test it:

```
dicebear ./my-style.json ./output --count 5
```

The PRNG picks a different background color for each seed.

## Adding components

Components are the randomizable parts of your avatar. Each component has
multiple variants that the PRNG can choose from.

Let's add a face component with two variants:

```json
{
  "canvas": {
    "width": 100,
    "height": 100,
    "elements": [
      {
        "type": "element",
        "name": "circle",
        "attributes": {
          "cx": "50",
          "cy": "50",
          "r": "45",
          "fill": { "type": "color", "name": "background" }
        }
      },
      {
        "type": "component",
        "name": "face"
      }
    ]
  },
  "components": {
    "face": {
      "width": 100,
      "height": 100,
      "variants": {
        "smile": {
          "elements": [
            {
              "type": "element",
              "name": "circle",
              "attributes": { "cx": "35", "cy": "40", "r": "4", "fill": "#000" }
            },
            {
              "type": "element",
              "name": "circle",
              "attributes": { "cx": "65", "cy": "40", "r": "4", "fill": "#000" }
            },
            {
              "type": "element",
              "name": "path",
              "attributes": {
                "d": "M 30 60 Q 50 80 70 60",
                "stroke": "#000",
                "stroke-width": "3",
                "fill": "none"
              }
            }
          ]
        },
        "neutral": {
          "elements": [
            {
              "type": "element",
              "name": "circle",
              "attributes": { "cx": "35", "cy": "40", "r": "4", "fill": "#000" }
            },
            {
              "type": "element",
              "name": "circle",
              "attributes": { "cx": "65", "cy": "40", "r": "4", "fill": "#000" }
            },
            {
              "type": "element",
              "name": "line",
              "attributes": {
                "x1": "35",
                "y1": "62",
                "x2": "65",
                "y2": "62",
                "stroke": "#000",
                "stroke-width": "3"
              }
            }
          ]
        }
      }
    }
  },
  "colors": {
    "background": {
      "values": ["#f94144", "#f9c74f", "#90be6d", "#43aa8b", "#577590"]
    }
  }
}
```

The `canvas.elements` array references the `face` component via
`{ "type": "component", "name": "face" }`. The PRNG selects either the `smile`
or `neutral` variant.

## Multiple components

You can add as many components as you like. Each component is independent: the
PRNG selects a variant for each one separately.

```json
{
  "components": {
    "eyes": {
      "width": 100,
      "height": 100,
      "variants": {
        "round": { "elements": [...] },
        "narrow": { "elements": [...] }
      }
    },
    "mouth": {
      "width": 100,
      "height": 100,
      "variants": {
        "smile": { "elements": [...] },
        "open": { "elements": [...] },
        "flat": { "elements": [...] }
      }
    },
    "accessories": {
      "width": 100,
      "height": 100,
      "probability": 30,
      "variants": {
        "glasses": { "elements": [...] },
        "hat": { "elements": [...] }
      }
    }
  }
}
```

### Probability

The `probability` property (0-100) controls how often a component appears. In
the example above, `accessories` only appears in ~30% of generated avatars.
Default is `100` (always visible).

### Variant weights

Control how often specific variants are selected:

```json
{
  "variants": {
    "common": { "weight": 3, "elements": [...] },
    "uncommon": { "weight": 1, "elements": [...] },
    "rare": { "weight": 0, "elements": [...] }
  }
}
```

Higher weight = more likely to be selected. Weight `0` is only chosen when all
other weights are also `0`. Default weight is `1`.

### Component transforms

Components can have default rotation, translation, and scale ranges that the
PRNG samples per render. All four fields use the same `{ min, max, step? }`
range object. See [Ranges](https://www.dicebear.com/create-styles/definition-schema/#ranges) for the
full reference.

```json
{
  "eyes": {
    "width": 80,
    "height": 40,
    "rotate": { "min": -5, "max": 5 },
    "scale": { "min": 0.95, "max": 1.05 },
    "translate": {
      "x": { "min": -2, "max": 2 },
      "y": { "min": -3, "max": 3 }
    },
    "variants": { ... }
  }
}
```

Set `min === max` for a fixed value, or add `"step": <n>` to quantize the range
to discrete buckets.

## Color palettes

Colors can be referenced from element attributes. The PRNG picks a value from
the palette for each avatar.

```json
{
  "colors": {
    "skin": {
      "values": ["#f5d6c3", "#d4a889", "#a67c5b", "#614335"]
    },
    "hair": {
      "values": ["#2c1b18", "#b58143", "#d6b370", "#724133"],
      "notEqualTo": ["skin"]
    },
    "text": {
      "values": ["#ffffff", "#000000"],
      "contrastTo": "background"
    }
  }
}
```

### Color references

Use color references in SVG attributes to apply dynamic colors:

```json
{
  "type": "element",
  "name": "circle",
  "attributes": {
    "fill": { "type": "color", "name": "skin" }
  }
}
```

### Color constraints

**`notEqualTo`** prevents two color groups from selecting the same color. In the
example above, `hair` will never be the same color as `skin`.

**`contrastTo`** picks the color with the highest contrast ratio against the
referenced color group. This is useful for ensuring text is readable against a
background.

## Metadata

Add metadata to your definition for license attribution:

```json
{
  "meta": {
    "license": {
      "name": "CC BY 4.0",
      "url": "https://creativecommons.org/licenses/by/4.0/",
      "text": "Full license text..."
    },
    "creator": {
      "name": "Your Name",
      "url": "https://your-website.com"
    },
    "source": {
      "name": "My Style",
      "url": "https://github.com/your/repo"
    }
  }
}
```

This metadata appears in:

- The `<metadata>` RDF block inside generated SVGs (Dublin Core terms; see the
  [Core implementation spec](https://www.dicebear.com/create-styles/implement-dicebear-core/#metadata-block))
- The CLI license banner
- The documentation (if your style is added to the official collection)

## Schema validation

Add the `$schema` property to enable validation in your editor:

```json
{
  "$schema": "https://cdn.hopjs.net/npm/@dicebear/schema@1.0.0/dist/definition.min.json",
  "canvas": { ... }
}
```

Most editors (VS Code, WebStorm, etc.) will provide autocompletion and inline
validation for your definition file.

## Testing

### With the CLI

```
dicebear ./my-style.json ./output --count 10
dicebear ./my-style.json ./output --seed "Alice" --format png
```

### With the JS Library

```js
import { Style, Avatar } from '@dicebear/core';
import definition from './my-style.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'test' });
console.log(avatar.toString());
```

### With the PHP Library

```php
use DiceBear\Avatar;
use DiceBear\Style;

$style = Style::fromJson(file_get_contents('./my-style.json'));
$avatar = new Avatar($style, ['seed' => 'test']);
echo (string) $avatar;
```

### With the Python Library

```python
from pathlib import Path

from dicebear import Avatar, Style

style = Style.from_json(Path("./my-style.json").read_text("utf-8"))
avatar = Avatar(style, {"seed": "test"})
print(avatar.to_string())
```

### With the Rust Library

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;
use std::fs;

let definition = fs::read_to_string("./my-style.json")?;
let style = Style::from_str(&definition)?;

let avatar = Avatar::new(&style, json!({ "seed": "test" }))?;
println!("{}", avatar.to_svg());
```

### With the Go Library

```go
import (
	"fmt"
	"os"

	dicebear "github.com/dicebear/dicebear-go/v10"
)

definition, _ := os.ReadFile("./my-style.json")
style, _ := dicebear.NewStyle(definition)

avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "test"})
fmt.Println(avatar.SVG())
```

### With the Dart Library

```dart
import 'dart:io';

import 'package:dicebear_core/dicebear_core.dart';

final style = Style.parse(File('./my-style.json').readAsStringSync());

final avatar = Avatar(style, {'seed': 'test'});
print(avatar.svg);
```

### With the C# Library

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(File.ReadAllText("./my-style.json"));

var avatar = new Avatar(style, new JsonObject { ["seed"] = "test" });
Console.WriteLine(avatar.ToSvg());
```

## Next steps

- See the [Definition Schema Reference](https://www.dicebear.com/create-styles/definition-schema/) for
  the complete specification
- Browse the [official definitions](https://github.com/dicebear/styles) for
  real-world examples
- Use the [Figma plugin](https://www.dicebear.com/create-styles/with-figma/) for a visual workflow

---

Source: https://www.dicebear.com/create-styles/implement-dicebear-core/

# Implement DiceBear Core

This guide explains how to implement DiceBear Core in any programming language.
A correct implementation produces **byte-identical SVGs** to the
[JavaScript](https://github.com/dicebear/dicebear/tree/10.x/src/js/core),
[PHP](https://github.com/dicebear/dicebear/tree/10.x/src/php/core),
[Python](https://github.com/dicebear/dicebear/tree/10.x/src/python/core),
[Rust](https://github.com/dicebear/dicebear/tree/10.x/src/rust/core),
[Go](https://github.com/dicebear/dicebear/tree/10.x/src/go/core),
[Dart](https://github.com/dicebear/dicebear/tree/10.x/src/dart/core) and
[C#](https://github.com/dicebear/dicebear/tree/10.x/src/csharp/core) reference
implementations for the same seed and style definition.

## Architecture overview

```
Avatar(definition, options)
  │
  ├── Style        Parse and validate the definition JSON
  ├── Options      Resolve options using the PRNG
  └── Renderer     Generate SVG from resolved style + options
        │
        ├── Prng          Deterministic random number generator
        │   ├── Fnv1a     FNV-1a 32-bit hash
        │   └── Mulberry32  Stateful PRNG
        │
        └── SVG output
```

The core is intentionally minimal. It takes a
[style definition](https://www.dicebear.com/create-styles/definition-schema/) and user options, resolves
randomizable values through a deterministic PRNG, and renders an SVG string.

## PRNG contract

The PRNG is the interoperability surface. If your PRNG produces the same outputs
as the reference for the same inputs, your implementation will produce identical
SVGs. Get this right first.

### FNV-1a 32-bit hash

[FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)
converts a string into a 32-bit unsigned integer. DiceBear iterates over
**UTF-16 code units** (not bytes, not code points).

```
offset_basis = 0x811c9dc5
prime        = 0x01000193

function fnv1a_hash(input: string) -> uint32:
    hash = offset_basis
    for each UTF-16 code unit c in input:
        hash = hash XOR c
        hash = hash * prime  (32-bit multiply, discard overflow)
    return hash as unsigned 32-bit
```

In JavaScript, `input.charCodeAt(i)` returns UTF-16 code units directly.
Languages without native UTF-16 strings must convert first. Outside the Basic
Multilingual Plane (e.g. emoji), code units and code points diverge, and using
code points instead produces wrong hashes for those inputs. The PHP reference
does the conversion explicitly:

```php
unpack('v*', mb_convert_encoding($input, 'UTF-16LE', 'UTF-8'))
```

Java and C# can iterate `string.charAt(i)` / `char` directly. For other
languages, transcode to UTF-16 and read 16-bit units.

**Reference (JS):**

```js
static hash(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
```

### Mulberry32

[Mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)
is a stateful PRNG that converts a 32-bit seed into a sequence of pseudo-random
numbers. The implementation must match Tommy Ettinger's C reference exactly.

```
function mulberry32_next(state) -> (uint32, new_state):
    state = (state + 0x6D2B79F5) as signed 32-bit
    z = state
    z = (z XOR (z >>> 15)) * (z OR 1)    (32-bit multiply)
    z = z XOR (z + ((z XOR (z >>> 7)) * (z OR 61)))  (32-bit multiply)
    return (z XOR (z >>> 14)) as unsigned 32-bit

function mulberry32_next_float(state) -> (float, new_state):
    (value, new_state) = mulberry32_next(state)
    return value / 2^32
```

**Reference (JS):**

```js
next() {
  const z = (this.#state = (this.#state + 0x6d2b79f5) | 0);
  let t = Math.imul(z ^ (z >>> 15), z | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0);
}

nextFloat() {
  return this.next() / 4294967296; // 2^32
}
```

Key details:

- `| 0` forces 32-bit signed integer (handles overflow)
- `>>> 0` converts back to unsigned 32-bit
- `Math.imul` performs 32-bit integer multiplication
- `nextFloat()` returns a value in `[0, 1)` by dividing by `2^32`
- The state is **stateful**: it advances with each call to `next()`
- Languages with 64-bit integers but no native `uint32_t` (e.g. PHP, Lua) must
  implement the 32-bit multiply manually: a naïve `uint32 * uint32` exceeds
  `2^63 - 1` and silently overflows. The PHP reference splits one operand into
  16-bit halves; see
  [`Prng/Mulberry32.php::mul`](https://github.com/dicebear/dicebear/blob/10.x/src/php/core/src/Prng/Mulberry32.php).

### Key-based value generation

DiceBear does not call the PRNG sequentially. Instead, each random decision uses
a **key** to derive an independent value. This makes the output independent of
call order.

```
function getValue(seed: string, key: string) -> float:
    hash = fnv1a_hash(seed + ":" + key)
    prng = new Mulberry32(hash)
    return prng.nextFloat()
```

For example, `getValue("alice", "eyesVariant")` always returns the same float,
regardless of whether `getValue("alice", "mouthVariant")` was called before or
after.

### Selection methods

For inputs with more than one entry, every selection method first normalizes:

1. **Deduplicate** by the item's string representation, keeping the first
   occurrence (`pick` and `shuffle` only; `weightedPick` operates on a map and
   has unique keys by construction).
2. **Sort** by the item's string representation using UTF-16 code unit
   comparison (JavaScript's default `.sort()` order).

Empty inputs return `undefined` (or an empty array for `shuffle`); single-entry
inputs are returned verbatim without deduplication or sorting. Both
normalization steps make multi-entry output independent of caller ordering and
duplicates. In practice the only values ever sorted are component variant names
and hex color strings (both guaranteed to be ASCII), so an implementation may
compare with `strcmp` and stay parity-correct, even though the JavaScript
reference compares full UTF-16 code units. The PHP reference does exactly this.

#### `pick(key, items) -> item | undefined`

Selects one item from an array.

```
function pick(seed, key, items):
    if items is empty: return undefined
    if items has 1 item: return items[0]
    unique = deduplicate items by string representation
    if unique has 1 item: return unique[0]
    sorted = sort unique by string representation
    index = floor(getValue(seed, key) * length(sorted))
    return sorted[index]
```

#### `weightedPick(key, weights) -> key | undefined`

Takes a map of `string → weight` and returns one of the map's keys, biased by
weight. When every weight is `0`, falls back to an unweighted `pick` across the
keys.

```
function weightedPick(seed, key, weights):
    keys = keys of weights
    if keys is empty: return undefined
    if keys has 1 item: return keys[0]
    sorted = sort keys by string representation
    totalWeight = sum of weights[k] for k in sorted
    if totalWeight == 0: return pick(seed, key, sorted)
    threshold = getValue(seed, key) * totalWeight
    cumulative = 0
    for each k in sorted:
        cumulative += weights[k]
        if threshold < cumulative: return k
    return last(sorted)
```

#### `bool(key, likelihood) -> boolean`

Returns `true` with probability `likelihood / 100`. `likelihood` defaults to
`50`.

```
function bool(seed, key, likelihood = 50):
    return getValue(seed, key) * 100 < likelihood
```

#### `float(key, range) -> number`

Returns a float in the closed range, rounded to four decimal places. `range` is
the schema's `{ min, max, step? }` object. If `min > max`, swap them internally.
With `step > 0`, sample uniformly from
`{ min + i × step | 0 ≤ i ≤ ⌊(max − min) / step⌋ }`, so when `(max − min)` is
not a multiple of `step`, the last bucket is `≤ max` and `max` itself is only
hit when the division is exact. Without `step`, the range is continuous.

```
function float(seed, key, range):
    min = min(range.min, range.max)
    max = max(range.min, range.max)
    step = range.step if range.step > 0 else 0

    if step > 0:
        buckets = floor((max - min) / step) + 1
        i = floor(getValue(seed, key) * buckets)
        raw = min + i * step
    else:
        raw = min + getValue(seed, key) * (max - min)

    return round(raw * 10000) / 10000   # round halves toward +Infinity
```

The `round` here is the same as in [number formatting](#number-formatting):
halves round **toward +Infinity** (JavaScript's `Math.round`), not your
language's native rounding. PHP's `round()` and many others round halves _away
from zero_, which diverges for negative values landing exactly on a `.5`
boundary (e.g. `round(-0.40625 × 10000) / 10000` is `-0.4062`, not `-0.4063`).

#### `integer(key, range) -> number`

Returns an integer in the closed range, inclusive on both ends. Accepts the same
`{ min, max, step? }` object as `float`; `step` is accepted for symmetry but
ignored, since integers already step by 1.

```
function integer(seed, key, range):
    min = min(range.min, range.max)
    max = max(range.min, range.max)
    return floor(getValue(seed, key) * (max - min + 1)) + min
```

#### `shuffle(key, items) -> items[]`

Fisher-Yates shuffle using a **stateful** Mulberry32 instance (not key-based).
For inputs of length ≤ 1 the items are returned as a copy without deduplication.

```
function shuffle(seed, key, items):
    if length(items) <= 1: return copy of items
    unique  = deduplicate items by string representation
    sorted  = sort unique by string representation
    result  = copy of sorted
    prng    = new Mulberry32(fnv1a_hash(seed + ":" + key))

    for i from length(result) - 1 down to 1:
        j = floor(prng.nextFloat() * (i + 1))
        swap result[i] and result[j]

    return result
```

Note: `shuffle` is the only method that uses a stateful PRNG instance directly
(calling `nextFloat()` multiple times). All other methods call `getValue()`
which creates a fresh PRNG for each key.

## Options resolution

The `Options` class resolves raw user options into concrete values used by the
renderer. Each resolution uses the PRNG with a specific key.

### Core options

| Option            | PRNG key       | Resolution                                                                 |
| ----------------- | -------------- | -------------------------------------------------------------------------- |
| `seed`            | —              | Literal string; defaults to `''` if not provided. Not memoized.            |
| `size`            | —              | Literal number; defaults to unset (renderer omits `width`/`height`).       |
| `idRandomization` | —              | Boolean; defaults to `false`. Uses host RNG, not the DiceBear PRNG.        |
| `title`           | —              | Literal string; defaults to unset (omits `<title>`, uses `aria-hidden`).   |
| `flip`            | `flip`         | `pick` from `['none', 'horizontal', 'vertical', 'both']`, default `'none'` |
| `rotate`          | `rotate`       | `float` from range, default `0`                                            |
| `scale`           | `scale`        | `float` from range, default `1`                                            |
| `borderRadius`    | `borderRadius` | `float` from range, default `0`                                            |
| `translateX`      | `translateX`   | `float` from range, default `0`                                            |
| `translateY`      | `translateY`   | `float` from range, default `0`                                            |
| `fontFamily`      | `fontFamily`   | `pick` from array, default `'system-ui'`                                   |
| `fontWeight`      | `fontWeight`   | `pick` from array, default `400`                                           |

Options with no PRNG key are read directly from the user input. The rest sample
from a user-supplied range/list under the given key, falling back to the listed
default.

The range options (`rotate`, `scale`, `borderRadius`, `translateX`,
`translateY`, and the per-color `${name}ColorAngle` / `${name}ColorFillStops`)
accept a number or an array, normalized to a `{ min, max }` range before
`float`/`integer` sampling:

- a bare number `n` → `{ min: n, max: n }` (a fixed value);
- a single-element array `[n]` → `{ min: n, max: n }` (same as the bare number);
- a two-element array → `{ min, max }` taken as the smaller/larger of the two
  (order does not matter, sampling swaps them anyway);
- an empty array `[]`, or the option unset, → fall back to the listed default.

Note the edge cases: `[n]` is a fixed value (**not** the default), and `[]`
falls back to the default (**not** a range with a missing bound). A fixed range
where `min === max` always samples that exact value.

### Component options

For each component (e.g. `eyes`) the user can supply exactly two options:

| Option            | PRNG key          | Resolution                                                                                                     |
| ----------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `eyesProbability` | `eyesProbability` | `bool` with likelihood from the user option, falling back to the component's `probability` (or `100` if unset) |
| `eyesVariant`     | `eyesVariant`     | `weightedPick` over a weighted map (see below)                                                                 |

If the probability check fails, the component is not rendered and `variant`
returns `undefined`.

`eyesVariant` accepts three shapes from the user: a single variant name, an
array of names, or a `Record<string, number>` weight map. Normalize the first
two to a map where each named variant has weight `1`. Then drop any keys that
are not declared in the component's `variants` block, and feed the remaining map
to `weightedPick`. When the user did not supply the option, build the map from
the variants' own `weight` values (defaulting to `1`).

For **component aliases** (declared via `extends` in the definition), the user
side is shared and only the PRNG side is independent. An alias does not expose
its own `${aliasName}Probability` or `${aliasName}Variant` user option. Both are
read from the source component's `${sourceName}Probability` and
`${sourceName}Variant`. The PRNG, however, uses the alias's own name as the key
(`${aliasName}Probability`, `${aliasName}Variant`), so each alias rolls its
visibility and variant independently while still being constrained by the same
user-set weights.

### Per-component transforms (render-time)

Each component reference also has a rotation, two translations, and a scale
applied at render time. These are **not user options**: they are sampled per
render from the component definition's `rotate`/`translate`/`scale` ranges. They
land in the introspective `resolvedOptions` snapshot under `${name}Rotate` /
`${name}TranslateX` / `${name}TranslateY` / `${name}Scale`, but they are not
part of the user-facing `StyleOptions<D>` type and feeding them back into a new
`Avatar` is not supported.

| Value      | PRNG key         | Sampling                                          |
| ---------- | ---------------- | ------------------------------------------------- |
| rotate     | `eyesRotate`     | `float` from `component.rotate`, default `0`      |
| translateX | `eyesTranslateX` | `float` from `component.translate.x`, default `0` |
| translateY | `eyesTranslateY` | `float` from `component.translate.y`, default `0` |
| scale      | `eyesScale`      | `float` from `component.scale`, default `1`       |

The translate values are percentages of the **component's own** `width` and
`height` (not the avatar canvas); multiply by the component dimension to get the
offset. Like every emitted number it is then run through
[`formatNumber`](#number-formatting) (which caps it at 5 decimal places). The
transform center `(cx, cy)` for rotate and scale is the component's own center:
`(width / 2, height / 2)`.

In the emitted SVG, the non-identity values are concatenated (space-separated)
into a single `transform` attribute on the `<use>` element, in this textual
order (read left to right):

```
transform="translate(tx, ty) rotate(angle, cx, cy) translate(cx, cy) scale(s) translate(-cx, -cy)"
```

Rules:

- Translate is one segment, emitted if either `tx ≠ 0` or `ty ≠ 0`.
- Rotate is one segment, emitted if `angle ≠ 0`.
- Scale is the three-part `translate cx,cy / scale s / translate -cx,-cy`
  fragment, emitted as a single unit if `s ≠ 1`.
- If all of `(tx, ty, angle, s)` are identity, the `transform` attribute is
  omitted entirely.
- If the style author wrote a `transform` on the component reference, it is
  prepended verbatim ahead of these segments (see
  [Component rendering](#component-rendering)).

### Color options

For each color group declared in the definition (**plus** an implicit
`background` group) the user can supply five options:

| Option                  | Type                                     | PRNG key                | Notes                                                                             |
| ----------------------- | ---------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `${name}Color`          | hex string or list                       | `${name}Color`          | Candidate colors (overrides the definition palette); normalized via `Color.toHex` |
| `${name}ColorFill`      | enum `solid` / `linear` / `radial`       | `${name}ColorFill`      | `pick` over a list, default `'solid'`                                             |
| `${name}ColorFillStops` | integer ≥ 2, or `[min, max]` of same     | `${name}ColorFillStops` | `integer` sample, default `2`; ignored when fill is `solid`                       |
| `${name}ColorAngle`     | number in `[-360, 360]`, or `[min, max]` | `${name}ColorAngle`     | `float` sample, default `0`                                                       |
| `${name}ColorOrder`     | enum `random` / `fixed`                  | none                    | Single value, no PRNG draw; default `'random'`                                    |

The resolver-level `colorOrder` accessor returns the user value or `'random'`.
Unlike `colorFill` it is not memoized into the resolved-options snapshot: it is
no PRNG pick, so the snapshot stays unchanged for existing inputs.

Resolution for each group:

1. Get candidate colors from the user option (`${name}Color`) or fall back to
   the style definition's palette. Remember which source was used: `'fixed'`
   treats user-supplied candidates ("verbatim") differently from the definition
   palette.
2. Normalize every candidate to lowercase hex (6 or 8 digits, leading `#`).
   3-/4-digit shorthand expands to 6/8.
3. Determine the number of stops: `1` if fill is `solid`, otherwise sample
   `${name}ColorFillStops` (PRNG `integer`). When the option is unset the
   fallback is `2`; in the verbatim case (`'fixed'` with user-supplied
   candidates) it is the candidate count instead, measured before the
   `notEqualTo` filtering below.
4. Apply constraints from the style definition:
   - **`contrastTo`**: Sort the candidates by WCAG 2.1 contrast ratio
     (descending) against the referenced color. The reference is resolved by
     calling the color-resolver recursively, so cycles must be detected and
     rejected. Skipped in the verbatim case: the user's order wins.
   - **`notEqualTo`**: Strip the alpha channel from every candidate and every
     already-picked color in the referenced groups, then drop the matches. If
     filtering would empty the candidate list, fall back to the unfiltered list:
     color constraints are best-effort, not hard. Applies regardless of
     `${name}ColorOrder`.
5. Order the candidates. If the definition declares `contrastTo`, keep the
   current order, even when the sort itself was skipped because the reference
   resolved to no color. Otherwise shuffle, unless `${name}ColorOrder` is
   `'fixed'`: verbatim candidates then keep exactly the given order (duplicates
   included), while a definition palette is deduplicated (first occurrence wins)
   and sorted by UTF-16 code units (the same canonicalization `shuffle` applies
   before drawing, without the shuffle itself).
6. Slice to the number of stops.

A group declared without a color entry in the style definition (the implicit
`background` group is the most common case) skips constraint handling entirely
and orders the user-supplied candidates as in step 5.

#### WCAG 2.1 contrast ratio

The contrast sort is the most likely source of subtle parity drift between
ports. Small differences in the linearization cutoff or the luminance
coefficients change the ordering on certain palettes. These are the defining
formulas:

```
function linearize(channel: uint8) -> float:
    s = channel / 255
    if s <= 0.04045:
        return s / 12.92
    return ((s + 0.055) / 1.055) ^ 2.4

function luminance(hex: string) -> float:
    (r, g, b) = parseHex(hex)
    return 0.2126 * linearize(r)
         + 0.7152 * linearize(g)
         + 0.0722 * linearize(b)

function contrastRatio(a: hex, b: hex) -> float:
    la = luminance(a)
    lb = luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
```

The cutoff is `0.04045`, the exponent is `2.4`, and the coefficients are
`0.2126 / 0.7152 / 0.0722` for R/G/B respectively. Sorting is descending by
`contrastRatio(candidate, refColor)` and must be **stable** (equal ratios keep
their input order).

> [!WARNING] Do not compute the linearization at runtime
> IEEE 754 does not require `pow` to be correctly rounded, and real
> implementations disagree in the last bit: V8's `Math.pow`, the C math library
> (used by PHP, Python, and Rust), and Go's pure-Go `math.Pow` each produce a
> different result for some channel values. A port that evaluates
> `((s + 0.055) / 1.055) ^ 2.4` at runtime will fail the parity fixtures on some
> inputs, and a JavaScript build would even differ between browser engines.
>
> `linearize` has only 256 possible inputs, so every reference implementation
> embeds a precomputed lookup table with the 256 results instead. Copy it from any
> reference port (e.g.
> [`Color.ts`](https://github.com/dicebear/dicebear/blob/10.x/src/js/core/src/Utils/Color.ts)).
> Decimal-literal parsing is correctly rounded in every mainstream language, so
> the table yields bit-identical doubles everywhere, and the remaining arithmetic
> (`+`, `×`, `÷`) is exactly specified by IEEE 754.
>
> One more trap: compilers that fuse `a × b + c` into a single FMA instruction
> (e.g. Go on arm64) round once instead of twice and drift in the last ULP. The
> weighted sum in `luminance` must round after every product. In Go that takes
> explicit `float64(...)` conversions around each product.

## SVG rendering pipeline

The renderer walks the element tree and generates an SVG string. The
transformations are applied in a specific order. Getting this wrong will produce
different output.

### Number formatting

Every number emitted into the SVG (`viewBox` dimensions, `width`/`height`, the
translate/rotate/scale offsets and their centers, `rx`/`ry`, gradient stop
offsets, the `fontWeight` variable, and so on) is stringified through a single
helper so that all implementations produce byte-identical output:

```
function formatNumber(value):
    scaled = round(value * 100000)   # round halves toward +Infinity
    sign = "-" if scaled < 0 else ""
    scaled = abs(scaled)

    integer  = floor(scaled / 100000)
    fraction = (scaled mod 100000), padded to 5 digits, then trailing zeros removed

    if fraction is empty:
        return sign + integer
    return sign + integer + "." + fraction
```

This rounds to at most **5 decimal places** and always uses plain decimal
notation (never scientific/exponential), with no trailing zeros and no trailing
`.0` (e.g. `1`, `-50`, `2.5`, `0.00001`). Build the string from the integer
`scaled` rather than the language's native float-to-string: PHP's
precision-based cast and Python's `repr` both diverge from JavaScript for small,
large, or fractional values. The `round` step rounds halves toward +Infinity
(JavaScript's `Math.round`); emulate it precisely: `floor(x + 0.5)` is **not**
equivalent (it is wrong for the largest double below `0.5`, where it yields `1`
instead of `0`).

### 1. Background

The renderer unconditionally asks the resolver for the `background` color group:
every style has it implicitly, even when the style definition declares no
`background` group. If the resolved list is non-empty, emit a
`<rect width="{w}" height="{h}" fill="{fill}"/>` as the first body element.
`{fill}` is either a literal hex string (solid fill, or a single candidate
color) or a `url(#…)` reference to a gradient registered in `<defs>`. See
[Gradient rendering](#gradient-rendering).

### 2. Element tree

Walk the `canvas.elements` array recursively:

- **`element`**: Render as `<{name} {attrs}/>` (self-closing) when there are no
  children, otherwise `<{name} {attrs}>{children}</{name}>`. Resolve color and
  variable references in attribute values, then XML-escape the resolved values.
  Element names and attribute keys are written verbatim because the schema
  validator already restricted them to a safe allowlist.
- **`text`**: Resolve any variable reference, then XML-escape and emit the
  result as the parent's text content.
- **`component`**: Look up the selected variant (from options resolution). If
  the component is visible, emit a `<use>` element pointing at a `<defs>` entry
  that holds the variant body (see below).

When an `element` has the name `defs`, the renderer **does not** emit a `<defs>`
tag inline. Instead, each child is rendered and pushed into the shared `<defs>`
block that the renderer accumulates over the whole walk (alongside generated
gradients, clip paths, and component variant bodies). The map key is the child's
`id` attribute when present, otherwise a synthetic `_{n}` slot, so two children
with the same `id` collapse to one entry, last writer wins. This lets style
definitions ship reusable fragments without breaking the
single-`<defs>`-per-document invariant.

#### Component rendering

A component reference is never inlined. The first time the renderer encounters a
`(component, variant)` pair, it:

1. Renders the variant's element tree.
2. Wraps it in `<g id="{sourceName}-{variantName}-{seedHash}">…</g>` and appends
   it to the shared `<defs>` block. `sourceName` is the _source_ component name.
   For an alias declared via `extends`, this is the name of the component the
   alias points to, so every alias referencing the same source shares a single
   `<defs>` entry.
3. At the call site, emits `<use {attributes} href="#{id}"/>` where
   `{attributes}` carries:
   - Every attribute the style author wrote on the component reference itself
     (rendered first, in iteration order).
   - A `transform` attribute composed of the per-component transforms (see
     [Per-component transforms](#per-component-transforms-render-time)). If the
     author also supplied a `transform`, it is **prepended** so it acts as the
     outermost (placement) transform, with the per-component values applied
     inside it. If all per-component values are identity and the author did not
     supply a transform, the attribute is omitted entirely.

`seedHash` is the FNV-1a hex hash of the seed, lowercased and zero-padded to 8
characters.

### 3. Transform order

The body (background plus rendered elements) is wrapped in nested `<g>`
elements. The list below is **outermost → innermost**: the border-radius clip is
always emitted, the others only when their value is non-identity.

1. **Border radius (always):** register a `<clipPath id="clip-{seedHash}">` in
   `<defs>` containing a `<rect width="{w}" height="{h}" rx="{rx}" ry="{ry}"/>`
   where `rx = (borderRadius / 100) * canvas.width` and
   `ry = (borderRadius / 100) * canvas.height`. Wrap the body in
   `<g clip-path="url(#clip-{seedHash})">`. **This wrap is emitted even when
   `borderRadius` is `0`** (with `rx="0" ry="0"`) so that transformed content
   cannot bleed past the canvas bounds.
2. **Translate** (skip if both are `0`): `<g transform="translate(dx, dy)">`
   where `dx = (translateX / 100) * canvas.width` and
   `dy = (translateY / 100) * canvas.height`.
3. **Rotate** (skip if `0`): `<g transform="rotate(angle, cx, cy)">` around
   canvas center, `cx = width / 2`, `cy = height / 2`.
4. **Flip** (skip if `none`) depends on mode:
   - `horizontal`: `translate(width, 0) scale(-1, 1)`
   - `vertical`: `translate(0, height) scale(1, -1)`
   - `both`: `translate(width, height) scale(-1, -1)`
5. **Scale** (skip if `1`):
   `<g transform="translate(cx, cy) scale(s) translate(-cx, -cy)">` where
   `cx = width / 2`, `cy = height / 2`.

Because border-radius is always wrapping the body, the rendered SVG always
contains a `<defs>` block with at least the `<clipPath>` entry.

### 4. SVG root element

The root `<svg>` element's attributes, in this order:

1. `xmlns="http://www.w3.org/2000/svg"`
2. `viewBox="0 0 {width} {height}"`
3. Global `attributes` from the style definition: keys verbatim from the
   allowlist, values XML-escaped
4. Either `role="img" aria-label="{title}"` (when `title` is set, escaped) or
   `aria-hidden="true"`
5. `width="{size}"` and `height="{size}"` (only when the `size` option is set)

Its children, in this exact order:

1. The generator comment
   `<!-- Generated by DiceBear (https://www.dicebear.com) -->`, always present
   and byte-identical across implementations.
2. `<metadata>`: the Dublin Core / RDF block from `meta` (see below); omitted
   entirely if `meta` is empty.
3. `<defs>`: the accumulated definitions (clip path, gradients, component
   variant bodies). Always present in practice because the border-radius clip is
   always registered.
4. `<title>`: only when the `title` option is set. Contents are escaped.
5. The transformed body from the previous step.

#### `<metadata>` block

The license/attribution metadata is emitted as a real `<metadata>` element with
RDF / Dublin Core terms, **not** as an HTML comment:

```xml
<metadata xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:dcterms="http://purl.org/dc/terms/">
  <rdf:RDF>
    <rdf:Description>
      <dc:title>{source.name}</dc:title>
      <dc:creator>{creator.name}</dc:creator>
      <dc:source xsi:type="dcterms:URI">{source.url}</dc:source>
      <dcterms:license xsi:type="dcterms:URI">{license.url}</dcterms:license>
      <dc:rights>{attribution text}</dc:rights>
    </rdf:Description>
  </rdf:RDF>
</metadata>
```

Each `dc:*` / `dcterms:*` field is only included when the corresponding `meta`
field is populated; if no field is populated, the `<metadata>` element is
omitted entirely. All text content is XML-escaped. The `<dc:rights>` value is a
single-line attribution string composed from `source`, `creator`, and `license`
(prefixed with `Remix of ` unless the style is MIT-licensed, authored by
DiceBear itself, or has no `source.name`).

### 5. ID randomization

When `idRandomization` is `true`, append a random suffix to every existing `id`
attribute and update every matching reference. The replacement patterns are
`id="…"`, `url(#…)`, and `href="#…"`; each occurrence is rewritten to
`{original}-{suffix}`.

The suffix format is **6 lowercase hex characters**, left-padded with zeros: in
JavaScript,
`Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')`.

The suffix **must be non-deterministic**: derive it from the host language's
non-seeded RNG (`Math.random()` in JavaScript, `random_int()` in PHP,
`random.randint()` in Python), not from the DiceBear PRNG. Two avatars rendered
with the same seed would otherwise still collide on their IDs, defeating the
purpose of the feature. Because the randomized output is non-deterministic, it
is excluded from parity testing: the avatar fixtures use the default of
`idRandomization: false`.

## Gradient rendering

A gradient is emitted only when the fill is `linear` or `radial` **and** the
color list has at least two entries. Otherwise the renderer returns a literal
hex string (`colors[0]`, or `'none'` when the list is empty).

When a gradient is needed:

1. Create a `<linearGradient>` (for `linear`) or `<radialGradient>` (for
   `radial`) in `<defs>`.
2. Calculate per-stop offsets: `formatNumber(i / (colors.length - 1) * 100)`
   followed by `%` (offsets are formatted like every other number, see
   [Number formatting](#number-formatting)).
3. Emit each color as `<stop offset="{offset}%" stop-color="{hex}"/>`.
4. Add `gradientTransform="rotate(angle, 0.5, 0.5)"` only when the resolved
   `${name}ColorAngle` is non-zero; omit the attribute entirely otherwise.
5. Reference the gradient via `url(#{id})` in the fill attribute that asked for
   it.
6. Gradient ID format: `{colorName}-color-{seedHash}` where `seedHash` is the
   FNV-1a hex hash of the seed (8 chars, zero-padded, lowercased).

## Initials extraction

The `initial` and `initials` variables are derived from the seed via the
`Initials.fromSeed(seed)` helper:

1. Strip the `@...` suffix so that an email yields a single name (`alice@x` →
   `alice`, not `[alice, x]`).
2. Remove apostrophe-like characters (`` ` ´ ' ʼ ``) so that `O'Neill` is
   treated as one word.
3. Match Unicode letter sequences with `\p{L}[\p{L}\p{M}]*`: each match is one
   "word".
4. **No words found?** Retry once without step 1 (so a seed of just `@bob` still
   yields `B`). If that still returns nothing, the variable resolves to the
   empty string.
5. **One word?** Take the first one or two grapheme-like units (`\p{L}\p{M}*`),
   uppercased.
6. **Multiple words?** Take the first grapheme of the first word and the first
   grapheme of the last word, uppercased.

`initial` is `initials.charAt(0)`, the first code unit of the result, which
matches the first letter for every input the regex produces.

## Testing your implementation

The DiceBear repository ships a language-neutral parity test suite at
[`tests/fixtures/parity/`](https://github.com/dicebear/dicebear/tree/10.x/tests/fixtures/parity).
It is the canonical way to verify a new implementation: the JavaScript, PHP,
Python, Rust, Go, Dart, and C# reference implementations all consume the same
JSON fixtures and assert the same outputs, so any port that reads these fixtures
gets the same coverage for free.

The fixture tree contains:

- **`fnv1a.json`**: input strings with their expected 32-bit hash and 8-char hex
  representation. Includes ASCII, the `seed:key` patterns produced by
  `Prng.getValue()`, and Unicode (`„é"`, `„日本語"`, emoji, long strings).
- **`mulberry32.json`**: seeds with the first 5 chained `{nextFloat, state}`
  pairs each. Catches state-progression bugs, not just first-step bugs.
- **`prng.json`**: every `Prng` method (`getValue`, `pick`, `weightedPick`,
  `bool`, `float`, `integer`, `shuffle`) with `{seed, key, args, result}` test
  cases, including order-independence checks for `pick` / `weightedPick` /
  `shuffle`.
- **`numbers.json`**: the number-to-string formatting contract (at most 5
  decimal places, halves toward +Infinity), including negative half-way
  boundaries and tiny values that collapse to `0`.
- **`initials.json`**: seed-to-initials extraction, covering accents, quotes,
  email `@`-stripping, CJK, and emoji.
- **`colors.json`**: the `Color` helpers (`toHex`, `toRgbHex`, `parseHex`,
  `luminance`, `sortByContrast`, `filterNotEqualTo`). The luminance entries pin
  exact doubles (including values around the linearization threshold, see the
  warning above), and the sort cases include a stability check.
- **`validation.json`**: style definitions and options with their expected
  accept/reject outcome (error _messages_ are language-specific and not part of
  the contract), plus circular `contrastTo` chains with the expected resolution
  path.
- **`styles/{initials,thumbs,glass,notionists,shape-grid}.json`**: vendored
  copies of five style definitions chosen to cover most rendering features
  (text, components, color overrides, gradient fills, root SVG attributes).
- **`avatars/{initials,thumbs,glass,notionists,shape-grid}.json`**:
  `{id, options, svg, resolvedOptions}` cases per style, exercising seed, size,
  scale, rotate, translate, border radius, flip, background gradients
  (solid/linear/radial), `title` escaping, component variant overrides, and
  style-specific options like `fontFamily` and `gestureVariant`. Select cases
  also carry a `dataUri` field that pins the percent-encoding contract
  (JavaScript's `encodeURIComponent`: every byte except `A-Za-z0-9-_.!~*'()` is
  escaped).
- **`descriptors/{initials,thumbs,glass,notionists,shape-grid}.json`**: the
  `OptionsDescriptor` field map per style (types, ranges, sorted variant lists,
  per-color fields).

### How to use the fixtures

For each fixture entry, your implementation must produce the recorded result
exactly:

```text
fnv1a:      Fnv1a::hash(input)        == entry.hash
            Fnv1a::hex(input)         == entry.hex
mulberry32: m = Mulberry32(seed);
            for each {float, state} in sequence:
              m.nextFloat() == float && m.state() == state
prng:       Prng(seed).<method>(key, args) == result
numbers:    formatNumber(input)       == entry.output
initials:   Initials::fromSeed(seed)  == entry.result
colors:     Color::<method>(args)     == entry.result   (floats bit-exact)
validation: Style/Avatar construction succeeds iff entry.valid;
            circular cases throw with chain == entry.chain
descriptor: OptionsDescriptor(style).toJSON() deep-equals the fixture
avatar:     Avatar(style, options).toString() == svg    (byte-for-byte)
            Avatar(style, options).toDataUri() == dataUri (when present)
```

Start with `fnv1a.json` and `mulberry32.json`. These are pure functions and the
easiest to debug. Once those are green, the `prng.json` cases will tell you
whether your sort order, weighted-pick threshold, and Fisher-Yates loop match.
Only then move on to the avatar fixtures, which compose everything.

The `resolvedOptions` field on each avatar fixture contains only the options
that were actually touched during resolution: unset options (`title`, `size`
when not provided, etc.) do not appear. The JavaScript reference relies on
`JSON.stringify()` dropping `undefined` values at the serialization boundary;
the PHP reference filters `null` values explicitly in `Options::resolved()`, and
the Python reference does the same in `Resolver.resolved()`. All produce the
same shape. A port that returns the full memo map verbatim will fail the
comparison. Strip unset entries before serializing.

### Regenerating the fixtures

The fixtures are produced from the JavaScript reference implementation:

```bash
npm run fixtures:parity
```

This rewrites every file under `tests/fixtures/parity/` from `@dicebear/core`.
You only need to run this if you have intentionally changed the JS rendering
output and want to update the expected values for every implementation.

### Manual SVG comparison

For ad-hoc spot checks beyond the fixtures, you can also generate reference SVGs
from the CLI and compare byte-for-byte:

```bash
dicebear initials ./reference --seed "Alice" --count 1
dicebear lorelei ./reference --seed "Alice" --count 1
dicebear avataaars ./reference --seed "Alice" --count 1
```

Start with the `initials` style (simplest) and work up to more complex styles
with multiple components and color constraints.

## Reference implementations

| Language   | Package                               | Source                                                                                     |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| JavaScript | `@dicebear/core`                      | [src/js/core/src/](https://github.com/dicebear/dicebear/tree/10.x/src/js/core/src)         |
| PHP        | `dicebear/core`                       | [src/php/core/src/](https://github.com/dicebear/dicebear/tree/10.x/src/php/core/src)       |
| Python     | `dicebear-core`                       | [src/python/core/src/](https://github.com/dicebear/dicebear/tree/10.x/src/python/core/src) |
| Rust       | `dicebear-core`                       | [src/rust/core/src/](https://github.com/dicebear/dicebear/tree/10.x/src/rust/core/src)     |
| Go         | `github.com/dicebear/dicebear-go/v10` | [src/go/core/](https://github.com/dicebear/dicebear/tree/10.x/src/go/core)                 |
| Dart       | `dicebear_core`                       | [src/dart/core/lib/](https://github.com/dicebear/dicebear/tree/10.x/src/dart/core/lib)     |
| C#         | `DiceBear.Core`                       | [src/csharp/core/src/](https://github.com/dicebear/dicebear/tree/10.x/src/csharp/core/src) |

---

Source: https://www.dicebear.com/create-styles/with-figma/

# Create an avatar style with Figma

Our [Figma plugin](https://www.figma.com/community/plugin/1005765655729342787)
is the easiest way to create an avatar style for DiceBear. The following
tutorial requires basic knowledge about [Figma](https://www.figma.com/).

> [!TIP]
> You do not have to start with an empty canvas. The plugin also imports a
> definition file, so you can take an existing style into Figma and change it
> there. See [Edit an avatar style with Figma](https://www.dicebear.com/create-styles/edit-a-style/).

## Step 1

If you want DiceBear to dynamically change colors in your avatar, you have to
create the colors in Figma as
[locale style](https://help.figma.com/hc/en-us/articles/360039820134-Manage-and-share-styles).
Arrange the colors in
[groups](https://help.figma.com/hc/en-us/articles/360039820134-Manage-and-share-styles#Manage_styles).
Name them according to the following pattern: `<group>/<option-name>`. For
example, `skin/light`.

You will use the locale styles later to colorize paths. DiceBear will then
change the colors of the paths within a group depending on the seed and color
settings. For the names of `<group>` and `<option-name>` you can use
alphanumeric characters as well as hyphens.

In the following example you can see how this could look like:

<video src="/create-styles/with-figma/1.mp4" controls muted></video>

## Step 2

Now assign a color from the created groups to your paths that will be colored
dynamically. Which color from a group does not matter. The important thing is
that the group is correct.

<video src="/create-styles/with-figma/2.mp4" controls muted></video>

## Step 3

Create the individual parts of your avatar as
[components](https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma).
Again, use the `<group>/<option-name>` naming pattern to create groups.

Identical to the colors, DiceBear will later (taking into account the seed and
the settings) select a component from a group and put it into the avatar.

<video src="/create-styles/with-figma/3.mp4" controls muted></video>

## Step 4

Make sure that each component in a group has the same dimensions.

<video src="/create-styles/with-figma/4.mp4" controls muted></video>

## Step 5

Create as many color and component groups as you like. Then you can bring all
the components together.

To do this,
[create a frame](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma)
and make sure that the width and height are identical. From the Assets tab, drag
one instance from each component group into the frame.

<video src="/create-styles/with-figma/5.mp4" controls muted></video>

## Step 6

Search now for the
[DiceBear Studio](https://www.figma.com/community/plugin/1005765655729342787)
plugin. Make sure you have selected the frame and start the plugin.

A dialog will open where you can make all kinds of settings. For example the
name of your avatar style, the license or the probability with which the
components will appear in your avatar later.

The settings are automatically saved to your frame. Once you are happy with your
settings, you can export your avatar style.

<video src="/create-styles/with-figma/6.mp4" controls muted></video>

> [!TIP]
> Make sure you select version **10.x** in the export settings. This guide covers
> version 10.x.
>
> ![You can find the version option in the "General" tab](https://www.dicebear.com/create-styles/with-figma/version-hint.png)

## Step 7

The plugin exports a JSON file: your
[style definition](https://www.dicebear.com/create-styles/definition-schema/). This file is ready to use
immediately, without a build step.

You can test your style right away with the [CLI](https://www.dicebear.com/integrations/cli/):

```
dicebear ./your-style.json ./test-output --count 10
```

This generates 10 sample avatars in the `./test-output` directory.

## Step 8

Congratulations! You can now use your avatar style with the
[JS Library](https://www.dicebear.com/integrations/javascript/), the [PHP Library](https://www.dicebear.com/integrations/php/),
the [Python Library](https://www.dicebear.com/integrations/python/), the
[Rust Library](https://www.dicebear.com/integrations/rust/), the [Go Library](https://www.dicebear.com/integrations/go/), the
[Dart Library](https://www.dicebear.com/integrations/dart/), [C# Library](https://www.dicebear.com/integrations/csharp/), or the
[CLI](https://www.dicebear.com/integrations/cli/).

### With the JS Library

```js
import { Style, Avatar } from '@dicebear/core';
import definition from './your-style.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, {
  seed: 'dicebear',
  // ... other options
});
```

### With the PHP Library

```php
use DiceBear\Avatar;
use DiceBear\Style;

$style = Style::fromJson(file_get_contents('./your-style.json'));

$avatar = new Avatar($style, [
  'seed' => 'dicebear',
  // ... other options
]);
```

### With the Python Library

```python
from pathlib import Path

from dicebear import Avatar, Style

style = Style.from_json(Path("./your-style.json").read_text("utf-8"))

avatar = Avatar(style, {
    "seed": "dicebear",
    # ... other options
})
```

### With the Rust Library

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;
use std::fs;

let definition = fs::read_to_string("./your-style.json")?;
let style = Style::from_str(&definition)?;

let avatar = Avatar::new(&style, json!({
    "seed": "dicebear",
    // ... other options
}))?;
```

### With the Go Library

```go
import (
	"os"

	dicebear "github.com/dicebear/dicebear-go/v10"
)

definition, _ := os.ReadFile("./your-style.json")
style, _ := dicebear.NewStyle(definition)

avatar, _ := dicebear.NewAvatar(style, map[string]any{
	"seed": "dicebear",
	// ... other options
})
```

### With the Dart Library

```dart
import 'dart:io';

import 'package:dicebear_core/dicebear_core.dart';

final style = Style.parse(File('./your-style.json').readAsStringSync());

final avatar = Avatar(style, {
  'seed': 'dicebear',
  // ... other options
});
```

### With the C# Library

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(File.ReadAllText("./your-style.json"));

var avatar = new Avatar(style, new JsonObject
{
    ["seed"] = "dicebear",
    // ... other options
});
```

### With the CLI

```
dicebear ./your-style.json ./avatars --seed "dicebear" --format png
```

> [!TIP]
> The CLI automatically detects all available options from your style definition.
> Use `--help` with your definition file to see them:
>
> ```
> dicebear ./your-style.json --help
> ```

---

Source: https://www.dicebear.com/contribute/documentation/

# Contribute to the documentation

This documentation site is a [VitePress](https://vitepress.vuejs.org/) app under
`apps/docs/` in the main
[`dicebear/dicebear`](https://github.com/dicebear/dicebear) monorepo. Every page
has an "Edit this page on GitHub" link at the bottom that opens the
corresponding source file.

Setup and workflow instructions live in the monorepo's contribution guide:

- [Documentation changes section](https://github.com/dicebear/dicebear/blob/10.x/CONTRIBUTING.md#documentation-changes-appsdocs)
  in `dicebear/dicebear/CONTRIBUTING.md`

---

Source: https://www.dicebear.com/contribute/editor/

# Contribute to the editor

The editor at [editor.dicebear.com](https://editor.dicebear.com) is a
[Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) +
[PrimeVue](https://primevue.org/) app. It lives under `apps/editor/` in the main
[`dicebear/dicebear`](https://github.com/dicebear/dicebear) monorepo.

Setup and workflow instructions live in the monorepo's contribution guide:

- [Editor changes section](https://github.com/dicebear/dicebear/blob/10.x/CONTRIBUTING.md#editor-changes-appseditor)
  in `dicebear/dicebear/CONTRIBUTING.md`

---

Source: https://www.dicebear.com/contribute/http-api/

# Contribute to the API

The HTTP API at [api.dicebear.com](https://api.dicebear.com) is a
[Fastify](https://www.fastify.io/) server that lives in its own repository:
[`dicebear/api`](https://github.com/dicebear/api).

The contribution guide, including local setup, the test suite, the Docker-based
production image, and the release process, lives alongside the code:

- [`CONTRIBUTING.md`](https://github.com/dicebear/api/blob/4.x/CONTRIBUTING.md)
  in `dicebear/api`

For hosting the API yourself (as opposed to working on its source), see
[Host the HTTP API yourself](https://www.dicebear.com/recipes/self-host-the-http-api/).

---

Source: https://www.dicebear.com/contribute/library/

# Contribute to the library

DiceBear is maintained across several repositories on GitHub. Each repo has its
own `CONTRIBUTING.md` with setup, scripts, testing, and release instructions.
Pick the one that matches what you want to work on.

## Avatar styles

New avatar styles and fixes to existing styles live in
[`dicebear/styles`](https://github.com/dicebear/styles). Most styles are
authored in Figma and exported with the
[DiceBear Studio](https://www.dicebear.com/create-styles/with-figma/) plugin, so the workflow there is
not the usual "edit a JSON file" loop.

- [`CONTRIBUTING.md`](https://github.com/dicebear/styles/blob/main/CONTRIBUTING.md)
  in `dicebear/styles`

## Core library, CLI, documentation, editor

The JavaScript, PHP, Python, Rust, Go, Dart and C# cores, the CLI, the VitePress
documentation (including the Playground), and the standalone editor all live in
the main [`dicebear/dicebear`](https://github.com/dicebear/dicebear) monorepo.
See:

- [`CONTRIBUTING.md`](https://github.com/dicebear/dicebear/blob/10.x/CONTRIBUTING.md)
  in `dicebear/dicebear`

It covers the monorepo layout, per-package workflow, cross-language parity tests
across the JavaScript, PHP, Python, Rust, Go, Dart and C# cores, and the release
process.

## JSON Schema

The schema for avatar style definitions and runtime options is versioned
separately in [`dicebear/schema`](https://github.com/dicebear/schema).

- [`CONTRIBUTING.md`](https://github.com/dicebear/schema/blob/main/CONTRIBUTING.md)
  in `dicebear/schema`

## DiceBear Studio (Figma plugin)

The Figma plugin that produces new avatar style definitions lives in
[`dicebear/studio`](https://github.com/dicebear/studio).

- [`CONTRIBUTING.md`](https://github.com/dicebear/studio/blob/main/CONTRIBUTING.md)
  in `dicebear/studio`

---

Source: https://www.dicebear.com/licenses/

# Licenses

While the DiceBear code is MIT licensed (see [Software](#software)), each artist
chooses the license for their own avatar style. The overview below groups the
styles by license, with the artist, the source work, and the license linked for
each one.

## CC0 1.0

These styles use the CC0 1.0 Public Domain Dedication, a waiver rather than a
license: https://creativecommons.org/publicdomain/zero/1.0/

- Blobs (https://www.dicebear.com/styles/blobs/): By DiceBear
- Cameo (https://www.dicebear.com/styles/cameo/): By DiceBear
- Clay (https://www.dicebear.com/styles/clay/): By DiceBear
- Constellation (https://www.dicebear.com/styles/constellation/): By DiceBear
- Critters (https://www.dicebear.com/styles/critters/): By DiceBear
- Cutouts (https://www.dicebear.com/styles/cutouts/): By DiceBear
- Disco (https://www.dicebear.com/styles/disco/): By DiceBear
- Gaze (https://www.dicebear.com/styles/gaze/): By DiceBear
- Glass (https://www.dicebear.com/styles/glass/): By DiceBear
- Identicon (https://www.dicebear.com/styles/identicon/): By DiceBear
- Initial Face (https://www.dicebear.com/styles/initial-face/): By DiceBear
- Initials (https://www.dicebear.com/styles/initials/): By DiceBear
- Landscape (https://www.dicebear.com/styles/landscape/): By DiceBear
- Line Face (https://www.dicebear.com/styles/line-face/): By DiceBear
- Loops (https://www.dicebear.com/styles/loops/): By DiceBear
- Lorelei Neutral (https://www.dicebear.com/styles/lorelei-neutral/): Remix of Lorelei Neutral (https://www.figma.com/community/file/1198749693280469639) by Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- Lorelei (https://www.dicebear.com/styles/lorelei/): Remix of Lorelei (https://www.figma.com/community/file/1198749693280469639) by Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- Marbles (https://www.dicebear.com/styles/marbles/): By DiceBear
- Moods (https://www.dicebear.com/styles/moods/): By DiceBear
- Notionists Neutral (https://www.dicebear.com/styles/notionists-neutral/): Remix of Notionists (https://heyzoish.gumroad.com/l/notionists) by Zoish (https://bio.link/heyzoish)
- Notionists (https://www.dicebear.com/styles/notionists/): Remix of Notionists (https://heyzoish.gumroad.com/l/notionists) by Zoish (https://bio.link/heyzoish)
- Open Peeps (https://www.dicebear.com/styles/open-peeps/): Remix of Open Peeps (https://www.openpeeps.com/) by Pablo Stanley (https://twitter.com/pablostanley)
- Patchwork (https://www.dicebear.com/styles/patchwork/): By DiceBear
- Pixel Art Neutral (https://www.dicebear.com/styles/pixel-art-neutral/): By DiceBear
- Pixel Art (https://www.dicebear.com/styles/pixel-art/): By DiceBear
- Pixelbot (https://www.dicebear.com/styles/pixelbot/): By DiceBear
- Planets (https://www.dicebear.com/styles/planets/): By DiceBear
- Rings (https://www.dicebear.com/styles/rings/): By DiceBear
- Shadows (https://www.dicebear.com/styles/shadows/): By DiceBear
- Shape Grid (https://www.dicebear.com/styles/shape-grid/): By DiceBear
- Shapes (https://www.dicebear.com/styles/shapes/): By DiceBear
- Slice (https://www.dicebear.com/styles/slice/): By DiceBear
- Sprouts (https://www.dicebear.com/styles/sprouts/): By DiceBear
- Squircles (https://www.dicebear.com/styles/squircles/): By DiceBear
- Stack (https://www.dicebear.com/styles/stack/): By DiceBear
- Stripes (https://www.dicebear.com/styles/stripes/): By DiceBear
- Thumbs (https://www.dicebear.com/styles/thumbs/): By DiceBear
- Triangles (https://www.dicebear.com/styles/triangles/): By DiceBear
- Voxel Art (https://www.dicebear.com/styles/voxel-art/): By DiceBear
- Voxel Bot (https://www.dicebear.com/styles/voxel-bot/): By DiceBear
- Waves (https://www.dicebear.com/styles/waves/): By DiceBear
- Weave (https://www.dicebear.com/styles/weave/): By DiceBear

## CC BY 4.0

These styles are remixes of works licensed under CC BY 4.0, which requires
naming the original artist, linking the license, and mentioning that the work
was modified: https://creativecommons.org/licenses/by/4.0/

- Adventurer Neutral (https://www.dicebear.com/styles/adventurer-neutral/): Remix of Adventurer Neutral (https://www.figma.com/community/file/1184595184137881796) by Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- Adventurer (https://www.dicebear.com/styles/adventurer/): Remix of Adventurer (https://www.figma.com/community/file/1184595184137881796) by Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- Big Ears Neutral (https://www.dicebear.com/styles/big-ears-neutral/): Remix of Face Generator (https://www.figma.com/community/file/986078800058673824) by The Visual Team (https://thevisual.team/)
- Big Ears (https://www.dicebear.com/styles/big-ears/): Remix of Face Generator (https://www.figma.com/community/file/986078800058673824) by The Visual Team (https://thevisual.team/)
- Big Smile (https://www.dicebear.com/styles/big-smile/): Remix of Custom Avatar (https://www.figma.com/community/file/881358461963645496) by Ashley Seo (http://www.ashleyseo.com/)
- Croodles Neutral (https://www.dicebear.com/styles/croodles-neutral/): Remix of Croodles - Doodle your face (https://www.figma.com/community/file/966199982810283152) by vijay verma (https://vjy.me/)
- Croodles (https://www.dicebear.com/styles/croodles/): Remix of Croodles - Doodle your face (https://www.figma.com/community/file/966199982810283152) by vijay verma (https://vjy.me/)
- Dylan (https://www.dicebear.com/styles/dylan/): Remix of Dylan! The Avatar Generator (https://www.figma.com/community/file/1356575240759683500) by Natalia Spivak (https://nataspvk.tilda.ws/)
- Fun Emoji (https://www.dicebear.com/styles/fun-emoji/): Remix of Fun Emoji Set (https://www.figma.com/community/file/968125295144990435) by Davis Uche (https://www.instagram.com/davedirect3/)
- Glyphs (https://www.dicebear.com/styles/glyphs/): Remix of Abstract Avatars for All Creative Profile Use (https://www.figma.com/community/file/1249154526125777853) by Matt Houser (https://x.com/mattkhouser)
- Micah (https://www.dicebear.com/styles/micah/): Remix of Avatar Illustration System (https://www.figma.com/community/file/829741575478342595) by Micah Lanier (https://dribbble.com/micahlanier)
- Miniavs (https://www.dicebear.com/styles/miniavs/): Remix of Miniavs - Free Avatar Creator (https://www.figma.com/community/file/923211396597067458) by Webpixels (https://webpixels.io/)
- Personas (https://www.dicebear.com/styles/personas/): Remix of Personas by Draftbit (https://personas.draftbit.com/) by Draftbit - draftbit.com (https://draftbit.com/)
- Toon Head (https://www.dicebear.com/styles/toon-head/): Remix of ToonHead (https://www.figma.com/community/file/1589627891082866389) by Johan Melin (https://www.johanmelin.com)

## MIT

The MIT license has a single condition: the copyright and permission notice
stays with the work.

- Icons (https://www.dicebear.com/styles/icons/): Based on Bootstrap Icons (https://github.com/twbs/icons) by The Bootstrap Authors (https://getbootstrap.com/)

The notice:

```
The MIT License (MIT)

Copyright (c) 2019-2024 The Bootstrap Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Artist's own terms

The artists of these styles wrote their own terms instead of picking a
standard license. They describe their work as free for personal and
commercial use.

- Avataaars Neutral (https://www.dicebear.com/styles/avataaars-neutral/): Remix of Avataaars (https://avataaars.com/) by Pablo Stanley (https://twitter.com/pablostanley), licensed under Free for personal and commercial use (https://avataaars.com/)
- Avataaars (https://www.dicebear.com/styles/avataaars/): Remix of Avataaars (https://avataaars.com/) by Pablo Stanley (https://twitter.com/pablostanley), licensed under Free for personal and commercial use (https://avataaars.com/)
- Bottts Neutral (https://www.dicebear.com/styles/bottts-neutral/): Remix of Bottts (https://bottts.com/) by Pablo Stanley (https://twitter.com/pablostanley), licensed under Free for personal and commercial use (https://bottts.com/)
- Bottts (https://www.dicebear.com/styles/bottts/): Remix of Bottts (https://bottts.com/) by Pablo Stanley (https://twitter.com/pablostanley), licensed under Free for personal and commercial use (https://bottts.com/)

## Software

The source code in the dicebear/dicebear repository is available under the
MIT license. That covers the libraries, the HTTP API, and this website. The
LICENSE file: https://github.com/dicebear/dicebear/blob/10.x/LICENSE

```
MIT License

Copyright (c) 2026 Florian Körner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The summaries on this page are meant as orientation, not as legal advice. The
linked license texts are the authoritative source.

---

Source: https://www.dicebear.com/support/

# Support DiceBear

DiceBear is free and MIT licensed. There is no paid tier and no company behind
it. If you use it and want to give something back, you have a few options.

## Star the repositories

A star costs nothing and makes the project easier to find for the next person
looking for an avatar library.

- [dicebear/dicebear](https://github.com/dicebear/dicebear): the core libraries
  for seven languages, the CLI, this documentation site, and the editor
- [dicebear/styles](https://github.com/dicebear/styles): the avatar style
  definitions
- [dicebear/api](https://github.com/dicebear/api): the self-hostable HTTP API

## Contribute

Bug reports and pull requests are welcome in all repositories.
[Contribute to the library](https://www.dicebear.com/contribute/library/) explains where each kind of
change belongs and how to set the projects up locally.

New avatar styles are the contribution users notice most. There are guides for
[creating a style with Figma](https://www.dicebear.com/create-styles/with-figma/) and
[from scratch](https://www.dicebear.com/create-styles/from-scratch/).

## Help other users

Integration questions come in through
[GitHub Discussions](https://github.com/dicebear/dicebear/discussions). Most of
them can be answered by anyone who has used DiceBear in a real project.

---

Source: https://www.dicebear.com/tools/

<div class="tools-hero">

      <strong>Tools</strong> Overview

      Small, focused utilities for working with DiceBear avatars. Each tool uses the same algorithms as the <code>@dicebear/core</code> library, so what you see here matches what your generated avatars do.

  </div>

---

# Avatar styles

- `adventurer` (Characters), CC BY 4.0: https://www.dicebear.com/styles/adventurer/index.md
- `adventurer-neutral` (Characters), CC BY 4.0: https://www.dicebear.com/styles/adventurer-neutral/index.md
- `avataaars` (Characters), Free for personal and commercial use: https://www.dicebear.com/styles/avataaars/index.md
- `avataaars-neutral` (Characters), Free for personal and commercial use: https://www.dicebear.com/styles/avataaars-neutral/index.md
- `big-ears` (Characters), CC BY 4.0: https://www.dicebear.com/styles/big-ears/index.md
- `big-ears-neutral` (Characters), CC BY 4.0: https://www.dicebear.com/styles/big-ears-neutral/index.md
- `big-smile` (Characters), CC BY 4.0: https://www.dicebear.com/styles/big-smile/index.md
- `blobs` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/blobs/index.md
- `bottts` (Characters), Free for personal and commercial use: https://www.dicebear.com/styles/bottts/index.md
- `bottts-neutral` (Characters), Free for personal and commercial use: https://www.dicebear.com/styles/bottts-neutral/index.md
- `cameo` (Characters), CC0 1.0: https://www.dicebear.com/styles/cameo/index.md
- `clay` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/clay/index.md
- `constellation` (Scenes, animated), CC0 1.0: https://www.dicebear.com/styles/constellation/index.md
- `critters` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/critters/index.md
- `croodles` (Characters), CC BY 4.0: https://www.dicebear.com/styles/croodles/index.md
- `croodles-neutral` (Characters), CC BY 4.0: https://www.dicebear.com/styles/croodles-neutral/index.md
- `cutouts` (Characters), CC0 1.0: https://www.dicebear.com/styles/cutouts/index.md
- `disco` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/disco/index.md
- `dylan` (Characters), CC BY 4.0: https://www.dicebear.com/styles/dylan/index.md
- `fun-emoji` (Characters), CC BY 4.0: https://www.dicebear.com/styles/fun-emoji/index.md
- `gaze` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/gaze/index.md
- `glass` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/glass/index.md
- `glyphs` (Minimalist), CC BY 4.0: https://www.dicebear.com/styles/glyphs/index.md
- `icons` (Minimalist), MIT: https://www.dicebear.com/styles/icons/index.md
- `identicon` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/identicon/index.md
- `initial-face` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/initial-face/index.md
- `initials` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/initials/index.md
- `landscape` (Scenes, animated), CC0 1.0: https://www.dicebear.com/styles/landscape/index.md
- `line-face` (Characters), CC0 1.0: https://www.dicebear.com/styles/line-face/index.md
- `loops` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/loops/index.md
- `lorelei` (Characters), CC0 1.0: https://www.dicebear.com/styles/lorelei/index.md
- `lorelei-neutral` (Characters), CC0 1.0: https://www.dicebear.com/styles/lorelei-neutral/index.md
- `marbles` (Characters), CC0 1.0: https://www.dicebear.com/styles/marbles/index.md
- `micah` (Characters), CC BY 4.0: https://www.dicebear.com/styles/micah/index.md
- `miniavs` (Characters), CC BY 4.0: https://www.dicebear.com/styles/miniavs/index.md
- `moods` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/moods/index.md
- `notionists` (Characters), CC0 1.0: https://www.dicebear.com/styles/notionists/index.md
- `notionists-neutral` (Characters), CC0 1.0: https://www.dicebear.com/styles/notionists-neutral/index.md
- `open-peeps` (Characters), CC0 1.0: https://www.dicebear.com/styles/open-peeps/index.md
- `patchwork` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/patchwork/index.md
- `personas` (Characters), CC BY 4.0: https://www.dicebear.com/styles/personas/index.md
- `pixel-art` (Characters), CC0 1.0: https://www.dicebear.com/styles/pixel-art/index.md
- `pixel-art-neutral` (Characters), CC0 1.0: https://www.dicebear.com/styles/pixel-art-neutral/index.md
- `pixelbot` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/pixelbot/index.md
- `planets` (Scenes, animated), CC0 1.0: https://www.dicebear.com/styles/planets/index.md
- `rings` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/rings/index.md
- `shadows` (Characters), CC0 1.0: https://www.dicebear.com/styles/shadows/index.md
- `shape-grid` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/shape-grid/index.md
- `shapes` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/shapes/index.md
- `slice` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/slice/index.md
- `sprouts` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/sprouts/index.md
- `squircles` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/squircles/index.md
- `stack` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/stack/index.md
- `stripes` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/stripes/index.md
- `thumbs` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/thumbs/index.md
- `toon-head` (Characters), CC BY 4.0: https://www.dicebear.com/styles/toon-head/index.md
- `triangles` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/triangles/index.md
- `voxel-art` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/voxel-art/index.md
- `voxel-bot` (Characters, animated), CC0 1.0: https://www.dicebear.com/styles/voxel-bot/index.md
- `waves` (Minimalist, animated), CC0 1.0: https://www.dicebear.com/styles/waves/index.md
- `weave` (Minimalist), CC0 1.0: https://www.dicebear.com/styles/weave/index.md

---

Source: https://www.dicebear.com/styles/adventurer-neutral/

# Adventurer Neutral

Adventurer Neutral is a reduced variant of the Adventurer style, showing only
the eyes, eyebrows, and mouth on a solid background, with no head outline or
hair.

- **Style name:** `adventurer-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- **Source:** https://www.figma.com/community/file/1184595184137881796
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/adventurer-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/adventurer-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/adventurer-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("adventurer-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features adventurer-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::ADVENTURER_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.AdventurerNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/adventurer_neutral.dart';

final style = Style.parse(adventurerNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.AdventurerNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear adventurer-neutral
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No glasses, the plain face.
- **Sepia:** One warm brown for face and features.
- **Greyscale:** No color anywhere, face included.
- **Duotone:** Two steps of one indigo.
- **Muted:** Dusty skin tones instead of the four defaults.
- **Electric:** An acid face with black features.
- **Pastel Wall:** Five soft faces.
- **Sunrise:** A warm gradient across the face.
- **Full Cast:** Everyone wears glasses.
- **Close Up:** Scaled in on the features.

The full option set of each one is at https://www.dicebear.com/styles/adventurer-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyebrowsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26` |
| `eyesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `glassesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30` |
| `mouthProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `lipsColor` | color (array allowed) | Hex color, `#` optional |
| `lipsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `lipsColorFillStops` | range |  |
| `lipsColorAngle` | range | -360 to 360 |
| `lipsColorOrder` | enum | `random`, `fixed` |
| `scleraColor` | color (array allowed) | Hex color, `#` optional |
| `scleraColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `scleraColorFillStops` | range |  |
| `scleraColorAngle` | range | -360 to 360 |
| `scleraColorOrder` | enum | `random`, `fixed` |
| `teethColor` | color (array allowed) | Hex color, `#` optional |
| `teethColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `teethColorFillStops` | range |  |
| `teethColorAngle` | range | -360 to 360 |
| `teethColorOrder` | enum | `random`, `fixed` |
| `throatColor` | color (array allowed) | Hex color, `#` optional |
| `throatColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `throatColorFillStops` | range |  |
| `throatColorAngle` | range | -360 to 360 |
| `throatColorOrder` | enum | `random`, `fixed` |
| `tongueColor` | color (array allowed) | Hex color, `#` optional |
| `tongueColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `tongueColorFillStops` | range |  |
| `tongueColorAngle` | range | -360 to 360 |
| `tongueColorOrder` | enum | `random`, `fixed` |
| `uvulaColor` | color (array allowed) | Hex color, `#` optional |
| `uvulaColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `uvulaColorFillStops` | range |  |
| `uvulaColorAngle` | range | -360 to 360 |
| `uvulaColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/adventurer-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/adventurer-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/adventurer-neutral/presets/

# Adventurer Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: the glasses component switched off so only the face is left.

```json
{
  "glassesProbability": 0
}
```

## Sepia

The background is the face in this style, so a sepia set moves it along with the mouth. Lips, tongue and throat are warmed to match, since nothing red survives a sepia treatment.

```json
{
  "backgroundColor": ["c9a883","b08e66","967458"],
  "inkColor": ["3a2a1c"],
  "eyesColor": ["3a2a1c"],
  "glassesColor": ["3a2a1c"],
  "scleraColor": ["f7ecd8"],
  "teethColor": ["f7ecd8"],
  "lipsColor": ["8a5a44"],
  "tongueColor": ["a87a5e"],
  "throatColor": ["6b4230"],
  "uvulaColor": ["6b4230"]
}
```

## Greyscale

Properly grey rather than a grey mouth on a colored face. Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["d6d6d6","b4b4b4","8c8c8c"],
  "inkColor": ["1c1c1c"],
  "eyesColor": ["1c1c1c"],
  "glassesColor": ["1c1c1c"],
  "scleraColor": ["f2f2f2"],
  "teethColor": ["f2f2f2"],
  "lipsColor": ["707070"],
  "tongueColor": ["8a8a8a"],
  "throatColor": ["4a4a4a"],
  "uvulaColor": ["4a4a4a"]
}
```

## Duotone

Face and features take the same hue at two lightnesses, and the mouth follows.

```json
{
  "backgroundColor": ["8e97cc"],
  "inkColor": ["1e2246"],
  "eyesColor": ["1e2246"],
  "glassesColor": ["1e2246"],
  "scleraColor": ["dfe3f5"],
  "teethColor": ["dfe3f5"],
  "lipsColor": ["4a4f80"],
  "tongueColor": ["6b73a8"],
  "throatColor": ["353a6b"],
  "uvulaColor": ["353a6b"]
}
```

## Muted

The style ships four skin tones as its background palette. This trades them for dusty ones, which reads less like a portrait and more like a printed icon.

```json
{
  "backgroundColor": ["c8b7a6","b0a08e","9a8b7c","cbbfae"]
}
```

## Electric

The other direction: colors past anything the style ships, with the linework left black so the face still reads.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together, though it does mean giving up the skin tones.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

The glasses component sits at ten percent, so a small set shows them on nobody. This puts them on everyone, which suits a demo rather than a user list.

```json
{
  "glassesProbability": 100
}
```

## Close Up

Uses scale rather than color. The style leaves a lot of face around the eyes and mouth, and cropping in buys detail back.

```json
{
  "scale": 1.3
}
```

---

Source: https://www.dicebear.com/styles/adventurer/

# Adventurer

Adventurer is an illustrated vector avatar style with expressive cartoon faces,
bold outlines, varied hairstyles, and customizable details like glasses,
earrings, and eyebrows. Generate friendly profile icons for games, communities,
and social apps.

- **Style name:** `adventurer`
- **Category:** Characters
- **Animated:** no
- **Creator:** Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- **Source:** https://www.figma.com/community/file/1184595184137881796
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/adventurer/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/adventurer.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/adventurer.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("adventurer.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features adventurer
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::ADVENTURER)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Adventurer))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/adventurer.dart';

final style = Style.parse(adventurer);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Adventurer);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear adventurer
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no extras, nothing added.
- **Sepia:** One warm brown for skin, hair and paper.
- **Greyscale:** No color anywhere, skin included.
- **Duotone:** Three steps of one indigo and nothing else.
- **Muted:** Hair in six dusty tones, skin left to the seed.
- **Electric:** Hair at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, everything else untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Night Shift:** Near black behind, light hair in front.
- **Sunrise:** A warm gradient behind, everything else untouched.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/adventurer/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `detailsVariant` | enum (array allowed) | `birthmark`, `blush`, `freckles`, `mustache` |
| `detailsProbability` | number | 0 to 100 |
| `earringsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06` |
| `earringsProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26` |
| `eyesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `glassesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `long01`, `long02`, `long03`, `long04`, `long05`, `long06`, `long07`, `long08`, `long09`, `long10`, `long11`, `long12`, `long13`, `long14`, `long15`, `long16`, `long17`, `long18`, `long19`, `long20`, `long21`, `long22`, `long23`, `long24`, `long25`, `long26`, `short01`, `short02`, `short03`, `short04`, `short05`, `short06`, `short07`, `short08`, `short09`, `short10`, `short11`, `short12`, `short13`, `short14`, `short15`, `short16`, `short17`, `short18`, `short19` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `default` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30` |
| `mouthProbability` | number | 0 to 100 |
| `earringsColor` | color (array allowed) | Hex color, `#` optional |
| `earringsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `earringsColorFillStops` | range |  |
| `earringsColorAngle` | range | -360 to 360 |
| `earringsColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `lipsColor` | color (array allowed) | Hex color, `#` optional |
| `lipsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `lipsColorFillStops` | range |  |
| `lipsColorAngle` | range | -360 to 360 |
| `lipsColorOrder` | enum | `random`, `fixed` |
| `scleraColor` | color (array allowed) | Hex color, `#` optional |
| `scleraColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `scleraColorFillStops` | range |  |
| `scleraColorAngle` | range | -360 to 360 |
| `scleraColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `teethColor` | color (array allowed) | Hex color, `#` optional |
| `teethColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `teethColorFillStops` | range |  |
| `teethColorAngle` | range | -360 to 360 |
| `teethColorOrder` | enum | `random`, `fixed` |
| `throatColor` | color (array allowed) | Hex color, `#` optional |
| `throatColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `throatColorFillStops` | range |  |
| `throatColorAngle` | range | -360 to 360 |
| `throatColorOrder` | enum | `random`, `fixed` |
| `tongueColor` | color (array allowed) | Hex color, `#` optional |
| `tongueColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `tongueColorFillStops` | range |  |
| `tongueColorAngle` | range | -360 to 360 |
| `tongueColorOrder` | enum | `random`, `fixed` |
| `uvulaColor` | color (array allowed) | Hex color, `#` optional |
| `uvulaColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `uvulaColorFillStops` | range |  |
| `uvulaColorAngle` | range | -360 to 360 |
| `uvulaColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/adventurer/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/adventurer/definition.json`.

---

Source: https://www.dicebear.com/styles/adventurer/presets/

# Adventurer presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style with everything switched off: no background, so the avatar sits on whatever your page is, and none of the low-probability extras. The baseline the rest of these presets move away from.

```json
{
  "backgroundColor": [],
  "detailsProbability": 0,
  "earringsProbability": 0,
  "glassesProbability": 0
}
```

## Sepia

A real sepia print, which means the skin tone goes with it. Every other preset here leaves skin to the seed; this one cannot, because a color photograph of a face is not sepia. Lips, tongue and throat are warmed to match, so nothing red survives the treatment. One face detail is a pink blush painted into the artwork rather than exposed as a color group, so that variant drops out; the other three follow the ink.

```json
{
  "backgroundColor": ["e7d7bd"],
  "skinColor": ["c9a883","b08e66","967458"],
  "hairColor": ["5a3d28","6b4f35","7d6047"],
  "inkColor": ["3a2a1c"],
  "eyesColor": ["3a2a1c"],
  "scleraColor": ["f7ecd8"],
  "lipsColor": ["8a5a44"],
  "tongueColor": ["a87a5e"],
  "throatColor": ["6b4230"],
  "uvulaColor": ["6b4230"],
  "teethColor": ["f7ecd8"],
  "detailsVariant": ["birthmark","freckles","mustache"]
}
```

## Greyscale

Properly grey rather than grey hair on a colored face. Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. One face detail is a pink blush painted into the artwork rather than exposed as a color group, so that variant drops out; the other three follow the ink.

```json
{
  "backgroundColor": ["e9e9ec"],
  "skinColor": ["d6d6d6","b4b4b4","8c8c8c","5e5e5e"],
  "hairColor": ["1a1a1a","4a4a4a","8a8a8a","c2c2c2"],
  "inkColor": ["1c1c1c"],
  "eyesColor": ["1c1c1c"],
  "scleraColor": ["f2f2f2"],
  "lipsColor": ["707070"],
  "tongueColor": ["8a8a8a"],
  "throatColor": ["4a4a4a"],
  "uvulaColor": ["4a4a4a"],
  "teethColor": ["f2f2f2"],
  "detailsVariant": ["birthmark","freckles","mustache"]
}
```

## Duotone

Background, skin and hair take the same hue at three lightnesses, and the mouth follows. As with Sepia, a duotone only works if the face joins in, so the seed loses its say over skin here. One face detail is a pink blush painted into the artwork rather than exposed as a color group, so that variant drops out; the other three follow the ink.

```json
{
  "backgroundColor": ["dfe3f5"],
  "skinColor": ["8e97cc"],
  "hairColor": ["2b2f5e"],
  "inkColor": ["1e2246"],
  "eyesColor": ["1e2246"],
  "scleraColor": ["dfe3f5"],
  "lipsColor": ["4a4f80"],
  "tongueColor": ["6b73a8"],
  "throatColor": ["353a6b"],
  "uvulaColor": ["353a6b"],
  "teethColor": ["dfe3f5"],
  "detailsVariant": ["birthmark","freckles","mustache"]
}
```

## Muted

The style's hair palette runs from black to teal and pink. This replaces it with six dusty tones that sit closer together, so a page full of these reads as one set rather than as a box of crayons.

```json
{
  "backgroundColor": ["ece7de"],
  "hairColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction, on the same lever: six hair colors past anything the style ships. The background goes dark so they read as lit, and skin still comes from the seed.

```json
{
  "backgroundColor": ["16161c"],
  "hairColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. Strong enough that the avatar holds its own against a busy page, and the only preset here that will fight with a colorful interface rather than sit inside it.

```json
{
  "backgroundColor": ["ff8fab","ffb703","4cc9a7","4d96ff","b57bff"]
}
```

## Night Shift

For dark interfaces. The hair pool drops to the pale end so the silhouette does not disappear into the background. The linework stays black on purpose: pale ink inverts the eyes and dissolves the outline against light hair, which looks like a bug rather than a night mode.

```json
{
  "backgroundColor": ["16161c"],
  "hairColor": ["e5d7a3","b9a05f","afafaf","85c2c6","dba3be"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends most of it on empty shoulders, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f3ede4"],
  "scale": 1.1
}
```

---

Source: https://www.dicebear.com/styles/avataaars-neutral/

# Avataaars Neutral

Avataaars Neutral is a reduced variant of the Avataaars style, showing only the
eyes, eyebrows, and mouth on a solid colored square, with no head, hair, or
clothing.

- **Style name:** `avataaars-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** Pablo Stanley (https://twitter.com/pablostanley)
- **Source:** https://avataaars.com/
- **License:** Free for personal and commercial use (https://avataaars.com/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/avataaars-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/avataaars-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/avataaars-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("avataaars-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features avataaars-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::AVATAAARS_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.AvataaarsNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/avataaars_neutral.dart';

final style = Style.parse(avataaarsNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.AvataaarsNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear avataaars-neutral
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Plain:** No hearts, no tears, no vomit.
- **Sepia:** One warm ramp, face and features.
- **Greyscale:** No hue on the face at all.
- **Duotone:** One blue complexion, shared by everyone.
- **Muted:** Six tones that read as neither skin nor paint.
- **Electric:** Neon faces, features left dark.
- **Cool:** Blues, teals and violets only.
- **Warm:** Reds, oranges and golds only.

The full option set of each one is at https://www.dicebear.com/styles/avataaars-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyebrowsVariant` | enum (array allowed) | `angry`, `angryNatural`, `default`, `defaultNatural`, `flatNatural`, `frownNatural`, `raisedExcited`, `raisedExcitedNatural`, `sadConcerned`, `sadConcernedNatural`, `unibrowNatural`, `upDown`, `upDownNatural` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `closed`, `cry`, `default`, `eyeRoll`, `happy`, `hearts`, `side`, `squint`, `surprised`, `wink`, `winkWacky`, `xDizzy` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `concerned`, `default`, `disbelief`, `eating`, `grimace`, `sad`, `screamOpen`, `serious`, `smile`, `tongue`, `twinkle`, `vomit` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `default` |
| `noseProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/avataaars-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/avataaars-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/avataaars-neutral/presets/

# Avataaars Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Plain

The style keeps a few cartoon extremes among its eyes and mouths, and they carry printed color that no option reaches. Dropping them leaves the everyday expressions. Worth knowing for the rest of these: what this style calls the background is the face, so `backgroundColor` sets the complexion and the tile at once.

```json
{
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"]
}
```

## Sepia

Since the background is the complexion here, a monochrome set commits everyone to the same four tones. The cartoon extremes come out too, for the reason Plain gives.

```json
{
  "backgroundColor": ["e3c39c","cba87e","ad8659","8a6a43"],
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The brows and mouth are drawn as dark shapes over the face, so they keep their contrast on every step of the ramp.

```json
{
  "backgroundColor": ["dcdce0","bfbfc6","9c9ca4","76767e"],
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"]
}
```

## Duotone

A single color across a whole set, so nothing but the brows, eyes and mouth tells two avatars apart. It commits everyone to one complexion, which is the point here and would be a problem anywhere else.

```json
{
  "backgroundColor": ["9ec9e8"],
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"]
}
```

## Muted

Six tones that do not read as complexions at all, which suits avatars standing in for accounts or teams rather than people. The printed expressions come out too, the ones Plain lists.

```json
{
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"],
  "backgroundColor": ["a5a58d","8e9aaf","9c8a94","8fa38f","b0a58c","94a3ad"]
}
```

## Electric

The same group past the end of its scale. The brows and mouth are dark and heavy enough to stay legible on top of any of these.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Cool

Half the color wheel, and the counterpart to Warm. Two groups of accounts can be told apart by temperature without a second badge. The printed expressions come out with them, since a red tongue pulls warm against every color here.

```json
{
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"],
  "backgroundColor": ["7dd3fc","5eead4","a5b4fc","c4b5fd","67e8f9"]
}
```

## Warm

The other half of the same wheel. The style's own palette already leans this way, so this is the smaller step of the two.

```json
{
  "backgroundColor": ["fdba74","fcd34d","fca5a5","fb923c","f9a8d4"]
}
```

---

Source: https://www.dicebear.com/styles/avataaars/

# Avataaars

Avataaars is a popular cartoon vector avatar style with half-body characters and
a wide range of hairstyles, clothing, accessories, and facial expressions.
Generate customizable SVG profile icons for user accounts, dashboards, and
social applications.

- **Style name:** `avataaars`
- **Category:** Characters
- **Animated:** no
- **Creator:** Pablo Stanley (https://twitter.com/pablostanley)
- **Source:** https://avataaars.com/
- **License:** Free for personal and commercial use (https://avataaars.com/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/avataaars/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/avataaars.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/avataaars.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("avataaars.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features avataaars
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::AVATAAARS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Avataaars))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/avataaars.dart';

final style = Style.parse(avataaars);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Avataaars);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear avataaars
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No glasses, no facial hair.
- **Sepia:** One brown ramp across every layer.
- **Greyscale:** No hue on any of the six groups.
- **Duotone:** Three steps of one blue.
- **Muted:** Dusty clothes, everything else untouched.
- **Electric:** Clothes past anything the style ships.
- **Pastel Wall:** A soft ground behind the shoulders.
- **Bold Pop:** Six saturated grounds behind the shoulders.
- **Night Shift:** Near-black ground, pale clothes.
- **Sunrise:** A warm gradient behind the portrait.
- **Full Cast:** Glasses and facial hair on everyone.

The full option set of each one is at https://www.dicebear.com/styles/avataaars/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `accessoriesVariant` | enum (array allowed) | `eyepatch`, `kurt`, `prescription01`, `prescription02`, `round`, `sunglasses`, `wayfarers` |
| `accessoriesProbability` | number | 0 to 100 |
| `clothesVariant` | enum (array allowed) | `blazerAndShirt`, `blazerAndSweater`, `collarAndSweater`, `graphicShirt`, `hoodie`, `overall`, `shirtCrewNeck`, `shirtScoopNeck`, `shirtVNeck` |
| `clothesProbability` | number | 0 to 100 |
| `clothesGraphicVariant` | enum (array allowed) | `bat`, `bear`, `cumbia`, `deer`, `diamond`, `hola`, `pizza`, `resist`, `skull`, `skullOutline` |
| `clothesGraphicProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `angry`, `angryNatural`, `default`, `defaultNatural`, `flatNatural`, `frownNatural`, `raisedExcited`, `raisedExcitedNatural`, `sadConcerned`, `sadConcernedNatural`, `unibrowNatural`, `upDown`, `upDownNatural` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `closed`, `cry`, `default`, `eyeRoll`, `happy`, `hearts`, `side`, `squint`, `surprised`, `wink`, `winkWacky`, `xDizzy` |
| `eyesProbability` | number | 0 to 100 |
| `facialHairVariant` | enum (array allowed) | `beardLight`, `beardMajestic`, `beardMedium`, `moustacheFancy`, `moustacheMagnum` |
| `facialHairProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `concerned`, `default`, `disbelief`, `eating`, `grimace`, `sad`, `screamOpen`, `serious`, `smile`, `tongue`, `twinkle`, `vomit` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `default` |
| `noseProbability` | number | 0 to 100 |
| `topVariant` | enum (array allowed) | `bigHair`, `bob`, `bun`, `curly`, `curvy`, `dreads`, `dreads01`, `dreads02`, `frida`, `frizzle`, `fro`, `froBand`, `hat`, `hijab`, `longButNotTooLong`, `miaWallace`, `shaggy`, `shaggyMullet`, `shavedSides`, `shortCurly`, `shortFlat`, `shortRound`, `shortWaved`, `sides`, `straight01`, `straight02`, `straightAndStrand`, `theCaesar`, `theCaesarAndSidePart`, `turban`, `winterHat02`, `winterHat03`, `winterHat04`, `winterHat1` |
| `topProbability` | number | 0 to 100 |
| `accessoriesColor` | color (array allowed) | Hex color, `#` optional |
| `accessoriesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `accessoriesColorFillStops` | range |  |
| `accessoriesColorAngle` | range | -360 to 360 |
| `accessoriesColorOrder` | enum | `random`, `fixed` |
| `clothesColor` | color (array allowed) | Hex color, `#` optional |
| `clothesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `clothesColorFillStops` | range |  |
| `clothesColorAngle` | range | -360 to 360 |
| `clothesColorOrder` | enum | `random`, `fixed` |
| `facialHairColor` | color (array allowed) | Hex color, `#` optional |
| `facialHairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `facialHairColorFillStops` | range |  |
| `facialHairColorAngle` | range | -360 to 360 |
| `facialHairColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `hatColor` | color (array allowed) | Hex color, `#` optional |
| `hatColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hatColorFillStops` | range |  |
| `hatColorAngle` | range | -360 to 360 |
| `hatColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/avataaars/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/avataaars/definition.json`.

---

Source: https://www.dicebear.com/styles/avataaars/presets/

# Avataaars presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Two optional components off at once. Both appear on one avatar in ten by default, so this mostly makes a set more even rather than plainer.

```json
{
  "accessoriesProbability": 0,
  "facialHairProbability": 0
}
```

## Sepia

Six color groups moved onto one ramp. The tops with printed color come out, along with the crying eyes and the mouths that open onto a pink tongue, since no option reaches any of those.

```json
{
  "backgroundColor": ["ede2ce"],
  "skinColor": ["d9bd94","c4a377","a8865a","8a6a43","e3cdb0"],
  "hairColor": ["3a2916","4a3018","5c4223","7d6038","a08256"],
  "facialHairColor": ["3a2916","4a3018","5c4223"],
  "clothesColor": ["8a6a3c","6d5031","a88b60","5a4227"],
  "hatColor": ["6d5031","8a6a3c"],
  "accessoriesColor": ["4a3018","7d6038"],
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"],
  "topVariant": ["bigHair","bob","bun","curly","curvy","dreads","dreads01","dreads02","frizzle","fro","hat","hijab","longButNotTooLong","miaWallace","shaggy","shaggyMullet","shavedSides","shortCurly","shortFlat","shortRound","shortWaved","sides","straight01","straight02","straightAndStrand","theCaesar","theCaesarAndSidePart","turban","winterHat02","winterHat03","winterHat04","winterHat1"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The style separates its layers by shape rather than by color, so a grey set stays readable. Same exclusions as Sepia.

```json
{
  "backgroundColor": ["ececee"],
  "skinColor": ["e4e4e7","c1c1c7","a1a1aa","76767e","d4d4d8"],
  "hairColor": ["18181b","3f3f46","52525b","71717a","a1a1aa"],
  "facialHairColor": ["18181b","3f3f46","52525b"],
  "clothesColor": ["3f3f46","52525b","71717a","27272a"],
  "hatColor": ["27272a","52525b"],
  "accessoriesColor": ["18181b","71717a"],
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"],
  "topVariant": ["bigHair","bob","bun","curly","curvy","dreads","dreads01","dreads02","frizzle","fro","hat","hijab","longButNotTooLong","miaWallace","shaggy","shaggyMullet","shavedSides","shortCurly","shortFlat","shortRound","shortWaved","sides","straight01","straight02","straightAndStrand","theCaesar","theCaesarAndSidePart","turban","winterHat02","winterHat03","winterHat04","winterHat1"]
}
```

## Duotone

Pale skin, mid shirt, dark hair, all the same hue. Every avatar in a set shares them, so only the haircut and the expression separate two of them.

```json
{
  "backgroundColor": ["e6ecef"],
  "skinColor": ["9ec9e8"],
  "hairColor": ["1d3d52"],
  "facialHairColor": ["1d3d52"],
  "clothesColor": ["37718e"],
  "hatColor": ["1d3d52"],
  "accessoriesColor": ["1d3d52"],
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"],
  "topVariant": ["bigHair","bob","bun","curly","curvy","dreads","dreads01","dreads02","frizzle","fro","hat","hijab","longButNotTooLong","miaWallace","shaggy","shaggyMullet","shavedSides","shortCurly","shortFlat","shortRound","shortWaved","sides","straight01","straight02","straightAndStrand","theCaesar","theCaesarAndSidePart","turban","winterHat02","winterHat03","winterHat04","winterHat1"]
}
```

## Muted

The style dresses everyone in fourteen colors, most of them fully saturated. These are the same garments in tones that hold still, which helps when a table shows thirty avatars. The printed expressions come out as well, the ones Sepia lists: a red tongue or a green mouth undoes a quiet palette on its own.

```json
{
  "eyesVariant": ["closed","default","eyeRoll","happy","side","squint","surprised","wink","winkWacky","xDizzy"],
  "mouthVariant": ["default","disbelief","eating","grimace","sad","serious","twinkle"],
  "topVariant": ["bigHair","bob","bun","curly","curvy","dreads","dreads01","dreads02","frizzle","fro","hat","hijab","longButNotTooLong","miaWallace","shaggy","shaggyMullet","shavedSides","shortCurly","shortFlat","shortRound","shortWaved","sides","straight01","straight02","straightAndStrand","theCaesar","theCaesarAndSidePart","turban","winterHat02","winterHat03","winterHat04","winterHat1"],
  "clothesColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58","8a7f6d"]
}
```

## Electric

The same group the other way. Only the clothes move, because loud clothes under loud hair cancel each other out.

```json
{
  "clothesColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

The style ships no background at all. Six pale colors give each avatar a tile without competing with the clothes.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The style requires clothes, hair and skin to differ from the background, so it picks its way around whatever you put behind it rather than clashing with it.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The clothes palette moves to light tones, since the charcoal and navy shirts the style ships disappear into a dark tile.

```json
{
  "backgroundColor": ["16161a"],
  "clothesColor": ["e6e6e6","b1e2ff","a7ffc4","ffffb1","ffafb9"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. Both stops stay light, so the hair keeps its edge against them.

```json
{
  "backgroundColor": ["ffd5a8","ff9db4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

Both optional components turned all the way up. The style ships seven pairs of glasses and five beards that nine seeds in ten never reach.

```json
{
  "accessoriesProbability": 100,
  "facialHairProbability": 100
}
```

---

Source: https://www.dicebear.com/styles/big-ears-neutral/

# Big Ears Neutral

Big Ears Neutral is a reduced variant of the Big Ears style, showing only the
eyes and mouth on a solid colored square, with no head outline, hair, or ears.

- **Style name:** `big-ears-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** The Visual Team (https://thevisual.team/)
- **Source:** https://www.figma.com/community/file/986078800058673824
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/big-ears-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/big-ears-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/big-ears-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("big-ears-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features big-ears-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BIG_EARS_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.BigEarsNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/big_ears_neutral.dart';

final style = Style.parse(bigEarsNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.BigEarsNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear big-ears-neutral
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No freckles, no birthmark.
- **Sepia:** One warm ramp across the face.
- **Greyscale:** No hue on the face at all.
- **Duotone:** A single pale blue for the whole set.
- **Muted:** Chalky faces instead of skin tones.
- **Electric:** Six faces past the end of the scale.
- **Cool:** Blues, teals and violets only.
- **Warm:** Reds, oranges and golds only.

The full option set of each one is at https://www.dicebear.com/styles/big-ears-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `detailsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06` |
| `detailsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30`, `variant31`, `variant32` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant0101`, `variant0102`, `variant0103`, `variant0104`, `variant0105`, `variant0201`, `variant0202`, `variant0203`, `variant0204`, `variant0205`, `variant0301`, `variant0302`, `variant0303`, `variant0304`, `variant0305`, `variant0401`, `variant0402`, `variant0403`, `variant0404`, `variant0405`, `variant0501`, `variant0502`, `variant0503`, `variant0504`, `variant0505`, `variant0601`, `variant0602`, `variant0603`, `variant0604`, `variant0605`, `variant0701`, `variant0702`, `variant0703`, `variant0704`, `variant0705`, `variant0706`, `variant0707`, `variant0708` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12` |
| `noseProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/big-ears-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/big-ears-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/big-ears-neutral/presets/

# Big Ears Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The details component appears on one avatar in ten. Off, every avatar is built the same way. Worth knowing for the rest of these: what this style calls the background is the face, so `backgroundColor` sets the complexion and the tile at once.

```json
{
  "detailsProbability": 0
}
```

## Sepia

The style prints a pink lip on twenty-four of its thirty-eight mouths, plus a few colored eyes, and no option reaches them. This keeps the fourteen mouths and twenty-eight eyes drawn in line alone.

```json
{
  "backgroundColor": ["e3c39c","cba87e","ad8659","8a6a43"],
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The features are drawn as dark lines, so they keep their contrast on every step of the ramp. Same exclusions as Sepia.

```json
{
  "backgroundColor": ["dcdce0","bfbfc6","9c9ca4","76767e"],
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0
}
```

## Duotone

A single color for the whole set, so nothing but the eyes, nose and mouth separates two avatars. It commits everyone to one complexion, which is the point here and would be a problem anywhere else.

```json
{
  "backgroundColor": ["9ec9e8"],
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0
}
```

## Muted

Six tones that do not read as complexions at all, which suits avatars standing in for accounts or teams rather than people. The printed lips and the colored eyes come out too, the ones Sepia lists.

```json
{
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0,
  "backgroundColor": ["a5a58d","8e9aaf","9c8a94","8fa38f","b0a58c","94a3ad"]
}
```

## Electric

The same group past the end of its scale. The features are heavy black lines, so they stay legible on any of these.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Cool

Half the color wheel, and the counterpart to Warm. Two groups of accounts can be told apart by temperature without a second badge. The printed lips come out with them, since their pink pulls warm against every color here.

```json
{
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0,
  "backgroundColor": ["7dd3fc","5eead4","a5b4fc","c4b5fd","67e8f9"]
}
```

## Warm

The other half of the same wheel. The style's own five tones already sit here, so this widens the range rather than moving it.

```json
{
  "backgroundColor": ["fdba74","fcd34d","fca5a5","fb923c","f9a8d4"]
}
```

---

Source: https://www.dicebear.com/styles/big-ears/

# Big Ears

Big Ears is a playful vector avatar style of cartoon heads with oversized round
ears, varied hairstyles, and simple expressive faces. Generate cheerful profile
icons for community apps, kids' platforms, and casual social products.

- **Style name:** `big-ears`
- **Category:** Characters
- **Animated:** no
- **Creator:** The Visual Team (https://thevisual.team/)
- **Source:** https://www.figma.com/community/file/986078800058673824
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/big-ears/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/big-ears.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/big-ears.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("big-ears.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features big-ears
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BIG_EARS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.BigEars))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/big_ears.dart';

final style = Style.parse(bigEars);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.BigEars);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear big-ears
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No freckles, no birthmark.
- **Sepia:** One warm ramp, skin and hair.
- **Greyscale:** No hue on skin or hair.
- **Duotone:** Pale blue face, deep blue hair.
- **Muted:** Dusty hair, skin untouched.
- **Electric:** Hair past anything the style ships.
- **Pastel Wall:** A soft ground behind the head.
- **Bold Pop:** Six saturated grounds behind the ears.
- **Night Shift:** Near-black ground, hair unchanged.
- **Sunrise:** A warm gradient behind the ears.
- **Full Cast:** Freckles and birthmarks on everyone.
- **Close Up:** The head scaled up in the frame.

The full option set of each one is at https://www.dicebear.com/styles/big-ears/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `detailsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06` |
| `detailsProbability` | number | 0 to 100 |
| `earsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08` |
| `earsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30`, `variant31`, `variant32` |
| `eyesProbability` | number | 0 to 100 |
| `frontHairVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12` |
| `frontHairProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `long01`, `long02`, `long03`, `long04`, `long05`, `long06`, `long07`, `long08`, `long09`, `long10`, `long11`, `long12`, `long13`, `long14`, `long15`, `long16`, `long17`, `long18`, `long19`, `long20`, `short01`, `short02`, `short03`, `short04`, `short05`, `short06`, `short07`, `short08`, `short09`, `short10`, `short11`, `short12`, `short13`, `short14`, `short15`, `short16`, `short17`, `short18`, `short19`, `short20` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant0101`, `variant0102`, `variant0103`, `variant0104`, `variant0105`, `variant0201`, `variant0202`, `variant0203`, `variant0204`, `variant0205`, `variant0301`, `variant0302`, `variant0303`, `variant0304`, `variant0305`, `variant0401`, `variant0402`, `variant0403`, `variant0404`, `variant0405`, `variant0501`, `variant0502`, `variant0503`, `variant0504`, `variant0505`, `variant0601`, `variant0602`, `variant0603`, `variant0604`, `variant0605`, `variant0701`, `variant0702`, `variant0703`, `variant0704`, `variant0705`, `variant0706`, `variant0707`, `variant0708` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12` |
| `noseProbability` | number | 0 to 100 |
| `sideburnsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07` |
| `sideburnsProbability` | number | 0 to 100 |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/big-ears/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/big-ears/definition.json`.

---

Source: https://www.dicebear.com/styles/big-ears/presets/

# Big Ears presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The details component appears on one avatar in ten. Off, every avatar in a set is built from the same seven parts, which reads more evenly down a list.

```json
{
  "detailsProbability": 0
}
```

## Sepia

The style prints a pink lip on twenty-four of its thirty-eight mouths, plus a few colored eyes, and no option reaches any of them. This keeps the fourteen mouths and twenty-eight eyes that are drawn in line alone.

```json
{
  "backgroundColor": ["ede2ce"],
  "skinColor": ["d9bd94","c4a377","a8865a","8a6a43","e3cdb0"],
  "hairColor": ["3a2916","4a3018","5c4223","7d6038","a08256"],
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The ears and the linework carry the drawing once the color is gone. Same exclusions as Sepia.

```json
{
  "backgroundColor": ["ececee"],
  "skinColor": ["e4e4e7","c1c1c7","a1a1aa","76767e","d4d4d8"],
  "hairColor": ["18181b","3f3f46","52525b","71717a","a1a1aa"],
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0
}
```

## Duotone

Two steps of one hue for a whole set, so only the haircut, the ears and the expression separate two avatars.

```json
{
  "backgroundColor": ["e6ecef"],
  "skinColor": ["9ec9e8"],
  "hairColor": ["1d3d52"],
  "eyesVariant": ["variant01","variant02","variant03","variant04","variant05","variant08","variant09","variant11","variant12","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23","variant24","variant25","variant26","variant27","variant28","variant29","variant30","variant31","variant32"],
  "mouthVariant": ["variant0104","variant0204","variant0304","variant0404","variant0504","variant0604","variant0701","variant0702","variant0703","variant0704","variant0705","variant0706","variant0707","variant0708"],
  "detailsProbability": 0
}
```

## Muted

The style ships pink, red and bleached white among its hair colors. These are tones that hold still, for a page where many avatars appear together.

```json
{
  "hairColor": ["4a4238","6b5a48","8a7a64","a3937c","5f6357","7b6a58"]
}
```

## Electric

The same group the other way. The style draws hair as a large flat mass, which makes it the right place to put the one loud color.

```json
{
  "hairColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

The style ships no background at all, so an avatar sits on whatever is behind it. Six pale colors give it a tile of its own.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The heads are pale and the hair is dark, so the drawing keeps its edge on a saturated ground.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The skin palette is light enough on its own that nothing else has to move.

```json
{
  "backgroundColor": ["16161a"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. Both stops stay light so the dark hair keeps its contrast.

```json
{
  "backgroundColor": ["ffd5a8","ff9db4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

The details component turned all the way up. The style ships six of them that nine seeds in ten never reach.

```json
{
  "detailsProbability": 100
}
```

## Close Up

The style leaves a wide margin, which costs size at 24 or 32 pixels. This stops short of the tallest hairstyles, so nothing spiky gets cut.

```json
{
  "scale": 1.15
}
```

---

Source: https://www.dicebear.com/styles/big-smile/

# Big Smile

Big Smile is an illustrated vector avatar style with rounded cartoon faces, full
hairstyles, and oversized toothy smiles. Generate cheerful SVG profile icons
that stand out in user feeds and comment sections.

- **Style name:** `big-smile`
- **Category:** Characters
- **Animated:** no
- **Creator:** Ashley Seo (http://www.ashleyseo.com/)
- **Source:** https://www.figma.com/community/file/881358461963645496
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/big-smile/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/big-smile.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/big-smile.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("big-smile.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features big-smile
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BIG_SMILE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.BigSmile))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/big_smile.dart';

final style = Style.parse(bigSmile);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.BigSmile);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear big-smile
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no accessories.
- **Terracotta:** A warm red-brown set built around the fixed features.
- **Muted:** Dusty hair, skin left to the seed.
- **Electric:** Hair at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, everything else untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind, everything else untouched.
- **Night Shift:** Near black behind, light hair in front.
- **Full Cast:** Every face gets an accessory.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/big-smile/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `accessoriesVariant` | enum (array allowed) | `catEars`, `clownNose`, `faceMask`, `glasses`, `mustache`, `sailormoonCrown`, `sleepMask`, `sunglasses` |
| `accessoriesProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `angry`, `cheery`, `confused`, `normal`, `sad`, `sleepy`, `starstruck`, `winking` |
| `eyesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `bangs`, `bowlCutHair`, `braids`, `bunHair`, `curlyBob`, `curlyShortHair`, `froBun`, `halfShavedHead`, `mohawk`, `shavedHead`, `shortHair`, `straightHair`, `wavyBob` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `base` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `awkwardSmile`, `braces`, `gapSmile`, `kawaii`, `openSad`, `openedSmile`, `teethSmile`, `unimpressed` |
| `mouthProbability` | number | 0 to 100 |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/big-smile/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/big-smile/definition.json`.

---

Source: https://www.dicebear.com/styles/big-smile/presets/

# Big Smile presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, so the face sits on whatever your page is, and the accessory component switched off.

```json
{
  "backgroundColor": [],
  "accessoriesProbability": 0
}
```

## Terracotta

Not quite a sepia. Big Smile paints its eyes a fixed brown and the inside of most mouths a fixed red, neither reachable by any option. Leaning the whole palette warm and red takes both in rather than leaving them as the two loud spots on an otherwise brown face. Accessories switch off, since most of them carry their own colors.

```json
{
  "backgroundColor": ["e7cdbd"],
  "skinColor": ["dcae95","c08e77","9c6b58","7d5344"],
  "hairColor": ["6b3529","8a4433","4a231c","a35b42"],
  "accessoriesProbability": 0
}
```

## Muted

The style ships four naturals and four brights for hair. This replaces all eight with dusty tones that sit closer together, so a page of these reads as one set.

```json
{
  "backgroundColor": ["ece7de"],
  "hairColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six hair colors past anything the style ships, on a dark background so they read as lit. Skin still comes from the seed.

```json
{
  "backgroundColor": ["101216"],
  "hairColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. Strong enough that the avatar holds its own against a busy page, and the only preset here that will fight with a colorful interface rather than sit inside it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Night Shift

For dark interfaces. The hair pool drops to the pale end so the silhouette does not disappear into the background.

```json
{
  "backgroundColor": ["16161c"],
  "hairColor": ["e2ba87","e9b729","d56c0c","238d80"]
}
```

## Full Cast

The accessory component sits at fifty percent, so half the avatars come out plain. This puts one on all of them, which suits a demo better than a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "accessoriesProbability": 100
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends a lot of it on empty space, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/blobs/

# Blobs

Blobs is an abstract vector avatar style that stacks soft organic shapes in
progressively lighter shades of a single hue. Generate smooth SVG profile icons
that work as avatar placeholders or decorative user identifiers.

- **Style name:** `blobs`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/blobs/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/blobs.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/blobs.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("blobs.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features blobs
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BLOBS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Blobs))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/blobs.dart';

final style = Style.parse(blobs);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Blobs);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear blobs
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the blob.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the blob.
- **Stencil:** One background for everyone, only the shape varies.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/blobs/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `bodyVariant` | enum (array allowed) | `duo`, `quartet`, `trio` |
| `bodyProbability` | number | 0 to 100 |
| `blobVariant` | enum (array allowed) | `drift`, `drop`, `dune`, `melt`, `pond`, `pool` |
| `blobProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `blobColor` | color (array allowed) | Hex color, `#` optional |
| `blobColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `blobColorFillStops` | range |  |
| `blobColorAngle` | range | -360 to 360 |
| `blobColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/blobs/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/blobs/definition.json`.

---

Source: https://www.dicebear.com/styles/blobs/presets/

# Blobs presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the blob changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion, and a static avatar next to an animated one stays static.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/bottts-neutral/

# Bottts Neutral

Bottts Neutral is a reduced variant of the Bottts style, showing only the robot
eyes and mouth on a solid colored square, with no head, antennas, or side units.

- **Style name:** `bottts-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** Pablo Stanley (https://twitter.com/pablostanley)
- **Source:** https://bottts.com/
- **License:** Free for personal and commercial use (https://bottts.com/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/bottts-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/bottts-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/bottts-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("bottts-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features bottts-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BOTTTS_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.BotttsNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/bottts_neutral.dart';

final style = Style.parse(botttsNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.BotttsNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear bottts-neutral
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No surface texture, flat shell.
- **Sepia:** A brass robot on tanned metal.
- **Greyscale:** Bare metal, four steps of grey.
- **Duotone:** One indigo for the whole face.
- **Muted:** An earthy shell instead of the bright one.
- **Electric:** Acid shells at full saturation.
- **Pastel Wall:** Five soft shells.
- **Bold Pop:** Five saturated shells.
- **Sunrise:** A warm gradient across the face plate.
- **Full Cast:** Every robot gets the surface texture.
- **Close Up:** Scaled in on the face plate.

The full option set of each one is at https://www.dicebear.com/styles/bottts-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `bulging`, `dizzy`, `eva`, `frame1`, `frame2`, `glow`, `happy`, `hearts`, `robocop`, `round`, `roundFrame01`, `roundFrame02`, `sensor`, `shade01` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `bite`, `diagram`, `grill01`, `grill02`, `grill03`, `smile01`, `smile02`, `square01`, `square02` |
| `mouthProbability` | number | 0 to 100 |
| `textureVariant` | enum (array allowed) | `camo01`, `camo02`, `circuits`, `dirty01`, `dirty02`, `dots`, `grunge01`, `grunge02` |
| `textureProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/bottts-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/bottts-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/bottts-neutral/presets/

# Bottts Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: the texture overlay switched off for a flat, clean face plate.

```json
{
  "textureProbability": 0
}
```

## Sepia

The whole robot is drawn on the background here, so one palette change carries the picture. Seven eye sets and one mouth carry a color painted into the artwork rather than exposed as a group, so those variants drop out.

```json
{
  "backgroundColor": ["8a6a3f","a3814f","6f5433","b59463"],
  "eyesVariant": ["dizzy","glow","happy","robocop","round","roundFrame01","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"]
}
```

## Greyscale

Grey suits the subject better than most styles: a robot in steel is not a compromise. Seven eye sets and one mouth carry a color painted into the artwork rather than exposed as a group, so those variants drop out.

```json
{
  "backgroundColor": ["4a4d52","6b6f75","8d9197","b2b6bc"],
  "eyesVariant": ["dizzy","glow","happy","robocop","round","roundFrame01","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"]
}
```

## Duotone

A single hue, which is the most restrained this style gets and the easiest to place next to an existing brand color. Seven eye sets and one mouth carry a color painted into the artwork rather than exposed as a group, so those variants drop out.

```json
{
  "backgroundColor": ["3d4272"],
  "eyesVariant": ["dizzy","glow","happy","robocop","round","roundFrame01","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"]
}
```

## Muted

The style ships 22 saturated colors. Six earthy ones turn the robots from toys into equipment. Seven eye sets and one mouth carry a color painted into the artwork rather than exposed as a group, so those variants drop out.

```json
{
  "backgroundColor": ["8a8f7a","a89078","7d8a94","9a8b9e","6f7f76","b0a08a"],
  "eyesVariant": ["dizzy","glow","happy","robocop","round","roundFrame01","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"]
}
```

## Electric

The other direction: six colors past anything the style ships. The LEDs and hearts stay, because loud is the point here.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

The texture overlay sits at fifty percent, so half the robots come out flat. This puts it on all of them, which makes a set read as one production run.

```json
{
  "textureProbability": 100
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, cropping in buys back the eyes and mouth.

```json
{
  "scale": 1.25
}
```

---

Source: https://www.dicebear.com/styles/bottts/

# Bottts

Bottts is a robot-themed vector avatar style with modular bot heads built from
swappable faces, mouths, antennas, side units, and textures. Generate fun,
technical profile icons for developer tools, AI apps, and API services.

- **Style name:** `bottts`
- **Category:** Characters
- **Animated:** no
- **Creator:** Pablo Stanley (https://twitter.com/pablostanley)
- **Source:** https://bottts.com/
- **License:** Free for personal and commercial use (https://bottts.com/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/bottts/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/bottts.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/bottts.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("bottts.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features bottts
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::BOTTTS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Bottts))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/bottts.dart';

final style = Style.parse(bottts);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Bottts);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear bottts
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no surface texture.
- **Sepia:** A brass robot on tanned paper.
- **Greyscale:** Bare metal, four steps of grey.
- **Duotone:** One indigo shell on a pale indigo wall.
- **Muted:** An earthy shell instead of the bright one.
- **Electric:** Acid shells on near black.
- **Pastel Wall:** Five soft backgrounds, the shell untouched.
- **Bold Pop:** Saturated backgrounds behind a saturated shell.
- **Night Shift:** Near black behind, a glowing shell in front.
- **Sunrise:** A warm gradient behind, the shell untouched.
- **Full Cast:** Every robot gets the surface texture.
- **Close Up:** Scaled in on the face plate, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/bottts/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `bulging`, `dizzy`, `eva`, `frame1`, `frame2`, `glow`, `happy`, `hearts`, `robocop`, `round`, `roundFrame01`, `roundFrame02`, `sensor`, `shade01` |
| `eyesProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `round01`, `round02`, `square01`, `square02`, `square03`, `square04` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `bite`, `diagram`, `grill01`, `grill02`, `grill03`, `smile01`, `smile02`, `square01`, `square02` |
| `mouthProbability` | number | 0 to 100 |
| `sidesVariant` | enum (array allowed) | `antenna01`, `antenna02`, `cables01`, `cables02`, `round`, `square`, `squareAssymetric` |
| `sidesProbability` | number | 0 to 100 |
| `textureVariant` | enum (array allowed) | `camo01`, `camo02`, `circuits`, `dirty01`, `dirty02`, `dots`, `grunge01`, `grunge02` |
| `textureProbability` | number | 0 to 100 |
| `topVariant` | enum (array allowed) | `antenna`, `antennaCrooked`, `bulb01`, `glowingBulb01`, `glowingBulb02`, `horns`, `lights`, `pyramid`, `radar` |
| `topProbability` | number | 0 to 100 |
| `baseColor` | color (array allowed) | Hex color, `#` optional |
| `baseColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `baseColorFillStops` | range |  |
| `baseColorAngle` | range | -360 to 360 |
| `baseColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/bottts/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/bottts/definition.json`.

---

Source: https://www.dicebear.com/styles/bottts/presets/

# Bottts presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, so the robot sits on whatever your page is, and the texture overlay switched off for a flat, clean shell.

```json
{
  "backgroundColor": [],
  "textureProbability": 0
}
```

## Sepia

Bottts has one color group for the whole shell, so a warm palette turns the machine into brass. The texture stays on, which reads as patina here. Five eye sets, one mouth and three antennas carry a color painted into the artwork rather than exposed as a group, so those variants drop out. A single blue LED undoes the whole treatment.

```json
{
  "backgroundColor": ["dfc9a3"],
  "baseColor": ["8a6a3f","a3814f","6f5433","b59463"],
  "eyesVariant": ["bulging","dizzy","glow","happy","robocop","round","roundFrame01","roundFrame02","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"],
  "topVariant": ["bulb01","glowingBulb01","glowingBulb02","horns","lights","pyramid","radar"],
  "sidesVariant": ["antenna02","cables01","cables02","round","square","squareAssymetric"]
}
```

## Greyscale

The shell drops to grey, which suits the subject better than most styles: a robot in steel is not a compromise. Useful anywhere color would carry meaning it should not. Five eye sets, one mouth and three antennas carry a color painted into the artwork rather than exposed as a group, so those variants drop out. A single blue LED undoes the whole treatment.

```json
{
  "backgroundColor": ["ececed"],
  "baseColor": ["4a4d52","6b6f75","8d9197","b2b6bc"],
  "eyesVariant": ["bulging","dizzy","glow","happy","robocop","round","roundFrame01","roundFrame02","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"],
  "topVariant": ["bulb01","glowingBulb01","glowingBulb02","horns","lights","pyramid","radar"],
  "sidesVariant": ["antenna02","cables01","cables02","round","square","squareAssymetric"]
}
```

## Duotone

Background and shell take the same hue at two lightnesses. The most restrained this style gets, and the easiest to place next to an existing brand color. Five eye sets, one mouth and three antennas carry a color painted into the artwork rather than exposed as a group, so those variants drop out. A single blue LED undoes the whole treatment.

```json
{
  "backgroundColor": ["dfe3f5"],
  "baseColor": ["3d4272"],
  "eyesVariant": ["bulging","dizzy","glow","happy","robocop","round","roundFrame01","roundFrame02","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"],
  "topVariant": ["bulb01","glowingBulb01","glowingBulb02","horns","lights","pyramid","radar"],
  "sidesVariant": ["antenna02","cables01","cables02","round","square","squareAssymetric"]
}
```

## Muted

The style ships 22 saturated shell colors. This swaps them for six earthy ones, which turns the robots from toys into equipment. Works well in dense tables where 22 bright hues would fight each other. The variants whose LEDs and hearts are painted in a fixed color drop out too, since a red heart on a dusty shell is exactly what this preset is trying to avoid.

```json
{
  "backgroundColor": ["ece7de"],
  "baseColor": ["8a8f7a","a89078","7d8a94","9a8b9e","6f7f76","b0a08a"],
  "eyesVariant": ["bulging","dizzy","glow","happy","robocop","round","roundFrame01","roundFrame02","sensor"],
  "mouthVariant": ["bite","grill01","grill02","grill03","smile01","smile02","square01","square02"],
  "topVariant": ["bulb01","glowingBulb01","glowingBulb02","horns","lights","pyramid","radar"],
  "sidesVariant": ["antenna02","cables01","cables02","round","square","squareAssymetric"]
}
```

## Electric

The other direction: six colors pushed past anything in the style's own palette, on a dark background so they read as lit rather than painted.

```json
{
  "backgroundColor": ["101216"],
  "baseColor": ["00ff9d","ff007a","ffe600","00c8ff","b400ff","ff5e00"]
}
```

## Pastel Wall

Changes nothing about the robots, only what they stand in front of. The shell keeps all 22 of its colors, so the set stays as varied as the plain style.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. The style already has a bright palette, and a strong background pushes it further rather than calming it down.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Night Shift

For dark interfaces. The shell pool drops to the bright end of the style's own palette so the robot does not disappear into the background.

```json
{
  "backgroundColor": ["14161a"],
  "baseColor": ["15a894","1499da","7681f5","ca62bb","7a9f12"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

The texture overlay sits at fifty percent, so half the robots come out flat. This puts it on all of them, which makes a set read as one production run rather than two.

```json
{
  "backgroundColor": ["f4f1ea"],
  "textureProbability": 100
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the antennas and side parts eat most of the frame, and cropping in buys the face back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/cameo/

# Cameo

Cameo draws a head with hair and a mouth and leaves the eyes out. Six head
shapes carry eight hairstyles and five mouths, all clipped to the outline, with
a bun or a tail on top of roughly half of them. Everything is painted in one
body color under a translucent black or white overlay, so a portrait holds a
single hue in two tones. Generate quiet, graphic profile pictures for editorial
sites and personal pages.

- **Style name:** `cameo`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/cameo/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/cameo.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/cameo.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("cameo.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features cameo
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CAMEO)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Cameo))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/cameo.dart';

final style = Style.parse(cameo);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Cameo);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear cameo
```

## Presets

13 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No bun and no ponytail.
- **Sepia:** One warm brown, ground included.
- **Greyscale:** The same portrait without hue.
- **Duotone:** One plum for everyone.
- **Muted:** Dusty tones instead of the candy palette.
- **Electric:** Bodies past anything the style ships.
- **Pastel Wall:** Pale ground behind the head.
- **Bold Pop:** Saturated ground behind the head.
- **Night Shift:** Near black ground, bodies unchanged.
- **Sunrise:** A warm gradient behind the head.
- **Etched:** The dark overlay every time.
- **Full Cast:** A bun or a ponytail on everyone.
- **Close Up:** Scaled in, so the head runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/cameo/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `shapeVariant` | enum (array allowed) | `jaw`, `oval`, `round`, `squircle`, `taper`, `wide` |
| `shapeProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `bangs`, `bowl`, `cap`, `curls`, `frame`, `part`, `side`, `wave` |
| `hairProbability` | number | 0 to 100 |
| `knotVariant` | enum (array allowed) | `bun`, `buns`, `tail` |
| `knotProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `beam`, `calm`, `grin`, `smile`, `smirk` |
| `mouthProbability` | number | 0 to 100 |
| `shadeColor` | color (array allowed) | Hex color, `#` optional |
| `shadeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shadeColorFillStops` | range |  |
| `shadeColorAngle` | range | -360 to 360 |
| `shadeColorOrder` | enum | `random`, `fixed` |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/cameo/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/cameo/definition.json`.

---

Source: https://www.dicebear.com/styles/cameo/presets/

# Cameo presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The knot is the only optional piece, and the only one that breaks the outline of the head. Without it every avatar is a closed shape, which is the quieter half of what the style can do.

```json
{
  "knotProbability": 0
}
```

## Sepia

Hair, face and mouth are all the same body color under a translucent overlay, so one hue redraws the whole portrait and the overlay supplies the second tone.

```json
{
  "backgroundColor": ["efe3d2"],
  "bodyColor": ["8a6244","a2795a","6f4c33","b98f6c"]
}
```

## Greyscale

Flat shapes separated by one translucent overlay, which is the kind of drawing that survives losing color. Useful for a print stylesheet or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["ececee"],
  "bodyColor": ["8a8a90","6c6c72","a4a4aa","58585e"]
}
```

## Duotone

A single body color across a whole set, so nothing but the head shape, the hair and the mouth separates two avatars. The overlay still splits each of them into a light and a dark half.

```json
{
  "backgroundColor": ["f0e7f2"],
  "bodyColor": ["9b5f86"]
}
```

## Muted

The style ships twelve bodies at full saturation. These are the same portraits in tones that hold still, which suits a list where a dozen appear at once.

```json
{
  "backgroundColor": ["e8e4dc"],
  "bodyColor": ["a5a58d","b98b73","8e9aaf","9c8a94","8fa38f","b0a58c"]
}
```

## Electric

The same lever the other way. The ground stays near black so the head is the only lit thing on the tile.

```json
{
  "backgroundColor": ["0f0f12"],
  "bodyColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Cameo ships no background of its own and renders transparent. A pale ground gives the portrait an edge to sit against without touching the artwork.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Louder than Pastel Wall and pushed toward the primaries, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Night Shift

For dark interfaces. The shipped bodies are bright enough that nothing else has to move for the portrait to stay visible.

```json
{
  "backgroundColor": ["16161a"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Etched

The style keeps one overlay slot and fills it with a translucent black or a translucent white, so a seed decides whether the hair sits darker or lighter than the face. Pinning it to black makes the hair read as hair in every avatar.

```json
{
  "shadeColor": ["00000057"]
}
```

## Full Cast

The knot is on for roughly half of the seeds by default. Turned all the way up it becomes the piece that carries most of the variation, since it is the only one drawn outside the head.

```json
{
  "knotProbability": 100
}
```

## Close Up

Uses scale rather than color. Cropping in turns the portrait from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.3
}
```

---

Source: https://www.dicebear.com/styles/clay/

# Clay

Clay is a soft vector avatar style of rounded lumps that look pinched from
modeling clay, with simple faces, small horns or curls on top, and pressed-in
surface marks. Generate warm SVG profile icons for chat apps and community
profiles.

- **Style name:** `clay`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/clay/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/clay.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/clay.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("clay.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features clay
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CLAY)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Clay))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/clay.dart';

final style = Style.parse(clay);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Clay);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear clay
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No head piece, no surface pattern.
- **Sepia:** One warm brown ramp, background included.
- **Greyscale:** No hue on body, accent or ground.
- **Duotone:** One blue body on one pale ground.
- **Cool:** Blues, greens and violets only.
- **Warm:** Rust, ochre and rose only.
- **Electric:** Neon bodies, quiet ground.
- **Bold Pop:** Saturated ground behind an earthy body.
- **Night Shift:** Dark room, unchanged bodies.
- **Sunrise:** A warm gradient behind the body.
- **Close Up:** The body scaled up, shadow cropped away.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/clay/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `topVariant` | enum (array allowed) | `antenna`, `crest`, `curl`, `ears`, `horns`, `hornsSmall`, `loop`, `nub`, `peak`, `pellet`, `spikes`, `swirl`, `tuft` |
| `topProbability` | number | 0 to 100 |
| `bodyVariant` | enum (array allowed) | `bell`, `blob`, `boulder`, `column`, `cube`, `dollop`, `egg`, `gumdrop`, `lean`, `loaf`, `pear`, `slug`, `squat`, `stack` |
| `bodyProbability` | number | 0 to 100 |
| `patternVariant` | enum (array allowed) | `buttons`, `checker`, `coil`, `freckles`, `patch`, `pellets`, `prints`, `spiral`, `stitches`, `zig` |
| `patternProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `big`, `dots`, `down`, `even`, `googly`, `happy`, `inward`, `mono`, `outward`, `pinprick`, `side`, `tiny`, `trio`, `up`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `cat`, `dot`, `frown`, `grin`, `laugh`, `line`, `o`, `open`, `openSmall`, `pout`, `smile`, `smileBig`, `smileTongue`, `smirk`, `teeth`, `tongue`, `toothy`, `uu`, `wavy`, `zigzag` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |
| `accentColor` | color (array allowed) | Hex color, `#` optional |
| `accentColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `accentColorFillStops` | range |  |
| `accentColorAngle` | range | -360 to 360 |
| `accentColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/clay/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/clay/definition.json`.

---

Source: https://www.dicebear.com/styles/clay/presets/

# Clay presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Two optional components off at once. What is left is the body shape and the face, and the fourteen body shapes carry a set on their own.

```json
{
  "topProbability": 0,
  "patternProbability": 0
}
```

## Sepia

The style's own palette is already earthy, so this is a short trip. Four mouth variants show a tongue painted into the artwork rather than taking a color option, and they are excluded here.

```json
{
  "backgroundColor": ["ede0c9"],
  "bodyColor": ["b39572","9c7d5c","c7ab8a","8a6a4d"],
  "accentColor": ["7a5c3f","a8895f"],
  "inkColor": ["3b2f21"],
  "mouthVariant": ["teeth","smile","o","frown","line","wavy","toothy","pout","grin","smirk","zigzag","dot","cat","smileBig","uu","openSmall"]
}
```

## Greyscale

The style models its bodies with a soft shadow underneath, and that shadow is what keeps them from looking flat once the color is gone. Same mouth exclusion as Sepia.

```json
{
  "backgroundColor": ["ececee"],
  "bodyColor": ["c1c1c7","a1a1aa","d4d4d8","8a8a92"],
  "accentColor": ["71717a","9c9ca4"],
  "inkColor": ["27272a"],
  "mouthVariant": ["teeth","smile","o","frown","line","wavy","toothy","pout","grin","smirk","zigzag","dot","cat","smileBig","uu","openSmall"]
}
```

## Duotone

A single body color for a whole set. The style has twenty mouths and fifteen eye arrangements, so the faces still differ plenty without any help from color.

```json
{
  "backgroundColor": ["e2ecf4"],
  "bodyColor": ["6f8fb0"],
  "accentColor": ["44607a"],
  "inkColor": ["23323f"],
  "mouthVariant": ["teeth","smile","o","frown","line","wavy","toothy","pout","grin","smirk","zigzag","dot","cat","smileBig","uu","openSmall"]
}
```

## Cool

The shipped palette runs the full wheel from rust to lilac. Half of it, and the counterpart to Warm, so two groups can be told apart by temperature alone. The tongue mouths are excluded: their terracotta is painted into the artwork, and it pulls warm against a cool body.

```json
{
  "mouthVariant": ["teeth","smile","o","frown","line","wavy","toothy","pout","grin","smirk","zigzag","dot","cat","smileBig","uu","openSmall"],
  "bodyColor": ["83b0a4","86a5c3","9793bd","8ba06b","6f9fb8"],
  "accentColor": ["5d8b80","63819e","70689c","6b7d4f"]
}
```

## Warm

The other half of the same wheel. Clay is a warm material to begin with, so this is the version of the style closest to its own name.

```json
{
  "bodyColor": ["c4795c","d99277","e0bd6a","cf9f52","cd8ea6"],
  "accentColor": ["9c5940","b0714f","b3903f","a86b7f"]
}
```

## Electric

The style ships nothing this loud. Only the body moves, because a neon body on a neon ground would flatten the shadow that gives it its shape.

```json
{
  "backgroundColor": ["f4f4f5"],
  "bodyColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Bold Pop

Every background the style ships is a pale wash. A loud one pushes the muted bodies forward instead of competing with them.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The bodies are mid-toned already, so they hold their edge against a near-black tile without moving the palette.

```json
{
  "backgroundColor": ["18181b"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd5a8","ffb0c4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Close Up

The style leaves room under the body for its shadow, which costs size at 24 or 32 pixels. This crops in far enough that the face carries and keeps whatever sits on the head.

```json
{
  "scale": 1.2
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/constellation/

# Constellation

Constellation is a night-sky vector avatar style that connects a few bright
stars into a unique star map, complete with scattered background stars and an
occasional comet. Generate quiet, distinctive SVG profile icons for dark
interfaces and creative projects.

- **Style name:** `constellation`
- **Category:** Scenes
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/constellation/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/constellation.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/constellation.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("constellation.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features constellation
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CONSTELLATION)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Constellation))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/constellation.dart';

final style = Style.parse(constellation);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Constellation);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear constellation
```

## Presets

7 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Deep Space:** Near black, stars in cold white.
- **Warm Night:** A brown-violet sky and amber stars.
- **Blueprint:** Pale lines on a flat blue.
- **Greyscale:** A grey sky and white stars.
- **Daylight:** A pale sky with dark stars.
- **Electric:** Neon stars on black.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/constellation/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `cometVariant` | enum (array allowed) | `long`, `short` |
| `cometProbability` | number | 0 to 100 |
| `constellationVariant` | enum (array allowed) | `andromeda`, `aquila`, `auriga`, `bear`, `bigDipper`, `bootes`, `camelopardalis`, `cassiopeia`, `cepheus`, `coronaBorealis`, `corvus`, `delphinus`, `dice`, `grus`, `lacerta`, `lynx`, `lyra`, `orion`, `ursaMinor` |
| `constellationProbability` | number | 0 to 100 |
| `starVariant` | enum (array allowed) | `faint`, `medium`, `small` |
| `starProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `constellationColor` | color (array allowed) | Hex color, `#` optional |
| `constellationColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `constellationColorFillStops` | range |  |
| `constellationColorAngle` | range | -360 to 360 |
| `constellationColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/constellation/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/constellation/definition.json`.

---

Source: https://www.dicebear.com/styles/constellation/presets/

# Constellation presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Deep Space

Darker and colder than the style's own skies, which pushes the constellation forward and drops everything else away.

```json
{
  "backgroundColor": ["07080d","0a0b12"],
  "constellationColor": ["eaf2ff","d8e6f5"]
}
```

## Warm Night

The other end of the same idea: a sky closer to city light than to deep space, with stars that read as amber rather than white.

```json
{
  "backgroundColor": ["2a1c2b","2e1f24"],
  "constellationColor": ["f2d9a8","e9c98c"]
}
```

## Blueprint

Trades the night for plan paper. The sky becomes one flat blue and the stars a single pale ink, which reads as a diagram of a constellation rather than a photograph of one.

```json
{
  "backgroundColor": ["12395c"],
  "constellationColor": ["dbe9f7"]
}
```

## Greyscale

Strips the color from a style that is mostly one color anyway. What is left is the geometry: points and the lines between them.

```json
{
  "backgroundColor": ["1c1c1f"],
  "constellationColor": ["f0f0f2"]
}
```

## Daylight

The one preset that abandons the night. Inverting sky and stars turns the constellation into a mark on paper, which suits a light interface where a black square would punch a hole.

```json
{
  "backgroundColor": ["eef2f7","e8eef5"],
  "constellationColor": ["2a3550"]
}
```

## Electric

Colors past anything the style ships, on the darkest sky, so the constellation reads as lit rather than lit up.

```json
{
  "backgroundColor": ["07080d"],
  "constellationColor": ["00e5ff","ff2e88","7cff00"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/critters/

# Critters

Critters is a cute vector avatar style with colorful creatures that combine
rounded bodies, big eyes, and expressive mouths with horns, ears, or antennae.
Generate playful SVG profile icons for communities and games.

- **Style name:** `critters`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/critters/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/critters.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/critters.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("critters.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features critters
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CRITTERS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Critters))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/critters.dart';

final style = Style.parse(critters);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Critters);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear critters
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No horns, no markings, no blush.
- **Sepia:** One warm brown ramp, ground included.
- **Greyscale:** No hue on body, markings or ground.
- **Duotone:** One mint critter on one deep green.
- **Muted:** A dusty menagerie.
- **Electric:** Bodies past anything the style ships.
- **Pastel Wall:** Pale ground behind the creature.
- **Bold Pop:** Saturated ground behind a pale creature.
- **Night Shift:** Near-black ground, bodies unchanged.
- **Sunrise:** A warm gradient behind the creature.
- **Full Cast:** Horns, markings and blush on everyone.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/critters/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `topVariant` | enum (array allowed) | `antenna`, `antennae`, `bobble`, `crown`, `earsDroop`, `earsPointy`, `earsRound`, `fin`, `horns`, `hornsIn`, `hornsSmall`, `nub`, `spike`, `spikes`, `sprout` |
| `topProbability` | number | 0 to 100 |
| `bodyVariant` | enum (array allowed) | `bell`, `blob`, `block`, `chimney`, `dome`, `lean`, `peak`, `round`, `squat`, `steps`, `tilt`, `tower`, `wedge`, `wedgeInv` |
| `bodyProbability` | number | 0 to 100 |
| `patternVariant` | enum (array allowed) | `bar`, `bars`, `belly`, `chevron`, `dotRow`, `dots`, `ring`, `speckles`, `spot`, `stripes` |
| `patternProbability` | number | 0 to 100 |
| `cheeksVariant` | enum (array allowed) | `blush`, `blushBig`, `freckles` |
| `cheeksProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `angry`, `bigPupils`, `close`, `closedLine`, `dots`, `four`, `happy`, `inward`, `mono`, `monoSleepy`, `round`, `sideeye`, `sleepy`, `squint`, `threeRow`, `trio`, `uneven`, `wide`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `blep`, `catMouth`, `dot`, `frown`, `grin`, `laugh`, `line`, `ooh`, `open`, `sad`, `slant`, `smile`, `smirk`, `teeth`, `tinySmile`, `tongue`, `tooth`, `wavy`, `zigzag` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |
| `accentColor` | color (array allowed) | Hex color, `#` optional |
| `accentColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `accentColorFillStops` | range |  |
| `accentColorAngle` | range | -360 to 360 |
| `accentColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/critters/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/critters/definition.json`.

---

Source: https://www.dicebear.com/styles/critters/presets/

# Critters presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Three optional components off at once. The body silhouette and the face are what is left, and the style ships nineteen mouths and nineteen eye arrangements to fill that.

```json
{
  "topProbability": 0,
  "patternProbability": 0,
  "cheeksProbability": 0
}
```

## Sepia

Four mouth variants are excluded here. They show a pink tongue painted straight into the artwork, where no color option reaches it.

```json
{
  "backgroundColor": ["43301c"],
  "bodyColor": ["d9bd94","c4a377","e3cdb0","b08d5f"],
  "accentColor": ["a8865a","8f6d43"],
  "inkColor": ["2b1d10"],
  "mouthVariant": ["smile","tinySmile","teeth","ooh","line","smirk","wavy","catMouth","zigzag","frown","sad","slant","dot","tooth"]
}
```

## Greyscale

Flat shapes with a hard shadow, which is the kind of drawing that survives losing color. Same mouth exclusion as Sepia.

```json
{
  "backgroundColor": ["3f3f46"],
  "bodyColor": ["e4e4e7","d4d4d8","c1c1c7","a1a1aa"],
  "accentColor": ["9c9ca4","b4b4bb"],
  "inkColor": ["18181b"],
  "mouthVariant": ["smile","tinySmile","teeth","ooh","line","smirk","wavy","catMouth","zigzag","frown","sad","slant","dot","tooth"]
}
```

## Duotone

A single body color across a whole set, so nothing but the silhouette and the face separates two of them. The markings stay a shade apart, because the style requires them to differ from the body.

```json
{
  "backgroundColor": ["0d3b2e"],
  "bodyColor": ["6ee7b9"],
  "accentColor": ["3fbf95"],
  "inkColor": ["07281e"],
  "mouthVariant": ["smile","tinySmile","teeth","ooh","line","smirk","wavy","catMouth","zigzag","frown","sad","slant","dot","tooth"]
}
```

## Muted

The style ships twelve bodies at candy brightness. These are the same creatures in tones that hold still, which suits a list where a dozen appear at once. The tongue mouths are excluded, the same ones the monochrome presets drop, because their pink is painted in rather than picked.

```json
{
  "mouthVariant": ["smile","tinySmile","teeth","ooh","line","smirk","wavy","catMouth","zigzag","frown","sad","slant","dot","tooth"],
  "backgroundColor": ["3a3a3f","41413a","3a4140","3f3a41"],
  "bodyColor": ["a5a58d","b98b73","8e9aaf","9c8a94","8fa38f","b0a58c"],
  "accentColor": ["8a8a72","9c7460","737f94","82707c"]
}
```

## Electric

The same lever the other way. The ground stays near-black so the creature is the only lit thing on the tile.

```json
{
  "backgroundColor": ["0f0f12"],
  "bodyColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Every background the style ships is dark and saturated. Pale ones turn the same creature from a spotlit specimen into a sticker.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

Louder than the shipped set and pushed toward the primaries. The bodies are pale, so they keep their edge on top of it.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The body palette is light already, so nothing else has to move for the creature to stay visible.

```json
{
  "backgroundColor": ["16161a"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ff9db4","ffd5a8"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

All three optional components turned up. The style ships fifteen head pieces and ten body markings, and at the default probabilities most seeds never reach them.

```json
{
  "topProbability": 100,
  "patternProbability": 100,
  "cheeksProbability": 100
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/croodles-neutral/

# Croodles Neutral

Croodles Neutral is a reduced variant of the Croodles style, drawing only the
eyes, nose, and mouth in loose black ink lines on a plain background, with no
head outline or hair.

- **Style name:** `croodles-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** vijay verma (https://vjy.me/)
- **Source:** https://www.figma.com/community/file/966199982810283152
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/croodles-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/croodles-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/croodles-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("croodles-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features croodles-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CROODLES_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.CroodlesNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/croodles_neutral.dart';

final style = Style.parse(croodlesNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.CroodlesNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear croodles-neutral
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** Black on white, nothing added.
- **Sepia:** Brown ink on tanned paper.
- **Greyscale:** Charcoal on light grey.
- **Duotone:** Deep teal on mint, two colors total.
- **Inverted:** White line on near black.
- **Muted:** Six dusty grounds under the same line.
- **Electric:** Black line on six acid grounds.
- **Pastel Wall:** Five soft grounds.
- **Bold Pop:** Five saturated grounds.
- **Sunrise:** A warm gradient under the drawing.
- **Close Up:** Scaled in on the features.

The full option set of each one is at https://www.dicebear.com/styles/croodles-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09` |
| `noseProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `eyepatchColor` | color (array allowed) | Hex color, `#` optional |
| `eyepatchColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyepatchColorFillStops` | range |  |
| `eyepatchColorAngle` | range | -360 to 360 |
| `eyepatchColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/croodles-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/croodles-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/croodles-neutral/presets/

# Croodles Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style at its plainest: the eyes, nose and mouth drawn in black on a white ground. The baseline the rest of these presets move away from.

```json
{
  "backgroundColor": ["ffffff"]
}
```

## Sepia

Warm all the way through. With no head shape to fill, the background is the paper and the ink is the whole drawing.

```json
{
  "backgroundColor": ["e3d2b4"],
  "inkColor": ["4a3526"],
  "glassesColor": ["4a3526"],
  "eyepatchColor": ["4a3526"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it, which suits an admin table or a comment thread where the avatar is a marker rather than a picture.

```json
{
  "backgroundColor": ["ececed"],
  "inkColor": ["3b3d42"],
  "glassesColor": ["3b3d42"],
  "eyepatchColor": ["3b3d42"]
}
```

## Duotone

One teal for the drawing and one pale mint for the ground, and that is the entire palette.

```json
{
  "backgroundColor": ["dff0eb"],
  "inkColor": ["0f3d38"],
  "glassesColor": ["0f3d38"],
  "eyepatchColor": ["0f3d38"]
}
```

## Inverted

Swaps line and ground. There is no filled head shape to dissolve here, only the drawing, so the inversion is clean.

```json
{
  "backgroundColor": ["111113"],
  "inkColor": ["f2f2f4"],
  "glassesColor": ["f2f2f4"],
  "eyepatchColor": ["f2f2f4"]
}
```

## Muted

Changes only what the drawing sits on, and away from white rather than towards a brighter color.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "inkColor": ["1f1f22"],
  "glassesColor": ["1f1f22"],
  "eyepatchColor": ["1f1f22"]
}
```

## Electric

The other direction: six grounds past anything the style ships, with the line left black so it survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "inkColor": ["101216"],
  "glassesColor": ["101216"],
  "eyepatchColor": ["101216"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Close Up

Uses scale rather than color. These styles leave a lot of air around the drawing, and cropping in buys it back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.3,
  "inkColor": ["2f2a24"],
  "glassesColor": ["2f2a24"],
  "eyepatchColor": ["2f2a24"]
}
```

---

Source: https://www.dicebear.com/styles/croodles/

# Croodles

Croodles is a hand-drawn doodle vector avatar style rendered in loose black ink
lines: sketchy faces with hair, glasses, and quirky expressions. Generate
informal profile icons for blogs, creative tools, and sketchbook-style products.

- **Style name:** `croodles`
- **Category:** Characters
- **Animated:** no
- **Creator:** vijay verma (https://vjy.me/)
- **Source:** https://www.figma.com/community/file/966199982810283152
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/croodles/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/croodles.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/croodles.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("croodles.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features croodles
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CROODLES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Croodles))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/croodles.dart';

final style = Style.parse(croodles);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Croodles);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear croodles
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** Black on nothing, no beard or moustache.
- **Sepia:** Brown ink on tanned paper.
- **Greyscale:** One grey for the whole drawing.
- **Duotone:** Deep teal on mint, two colors total.
- **Inverted:** White line on black, like chalk.
- **Muted:** Hair in six dusty tones instead of six bright ones.
- **Electric:** Hair at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, the drawing untouched.
- **Bold Pop:** Saturated backgrounds and the style's own bright hair.
- **Sunrise:** A warm gradient behind, the drawing untouched.
- **Full Cast:** Beards and moustaches turned up.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/croodles/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `beardVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `beardProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16` |
| `eyesProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18` |
| `mouthProbability` | number | 0 to 100 |
| `mustacheVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04` |
| `mustacheProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09` |
| `noseProbability` | number | 0 to 100 |
| `topVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29` |
| `topProbability` | number | 0 to 100 |
| `baseColor` | color (array allowed) | Hex color, `#` optional |
| `baseColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `baseColorFillStops` | range |  |
| `baseColorAngle` | range | -360 to 360 |
| `baseColorOrder` | enum | `random`, `fixed` |
| `eyepatchColor` | color (array allowed) | Hex color, `#` optional |
| `eyepatchColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyepatchColorFillStops` | range |  |
| `eyepatchColorAngle` | range | -360 to 360 |
| `eyepatchColorOrder` | enum | `random`, `fixed` |
| `facialHairColor` | color (array allowed) | Hex color, `#` optional |
| `facialHairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `facialHairColorFillStops` | range |  |
| `facialHairColorAngle` | range | -360 to 360 |
| `facialHairColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `topColor` | color (array allowed) | Hex color, `#` optional |
| `topColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `topColorFillStops` | range |  |
| `topColorAngle` | range | -360 to 360 |
| `topColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/croodles/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/croodles/definition.json`.

---

Source: https://www.dicebear.com/styles/croodles/presets/

# Croodles presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped to its drawing. No background at all, so the avatar sits on whatever your page is, and the two facial hair components switched off.

```json
{
  "backgroundColor": [],
  "beardProbability": 0,
  "mustacheProbability": 0,
  "topColor": ["000000"]
}
```

## Sepia

Warm all the way through, face included. Croodles draws with a single pen, so recoloring the ink recolors the whole portrait at once.

```json
{
  "backgroundColor": ["dfc9a3"],
  "baseColor": ["f2e4cc"],
  "inkColor": ["5a3d28"],
  "topColor": ["5a3d28"],
  "facialHairColor": ["5a3d28"],
  "glassesColor": ["5a3d28"],
  "eyepatchColor": ["5a3d28"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it, which suits an admin table or a comment thread where the avatar is a marker rather than a picture.

```json
{
  "backgroundColor": ["ececed"],
  "baseColor": ["fafafa"],
  "inkColor": ["4a4d52"],
  "topColor": ["4a4d52"],
  "facialHairColor": ["4a4d52"],
  "glassesColor": ["4a4d52"],
  "eyepatchColor": ["4a4d52"]
}
```

## Duotone

One teal for every line and one pale mint for the face, and that is the entire palette. Restrictive on purpose: two colors is the point at which a set of avatars stops looking like a collection of people and starts looking like an icon set.

```json
{
  "backgroundColor": ["dff0eb"],
  "baseColor": ["eefaf6"],
  "inkColor": ["0f3d38"],
  "topColor": ["0f3d38"],
  "facialHairColor": ["0f3d38"],
  "glassesColor": ["0f3d38"],
  "eyepatchColor": ["0f3d38"]
}
```

## Inverted

Swaps line and face. This works here because the face fill is a color group of its own, so it can go dark with the background instead of leaving a bright shape behind pale outlines.

```json
{
  "backgroundColor": ["111113"],
  "baseColor": ["1c1c20"],
  "inkColor": ["f2f2f4"],
  "topColor": ["f2f2f4"],
  "facialHairColor": ["f2f2f4"],
  "glassesColor": ["f2f2f4"],
  "eyepatchColor": ["f2f2f4"]
}
```

## Muted

Croodles ships black plus five saturated hair colors. This trades them for dusty greens, clays and blues, which keeps the drawing playful without the primary-color energy.

```json
{
  "backgroundColor": ["ece7de"],
  "topColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction: six hair colors past anything the style ships, on a dark background. The linework stays black, so the hair is the only thing that glows.

```json
{
  "backgroundColor": ["101216"],
  "baseColor": ["f2f2f4"],
  "topColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Croodles ships five bright hair colors next to black. This keeps only those and puts a strong background behind them.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"],
  "topColor": ["699bf7","0fa958","9747ff","f24e1e","ffc700"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

Both facial hair components sit at ten percent, so a small set shows them on nobody. This raises them, which is what you want when showing the style off rather than filling a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "beardProbability": 45,
  "mustacheProbability": 40
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing leaves a lot of air around the head, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/cutouts/

# Cutouts

Cutouts is a paper collage avatar style. Every face is assembled from torn craft
paper: a colored head, hair laid over it, and eyes, nose and mouth cut out
separately. The two eyes never match, which is the point of the style. Generate
warm, handmade profile pictures for communities and editorial sites.

- **Style name:** `cutouts`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/cutouts/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/cutouts.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/cutouts.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("cutouts.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features cutouts
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::CUTOUTS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Cutouts))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/cutouts.dart';

final style = Style.parse(cutouts);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Cutouts);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear cutouts
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No brows, no torn cheeks.
- **Sepia:** Torn brown paper on tan.
- **Greyscale:** Newsprint, no hue anywhere.
- **Duotone:** Two papers, blue and cream.
- **Muted:** Faded sugar paper.
- **Electric:** Fluorescent card, quiet ground.
- **Pastel Wall:** Colored ground under the collage.
- **Bold Pop:** Six grounds, loud under the paper.
- **Night Shift:** Dark table, pale paper.
- **Sunrise:** A warm gradient under the paper.
- **Full Cast:** Hair, brows and cheeks on everyone.
- **Close Up:** The collage scaled up in the frame.

The full option set of each one is at https://www.dicebear.com/styles/cutouts/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `headVariant` | enum (array allowed) | `blob`, `block`, `pear`, `slanted`, `tall`, `wide` |
| `headProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `crest`, `curls`, `fringe`, `long`, `sidePart`, `swoosh`, `tufts` |
| `hairProbability` | number | 0 to 100 |
| `browsVariant` | enum (array allowed) | `dashes`, `mono`, `strips`, `uneven` |
| `browsProbability` | number | 0 to 100 |
| `cheeksVariant` | enum (array allowed) | `torn` |
| `cheeksProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `bigSmall`, `circleSquare`, `inkDots`, `pair`, `ringDot`, `sleepyOpen`, `squares` |
| `eyesProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `bent`, `dab`, `hook`, `strip`, `tornTriangle`, `wedge` |
| `noseProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `gasp`, `grin`, `smile`, `strip`, `tornSmile`, `wavy`, `zigzag` |
| `mouthProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `paperFaceColor` | color (array allowed) | Hex color, `#` optional |
| `paperFaceColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `paperFaceColorFillStops` | range |  |
| `paperFaceColorAngle` | range | -360 to 360 |
| `paperFaceColorOrder` | enum | `random`, `fixed` |
| `paperBackColor` | color (array allowed) | Hex color, `#` optional |
| `paperBackColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `paperBackColorFillStops` | range |  |
| `paperBackColorAngle` | range | -360 to 360 |
| `paperBackColorOrder` | enum | `random`, `fixed` |
| `paperHairColor` | color (array allowed) | Hex color, `#` optional |
| `paperHairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `paperHairColorFillStops` | range |  |
| `paperHairColorAngle` | range | -360 to 360 |
| `paperHairColorOrder` | enum | `random`, `fixed` |
| `paperMouthColor` | color (array allowed) | Hex color, `#` optional |
| `paperMouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `paperMouthColorFillStops` | range |  |
| `paperMouthColorAngle` | range | -360 to 360 |
| `paperMouthColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/cutouts/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/cutouts/definition.json`.

---

Source: https://www.dicebear.com/styles/cutouts/presets/

# Cutouts presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Two optional components off. The style is a paper collage, and with fewer scraps on the face the cut shapes of the head and eyes carry it.

```json
{
  "browsProbability": 0,
  "cheeksProbability": 0
}
```

## Sepia

The cheeks are switched off here rather than recolored: the style's only cheek scrap is printed pink, and no color option reaches it.

```json
{
  "backgroundColor": ["ede2ce"],
  "paperFaceColor": ["c9a678","b08d5f","d9bd94"],
  "paperBackColor": ["8f6d43","6d5031"],
  "paperHairColor": ["4a3018","3a2916","5c4223"],
  "paperMouthColor": ["7a5c37"],
  "cheeksProbability": 0
}
```

## Greyscale

Paper cut from a black and white page. The drop shadow under each scrap does the work that color usually does, so the layers still read apart.

```json
{
  "backgroundColor": ["ececee"],
  "paperFaceColor": ["c1c1c7","a1a1aa","d4d4d8"],
  "paperBackColor": ["71717a","52525b"],
  "paperHairColor": ["27272a","3f3f46","18181b"],
  "paperMouthColor": ["52525b"],
  "cheeksProbability": 0
}
```

## Duotone

One color for the face, one for everything behind and on top of it. The head shapes and the cut of the features are all that separates two avatars.

```json
{
  "backgroundColor": ["e6ecef"],
  "paperFaceColor": ["9ec9e8"],
  "paperBackColor": ["37718e"],
  "paperHairColor": ["1d3d52"],
  "paperMouthColor": ["37718e"],
  "cheeksProbability": 0
}
```

## Muted

The style cuts from saturated stock. This is the same collage in paper that has been sitting in the sun, which suits a page where many of them appear together. The mouth scrap moves with the rest: the style cuts it from four reds, and one of those against a faded face is all you would see.

```json
{
  "backgroundColor": ["ece7dd"],
  "paperFaceColor": ["c2a878","bd9080","8fa3ad","9aa88f","b09aa8","a8998c"],
  "paperBackColor": ["6f7a72","7a6b63","6b7280","7c6b78"],
  "paperHairColor": ["4a4a42","3f4642","4a4250","52483f"],
  "cheeksProbability": 0,
  "paperMouthColor": ["8f6b63","7c6b58","96736b","6b6259"]
}
```

## Electric

Only the face scraps go loud. The hair stays dark so the collage keeps a top and a bottom instead of turning into one bright field.

```json
{
  "backgroundColor": ["f6f1e7"],
  "paperFaceColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

The five grounds the style ships are all near-white. These are pale but present, which gives the paper something to sit on.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The scraps are mid-toned and each carries a drop shadow, so they hold their edge against a saturated ground.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The face palette lightens so the collage still separates from the ground, and the hair keeps its dark stock.

```json
{
  "backgroundColor": ["17171b"],
  "paperFaceColor": ["e8c98a","e8a08a","a8cbe8","b9d8ae","f0c4d0"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. Both stops stay light, so the shadows under the scraps keep their contrast.

```json
{
  "backgroundColor": ["ffd5a8","ffb0c4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

All three optional components turned up. The style ships seven haircuts and four brow shapes that most seeds never reach.

```json
{
  "hairProbability": 100,
  "browsProbability": 100,
  "cheeksProbability": 100
}
```

## Close Up

The style leaves a wide margin around the head. This crops in until the paper nearly touches the edge, which is what you want at 24 or 32 pixels.

```json
{
  "scale": 1.25
}
```

---

Source: https://www.dicebear.com/styles/disco/

# Disco

Disco is an abstract vector avatar style built from halftone-like grids of small
shapes that grow and shrink across a colored background. Generate graphic SVG
profile icons, useful as avatar placeholders or decorative user identifiers.

- **Style name:** `disco`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/disco/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/disco.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/disco.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("disco.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features disco
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::DISCO)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Disco))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/disco.dart';

final style = Style.parse(disco);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Disco);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear disco
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the disc.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the disc.
- **Stencil:** One background for everyone, only the shape varies.
- **Close Up:** Scaled in, so the shape runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/disco/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `patternVariant` | enum (array allowed) | `default` |
| `patternProbability` | number | 0 to 100 |
| `shapeVariant` | enum (array allowed) | `circle`, `hexagon`, `pentagon`, `rectangle`, `triangle` |
| `shapeProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `shapeColor` | color (array allowed) | Hex color, `#` optional |
| `shapeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shapeColorFillStops` | range |  |
| `shapeColorAngle` | range | -360 to 360 |
| `shapeColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/disco/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/disco/definition.json`.

---

Source: https://www.dicebear.com/styles/disco/presets/

# Disco presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the disc changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Close Up

Uses scale rather than color. Cropping in turns the composition from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/dylan/

# Dylan

Dylan is a bold, flat-illustrated vector avatar style with chunky outlined
faces, hand-drawn stubble, and minimal facial features on saturated backgrounds.
Generate distinctive SVG profile icons for creative projects and modern apps.

- **Style name:** `dylan`
- **Category:** Characters
- **Animated:** no
- **Creator:** Natalia Spivak (https://nataspvk.tilda.ws/)
- **Source:** https://www.figma.com/community/file/1356575240759683500
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/dylan/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/dylan.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/dylan.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("dylan.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features dylan
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::DYLAN)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Dylan))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/dylan.dart';

final style = Style.parse(dylan);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Dylan);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear dylan
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No stubble, just hair and expression.
- **Sepia:** Brown on tan, skin included.
- **Greyscale:** No hue anywhere on the avatar.
- **Duotone:** Three steps of one teal.
- **Muted:** Dusty hair colors instead of primaries.
- **Electric:** Hair past anything the style ships.
- **Pastel Wall:** Soft backgrounds, the style's own hair.
- **Bold Pop:** Six backgrounds, loud on purpose.
- **Night Shift:** Near-black ground, pale hair.
- **Sunrise:** A warm gradient behind the head.
- **Close Up:** The head scaled up in the frame.

The full option set of each one is at https://www.dicebear.com/styles/dylan/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `facialHairVariant` | enum (array allowed) | `default` |
| `facialHairProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `bangs`, `buns`, `flatTop`, `fluffy`, `longCurls`, `parting`, `plain`, `roundBob`, `shaggy`, `shortCurls`, `spiky`, `wavy` |
| `hairProbability` | number | 0 to 100 |
| `moodVariant` | enum (array allowed) | `angry`, `confused`, `happy`, `hopeful`, `neutral`, `sad`, `superHappy` |
| `moodProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/dylan/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/dylan/definition.json`.

---

Source: https://www.dicebear.com/styles/dylan/presets/

# Dylan presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Facial hair appears on one avatar in five by default. Switching it off leaves the two things that carry the style: the haircut and the mood.

```json
{
  "facialHairProbability": 0
}
```

## Sepia

The skin palette moves with the rest here. A monochrome set with two natural skin tones in it would not read as monochrome at all.

```json
{
  "backgroundColor": ["e7d5b8"],
  "hairColor": ["3d2a17","5c4223","8a6a3c","b0946a"],
  "skinColor": ["c39a6b","a87f52"]
}
```

## Greyscale

For interfaces where color already means something else, or for a print stylesheet. The heavy black linework the style draws with survives the treatment better than most.

```json
{
  "backgroundColor": ["e4e4e7"],
  "hairColor": ["18181b","3f3f46","71717a","a1a1aa"],
  "skinColor": ["c9c9cf","9c9ca4"]
}
```

## Duotone

Dark ground, mid hair, pale face. The hair needs its own step here: the style draws it as a flat shape with no outline, so hair the color of the background loses the haircut entirely.

```json
{
  "backgroundColor": ["0d3b3f"],
  "hairColor": ["2f8a86"],
  "skinColor": ["cfeceb"]
}
```

## Muted

The style ships black, white and three primaries for hair. This trades them for tones that sit quietly next to each other, which suits a dense list where five primaries would fight.

```json
{
  "backgroundColor": ["dcd7cc"],
  "hairColor": ["4a4238","7b6a58","a3937c","6b7361","8c6f63"]
}
```

## Electric

The same lever pulled the other way. The background stays pale so the hair is the only loud thing in the frame.

```json
{
  "backgroundColor": ["f4f4f5"],
  "hairColor": ["ff2e88","00e5ff","7cff00","ffe600","b400ff"]
}
```

## Pastel Wall

The three backgrounds the style ships are fully saturated. These six are not, which lets the black linework do the work.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The style is already flat and graphic, so it takes a loud ground without turning to mush.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The hair palette moves to light tones so the silhouette still separates from the background.

```json
{
  "backgroundColor": ["16161a"],
  "hairColor": ["f4f4f5","d4d4d8","fcd34d","a5b4fc"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffb37a","ff7a9c"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Close Up

The style leaves a wide margin around the head, which reads as small at avatar sizes. This crops in far enough to matter and still keeps the ears.

```json
{
  "scale": 1.25
}
```

---

Source: https://www.dicebear.com/styles/fun-emoji/

# Fun Emoji

Fun Emoji is an emoji-inspired vector avatar style that places a single
expressive face (eyes, mouth, and the occasional accessory like sunglasses or
tears) on a solid colored square. Generate instantly readable profile icons for
chat apps and social networks.

- **Style name:** `fun-emoji`
- **Category:** Characters
- **Animated:** no
- **Creator:** Davis Uche (https://www.instagram.com/davedirect3/)
- **Source:** https://www.figma.com/community/file/968125295144990435
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/fun-emoji/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/fun-emoji.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/fun-emoji.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("fun-emoji.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features fun-emoji
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::FUN_EMOJI)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.FunEmoji))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/fun_emoji.dart';

final style = Style.parse(funEmoji);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.FunEmoji);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear fun-emoji
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Plain:** Black and white features only.
- **Sepia:** Black ink on tanned ground.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One teal field for every avatar.
- **Muted:** Six dusty fields.
- **Electric:** Six fields past the shipped set.
- **Cool:** Blues, teals and violets only.
- **Warm:** Reds, oranges and golds only.
- **Night Shift:** Dark fields, features that survive them.
- **Sunrise:** A warm gradient across the tile.
- **Close Up:** Eyes and mouth scaled up.

The full option set of each one is at https://www.dicebear.com/styles/fun-emoji/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `closed`, `closed2`, `crying`, `cute`, `glasses`, `love`, `pissed`, `plain`, `sad`, `shades`, `sleepClose`, `stars`, `tearDrop`, `wink`, `wink2` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `cute`, `drip`, `faceMask`, `kissHeart`, `lilSmile`, `pissed`, `plain`, `sad`, `shout`, `shy`, `sick`, `smileLol`, `smileTeeth`, `tongueOut`, `wideSmile` |
| `mouthProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/fun-emoji/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/fun-emoji/definition.json`.

---

Source: https://www.dicebear.com/styles/fun-emoji/presets/

# Fun Emoji presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Plain

Several eyes and mouths carry printed color: red hearts, a blue tear, a pink tongue. Dropping those leaves the black and white drawing on a single field, which is the style at its cleanest. It also makes every color preset below a one-color change.

```json
{
  "eyesVariant": ["closed","closed2","cute","glasses","plain","sad","shades","sleepClose","wink","wink2"],
  "mouthVariant": ["cute","faceMask","lilSmile","plain","sad","shy","smileTeeth","wideSmile"]
}
```

## Sepia

The style has one color group, so a monochrome set is one field plus the exclusions Plain explains.

```json
{
  "backgroundColor": ["c9a678","b08d5f","d9bd94","8f6d43"],
  "eyesVariant": ["closed","closed2","cute","glasses","plain","sad","shades","sleepClose","wink","wink2"],
  "mouthVariant": ["cute","faceMask","lilSmile","plain","sad","shy","smileTeeth","wideSmile"]
}
```

## Greyscale

The drawing is already black and white once the colored expressions are out, so this only asks the ground to follow.

```json
{
  "backgroundColor": ["e4e4e7","c1c1c7","9c9ca4","76767e"],
  "eyesVariant": ["closed","closed2","cute","glasses","plain","sad","shades","sleepClose","wink","wink2"],
  "mouthVariant": ["cute","faceMask","lilSmile","plain","sad","shy","smileTeeth","wideSmile"]
}
```

## Duotone

A single ground across a whole set. Only the pair of eyes and the mouth separates two avatars, which for this style is the whole identity anyway.

```json
{
  "backgroundColor": ["2f8a86"],
  "eyesVariant": ["closed","closed2","cute","glasses","plain","sad","shades","sleepClose","wink","wink2"],
  "mouthVariant": ["cute","faceMask","lilSmile","plain","sad","shy","smileTeeth","wideSmile"]
}
```

## Muted

The six colors the style ships are all fully saturated, which is a lot of shouting when a page shows twenty of them. These carry the same drawing without the volume. The colored expressions come out too, the same ones Plain drops: a red heart is the loudest thing on the page next to these.

```json
{
  "eyesVariant": ["closed","closed2","cute","glasses","plain","sad","shades","sleepClose","wink","wink2"],
  "mouthVariant": ["cute","faceMask","lilSmile","plain","sad","shy","smileTeeth","wideSmile"],
  "backgroundColor": ["9aa88f","b0a48c","8fa3ad","a894a3","b8a06f","8d9bb5"]
}
```

## Electric

The other direction on the same lever. The features are solid black, so they hold up against anything behind them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Cool

Half the color wheel, and the counterpart to Warm. Useful when two groups of avatars need telling apart at a glance.

```json
{
  "backgroundColor": ["38bdf8","2dd4bf","818cf8","a78bfa","22d3ee"]
}
```

## Warm

The other half of the same wheel.

```json
{
  "backgroundColor": ["fb923c","fbbf24","f87171","f472b6","ea580c"]
}
```

## Night Shift

The features are solid black and cannot be recolored, so on a dark ground only the expressions with light in them still read: glasses, shades, a mask, a row of teeth. Everything else would disappear, so this preset leaves it out.

```json
{
  "backgroundColor": ["1e293b","312e81","3b0764","134e4a"],
  "eyesVariant": ["glasses","shades","closed","closed2","sleepClose"],
  "mouthVariant": ["faceMask","smileTeeth","wideSmile"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffb37a","ff7a9c"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Close Up

The field fills the tile either way, so nothing is lost by cropping. What changes is the size of the two things that carry the expression.

```json
{
  "scale": 1.25
}
```

---

Source: https://www.dicebear.com/styles/gaze/

# Gaze

Gaze puts a pair of eyes on a colored body and leaves off everything else. Seven
of the eleven silhouettes are plain geometry, the rest a pill, a column, an egg
and an arch, and eleven eye pairs sit on them at five spacings. The eyes take
whichever ink holds up against the body color. With the animation on they wander
and blink while the body hops. Generate friendly SVG profile icons for chat apps
and dashboards.

- **Style name:** `gaze`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/gaze/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/gaze.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/gaze.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("gaze.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features gaze
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::GAZE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Gaze))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/gaze.dart';

final style = Style.parse(gaze);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Gaze);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear gaze
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Warm brown bodies on cream.
- **Greyscale:** The same bodies without hue.
- **Duotone:** One mint body for everyone.
- **Muted:** Dusty bodies instead of the pastels.
- **Electric:** Bodies past anything the style ships.
- **Pastel Wall:** Pale ground behind the body.
- **Bold Pop:** Saturated ground behind the body.
- **Night Shift:** Near black ground, bodies unchanged.
- **Sunrise:** A warm gradient behind the body.
- **Geometric:** Only the straight edged silhouettes.
- **Animated:** Turns the style's built-in animation on.
- **Close Up:** Scaled in, so the body runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/gaze/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `shapeVariant` | enum (array allowed) | `arch`, `circle`, `column`, `diamond`, `egg`, `hexagon`, `octagon`, `pentagon`, `pill`, `square`, `triangle` |
| `shapeProbability` | number | 0 to 100 |
| `spacingVariant` | enum (array allowed) | `close`, `far`, `normal`, `snug`, `wide` |
| `spacingProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `bars`, `beans`, `big`, `dots`, `grin`, `happy`, `shine`, `small`, `squint`, `tall`, `wide` |
| `eyesProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `glintColor` | color (array allowed) | Hex color, `#` optional |
| `glintColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glintColorFillStops` | range |  |
| `glintColorAngle` | range | -360 to 360 |
| `glintColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/gaze/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/gaze/definition.json`.

---

Source: https://www.dicebear.com/styles/gaze/presets/

# Gaze presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The eyes are not painted, they take whichever of two inks holds up against the body. Move the bodies into brown and the eyes follow on their own.

```json
{
  "backgroundColor": ["efe3d2"],
  "bodyColor": ["d5b28c","c49a70","e0c6a8","b3835c"]
}
```

## Greyscale

Nothing here but a silhouette and a pair of eyes, so losing color costs the style very little. Useful for a print stylesheet or a chart where color already means something.

```json
{
  "backgroundColor": ["ececee"],
  "bodyColor": ["c9c9cd","aeaeb4","dcdce0","94949a"]
}
```

## Duotone

A single body color across a whole set, so the silhouette, the eyes and how far apart they sit are all that separates two avatars.

```json
{
  "backgroundColor": ["e2f5ef"],
  "bodyColor": ["7ad0b4"]
}
```

## Muted

The shipped palette is six bright pastels. These are the same bodies in tones that hold still, which suits a sidebar where a dozen appear at once.

```json
{
  "backgroundColor": ["e8e4dc"],
  "bodyColor": ["a5a58d","b98b73","8e9aaf","9c8a94","8fa38f","b0a58c"]
}
```

## Electric

The same lever the other way, on a near black ground. The ink flips to the dark of the two by itself, because the neon bodies are the lighter side of every pairing.

```json
{
  "backgroundColor": ["0f0f12"],
  "bodyColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Gaze ships no background of its own and renders transparent. A pale ground gives the shape an edge to sit against without touching the artwork.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Louder than Pastel Wall. The bodies are pale, so they keep their edge on top of it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Night Shift

For dark interfaces. The shipped bodies are pastel already, so nothing else has to move for the shape to stay visible.

```json
{
  "backgroundColor": ["16161a"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Geometric

Seven of the eleven shapes are plain polygons and the other four are drawn by hand. Keeping the polygons gives a set one consistent edge treatment, which reads more like a system of icons than a family of creatures.

```json
{
  "shapeVariant": ["circle","square","triangle","pentagon","hexagon","octagon","diamond"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed, so the eyes wander and blink while the body hops. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

## Close Up

Uses scale rather than color. Cropping in leaves the eyes and little else, which reads better at the size a comment thread gives an avatar.

```json
{
  "scale": 1.3
}
```

---

Source: https://www.dicebear.com/styles/glass/

# Glass

Glass is a minimal abstract vector avatar style rendered as smooth color
gradients with a subtle glassy sheen and no visible shapes. Generate SVG profile
icons that work as understated placeholders or backgrounds for polished
interfaces.

- **Style name:** `glass`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/glass/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/glass.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/glass.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("glass.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features glass
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::GLASS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Glass))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/glass.dart';

final style = Style.parse(glass);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Glass);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear glass
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the panes.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the panes.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/glass/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `shapeVariant` | enum (array allowed) | `a`, `d`, `e`, `g`, `i`, `n`, `r`, `t` |
| `shapeProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/glass/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/glass/definition.json`.

---

Source: https://www.dicebear.com/styles/glass/presets/

# Glass presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the panes changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion, and a static avatar next to an animated one stays static.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/glyphs/

# Glyphs

Glyphs is a minimal abstract vector avatar style that pairs a flat shoulder
silhouette with a unique glyph-like hat or headpiece inside a soft tinted
circle. Generate simple SVG profile icons that work well as placeholders in user
lists and chat sidebars.

- **Style name:** `glyphs`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** Matt Houser (https://x.com/mattkhouser)
- **Source:** https://www.figma.com/community/file/1249154526125777853
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/glyphs/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/glyphs.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/glyphs.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("glyphs.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features glyphs
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::GLYPHS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Glyphs))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/glyphs.dart';

final style = Style.parse(glyphs);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Glyphs);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear glyphs
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Ink:** One near-black glyph on its own pale ground.
- **Sepia:** A brown glyph on tanned ground.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One deep teal for every avatar.
- **Muted:** Six dusty glyph colors.
- **Electric:** Six colors at full saturation.
- **Cool:** Blues, teals and violets only.
- **Warm:** Reds, oranges and golds only.

The full option set of each one is at https://www.dicebear.com/styles/glyphs/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `shapeVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30`, `variant31`, `variant32`, `variant33`, `variant34`, `variant35` |
| `shapeProbability` | number | 0 to 100 |
| `glyphColor` | color (array allowed) | Hex color, `#` optional |
| `glyphColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glyphColorFillStops` | range |  |
| `glyphColorAngle` | range | -360 to 360 |
| `glyphColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/glyphs/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/glyphs/definition.json`.

---

Source: https://www.dicebear.com/styles/glyphs/presets/

# Glyphs presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Ink

The plainest the style gets. Worth knowing while you read the rest of these: Glyphs paints its own background as a pale version of the glyph color, so the `backgroundColor` option never reaches the canvas and every preset here moves one color, not two.

```json
{
  "glyphColor": ["1f1f22"]
}
```

## Sepia

One color carries both the mark and the ground it sits on, which is what makes this style so cheap to retint.

```json
{
  "glyphColor": ["6b4f35"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "glyphColor": ["343437","5e5e62","8c8c90","4a4d52"]
}
```

## Duotone

A single glyph color means every avatar in a set shares both mark and ground, and only the shape changes.

```json
{
  "glyphColor": ["0f3d38"]
}
```

## Muted

The style ships seven saturated colors. This trades them for dusty tones, which suits a dense list where seven bright marks would compete.

```json
{
  "glyphColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: colors past anything the style ships. The pale ground goes with them, so the whole tile gets louder rather than just the mark.

```json
{
  "glyphColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Cool

Half the color wheel. Useful next to Warm when two groups of avatars need to be told apart at a glance.

```json
{
  "glyphColor": ["2f6fb5","2f8f8a","4a5fb8","6b4bd6","2f9ec4"]
}
```

## Warm

The other half of the same wheel, and the counterpart to Cool.

```json
{
  "glyphColor": ["c4443f","c67a2c","b8542f","c43f7a","a8842c"]
}
```

---

Source: https://www.dicebear.com/styles/icons/

# Icons

Icons is a clean vector avatar style that drops a single Bootstrap Icons
pictogram onto a tinted background. Generate scalable profile icons ideal for
dashboards, admin panels, and enterprise tools where character faces would feel
out of place.

- **Style name:** `icons`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** The Bootstrap Authors (https://getbootstrap.com/)
- **Source:** https://github.com/twbs/icons
- **License:** MIT (https://github.com/twbs/icons/blob/main/LICENSE)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/icons/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/icons.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/icons.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("icons.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features icons
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::ICONS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Icons))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/icons.dart';

final style = Style.parse(icons);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Icons);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear icons
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the icon.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo for every avatar.
- **Muted:** Six dusty backgrounds.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the icon.
- **Stencil:** One dark ground for everyone.

The full option set of each one is at https://www.dicebear.com/styles/icons/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `iconVariant` | enum (array allowed) | `alarm`, `archive`, `award`, `bag`, `bandaid`, `bank`, `basket`, `basket2`, `basket3`, `bell`, `bicycle`, `binoculars`, `book`, `bookshelf`, `boombox`, `box`, `boxSeam`, `boxes`, `bricks`, `briefcase`, `brightnessHigh`, `brush`, `bucket`, `bug`, `building`, `calculator`, `camera`, `cameraReels`, `cart2`, `cashCoin`, `clock`, `cloud`, `cloudDrizzle`, `cloudMoon`, `cloudSnow`, `clouds`, `coin`, `compass`, `controller`, `cup`, `cupStraw`, `dice5`, `disc`, `display`, `doorClosed`, `doorOpen`, `dpad`, `droplet`, `easel`, `egg`, `eggFried`, `emojiHeartEyes`, `emojiLaughing`, `emojiSmile`, `emojiSmileUpsideDown`, `emojiSunglasses`, `emojiWink`, `envelope`, `eyeglasses`, `flag`, `flower1`, `flower2`, `flower3`, `gem`, `gift`, `globe`, `globe2`, `handThumbsUp`, `handbag`, `hdd`, `heart`, `hourglass`, `hourglassSplit`, `house`, `houseDoor`, `inbox`, `inboxes`, `key`, `keyboard`, `ladder`, `lamp`, `laptop`, `lightbulb`, `lightning`, `lightningCharge`, `lock`, `magic`, `mailbox`, `map`, `megaphone`, `minecart`, `minecartLoaded`, `moon`, `moonStars`, `mortarboard`, `mouse`, `mouse2`, `newspaper`, `paintBucket`, `palette`, `palette2`, `paperclip`, `pen`, `pencil`, `phone`, `piggyBank`, `pinAngle`, `plug`, `printer`, `projector`, `puzzle`, `router`, `scissors`, `sdCard`, `search`, `send`, `shop`, `shopWindow`, `signpost`, `signpost2`, `signpostSplit`, `smartwatch`, `snow`, `snow2`, `snow3`, `speaker`, `star`, `stoplights`, `stopwatch`, `sun`, `tablet`, `thermometer`, `ticketPerforated`, `tornado`, `trash`, `trash2`, `tree`, `trophy`, `truck`, `truckFlatbed`, `tsunami`, `umbrella`, `wallet`, `wallet2`, `watch`, `webcam` |
| `iconProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `iconColor` | color (array allowed) | Hex color, `#` optional |
| `iconColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `iconColorFillStops` | range |  |
| `iconColorAngle` | range | -360 to 360 |
| `iconColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/icons/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/icons/definition.json`.

---

Source: https://www.dicebear.com/styles/icons/presets/

# Icons presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The icon flips between black and white on its own, picking whichever contrasts more, so changing the background carries the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background means every avatar in a set shares it and only the icon changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the icon. That turns a set from a group of portraits into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

---

Source: https://www.dicebear.com/styles/identicon/

# Identicon

Identicon renders symmetrical pixel-grid patterns in a single color on a tinted
background, the classic identicon look popularized by developer tools and
version control hosts. Each pattern is deterministically derived from its seed,
so it works well for technical profile icons and identicon API use cases.

- **Style name:** `identicon`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/identicon/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/identicon.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/identicon.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("identicon.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features identicon
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::IDENTICON)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Identicon))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/identicon.dart';

final style = Style.parse(identicon);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Identicon);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear identicon
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** A warm brown grid on tanned paper.
- **Greyscale:** Four steps of grey.
- **Duotone:** One indigo on a pale indigo ground.
- **Muted:** Dusty tones instead of the full spectrum.
- **Electric:** Acid grid on near black.
- **Pastel Wall:** Soft backgrounds, the grid untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind the shapes.

The full option set of each one is at https://www.dicebear.com/styles/identicon/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `rowVariant` | enum (array allowed) | `ooxoo`, `oxoxo`, `oxxxo`, `xooox`, `xoxox`, `xxoxx`, `xxxxx` |
| `rowProbability` | number | 0 to 100 |
| `rowColor` | color (array allowed) | Hex color, `#` optional |
| `rowColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `rowColorFillStops` | range |  |
| `rowColorAngle` | range | -360 to 360 |
| `rowColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/identicon/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/identicon/definition.json`.

---

Source: https://www.dicebear.com/styles/identicon/presets/

# Identicon presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The style has one color group for the whole grid, so a single palette change carries the picture.

```json
{
  "backgroundColor": ["e3d2b4"],
  "rowColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

No hue anywhere, which suits an identicon: the pattern carries the identity, not the color.

```json
{
  "backgroundColor": ["ececee"],
  "rowColor": ["343437","5e5e62","8c8c90"]
}
```

## Duotone

Background and grid take the same hue at two lightnesses. The most restrained this style gets, and the easiest to place next to an existing brand color.

```json
{
  "backgroundColor": ["dfe3f5"],
  "rowColor": ["3d4272"]
}
```

## Muted

The style ships nineteen colors around the wheel. This trades them for six dusty tones, which stops a table of identicons looking like a test chart.

```json
{
  "backgroundColor": ["ece7de"],
  "rowColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships, on a dark background so they read as lit.

```json
{
  "backgroundColor": ["101216"],
  "rowColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes only what the grid sits on. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

---

Source: https://www.dicebear.com/styles/initial-face/

# Initial Face

Initial Face is a friendly vector avatar style that combines expressive eyes
with a single bold initial on a colored square: half emoji, half monogram.
Generate SVG profile icons that feel personal even at small sizes, great for
user lists and profile placeholders.

- **Style name:** `initial-face`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/initial-face/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/initial-face.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/initial-face.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("initial-face.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features initial-face
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::INITIAL_FACE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.InitialFace))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/initial_face.dart';

final style = Style.parse(initialFace);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.InitialFace);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear initial-face
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the face.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo for every avatar.
- **Muted:** Six dusty backgrounds.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the face.
- **Stencil:** One dark ground for everyone.
- **Animated:** Turns the style's built-in animation on.
- **Close Up:** Scaled in on the eyes and mouth.

The full option set of each one is at https://www.dicebear.com/styles/initial-face/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08` |
| `eyesProbability` | number | 0 to 100 |
| `faceVariant` | enum (array allowed) | `default` |
| `faceProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `alt`, `default` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `default` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/initial-face/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/initial-face/definition.json`.

---

Source: https://www.dicebear.com/styles/initial-face/presets/

# Initial Face presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The face flips between black and white on its own, picking whichever contrasts more, so changing the background carries the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background means every avatar in a set shares it and only the face changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the face. That turns a set from a group of portraits into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

## Close Up

Uses scale rather than color. The style leaves a wide margin around the features, and cropping in buys it back at small sizes.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.3
}
```

---

Source: https://www.dicebear.com/styles/initials/

# Initials

Initials is a text-based vector avatar style that renders one or two large
letters centered on a solid colored square, the monogram or letter avatar you
see in many apps. It is deterministic and easy to read, which makes it a
practical fallback for users who haven't uploaded a profile picture yet, and you
can generate it from any name or seed.

- **Style name:** `initials`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/initials/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/initials.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/initials.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("initials.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features initials
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::INITIALS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Initials))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/initials.dart';

final style = Style.parse(initials);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Initials);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear initials
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the letters.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo for every avatar.
- **Muted:** Six dusty backgrounds.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the letters.
- **Stencil:** One dark ground for everyone.

The full option set of each one is at https://www.dicebear.com/styles/initials/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `initialsVariant` | enum (array allowed) | `alt`, `default` |
| `initialsProbability` | number | 0 to 100 |
| `lettersVariant` | enum (array allowed) | `double`, `single` |
| `lettersProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `textColor` | color (array allowed) | Hex color, `#` optional |
| `textColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `textColorFillStops` | range |  |
| `textColorAngle` | range | -360 to 360 |
| `textColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/initials/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/initials/definition.json`.

---

Source: https://www.dicebear.com/styles/initials/presets/

# Initials presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The letters flips between black and white on its own, picking whichever contrasts more, so changing the background carries the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background means every avatar in a set shares it and only the letters changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the letters. That turns a set from a group of portraits into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

---

Source: https://www.dicebear.com/styles/landscape/

# Landscape

Landscape is a scenic vector avatar style that stacks wavy mountain ridges
beneath a sun in soft daylight palettes. Generate peaceful SVG profile icons
that stand out in interfaces full of faces.

- **Style name:** `landscape`
- **Category:** Scenes
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/landscape/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/landscape.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/landscape.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("landscape.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features landscape
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::LANDSCAPE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Landscape))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/landscape.dart';

final style = Style.parse(landscape);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Landscape);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear landscape
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Dawn:** Pale sky, low sun, hills still cool.
- **Dusk:** Violet sky, red sun, hills going dark.
- **Night:** Deep blue sky, a pale moon, black ridges.
- **Autumn:** Warm sky, rust and ochre hills.
- **Winter:** Cold sky, a low sun, snow on the ridges.
- **Greyscale:** The depth ladder without any color.
- **Electric:** An acid sky over neon ridges.
- **Animated:** Turns the style's built-in animation on.
- **Close Up:** Scaled in on the front ridges.

The full option set of each one is at https://www.dicebear.com/styles/landscape/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `orbVariant` | enum (array allowed) | `glow`, `ring`, `sun` |
| `orbProbability` | number | 0 to 100 |
| `hill1Variant` | enum (array allowed) | `dunes`, `gentle`, `mesa`, `peak`, `ridge`, `rolling`, `rugged`, `slope` |
| `hill1Probability` | number | 0 to 100 |
| `hill2Variant` | enum (array allowed) | `dunes`, `gentle`, `mesa`, `peak`, `ridge`, `rolling`, `rugged`, `slope` |
| `hill2Probability` | number | 0 to 100 |
| `hill3Variant` | enum (array allowed) | `dunes`, `gentle`, `mesa`, `peak`, `ridge`, `rolling`, `rugged`, `slope` |
| `hill3Probability` | number | 0 to 100 |
| `hill4Variant` | enum (array allowed) | `dunes`, `gentle`, `mesa`, `peak`, `ridge`, `rolling`, `rugged`, `slope` |
| `hill4Probability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `orbColor` | color (array allowed) | Hex color, `#` optional |
| `orbColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `orbColorFillStops` | range |  |
| `orbColorAngle` | range | -360 to 360 |
| `orbColorOrder` | enum | `random`, `fixed` |
| `hill1Color` | color (array allowed) | Hex color, `#` optional |
| `hill1ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hill1ColorFillStops` | range |  |
| `hill1ColorAngle` | range | -360 to 360 |
| `hill1ColorOrder` | enum | `random`, `fixed` |
| `hill2Color` | color (array allowed) | Hex color, `#` optional |
| `hill2ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hill2ColorFillStops` | range |  |
| `hill2ColorAngle` | range | -360 to 360 |
| `hill2ColorOrder` | enum | `random`, `fixed` |
| `hill3Color` | color (array allowed) | Hex color, `#` optional |
| `hill3ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hill3ColorFillStops` | range |  |
| `hill3ColorAngle` | range | -360 to 360 |
| `hill3ColorOrder` | enum | `random`, `fixed` |
| `hill4Color` | color (array allowed) | Hex color, `#` optional |
| `hill4ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hill4ColorFillStops` | range |  |
| `hill4ColorAngle` | range | -360 to 360 |
| `hill4ColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/landscape/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/landscape/definition.json`.

---

Source: https://www.dicebear.com/styles/landscape/presets/

# Landscape presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Dawn

The style ships one warm sky palette and a sun that is always golden. This sets an early morning instead: a pale blue sky, a low sun still white-gold, and hills that have not warmed up yet.

```json
{
  "backgroundColor": ["e6f1fb","dfeef7","e8f3f8"],
  "orbColor": ["f8e6a8","f5d98a"],
  "hill1Color": ["bcd4e6","b6cfdd"],
  "hill2Color": ["8ea9bd","93aab4"],
  "hill3Color": ["5f7d92","647f88"],
  "hill4Color": ["36505f","3a5259"]
}
```

## Dusk

The other end of the day. The sky turns violet, the sun drops to a deep orange-red, and the hill ladder loses its green so the ridges read as silhouettes.

```json
{
  "backgroundColor": ["f3e2ef","ecdcee","f6e4e6"],
  "orbColor": ["f2724f","e85f45"],
  "hill1Color": ["d8b6c4","cfaebd"],
  "hill2Color": ["a8849c","9c7c93"],
  "hill3Color": ["6f5470","67506a"],
  "hill4Color": ["3b2c43","36283e"]
}
```

## Night

The sun becomes a moon. Everything drops several steps in lightness, and the front ridge goes nearly black, which is what makes the depth read without any color left to help.

```json
{
  "backgroundColor": ["1b2740","172236","1d2a44"],
  "orbColor": ["e8ecf5","dbe2ef"],
  "hill1Color": ["44546f","3f4f6a"],
  "hill2Color": ["334059","2f3c53"],
  "hill3Color": ["222c40","1f2a3c"],
  "hill4Color": ["141b28","121825"]
}
```

## Autumn

Keeps the style's daylight sky and swaps the hill ladder for rust, ochre and brown, so the scene reads as late in the year rather than late in the day.

```json
{
  "backgroundColor": ["fdf0dc","fbe9d4","fdf3e4"],
  "orbColor": ["f5b942","f0a63a"],
  "hill1Color": ["e8c9a0","e3c199"],
  "hill2Color": ["cfa066","c79a62"],
  "hill3Color": ["a86f3d","9e683a"],
  "hill4Color": ["6b4326","643f24"]
}
```

## Winter

A cold, high-key scene: near-white sky, a sun with no heat in it, and hills that go from snow to slate. The narrowest contrast range of the five, which is what makes it read as overcast.

```json
{
  "backgroundColor": ["eef5fa","e8f1f7","f2f7fb"],
  "orbColor": ["fdf3d9","f8ecd0"],
  "hill1Color": ["dfe8ee","d8e3ea"],
  "hill2Color": ["bccbd6","b4c4d0"],
  "hill3Color": ["8fa3b3","879bac"],
  "hill4Color": ["5b6f7f","55697a"]
}
```

## Greyscale

Landscape builds its depth from four hill layers that get darker towards the front. Stripping the color leaves that ladder intact, which makes this the clearest way to see how the style works.

```json
{
  "backgroundColor": ["f0f0f2"],
  "orbColor": ["d8d8dc"],
  "hill1Color": ["c2c2c6"],
  "hill2Color": ["9a9a9e"],
  "hill3Color": ["6e6e72"],
  "hill4Color": ["3a3a3d"]
}
```

## Electric

The one preset here that abandons naturalism. The ladder still runs dark towards the front, so the depth survives even though nothing else about it is plausible.

```json
{
  "backgroundColor": ["101216"],
  "orbColor": ["ffe600"],
  "hill1Color": ["00e5ff"],
  "hill2Color": ["00b3d6"],
  "hill3Color": ["7a2ff2"],
  "hill4Color": ["3d0f8f"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

## Close Up

Uses scale rather than color. Cropping in drops the sky and pushes the front hills forward, which reads better at small sizes than the full scene.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/line-face/

# Line Face

Line Face draws a face with a few brush strokes and leaves out everything else.
Eight eye pairs, six noses and eight mouths, each a single stroke, sit directly
on a warm background with no head outline around them. Generate quiet, minimal
profile icons for reading apps and personal sites.

- **Style name:** `line-face`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/line-face/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/line-face.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/line-face.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("line-face.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features line-face
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::LINE_FACE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.LineFace))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/line_face.dart';

final style = Style.parse(lineFace);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.LineFace);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear line-face
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Brown brush on tanned paper.
- **Greyscale:** Charcoal on light grey.
- **Duotone:** Deep teal on mint, two colors total.
- **Inverted:** White brush on near black.
- **Muted:** Six dusty grounds under the same brush.
- **Electric:** Black brush on six acid grounds.
- **Pastel Wall:** Five soft grounds.
- **Sunrise:** A warm gradient under the brush.
- **Close Up:** Scaled in on the face.

The full option set of each one is at https://www.dicebear.com/styles/line-face/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `closed`, `dots`, `happy`, `mismatch`, `sleepy`, `unevenDots`, `wink`, `winkRight` |
| `eyesProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `angular`, `bow`, `curve`, `hook`, `long`, `slant` |
| `noseProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `frown`, `line`, `pleased`, `shy`, `smile`, `smirk`, `soft`, `wavy` |
| `mouthProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/line-face/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/line-face/definition.json`.

---

Source: https://www.dicebear.com/styles/line-face/presets/

# Line Face presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The style is one ink color on one ground, so a sepia treatment is the whole picture at once.

```json
{
  "backgroundColor": ["e3d2b4"],
  "inkColor": ["4a3526"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it.

```json
{
  "backgroundColor": ["ececed"],
  "inkColor": ["3b3d42"]
}
```

## Duotone

Line Face draws with exactly one ink on one ground, which makes it the one style where a duotone is not an approximation.

```json
{
  "backgroundColor": ["dff0eb"],
  "inkColor": ["0f3d38"]
}
```

## Inverted

Swaps ink and ground. There is no filled shape to dissolve here, only the stroke, so the inversion is clean.

```json
{
  "backgroundColor": ["111113"],
  "inkColor": ["f2f2f4"]
}
```

## Muted

The style ships six warm grounds. This trades them for dusty tones that sit further from cream.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "inkColor": ["1f1f22"]
}
```

## Electric

The other direction: six grounds past anything the style ships, with the brush left black so it survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "inkColor": ["101216"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Close Up

Uses scale rather than color. The style leaves a lot of air around the strokes, and cropping in buys it back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.3
}
```

---

Source: https://www.dicebear.com/styles/loops/

# Loops

Loops is an abstract vector avatar style that tiles rounded arcs and wavy
strokes into a two-tone geometric pattern. Generate bold SVG profile icons that
work as avatar placeholders or minimalist user identifiers.

- **Style name:** `loops`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/loops/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/loops.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/loops.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("loops.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features loops
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::LOOPS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Loops))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/loops.dart';

final style = Style.parse(loops);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Loops);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear loops
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the loops.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the loops.
- **Stencil:** One background for everyone, only the drawing varies.
- **Animated:** Turns the style's built-in animation on.
- **Close Up:** Scaled in, so the pattern runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/loops/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `tileVariant` | enum (array allowed) | `default` |
| `tileProbability` | number | 0 to 100 |
| `patternVariant` | enum (array allowed) | `alt`, `default` |
| `patternProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `lineColor` | color (array allowed) | Hex color, `#` optional |
| `lineColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `lineColorFillStops` | range |  |
| `lineColorAngle` | range | -360 to 360 |
| `lineColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/loops/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/loops/definition.json`.

---

Source: https://www.dicebear.com/styles/loops/presets/

# Loops presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette carries the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar shares it and only the loops changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

## Close Up

Uses scale rather than color. Cropping in turns the composition from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/lorelei-neutral/

# Lorelei Neutral

Lorelei Neutral is a reduced variant of the Lorelei style, drawing only the
eyes, nose, and mouth in delicate ink lines on a plain background, with no head
outline or hair.

- **Style name:** `lorelei-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- **Source:** https://www.figma.com/community/file/1198749693280469639
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/lorelei-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/lorelei-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/lorelei-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("lorelei-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features lorelei-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::LORELEI_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.LoreleiNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/lorelei_neutral.dart';

final style = Style.parse(loreleiNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.LoreleiNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear lorelei-neutral
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** Black on white, nothing added.
- **Sepia:** Brown ink on tanned paper.
- **Greyscale:** Charcoal on light grey.
- **Duotone:** Deep teal on mint, two colors total.
- **Inverted:** White line on near black.
- **Muted:** Six dusty grounds under the same line.
- **Electric:** Black line on six acid grounds.
- **Pastel Wall:** Five soft grounds.
- **Bold Pop:** Five saturated grounds.
- **Sunrise:** A warm gradient under the drawing.
- **Close Up:** Scaled in on the features.

The full option set of each one is at https://www.dicebear.com/styles/lorelei-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyebrowsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24` |
| `eyesProbability` | number | 0 to 100 |
| `frecklesVariant` | enum (array allowed) | `variant01` |
| `frecklesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `glassesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `happy01`, `happy02`, `happy03`, `happy04`, `happy05`, `happy06`, `happy07`, `happy08`, `happy09`, `happy10`, `happy11`, `happy12`, `happy13`, `happy14`, `happy15`, `happy16`, `happy17`, `happy18`, `sad01`, `sad02`, `sad03`, `sad04`, `sad05`, `sad06`, `sad07`, `sad08`, `sad09` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06` |
| `noseProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `eyebrowsColor` | color (array allowed) | Hex color, `#` optional |
| `eyebrowsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyebrowsColorFillStops` | range |  |
| `eyebrowsColorAngle` | range | -360 to 360 |
| `eyebrowsColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `frecklesColor` | color (array allowed) | Hex color, `#` optional |
| `frecklesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `frecklesColorFillStops` | range |  |
| `frecklesColorAngle` | range | -360 to 360 |
| `frecklesColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |
| `noseColor` | color (array allowed) | Hex color, `#` optional |
| `noseColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `noseColorFillStops` | range |  |
| `noseColorAngle` | range | -360 to 360 |
| `noseColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/lorelei-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/lorelei-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/lorelei-neutral/presets/

# Lorelei Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style at its plainest: the face drawn in black on a white ground. The baseline the rest of these presets move away from.

```json
{
  "backgroundColor": ["ffffff"]
}
```

## Sepia

Warm all the way through. With no head shape to fill, the background is the paper and the ink is the whole drawing.

```json
{
  "backgroundColor": ["e3d2b4"],
  "eyebrowsColor": ["4a3526"],
  "eyesColor": ["4a3526"],
  "frecklesColor": ["4a3526"],
  "glassesColor": ["4a3526"],
  "mouthColor": ["4a3526"],
  "noseColor": ["4a3526"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it, which suits an admin table or a comment thread where the avatar is a marker rather than a picture.

```json
{
  "backgroundColor": ["ececed"],
  "eyebrowsColor": ["3b3d42"],
  "eyesColor": ["3b3d42"],
  "frecklesColor": ["3b3d42"],
  "glassesColor": ["3b3d42"],
  "mouthColor": ["3b3d42"],
  "noseColor": ["3b3d42"]
}
```

## Duotone

One teal for the drawing and one pale mint for the ground, and that is the entire palette.

```json
{
  "backgroundColor": ["dff0eb"],
  "eyebrowsColor": ["0f3d38"],
  "eyesColor": ["0f3d38"],
  "frecklesColor": ["0f3d38"],
  "glassesColor": ["0f3d38"],
  "mouthColor": ["0f3d38"],
  "noseColor": ["0f3d38"]
}
```

## Inverted

Swaps line and ground. There is no filled head shape to dissolve here, only the drawing, so the inversion is clean.

```json
{
  "backgroundColor": ["111113"],
  "eyebrowsColor": ["f2f2f4"],
  "eyesColor": ["f2f2f4"],
  "frecklesColor": ["f2f2f4"],
  "glassesColor": ["f2f2f4"],
  "mouthColor": ["f2f2f4"],
  "noseColor": ["f2f2f4"]
}
```

## Muted

Changes only what the drawing sits on, and away from white rather than towards a brighter color.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "eyebrowsColor": ["1f1f22"],
  "eyesColor": ["1f1f22"],
  "frecklesColor": ["1f1f22"],
  "glassesColor": ["1f1f22"],
  "mouthColor": ["1f1f22"],
  "noseColor": ["1f1f22"]
}
```

## Electric

The other direction: six grounds past anything the style ships, with the line left black so it survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "eyebrowsColor": ["101216"],
  "eyesColor": ["101216"],
  "frecklesColor": ["101216"],
  "glassesColor": ["101216"],
  "mouthColor": ["101216"],
  "noseColor": ["101216"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Close Up

Uses scale rather than color. These styles leave a lot of air around the drawing, and cropping in buys it back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.3,
  "eyebrowsColor": ["2f2a24"],
  "eyesColor": ["2f2a24"],
  "frecklesColor": ["2f2a24"],
  "glassesColor": ["2f2a24"],
  "mouthColor": ["2f2a24"],
  "noseColor": ["2f2a24"]
}
```

---

Source: https://www.dicebear.com/styles/lorelei/

# Lorelei

Lorelei is a hand-drawn vector avatar style rendered in fine black ink lines,
with detailed hairstyles, expressive eyes, and sketched collars. Generate
illustration-style SVG profile icons for social apps, editorial sites, and user
accounts.

- **Style name:** `lorelei`
- **Category:** Characters
- **Animated:** no
- **Creator:** Lisa Wischofsky (https://www.instagram.com/lischi_art/)
- **Source:** https://www.figma.com/community/file/1198749693280469639
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/lorelei/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/lorelei.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/lorelei.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("lorelei.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features lorelei
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::LORELEI)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Lorelei))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/lorelei.dart';

final style = Style.parse(lorelei);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Lorelei);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear lorelei
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** Black on nothing, every accessory switched off.
- **Sepia:** Brown ink on tanned paper, contour included.
- **Greyscale:** One grey for the whole drawing.
- **Duotone:** Two colors and nothing else, deep teal on mint.
- **Muted:** Hair in six dusty tones, black line kept.
- **Electric:** Hair at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, the drawing untouched.
- **Bold Pop:** Eight backgrounds, eight hair colors, no restraint.
- **Night Shift:** Pale face and violet hair on near black.
- **Sunrise:** A warm gradient behind, the drawing untouched.
- **Sunset Fade:** The hair itself is a gradient, top to bottom.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/lorelei/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `beardVariant` | enum (array allowed) | `variant01`, `variant02` |
| `beardProbability` | number | 0 to 100 |
| `earringsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03` |
| `earringsProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24` |
| `eyesProbability` | number | 0 to 100 |
| `frecklesVariant` | enum (array allowed) | `variant01` |
| `frecklesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `glassesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30`, `variant31`, `variant32`, `variant33`, `variant34`, `variant35`, `variant36`, `variant37`, `variant38`, `variant39`, `variant40`, `variant41`, `variant42`, `variant43`, `variant44`, `variant45`, `variant46`, `variant47`, `variant48` |
| `hairProbability` | number | 0 to 100 |
| `hairAccessoriesVariant` | enum (array allowed) | `flowers` |
| `hairAccessoriesProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `happy01`, `happy02`, `happy03`, `happy04`, `happy05`, `happy06`, `happy07`, `happy08`, `happy09`, `happy10`, `happy11`, `happy12`, `happy13`, `happy14`, `happy15`, `happy16`, `happy17`, `happy18`, `sad01`, `sad02`, `sad03`, `sad04`, `sad05`, `sad06`, `sad07`, `sad08`, `sad09` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06` |
| `noseProbability` | number | 0 to 100 |
| `earringsColor` | color (array allowed) | Hex color, `#` optional |
| `earringsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `earringsColorFillStops` | range |  |
| `earringsColorAngle` | range | -360 to 360 |
| `earringsColorOrder` | enum | `random`, `fixed` |
| `eyebrowsColor` | color (array allowed) | Hex color, `#` optional |
| `eyebrowsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyebrowsColorFillStops` | range |  |
| `eyebrowsColorAngle` | range | -360 to 360 |
| `eyebrowsColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `frecklesColor` | color (array allowed) | Hex color, `#` optional |
| `frecklesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `frecklesColorFillStops` | range |  |
| `frecklesColorAngle` | range | -360 to 360 |
| `frecklesColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `hairAccessoriesColor` | color (array allowed) | Hex color, `#` optional |
| `hairAccessoriesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairAccessoriesColorFillStops` | range |  |
| `hairAccessoriesColorAngle` | range | -360 to 360 |
| `hairAccessoriesColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |
| `noseColor` | color (array allowed) | Hex color, `#` optional |
| `noseColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `noseColorFillStops` | range |  |
| `noseColorAngle` | range | -360 to 360 |
| `noseColorOrder` | enum | `random`, `fixed` |
| `outlineColor` | color (array allowed) | Hex color, `#` optional |
| `outlineColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `outlineColorFillStops` | range |  |
| `outlineColorAngle` | range | -360 to 360 |
| `outlineColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/lorelei/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/lorelei/definition.json`.

---

Source: https://www.dicebear.com/styles/lorelei/presets/

# Lorelei presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped to its drawing. No background at all, so the avatar sits on whatever your page is, and no glasses, earrings, freckles, beards or hair clips to distract from the line.

```json
{
  "backgroundColor": [],
  "beardProbability": 0,
  "earringsProbability": 0,
  "frecklesProbability": 0,
  "glassesProbability": 0,
  "hairAccessoriesProbability": 0
}
```

## Sepia

Warm all the way through. Lorelei used to paint its head and ear contours black where no option reached them, so a sepia set kept a hard black edge; `outlineColor` closes that gap and the whole drawing goes brown.

```json
{
  "backgroundColor": ["d6bd97"],
  "skinColor": ["e9d3b0"],
  "hairColor": ["4a3526"],
  "outlineColor": ["4a3526"],
  "eyebrowsColor": ["4a3526"],
  "eyesColor": ["4a3526"],
  "noseColor": ["4a3526"],
  "mouthColor": ["4a3526"],
  "frecklesColor": ["4a3526"],
  "glassesColor": ["4a3526"],
  "earringsColor": ["4a3526"],
  "hairAccessoriesColor": ["4a3526"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it, which suits an admin table or a comment thread where the avatar is a marker rather than a picture.

```json
{
  "backgroundColor": ["f0f0f2"],
  "skinColor": ["e4e4e6"],
  "hairColor": ["3f4247"],
  "outlineColor": ["3f4247"],
  "eyebrowsColor": ["3f4247"],
  "eyesColor": ["3f4247"],
  "noseColor": ["3f4247"],
  "mouthColor": ["3f4247"],
  "frecklesColor": ["3f4247"],
  "glassesColor": ["3f4247"],
  "earringsColor": ["3f4247"],
  "hairAccessoriesColor": ["3f4247"]
}
```

## Duotone

One teal for every line and the head contour, one pale mint for the face, and that is the entire palette. Restrictive on purpose: two colors is the point at which a set of avatars stops looking like a collection of people and starts looking like an icon set.

```json
{
  "backgroundColor": ["e8f3f0"],
  "skinColor": ["cfe4de"],
  "hairColor": ["0f3d38"],
  "outlineColor": ["0f3d38"],
  "eyebrowsColor": ["0f3d38"],
  "eyesColor": ["0f3d38"],
  "noseColor": ["0f3d38"],
  "mouthColor": ["0f3d38"],
  "frecklesColor": ["0f3d38"],
  "glassesColor": ["0f3d38"],
  "earringsColor": ["0f3d38"],
  "hairAccessoriesColor": ["0f3d38"]
}
```

## Muted

Lorelei draws hair as a filled shape, which makes it the one area with real surface. Six dusty tones there, and the linework left black, gives the style color without turning it into a cartoon.

```json
{
  "backgroundColor": ["ece7de"],
  "skinColor": ["fdfbf7"],
  "hairColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction: six hair colors past anything the style ships, on a dark background, with the face and linework pale so the hair is what carries the color.

```json
{
  "backgroundColor": ["101216"],
  "skinColor": ["f2f2f4"],
  "outlineColor": ["101216"],
  "hairColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "eyebrowsColor": ["101216"],
  "eyesColor": ["101216"],
  "noseColor": ["101216"],
  "mouthColor": ["101216"],
  "frecklesColor": ["101216"],
  "glassesColor": ["101216"],
  "earringsColor": ["101216"],
  "hairAccessoriesColor": ["101216"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loudest set here, and the one where two avatars next to each other are least likely to look related. Everything still comes from the seed, so it stays deterministic, it just does not stay quiet.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff","ff8c42","2ec4b6","f15bb5"],
  "skinColor": ["fffdfb"],
  "hairColor": ["1b1b3a","d90429","0466c8","007f5f","7b2cbf","f77f00","006d77","9d0208"],
  "eyebrowsColor": ["1b1b3a"],
  "eyesColor": ["1b1b3a"],
  "noseColor": ["1b1b3a"],
  "mouthColor": ["1b1b3a"],
  "frecklesColor": ["1b1b3a"],
  "glassesColor": ["1b1b3a"],
  "earringsColor": ["1b1b3a"],
  "hairAccessoriesColor": ["1b1b3a"]
}
```

## Night Shift

For dark interfaces. The head stays light so the drawing keeps its detail, and only the hair carries color. The linework goes deep indigo rather than black, which stops it looking like a hole in the face.

```json
{
  "backgroundColor": ["121219"],
  "skinColor": ["e9e6f5"],
  "hairColor": ["8b6cff"],
  "eyebrowsColor": ["3a3350"],
  "eyesColor": ["2a2440"],
  "noseColor": ["3a3350"],
  "mouthColor": ["6b4bd6"],
  "frecklesColor": ["3a3350"],
  "glassesColor": ["2a2440"],
  "earringsColor": ["8b6cff"],
  "hairAccessoriesColor": ["8b6cff"],
  "outlineColor": ["3a3350"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Sunset Fade

The same gradient options aimed at a component instead of the background: two hair colors, a linear fill and a fixed angle. Which color ends up on top is still the seed's choice, so the fade runs both ways across a set.

```json
{
  "backgroundColor": ["fff1e0"],
  "skinColor": ["fffaf4"],
  "hairColor": ["ff8a4c","b0468c"],
  "hairColorFill": "linear",
  "hairColorAngle": 90,
  "eyebrowsColor": ["7a3a63"],
  "eyesColor": ["3b2233"],
  "noseColor": ["7a3a63"],
  "mouthColor": ["b0468c"],
  "frecklesColor": ["b0468c"],
  "glassesColor": ["3b2233"],
  "earringsColor": ["b0468c"],
  "hairAccessoriesColor": ["ff8a4c"],
  "outlineColor": ["3b2233"]
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends most of it on empty shoulders, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f1ece4"],
  "scale": 1.15,
  "skinColor": ["fffdf9"],
  "hairColor": ["2f2a24"],
  "eyebrowsColor": ["2f2a24"],
  "eyesColor": ["2f2a24"],
  "noseColor": ["2f2a24"],
  "mouthColor": ["2f2a24"],
  "frecklesColor": ["2f2a24"],
  "glassesColor": ["2f2a24"],
  "earringsColor": ["2f2a24"],
  "hairAccessoriesColor": ["2f2a24"],
  "outlineColor": ["2f2a24"]
}
```

---

Source: https://www.dicebear.com/styles/marbles/

# Marbles

Marbles sets a small face on a colored sphere. Three blurred ellipses do the
shading, a second color, a pastel tint and a white bloom, so the ball reads as
round without a gradient. Twenty tops cover hats, headphones, hair, a bow and an
antenna, and the face has nine eye sets, eleven mouths and a nose on three of
four seeds, all at one line weight. Generate hand-drawn profile pictures for
communities and games.

- **Style name:** `marbles`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/marbles/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/marbles.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/marbles.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("marbles.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features marbles
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::MARBLES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Marbles))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/marbles.dart';

final style = Style.parse(marbles);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Marbles);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear marbles
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No nose on anyone.
- **Sepia:** One warm brown marble.
- **Greyscale:** The same marble without hue.
- **Duotone:** One indigo at three lightnesses.
- **Muted:** Dusty marbles instead of the candy palette.
- **Electric:** Marbles past anything the style ships.
- **Pastel Wall:** Pale grounds instead of the one paper white.
- **Bold Pop:** Saturated ground, pale ink over it.
- **Night Shift:** Near black ground, pale ink.
- **Sunrise:** A warm gradient behind the marble.
- **Full Cast:** A nose on everyone.
- **Close Up:** Scaled in as far as the tops allow.

The full option set of each one is at https://www.dicebear.com/styles/marbles/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `blendVariant` | enum (array allowed) | `core`, `dawn`, `drift`, `dusk`, `swell`, `tide` |
| `blendProbability` | number | 0 to 100 |
| `topVariant` | enum (array allowed) | `afro`, `antenna`, `beanie`, `bow`, `cap`, `cowlick`, `crimp`, `curl`, `curls`, `flick`, `garland`, `headphones`, `knot`, `ringlets`, `shag`, `spikes`, `sunhat`, `swirl`, `tuft`, `zigzag` |
| `topProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `closed`, `dots`, `happy`, `oval`, `sleepy`, `squint`, `uneven`, `wide`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `hook`, `tick` |
| `noseProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `cat`, `grin`, `jagged`, `line`, `open`, `pout`, `small`, `smile`, `smirk`, `tongue`, `wavy` |
| `mouthProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `sphereColor` | color (array allowed) | Hex color, `#` optional |
| `sphereColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `sphereColorFillStops` | range |  |
| `sphereColorAngle` | range | -360 to 360 |
| `sphereColorOrder` | enum | `random`, `fixed` |
| `blendColor` | color (array allowed) | Hex color, `#` optional |
| `blendColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `blendColorFillStops` | range |  |
| `blendColorAngle` | range | -360 to 360 |
| `blendColorOrder` | enum | `random`, `fixed` |
| `tintColor` | color (array allowed) | Hex color, `#` optional |
| `tintColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `tintColorFillStops` | range |  |
| `tintColorAngle` | range | -360 to 360 |
| `tintColorOrder` | enum | `random`, `fixed` |
| `bloomColor` | color (array allowed) | Hex color, `#` optional |
| `bloomColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bloomColorFillStops` | range |  |
| `bloomColorAngle` | range | -360 to 360 |
| `bloomColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/marbles/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/marbles/definition.json`.

---

Source: https://www.dicebear.com/styles/marbles/presets/

# Marbles presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The nose is the style's one optional piece and it appears on three of four seeds. Without it the face is eyes and a mouth, which is closer to how the smaller drawing styles handle a face at avatar size.

```json
{
  "noseProbability": 0
}
```

## Sepia

The sphere is shaded by three blurred ellipses rather than a gradient definition, so a monochrome set has to move all of them together: the second color, the pale tint and the ground.

```json
{
  "backgroundColor": ["f1e7d8"],
  "sphereColor": ["b98f6c"],
  "blendColor": ["8a6244"],
  "tintColor": ["e6d3ba"],
  "inkColor": ["2f2016"]
}
```

## Greyscale

The face is one ink weight on a shaded ball, and both survive losing color. Useful for a print stylesheet or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["ececee"],
  "sphereColor": ["b6b6b9"],
  "blendColor": ["7c7c80"],
  "tintColor": ["dcdce0"],
  "inkColor": ["1a1a1e"]
}
```

## Duotone

Sphere, blend and tint take the same hue at three steps, which is as close to a single color as the shading allows. The style requires the blend to differ from the sphere, so the two cannot collapse into one.

```json
{
  "backgroundColor": ["e6e8f5"],
  "sphereColor": ["8e97d6"],
  "blendColor": ["5a63a8"],
  "tintColor": ["cfd4ee"],
  "inkColor": ["1d2040"]
}
```

## Muted

The style ships fifteen spheres at full saturation. These are the same marbles in tones that hold still, which suits a list where a dozen appear at once.

```json
{
  "backgroundColor": ["ece8e0"],
  "sphereColor": ["a5a58d","b98b73","8e9aaf","9c8a94","8fa38f","b0a58c"],
  "blendColor": ["8a8a72","9c7460","737f94","82707c","7d8f7d","978c76"],
  "tintColor": ["ddd8cc","e4d5c8","d3d8e2","ded3d8"]
}
```

## Electric

The same lever the other way. The ground goes near black and the ink with it goes pale, because the hair and the antennae are drawn outside the sphere where a dark line would disappear.

```json
{
  "backgroundColor": ["0f0f12"],
  "sphereColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"],
  "blendColor": ["b400ff","ff2e88","00e5ff","7cff00","ffe600","ff6a00"],
  "tintColor": ["ffd6f0","d6fbff","eaffd6"],
  "inkColor": ["f4f4f6"]
}
```

## Pastel Wall

The style ships a single background. Five pale ones turn a set from a sheet of specimens into something that belongs to whatever page it sits on.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Loud enough that the avatar holds its own against a busy page. The ink goes near white, since the hair reaches past the sphere and onto the ground.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"],
  "inkColor": ["f8f8fa"]
}
```

## Night Shift

For dark interfaces. The marbles are bright already, so only the ink has to move, and it moves because the hair is drawn outside the sphere.

```json
{
  "backgroundColor": ["16161a"],
  "inkColor": ["f4f4f6"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

The nose is a two variant component at three quarters probability. Turned all the way up, every face gets the extra mark and the set reads as one drawing rather than two.

```json
{
  "noseProbability": 100
}
```

## Close Up

Uses scale rather than color. This one stops at 1.1 where the other styles go further, because the hair and the antenna are drawn above the sphere and reach the top of the frame. Anything tighter cuts them off mid stroke.

```json
{
  "scale": 1.1
}
```

---

Source: https://www.dicebear.com/styles/micah/

# Micah

Micah is a flat-design vector avatar style of half-body portraits with clean
outlines, simple facial features, and bold color combinations across hair,
clothing, and background. Generate SVG profile icons for modern web and mobile
applications.

- **Style name:** `micah`
- **Category:** Characters
- **Animated:** no
- **Creator:** Micah Lanier (https://dribbble.com/micahlanier)
- **Source:** https://www.figma.com/community/file/829741575478342595
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/micah/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/micah.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/micah.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("micah.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features micah
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::MICAH)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Micah))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/micah.dart';

final style = Style.parse(micah);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Micah);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear micah
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no glasses, earrings or stubble.
- **Sepia:** One warm brown for skin, hair and shirt.
- **Greyscale:** No color anywhere, skin included.
- **Duotone:** Four steps of one indigo and nothing else.
- **Muted:** Dusty hair and shirts, skin left to the seed.
- **Electric:** Hair and shirts at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, everything else untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind, everything else untouched.
- **Night Shift:** Near black behind, light hair and shirts.
- **Full Cast:** Glasses, earrings and stubble turned up.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/micah/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `clothesVariant` | enum (array allowed) | `collared`, `crew`, `open` |
| `clothesProbability` | number | 0 to 100 |
| `earringsVariant` | enum (array allowed) | `hoop`, `stud` |
| `earringsProbability` | number | 0 to 100 |
| `earsVariant` | enum (array allowed) | `attached`, `detached` |
| `earsProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `down`, `eyelashesDown`, `eyelashesUp`, `up` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `eyes`, `eyesShadow`, `round`, `smiling`, `smilingShadow` |
| `eyesProbability` | number | 0 to 100 |
| `facialHairVariant` | enum (array allowed) | `beard`, `scruff` |
| `facialHairProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `round`, `square` |
| `glassesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `dannyPhantom`, `dougFunny`, `fonze`, `full`, `mrClean`, `mrT`, `pixie`, `turban` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `standard` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `frown`, `laughing`, `nervous`, `pucker`, `sad`, `smile`, `smirk`, `surprised` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `curve`, `pointed`, `tound` |
| `noseProbability` | number | 0 to 100 |
| `baseColor` | color (array allowed) | Hex color, `#` optional |
| `baseColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `baseColorFillStops` | range |  |
| `baseColorAngle` | range | -360 to 360 |
| `baseColorOrder` | enum | `random`, `fixed` |
| `earringColor` | color (array allowed) | Hex color, `#` optional |
| `earringColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `earringColorFillStops` | range |  |
| `earringColorAngle` | range | -360 to 360 |
| `earringColorOrder` | enum | `random`, `fixed` |
| `eyeShadowColor` | color (array allowed) | Hex color, `#` optional |
| `eyeShadowColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyeShadowColorFillStops` | range |  |
| `eyeShadowColorAngle` | range | -360 to 360 |
| `eyeShadowColorOrder` | enum | `random`, `fixed` |
| `eyebrowsColor` | color (array allowed) | Hex color, `#` optional |
| `eyebrowsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyebrowsColorFillStops` | range |  |
| `eyebrowsColorAngle` | range | -360 to 360 |
| `eyebrowsColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `facialHairColor` | color (array allowed) | Hex color, `#` optional |
| `facialHairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `facialHairColorFillStops` | range |  |
| `facialHairColorAngle` | range | -360 to 360 |
| `facialHairColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |
| `shirtColor` | color (array allowed) | Hex color, `#` optional |
| `shirtColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shirtColorFillStops` | range |  |
| `shirtColorAngle` | range | -360 to 360 |
| `shirtColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/micah/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/micah/definition.json`.

---

Source: https://www.dicebear.com/styles/micah/presets/

# Micah presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, so the avatar sits on whatever your page is, and the three components that only show on a third of seeds switched off.

```json
{
  "backgroundColor": [],
  "earringsProbability": 0,
  "glassesProbability": 0,
  "facialHairProbability": 0
}
```

## Sepia

A real sepia print, which means the skin tone goes with it. Every other preset here leaves skin to the seed; this one cannot, because a color photograph of a face is not sepia. Two of the eight mouths are painted pink rather than taking the mouth color group, so those drop out.

```json
{
  "backgroundColor": ["e3d2b4"],
  "baseColor": ["d8b48c","c19a70","a37e58"],
  "hairColor": ["5a3d28","6b4f35","7d6047"],
  "shirtColor": ["8a6a48","9c7c58"],
  "eyebrowsColor": ["3f2d1e"],
  "eyesColor": ["3f2d1e"],
  "mouthColor": ["3f2d1e"],
  "facialHairColor": ["3f2d1e"],
  "eyeShadowColor": ["f0e2cc"],
  "glassesColor": ["3f2d1e"],
  "earringColor": ["8a6a48"],
  "mouthVariant": ["frown","nervous","pucker","sad","smile","smirk"]
}
```

## Greyscale

Properly grey rather than grey hair on a colored face. Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. Two of the eight mouths are painted pink rather than taking the mouth color group, so those drop out.

```json
{
  "backgroundColor": ["ececee"],
  "baseColor": ["dcdcde","b6b6b9","8c8c90"],
  "hairColor": ["343437","5a5a5e","828286"],
  "shirtColor": ["6e6e72","9a9a9e"],
  "eyebrowsColor": ["232326"],
  "eyesColor": ["232326"],
  "mouthColor": ["232326"],
  "facialHairColor": ["232326"],
  "eyeShadowColor": ["f2f2f4"],
  "glassesColor": ["232326"],
  "earringColor": ["6e6e72"],
  "mouthVariant": ["frown","nervous","pucker","sad","smile","smirk"]
}
```

## Duotone

Background, skin, hair and shirt take the same hue at four lightnesses. The style requires each of them to differ from the others, so a duotone here is really a four-step tonal ladder. Two of the eight mouths are painted pink rather than taking the mouth color group, so those drop out.

```json
{
  "backgroundColor": ["dfe3f5"],
  "baseColor": ["9aa2d2"],
  "hairColor": ["3d4272"],
  "shirtColor": ["6a71a8"],
  "eyebrowsColor": ["23264a"],
  "eyesColor": ["23264a"],
  "mouthColor": ["23264a"],
  "facialHairColor": ["23264a"],
  "eyeShadowColor": ["e8eaf7"],
  "glassesColor": ["23264a"],
  "earringColor": ["6a71a8"],
  "mouthVariant": ["frown","nervous","pucker","sad","smile","smirk"]
}
```

## Muted

The style shares one bright thirteen-color palette across hair, shirt, glasses and earrings. This swaps it for dusty tones, which stops a page of avatars looking like a paint box.

```json
{
  "backgroundColor": ["ece7de"],
  "hairColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "shirtColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "glassesColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "earringColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships, on a dark background so they read as lit. Skin still comes from the seed.

```json
{
  "backgroundColor": ["101216"],
  "hairColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "shirtColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. Strong enough that the avatar holds its own against a busy page, and the only preset here that will fight with a colorful interface rather than sit inside it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Night Shift

For dark interfaces. Hair and shirt drop to the pale end of the style's own palette so the silhouette does not disappear into the background.

```json
{
  "backgroundColor": ["16161c"],
  "hairColor": ["f9c9b6","d2eff3","e0ddff","ffeba4","ffedef"],
  "shirtColor": ["d2eff3","e0ddff","ffeba4","6bd9e9"]
}
```

## Full Cast

Three components sit at 10 to 30 percent, so a small set of avatars rarely shows them. This raises all three, which is what you want when showing the style off rather than filling a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "earringsProbability": 60,
  "glassesProbability": 55,
  "facialHairProbability": 40
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends most of it on shoulders, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/miniavs/

# Miniavs

Miniavs is a flat-design vector avatar style with chunky half-body characters
sporting bold hairstyles, simple expressions, and colorful tops. Generate
friendly SVG profile icons that read clearly even at small sizes, well suited to
compact user lists and mobile UIs.

- **Style name:** `miniavs`
- **Category:** Characters
- **Animated:** no
- **Creator:** Webpixels (https://webpixels.io/)
- **Source:** https://www.figma.com/community/file/923211396597067458
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/miniavs/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/miniavs.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/miniavs.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("miniavs.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features miniavs
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::MINIAVS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Miniavs))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/miniavs.dart';

final style = Style.parse(miniavs);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Miniavs);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear miniavs
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no blush, glasses or moustache.
- **Terracotta:** A warm red-brown set built around the fixed mouth.
- **Muted:** Dusty shirts, hair left natural.
- **Electric:** Shirts at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, everything else untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind, everything else untouched.
- **Night Shift:** Near black behind, light shirts in front.
- **Full Cast:** Blush, glasses and moustaches turned up.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/miniavs/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `blushVariant` | enum (array allowed) | `default` |
| `blushProbability` | number | 0 to 100 |
| `bodyVariant` | enum (array allowed) | `golf`, `tShirt` |
| `bodyProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `confident`, `happy`, `normal` |
| `eyesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `normal` |
| `glassesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `balndess`, `classic01`, `classic02`, `curly`, `elvis`, `long`, `ponyTail`, `slaughter`, `stylish` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `normal`, `thin`, `wide` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `default`, `missingTooth` |
| `mouthProbability` | number | 0 to 100 |
| `mustacheVariant` | enum (array allowed) | `freddy`, `horshoe`, `pencilThin`, `pencilThinBeard` |
| `mustacheProbability` | number | 0 to 100 |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/miniavs/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/miniavs/definition.json`.

---

Source: https://www.dicebear.com/styles/miniavs/presets/

# Miniavs presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, so the avatar sits on whatever your page is, and the three components that only show on a fifth of seeds switched off.

```json
{
  "backgroundColor": [],
  "blushProbability": 0,
  "glassesProbability": 0,
  "mustacheProbability": 0
}
```

## Terracotta

Not quite a sepia. Miniavs paints the inside of both mouths a pink-red that no option reaches, so a brown or grey set keeps one loud spot. This leans the whole palette red instead, which takes that color in rather than fighting it. The blush and the pink hair tie still switch off.

```json
{
  "backgroundColor": ["e7cdbd"],
  "skinColor": ["dcae95","c08e77","9c6b58"],
  "hairColor": ["6b3529","8a4433","4a231c"],
  "bodyColor": ["a85440","8f4436","c26850"],
  "blushProbability": 0,
  "hairVariant": ["balndess","classic01","classic02","curly","elvis","long","slaughter","stylish"]
}
```

## Muted

The style ships three shirt colors and all of them are loud: cobalt, orange and magenta. This replaces them with dusty tones, which is a bigger change here than in most styles because the shirt is a large flat area.

```json
{
  "backgroundColor": ["ece7de"],
  "bodyColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships, on a dark background so they read as lit. Hair and skin still come from the seed.

```json
{
  "backgroundColor": ["101216"],
  "bodyColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. Strong enough that the avatar holds its own against a busy page, and the only preset here that will fight with a colorful interface rather than sit inside it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Night Shift

For dark interfaces. The shirt pool goes light so the body does not disappear into the background, and the hair stays dark, which reads as a silhouette rather than a mistake.

```json
{
  "backgroundColor": ["16161c"],
  "bodyColor": ["dfe3f5","c9d6e8","e8dcc4"]
}
```

## Full Cast

Three components sit at twenty percent, so most avatars show none of them. This raises all three, which is what you want when showing the style off rather than filling a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "blushProbability": 60,
  "glassesProbability": 50,
  "mustacheProbability": 45
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends a lot of it on shoulders, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/moods/

# Moods

Moods is a friendly vector avatar style of soft pastel shapes with simple faces
that range from cheerful to sleepy to grumpy. Generate expressive SVG profile
icons for chat apps, feedback tools, and communities.

- **Style name:** `moods`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/moods/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/moods.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/moods.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("moods.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features moods
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::MOODS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Moods))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/moods.dart';

final style = Style.parse(moods);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Moods);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear moods
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No blush, just the face and its expression.
- **Sepia:** Brown face, brown ground, brown ink.
- **Greyscale:** No hue at all, same mouth exclusion.
- **Duotone:** One mint face on one deep green.
- **Muted:** Dusty faces on a dusty ground.
- **Electric:** Faces past anything the style ships.
- **Pastel Wall:** Soft ground instead of the deep one.
- **Bold Pop:** Six grounds at full strength.
- **Night Shift:** Near-black ground, pale face.
- **Sunrise:** A warm gradient behind the face.
- **Close Up:** The face scaled up in the frame.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/moods/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `faceVariant` | enum (array allowed) | `bean`, `blob`, `circle`, `hexagon`, `pebble`, `softSquare`, `squircle`, `tall`, `wide` |
| `faceProbability` | number | 0 to 100 |
| `cheeksVariant` | enum (array allowed) | `blush` |
| `cheeksProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `angry`, `bigPupils`, `calm`, `closed`, `happy`, `lookDown`, `lookSide`, `lookUp`, `pupils`, `sleepy`, `small`, `sparkle`, `squint`, `tallPupils`, `uneven`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `bigSmile`, `cat`, `frown`, `gasp`, `grin`, `laugh`, `line`, `open`, `smile`, `smileOpen`, `smirk`, `teeth`, `tongue`, `wavy`, `wide` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `faceColor` | color (array allowed) | Hex color, `#` optional |
| `faceColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `faceColorFillStops` | range |  |
| `faceColorAngle` | range | -360 to 360 |
| `faceColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/moods/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/moods/definition.json`.

---

Source: https://www.dicebear.com/styles/moods/presets/

# Moods presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Blush shows up on half the avatars by default. Off, the two things left are the shape of the head and what it is doing with its eyes and mouth.

```json
{
  "cheeksProbability": 0
}
```

## Sepia

Two mouth variants are excluded here. They are drawn with a pink tongue painted straight into the artwork, and no color option reaches it.

```json
{
  "backgroundColor": ["4a3520"],
  "faceColor": ["d9bd94","c4a377","e3cdb0"],
  "inkColor": ["2b1d10"],
  "mouthVariant": ["smile","wide","bigSmile","grin","cat","smirk","gasp","line","frown","wavy","teeth"]
}
```

## Greyscale

The style is built on flat shapes with a soft drop shadow, so it survives losing color better than a line style would.

```json
{
  "backgroundColor": ["3f3f46"],
  "faceColor": ["e4e4e7","d4d4d8","c1c1c7"],
  "inkColor": ["18181b"],
  "mouthVariant": ["smile","wide","bigSmile","grin","cat","smirk","gasp","line","frown","wavy","teeth"]
}
```

## Duotone

A single face color across a whole set. What is left to tell avatars apart is the head shape and the expression, which in this style is plenty.

```json
{
  "backgroundColor": ["0d3b2e"],
  "faceColor": ["6ee7b9"],
  "inkColor": ["07281e"],
  "mouthVariant": ["smile","wide","bigSmile","grin","cat","smirk","gasp","line","frown","wavy","teeth"]
}
```

## Muted

The style ships twelve faces at candy brightness. These twelve are the same idea in tones that hold still, for a list where a dozen appear at once. The tongue mouths are excluded, the same ones the monochrome presets drop, because their pink is painted in rather than picked.

```json
{
  "mouthVariant": ["smile","wide","bigSmile","grin","cat","smirk","gasp","line","frown","wavy","teeth"],
  "backgroundColor": ["3a3a3f","41413a","3a4140","3f3a41"],
  "faceColor": ["a5a58d","b98b73","8e9aaf","9c8a94","8fa38f","b0a58c"]
}
```

## Electric

The same lever the other way. The ground stays near-black so the face is the only lit thing on the tile.

```json
{
  "backgroundColor": ["0f0f12"],
  "faceColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Every background the style ships is dark and saturated. These are pale, which turns the same avatar from a spotlight into a sticker.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

Louder than the shipped set and pushed toward the primaries. The dark ink around the eyes keeps the face readable on top of it.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The face palette stays light rather than inverting, because a dark face loses its eyes and its drop shadow at the same time.

```json
{
  "backgroundColor": ["16161a"],
  "faceColor": ["e2e8f0","a5b4fc","5eead4","fcd34d"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ff7a9c","ffb37a"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Close Up

The style leaves a generous margin, which costs size at 24 or 32 pixels. This crops in until the face nearly touches the edge and the expression carries.

```json
{
  "scale": 1.3
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/notionists-neutral/

# Notionists Neutral

Notionists Neutral is a reduced variant of the Notionists style, drawing only
the eyes, nose, and mouth in loose black ink lines on a plain background, with
no head, hair, or body.

- **Style name:** `notionists-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** Zoish (https://bio.link/heyzoish)
- **Source:** https://heyzoish.gumroad.com/l/notionists
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/notionists-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/notionists-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/notionists-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("notionists-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features notionists-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::NOTIONISTS_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.NotionistsNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/notionists_neutral.dart';

final style = Style.parse(notionistsNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.NotionistsNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear notionists-neutral
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** Black on white, nothing added.
- **Sepia:** Brown ink on tanned paper.
- **Greyscale:** Charcoal on light grey.
- **Duotone:** Deep teal on mint, two colors total.
- **Inverted:** White line on near black, like chalk.
- **Muted:** Six dusty grounds under the same line.
- **Electric:** Black line on six acid grounds.
- **Pastel Wall:** Five soft grounds.
- **Bold Pop:** Five saturated grounds.
- **Sunrise:** A warm gradient under the drawing.
- **Close Up:** Scaled in on the features.

The full option set of each one is at https://www.dicebear.com/styles/notionists-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyebrowsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `eyesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11` |
| `glassesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20` |
| `noseProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `paperColor` | color (array allowed) | Hex color, `#` optional |
| `paperColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `paperColorFillStops` | range |  |
| `paperColorAngle` | range | -360 to 360 |
| `paperColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/notionists-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/notionists-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/notionists-neutral/presets/

# Notionists Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style at its plainest: the face drawn in black on a white ground. The baseline the rest of these presets move away from.

```json
{
  "backgroundColor": ["ffffff"]
}
```

## Sepia

Warm all the way through. With no head shape to fill, the background is the paper and the ink is the whole drawing.

```json
{
  "backgroundColor": ["e3d2b4"],
  "inkColor": ["4a3526"],
  "paperColor": ["f5ead6"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it, which suits an admin table or a comment thread where the avatar is a marker rather than a picture.

```json
{
  "backgroundColor": ["ececed"],
  "inkColor": ["3b3d42"],
  "paperColor": ["fafafa"]
}
```

## Duotone

One teal for the drawing and one pale mint for the ground, and that is the entire palette.

```json
{
  "backgroundColor": ["dff0eb"],
  "inkColor": ["0f3d38"],
  "paperColor": ["eefaf6"]
}
```

## Inverted

Swaps the two colors. The fill is a color group of its own here, so it goes dark with the ground and the drawing reads as chalk on a board rather than as pale lines dissolving.

```json
{
  "backgroundColor": ["111113"],
  "inkColor": ["f2f2f4"],
  "paperColor": ["1c1c20"]
}
```

## Muted

Changes only what the drawing sits on, and away from white rather than towards a brighter color.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "inkColor": ["1f1f22"],
  "paperColor": ["f0efe9"]
}
```

## Electric

The other direction: six grounds past anything the style ships, with the line left black so it survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "inkColor": ["101216"],
  "paperColor": ["ffffff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Close Up

Uses scale rather than color. These styles leave a lot of air around the drawing, and cropping in buys it back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.3,
  "inkColor": ["2f2a24"],
  "paperColor": ["fffdf9"]
}
```

---

Source: https://www.dicebear.com/styles/notionists/

# Notionists

Notionists is a hand-drawn black-line vector avatar style of half-body
characters posing with small props like phones or coffee cups. Generate
casual-professional SVG profile icons for productivity tools, docs apps, and
team workspaces.

- **Style name:** `notionists`
- **Category:** Characters
- **Animated:** no
- **Creator:** Zoish (https://bio.link/heyzoish)
- **Source:** https://heyzoish.gumroad.com/l/notionists
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/notionists/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/notionists.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/notionists.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("notionists.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features notionists
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::NOTIONISTS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Notionists))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/notionists.dart';

final style = Style.parse(notionists);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Notionists);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear notionists
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, none of the rare extras.
- **Sepia:** Brown ink on aged paper.
- **Greyscale:** Charcoal on light grey.
- **Duotone:** Deep teal on mint, two colors total.
- **Inverted:** White line on black, like chalk.
- **Pastel Wall:** Five soft backgrounds, the drawing untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind, the drawing untouched.
- **Full Cast:** Beards, glasses, gestures and shirt prints turned up.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/notionists/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `beardVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12` |
| `beardProbability` | number | 0 to 100 |
| `clothesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25` |
| `clothesProbability` | number | 0 to 100 |
| `clothesGraphicVariant` | enum (array allowed) | `electric`, `galaxy`, `saturn` |
| `clothesGraphicProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `eyesProbability` | number | 0 to 100 |
| `gestureVariant` | enum (array allowed) | `hand`, `handPhone`, `ok`, `okLongArm`, `point`, `pointLongArm`, `waveLongArm`, `waveLongArms`, `waveOkLongArms`, `wavePointLongArms` |
| `gestureProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11` |
| `glassesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `hat`, `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30`, `variant31`, `variant32`, `variant33`, `variant34`, `variant35`, `variant36`, `variant37`, `variant38`, `variant39`, `variant40`, `variant41`, `variant42`, `variant43`, `variant44`, `variant45`, `variant46`, `variant47`, `variant48`, `variant49`, `variant50`, `variant51`, `variant52`, `variant53`, `variant54`, `variant55`, `variant56`, `variant57`, `variant58`, `variant59`, `variant60`, `variant61`, `variant62`, `variant63` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `variant01` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23`, `variant24`, `variant25`, `variant26`, `variant27`, `variant28`, `variant29`, `variant30` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20` |
| `noseProbability` | number | 0 to 100 |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `paperColor` | color (array allowed) | Hex color, `#` optional |
| `paperColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `paperColorFillStops` | range |  |
| `paperColorAngle` | range | -360 to 360 |
| `paperColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/notionists/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/notionists/definition.json`.

---

Source: https://www.dicebear.com/styles/notionists/presets/

# Notionists presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, so the drawing sits on whatever your page is, and the beard, gesture, glasses and shirt print all switched off.

```json
{
  "backgroundColor": [],
  "beardProbability": 0,
  "gestureProbability": 0,
  "glassesProbability": 0,
  "clothesGraphicProbability": 0
}
```

## Sepia

The style only has two colors, so a sepia treatment is the whole picture at once: warm brown for every line and filled mass, tanned paper for the body.

```json
{
  "backgroundColor": ["e3d2b4"],
  "inkColor": ["4a3526"],
  "paperColor": ["f5ead6"]
}
```

## Greyscale

The quietest set here. Nothing competes with the page around it, which suits an admin table or a comment thread where the avatar is a marker rather than a picture.

```json
{
  "backgroundColor": ["ececed"],
  "inkColor": ["3b3d42"],
  "paperColor": ["fafafa"]
}
```

## Duotone

Notionists draws with exactly one dark and one light color, which makes it the one style where a duotone is not an approximation. These two are the entire palette.

```json
{
  "backgroundColor": ["dff0eb"],
  "inkColor": ["0f3d38"],
  "paperColor": ["eefaf6"]
}
```

## Inverted

Swaps the two colors. Most styles break when the linework goes pale, because their fills stay light and the outlines dissolve. Here the fill is a color group too, so it goes dark with the background and the drawing reads as chalk on a board.

```json
{
  "backgroundColor": ["111113"],
  "inkColor": ["f2f2f4"],
  "paperColor": ["1c1c20"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Black on a strong color is the most legible this style gets. Strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

Four components sit between 10 and 50 percent, so a small set of avatars rarely shows any of them. This raises all four, which is what you want when showing the style off rather than filling a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "beardProbability": 45,
  "gestureProbability": 40,
  "glassesProbability": 50,
  "clothesGraphicProbability": 70
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends most of it on shoulders, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/open-peeps/

# Open Peeps

Open Peeps is a hand-drawn vector avatar style of diverse half-body characters
with sketchy outlines, mix-and-match hair, expressions, and accessories.
Generate friendly SVG profile icons for community platforms, marketing pages,
and social apps.

- **Style name:** `open-peeps`
- **Category:** Characters
- **Animated:** no
- **Creator:** Pablo Stanley (https://twitter.com/pablostanley)
- **Source:** https://www.openpeeps.com/
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/open-peeps/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/open-peeps.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/open-peeps.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("open-peeps.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features open-peeps
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::OPEN_PEEPS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.OpenPeeps))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/open_peeps.dart';

final style = Style.parse(openPeeps);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.OpenPeeps);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear open-peeps
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no accessories or masks.
- **Sepia:** One warm brown for skin, hair and shirt.
- **Greyscale:** No color anywhere, skin included.
- **Duotone:** Three steps of one indigo and nothing else.
- **Muted:** Dusty clothing and natural hair, nothing shouts.
- **Electric:** Shirts turned up to full saturation.
- **Pastel Wall:** Five soft backgrounds, everything else untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Night Shift:** Deep slate behind, light shirts in front.
- **Sunrise:** A warm gradient behind, everything else untouched.
- **Full Cast:** Accessories, facial hair and masks turned up.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/open-peeps/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `accessoriesVariant` | enum (array allowed) | `eyepatch`, `glasses`, `glasses2`, `glasses3`, `glasses4`, `glasses5`, `sunglasses`, `sunglasses2` |
| `accessoriesProbability` | number | 0 to 100 |
| `expressionVariant` | enum (array allowed) | `angryWithFang`, `awe`, `blank`, `calm`, `cheeky`, `concerned`, `concernedFear`, `contempt`, `cute`, `cyclops`, `driven`, `eatingHappy`, `explaining`, `eyesClosed`, `fear`, `hectic`, `lovingGrin1`, `lovingGrin2`, `monster`, `old`, `rage`, `serious`, `smile`, `smileBig`, `smileLOL`, `smileTeethGap`, `solemn`, `suspicious`, `tired`, `veryAngry` |
| `expressionProbability` | number | 0 to 100 |
| `facialHairVariant` | enum (array allowed) | `chin`, `full`, `full2`, `full3`, `full4`, `goatee1`, `goatee2`, `moustache1`, `moustache2`, `moustache3`, `moustache4`, `moustache5`, `moustache6`, `moustache7`, `moustache8`, `moustache9` |
| `facialHairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `afro`, `bangs`, `bangs2`, `bantuKnots`, `bear`, `bun`, `bun2`, `buns`, `cornrows`, `cornrows2`, `dreads1`, `dreads2`, `flatTop`, `flatTopLong`, `grayBun`, `grayMedium`, `grayShort`, `hatBeanie`, `hatHip`, `hijab`, `long`, `longAfro`, `longBangs`, `longCurly`, `medium1`, `medium2`, `medium3`, `mediumBangs`, `mediumBangs2`, `mediumBangs3`, `mediumStraight`, `mohawk`, `mohawk2`, `noHair1`, `noHair2`, `noHair3`, `pomp`, `shaved1`, `shaved2`, `shaved3`, `short1`, `short2`, `short3`, `short4`, `short5`, `turban`, `twists`, `twists2` |
| `headProbability` | number | 0 to 100 |
| `maskVariant` | enum (array allowed) | `medicalMask`, `respirator` |
| `maskProbability` | number | 0 to 100 |
| `clothingColor` | color (array allowed) | Hex color, `#` optional |
| `clothingColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `clothingColorFillStops` | range |  |
| `clothingColorAngle` | range | -360 to 360 |
| `clothingColorOrder` | enum | `random`, `fixed` |
| `headContrastColor` | color (array allowed) | Hex color, `#` optional |
| `headContrastColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `headContrastColorFillStops` | range |  |
| `headContrastColorAngle` | range | -360 to 360 |
| `headContrastColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/open-peeps/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/open-peeps/definition.json`.

---

Source: https://www.dicebear.com/styles/open-peeps/presets/

# Open Peeps presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, and the accessories, facial hair and mask all switched off so only the person is left.

```json
{
  "backgroundColor": [],
  "accessoriesProbability": 0,
  "facialHairProbability": 0,
  "maskProbability": 0
}
```

## Sepia

A real sepia print, which means the skin tone goes with it. Every other preset here leaves skin to the seed; this one cannot, because a color photograph of a face is not sepia. The mask switches off, since its blue is painted into the variant and no option reaches it.

```json
{
  "backgroundColor": ["e3d2b4"],
  "skinColor": ["d8b48c","c19a70","a37e58"],
  "clothingColor": ["c9ae86","b89b72","d6c19c"],
  "headContrastColor": ["7d6047","6b4f35","8f7154"],
  "inkColor": ["3f2d1e"],
  "maskProbability": 0
}
```

## Greyscale

Properly grey rather than grey hair on a colored face. Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The mask switches off, since its blue is painted into the variant and no option reaches it.

```json
{
  "backgroundColor": ["ececee"],
  "skinColor": ["dcdcde","c2c2c4","a2a2a5","7c7c80"],
  "clothingColor": ["c9c9cc","b0b0b3","dedee0"],
  "headContrastColor": ["4a4a4d","6b6b6f","8d8d91"],
  "inkColor": ["232326"],
  "maskProbability": 0
}
```

## Duotone

Background, skin, clothing and hair take the same hue at different lightnesses. As with Sepia, a duotone only works if the face joins in, so the seed loses its say over skin here. The mask switches off, since its blue is painted into the variant and no option reaches it.

```json
{
  "backgroundColor": ["dfe3f5"],
  "skinColor": ["9aa2d2"],
  "clothingColor": ["7d86bd"],
  "headContrastColor": ["3d4272"],
  "inkColor": ["23264a"],
  "maskProbability": 0
}
```

## Muted

Replaces the style's bright shirt palette with six dusty tones and keeps hair to the natural browns and greys it already ships. Skin stays with the seed. For interfaces where the avatar should be present without being the loudest thing on screen. The mask switches off, since its blue is painted into the variant and no option reaches it.

```json
{
  "backgroundColor": ["ece7de"],
  "clothingColor": ["9aa88f","c08e77","8fa3b8","d9cbb3","b09aa8","7d8894"],
  "headContrastColor": ["2c1b18","724133","4a312c","a55728","b58143","d6b370"],
  "maskProbability": 0
}
```

## Electric

The counterpart to Muted, on the same lever. Only the clothing changes: six colors at the top of their saturation. Hair stays natural on purpose, because two loud layers cancel each other out and the shirt is the larger area.

```json
{
  "backgroundColor": ["17181d"],
  "clothingColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "headContrastColor": ["2c1b18","724133","4a312c","e8e1e1"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. Strong enough that the avatar holds its own against a busy page, and the only preset here that will fight with a colorful interface rather than sit inside it.

```json
{
  "backgroundColor": ["ff8fab","ffb703","4cc9a7","4d96ff","b57bff"]
}
```

## Night Shift

For dark interfaces. The background stops short of black on purpose: the hair in this style is drawn in the same black as the outlines, so a truly black backdrop would swallow every dark hairstyle.

```json
{
  "backgroundColor": ["262b36"],
  "clothingColor": ["e8e1e1","d6b370","9ddadb","fdea6b"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

Three components sit between 5 and 20 percent, so most avatars show none of them. This raises all three, which is what you want when showing the style off rather than filling a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "accessoriesProbability": 55,
  "facialHairProbability": 45,
  "maskProbability": 25
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends most of it on shoulders, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f2ede4"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/patchwork/

# Patchwork

Patchwork lays a quilt from traditional blocks such as pinwheel, flying geese
and rail fence. Each avatar picks two of the eighteen blocks and repeats them as
diagonal twins rotated by 180 degrees, so every quilt comes out point symmetric.
Generate textile abstract avatars for user accounts and placeholders.

- **Style name:** `patchwork`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/patchwork/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/patchwork.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/patchwork.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("patchwork.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features patchwork
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::PATCHWORK)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Patchwork))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/patchwork.dart';

final style = Style.parse(patchwork);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Patchwork);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear patchwork
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Three browns for the quilt.
- **Greyscale:** Three greys, no hue at all.
- **Duotone:** Three steps of one indigo.
- **Muted:** Dusty fabrics on unbleached cloth.
- **Electric:** Acid fabrics on near black.
- **Pastel Wall:** Soft fabrics throughout.
- **Bold Pop:** Primary colors, no shading.
- **Close Up:** Scaled in on a couple of blocks.

The full option set of each one is at https://www.dicebear.com/styles/patchwork/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `blockVariant` | enum (array allowed) | `brokenDishes`, `checker`, `corners`, `economy`, `fan`, `geese`, `halfSquare`, `hourglass`, `mountains`, `peak`, `petals`, `pinwheel`, `rails`, `rings`, `shells`, `sunrise`, `swirl`, `target` |
| `blockProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `fabricAColor` | color (array allowed) | Hex color, `#` optional |
| `fabricAColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `fabricAColorFillStops` | range |  |
| `fabricAColorAngle` | range | -360 to 360 |
| `fabricAColorOrder` | enum | `random`, `fixed` |
| `fabricBColor` | color (array allowed) | Hex color, `#` optional |
| `fabricBColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `fabricBColorFillStops` | range |  |
| `fabricBColorAngle` | range | -360 to 360 |
| `fabricBColorOrder` | enum | `random`, `fixed` |
| `fabricCColor` | color (array allowed) | Hex color, `#` optional |
| `fabricCColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `fabricCColorFillStops` | range |  |
| `fabricCColorAngle` | range | -360 to 360 |
| `fabricCColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/patchwork/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/patchwork/definition.json`.

---

Source: https://www.dicebear.com/styles/patchwork/presets/

# Patchwork presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The three fabrics take a warm ladder and the paper goes tan, which reads like a quilt photographed decades ago.

```json
{
  "backgroundColor": ["e3d2b4"],
  "fabricAColor": ["8a6a48"],
  "fabricBColor": ["6b4f35"],
  "fabricCColor": ["a3855f"]
}
```

## Greyscale

The block geometry carries the picture on its own, which makes this style one of the few where a greyscale set loses almost nothing.

```json
{
  "backgroundColor": ["ececee"],
  "fabricAColor": ["5e5e62"],
  "fabricBColor": ["343437"],
  "fabricCColor": ["8c8c90"]
}
```

## Duotone

Background and all three fabrics take the same hue at different lightnesses.

```json
{
  "backgroundColor": ["dfe3f5"],
  "fabricAColor": ["9aa2d2"],
  "fabricBColor": ["3d4272"],
  "fabricCColor": ["6a71a8"]
}
```

## Muted

The style ships strong reds, greens and golds. This trades them for dusty tones, which moves the quilt from folk art towards linen.

```json
{
  "backgroundColor": ["e8e4dc"],
  "fabricAColor": ["9c6b58","b98b73"],
  "fabricBColor": ["6b705c","7c9082"],
  "fabricCColor": ["a5a58d","8e9aaf"]
}
```

## Electric

The other direction on the same lever: colors past anything the style ships, on a dark ground so the quilt reads as lit.

```json
{
  "backgroundColor": ["101216"],
  "fabricAColor": ["ff2e88","ff6a00"],
  "fabricBColor": ["00e5ff","7cff00"],
  "fabricCColor": ["ffe600","b400ff"]
}
```

## Pastel Wall

The whole quilt drops to pastels, which suits a nursery or an onboarding screen better than the default folk palette.

```json
{
  "backgroundColor": ["fdf6ec"],
  "fabricAColor": ["ffc9d6","ffd9b0"],
  "fabricBColor": ["bfe3d0","b8d8f0"],
  "fabricCColor": ["ffeaa8","e0d4f5"]
}
```

## Bold Pop

Three flat primaries and nothing between them. The block geometry is strong enough to carry a palette this blunt.

```json
{
  "backgroundColor": ["fdf6ec"],
  "fabricAColor": ["e63946"],
  "fabricBColor": ["1d3557"],
  "fabricCColor": ["f4a261"]
}
```

## Close Up

Uses scale rather than color. Two large blocks read better at avatar size than a full quilt of small ones.

```json
{
  "scale": 1.6
}
```

---

Source: https://www.dicebear.com/styles/personas/

# Personas

Personas is a flat-design vector avatar style of half-body characters with
subtle skin shading, varied hair, facial hair, and glasses on solid colored
tops. Generate SVG profile icons that cover a broad range of ages and
appearances.

- **Style name:** `personas`
- **Category:** Characters
- **Animated:** no
- **Creator:** Draftbit - draftbit.com (https://draftbit.com/)
- **Source:** https://personas.draftbit.com/
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/personas/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/personas.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/personas.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("personas.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features personas
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::PERSONAS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Personas))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/personas.dart';

final style = Style.parse(personas);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Personas);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear personas
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No background, no facial hair.
- **Sepia:** One warm brown for skin, hair and shirt.
- **Greyscale:** No color anywhere, skin included.
- **Duotone:** Three steps of one indigo and nothing else.
- **Muted:** Dusty clothing and hair, nothing shouts.
- **Electric:** Clothing at full saturation on near black.
- **Pastel Wall:** Five soft backgrounds, everything else untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind, everything else untouched.
- **Night Shift:** Near black behind, light clothing in front.
- **Full Cast:** Facial hair turned way up.
- **Close Up:** Scaled in on the face, for small avatars.

The full option set of each one is at https://www.dicebear.com/styles/personas/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `clothesVariant` | enum (array allowed) | `checkered`, `rounded`, `small`, `squared` |
| `clothesProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `glasses`, `happy`, `open`, `sleep`, `sunglasses`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `facialHairVariant` | enum (array allowed) | `beardMustache`, `goatee`, `pyramid`, `shadow`, `soulPatch`, `walrus` |
| `facialHairProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `bald`, `balding`, `beanie`, `bobBangs`, `bobCut`, `bunUndercut`, `buzzcut`, `cap`, `curly`, `curlyBun`, `curlyHighTop`, `extraLong`, `fade`, `long`, `mohawk`, `pigtails`, `shortCombover`, `shortComboverChops`, `sideShave`, `straightBun` |
| `hairProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `bigSmile`, `frown`, `lips`, `pacifier`, `smile`, `smirk`, `surprise` |
| `mouthProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `mediumRound`, `smallRound`, `wrinkles` |
| `noseProbability` | number | 0 to 100 |
| `clothingColor` | color (array allowed) | Hex color, `#` optional |
| `clothingColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `clothingColorFillStops` | range |  |
| `clothingColorAngle` | range | -360 to 360 |
| `clothingColorOrder` | enum | `random`, `fixed` |
| `facialHairColor` | color (array allowed) | Hex color, `#` optional |
| `facialHairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `facialHairColorFillStops` | range |  |
| `facialHairColorAngle` | range | -360 to 360 |
| `facialHairColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/personas/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/personas/definition.json`.

---

Source: https://www.dicebear.com/styles/personas/presets/

# Personas presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The style stripped back: no background, so the avatar sits on whatever your page is, and the facial hair component switched off.

```json
{
  "backgroundColor": [],
  "facialHairProbability": 0
}
```

## Sepia

A real sepia print, which means the skin tone goes with it. Every other preset here leaves skin to the seed; this one cannot, because a color photograph of a face is not sepia. Six hairstyles carry a colored cap or band and two mouths a pink that no option reaches, so those drop out.

```json
{
  "backgroundColor": ["e3d2b4"],
  "skinColor": ["d8b48c","c19a70","a37e58","8f6f4e"],
  "hairColor": ["4a3526","5f4531","7a5c43"],
  "facialHairColor": ["4a3526","5f4531"],
  "clothingColor": ["8a6a48","9c7c58","6f5433"],
  "hairVariant": ["bald","balding","bobBangs","bobCut","buzzcut","curly","curlyHighTop","extraLong","fade","long","mohawk","shortCombover","shortComboverChops","sideShave"],
  "mouthVariant": ["bigSmile","frown","smile","smirk","surprise"]
}
```

## Greyscale

Properly grey rather than grey hair on a colored face. Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. Six hairstyles carry a colored cap or band and two mouths a pink that no option reaches, so those drop out.

```json
{
  "backgroundColor": ["ececee"],
  "skinColor": ["dcdcde","bcbcc0","98989c","6e6e72"],
  "hairColor": ["2a2a2d","454549","6a6a6e"],
  "facialHairColor": ["2a2a2d","454549"],
  "clothingColor": ["7c7c80","9a9a9e","5e5e62"],
  "hairVariant": ["bald","balding","bobBangs","bobCut","buzzcut","curly","curlyHighTop","extraLong","fade","long","mohawk","shortCombover","shortComboverChops","sideShave"],
  "mouthVariant": ["bigSmile","frown","smile","smirk","surprise"]
}
```

## Duotone

Background, skin, hair and clothing take the same hue at different lightnesses. As with Sepia, a duotone only works if the face joins in, so the seed loses its say over skin here. Six hairstyles carry a colored cap or band and two mouths a pink that no option reaches, so those drop out.

```json
{
  "backgroundColor": ["dfe3f5"],
  "skinColor": ["9aa2d2"],
  "hairColor": ["3d4272"],
  "facialHairColor": ["3d4272"],
  "clothingColor": ["6a71a8"],
  "hairVariant": ["bald","balding","bobBangs","bobCut","buzzcut","curly","curlyHighTop","extraLong","fade","long","mohawk","shortCombover","shortComboverChops","sideShave"],
  "mouthVariant": ["bigSmile","frown","smile","smirk","surprise"]
}
```

## Muted

The style ships seven saturated clothing colors and a hair palette that runs to pink. This replaces both with dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["ece7de"],
  "clothingColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "hairColor": ["362c47","6c4545","8e7f6b","5a5f52","7c6a5c"],
  "facialHairColor": ["362c47","6c4545","8e7f6b"]
}
```

## Electric

The other direction on the same lever. Only the clothing changes: six colors at the top of their saturation. Hair stays natural on purpose, because two loud layers cancel each other out and the shirt is the larger area.

```json
{
  "backgroundColor": ["101216"],
  "clothingColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "hairColor": ["362c47","6c4545","dee1f5"]
}
```

## Pastel Wall

Changes nothing about the people, only what they stand in front of. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall. Strong enough that the avatar holds its own against a busy page, and the only preset here that will fight with a colorful interface rather than sit inside it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Night Shift

For dark interfaces. The clothing pool drops to the light end so the figure does not disappear into the background.

```json
{
  "backgroundColor": ["16161c"],
  "clothingColor": ["dee1f5","54d7c7","f3b63a","6dbb58"]
}
```

## Full Cast

The facial hair component sits at ten percent, so a small set shows it on nobody. This raises it, which is what you want when showing the style off rather than filling a user list.

```json
{
  "backgroundColor": ["f4f1ea"],
  "facialHairProbability": 60
}
```

## Close Up

Uses scale rather than color. At the size a comment thread gives an avatar, the default framing spends a lot of it on empty space, and cropping in buys the detail back.

```json
{
  "backgroundColor": ["f4f1ea"],
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/pixel-art-neutral/

# Pixel Art Neutral

Pixel Art Neutral is a reduced variant of the Pixel Art style, showing only
pixel eyes and a mouth on a solid background, with no head outline, hair, or
body.

- **Style name:** `pixel-art-neutral`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.figma.com/community/file/1198754108850888330
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/pixel-art-neutral/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/pixel-art-neutral.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/pixel-art-neutral.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("pixel-art-neutral.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features pixel-art-neutral
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::PIXEL_ART_NEUTRAL)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.PixelArtNeutral))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/pixel_art_neutral.dart';

final style = Style.parse(pixelArtNeutral);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.PixelArtNeutral);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear pixel-art-neutral
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No glasses, just eyes and mouth.
- **Full Cast:** Everyone wears glasses.
- **Sepia:** One warm ramp, face included.
- **Greyscale:** No hue on the face or the features.
- **Duotone:** One blue face for every avatar.
- **Muted:** Dusty faces instead of skin tones.
- **Electric:** Six faces at full saturation.
- **Cool:** Blues, teals and violets only.
- **Warm:** Reds, oranges and golds only.
- **Night Shift:** Dark faces, light features.

The full option set of each one is at https://www.dicebear.com/styles/pixel-art-neutral/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12` |
| `eyesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `dark01`, `dark02`, `dark03`, `dark04`, `dark05`, `dark06`, `dark07`, `light01`, `light02`, `light03`, `light04`, `light05`, `light06`, `light07` |
| `glassesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `happy01`, `happy02`, `happy03`, `happy04`, `happy05`, `happy06`, `happy07`, `happy08`, `happy09`, `happy10`, `happy11`, `happy12`, `happy13`, `sad01`, `sad02`, `sad03`, `sad04`, `sad05`, `sad06`, `sad07`, `sad08`, `sad09`, `sad10` |
| `mouthProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/pixel-art-neutral/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/pixel-art-neutral/definition.json`.

---

Source: https://www.dicebear.com/styles/pixel-art-neutral/presets/

# Pixel Art Neutral presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Glasses appear on one avatar in ten by default. Off, three components become two, and every avatar in a set is built the same way. Worth knowing before you read the rest of these: what this style calls the background is the face. There is no separate skin group, so `backgroundColor` sets the complexion and the tile at once.

```json
{
  "glassesProbability": 0
}
```

## Full Cast

The opposite end of the same lever. The style ships fourteen frames, and at the default probability most of them are never seen.

```json
{
  "glassesProbability": 100
}
```

## Sepia

One warm ramp across the face and the features. Since the background is the complexion here, a sepia set commits everyone to the same four tones rather than leaving skin to the seed.

```json
{
  "backgroundColor": ["d9bd94","c4a377","a8865a","8a6a43"],
  "eyesColor": ["4a3018"],
  "mouthColor": ["9c7147"],
  "glassesColor": ["3a2916"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. Four steps of grey stand in for the eight skin tones, which is enough for the faces to stay distinguishable.

```json
{
  "backgroundColor": ["dcdce0","bfbfc6","9c9ca4","76767e"],
  "eyesColor": ["27272a"],
  "mouthColor": ["8a8a92"],
  "glassesColor": ["18181b"]
}
```

## Duotone

A single color for the whole set, so nothing but the eye and mouth shapes tells two avatars apart. It commits everyone to the same complexion, which is the point here and would be a problem anywhere else.

```json
{
  "backgroundColor": ["9ec9e8"],
  "eyesColor": ["0f2d4a"],
  "mouthColor": ["4a7fa8"],
  "glassesColor": ["0f2d4a"]
}
```

## Muted

Six tones that do not read as complexions at all. Useful when the avatars stand for accounts or machines rather than people.

```json
{
  "backgroundColor": ["a5a58d","8e9aaf","9c8a94","8fa38f","b0a58c","94a3ad"],
  "eyesColor": ["3f3f46"],
  "mouthColor": ["6b6b73"],
  "glassesColor": ["3f3f46","52525b"]
}
```

## Electric

The same idea past the end of the scale. On a 14 pixel grid a loud face carries much further down a list than a loud detail would.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"],
  "eyesColor": ["141418"],
  "mouthColor": ["141418"]
}
```

## Cool

Half the color wheel, and the counterpart to Warm. Two groups of accounts can be told apart by temperature without a second badge.

```json
{
  "backgroundColor": ["7dd3fc","5eead4","a5b4fc","c4b5fd","67e8f9"],
  "eyesColor": ["1e293b"],
  "mouthColor": ["475569"]
}
```

## Warm

The other half of the same wheel.

```json
{
  "backgroundColor": ["fdba74","fcd34d","fca5a5","fb923c","f9a8d4"],
  "eyesColor": ["3b1f14"],
  "mouthColor": ["7c3f2a"]
}
```

## Night Shift

For dark interfaces. Eyes and mouth invert to pale, because the near-black features the style ships disappear on a dark face.

```json
{
  "backgroundColor": ["2a2a32","34343d","3d3d47","26262d"],
  "eyesColor": ["e4e4e7"],
  "mouthColor": ["a1a1aa"],
  "glassesColor": ["71717a"]
}
```

---

Source: https://www.dicebear.com/styles/pixel-art/

# Pixel Art

Pixel Art is a low-resolution vector avatar style that renders half-body
characters as crisp pixel sprites with retro hairstyles, eyes, and colored tops.
Generate 8-bit-style SVG profile icons popular in gaming communities and
developer tools.

- **Style name:** `pixel-art`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.figma.com/community/file/1198754108850888330
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/pixel-art/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/pixel-art.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/pixel-art.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("pixel-art.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features pixel-art
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::PIXEL_ART)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.PixelArt))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/pixel_art.dart';

final style = Style.parse(pixelArt);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.PixelArt);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear pixel-art
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No hat, glasses, beard or accessory.
- **Sepia:** Brown throughout, skin and clothes included.
- **Greyscale:** No hue on any of the eight groups.
- **Duotone:** One blue, one cream, nothing else.
- **Muted:** Dusty clothes and hair, skin untouched.
- **Electric:** Clothes past anything the style ships.
- **Pastel Wall:** A soft ground behind the sprite.
- **Bold Pop:** Six backgrounds at full strength.
- **Night Shift:** Near-black ground, pale hair and clothes.
- **Sunrise:** A warm gradient behind the sprite.

The full option set of each one is at https://www.dicebear.com/styles/pixel-art/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `accessoriesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04` |
| `accessoriesProbability` | number | 0 to 100 |
| `beardVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08` |
| `beardProbability` | number | 0 to 100 |
| `clothesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12`, `variant13`, `variant14`, `variant15`, `variant16`, `variant17`, `variant18`, `variant19`, `variant20`, `variant21`, `variant22`, `variant23` |
| `clothesProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10`, `variant11`, `variant12` |
| `eyesProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `dark01`, `dark02`, `dark03`, `dark04`, `dark05`, `dark06`, `dark07`, `light01`, `light02`, `light03`, `light04`, `light05`, `light06`, `light07` |
| `glassesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `long01`, `long02`, `long03`, `long04`, `long05`, `long06`, `long07`, `long08`, `long09`, `long10`, `long11`, `long12`, `long13`, `long14`, `long15`, `long16`, `long17`, `long18`, `long19`, `long20`, `long21`, `short01`, `short02`, `short03`, `short04`, `short05`, `short06`, `short07`, `short08`, `short09`, `short10`, `short11`, `short12`, `short13`, `short14`, `short15`, `short16`, `short17`, `short18`, `short19`, `short20`, `short21`, `short22`, `short23`, `short24` |
| `hairProbability` | number | 0 to 100 |
| `hatVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08`, `variant09`, `variant10` |
| `hatProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `happy01`, `happy02`, `happy03`, `happy04`, `happy05`, `happy06`, `happy07`, `happy08`, `happy09`, `happy10`, `happy11`, `happy12`, `happy13`, `sad01`, `sad02`, `sad03`, `sad04`, `sad05`, `sad06`, `sad07`, `sad08`, `sad09`, `sad10` |
| `mouthProbability` | number | 0 to 100 |
| `accessoriesColor` | color (array allowed) | Hex color, `#` optional |
| `accessoriesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `accessoriesColorFillStops` | range |  |
| `accessoriesColorAngle` | range | -360 to 360 |
| `accessoriesColorOrder` | enum | `random`, `fixed` |
| `clothingColor` | color (array allowed) | Hex color, `#` optional |
| `clothingColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `clothingColorFillStops` | range |  |
| `clothingColorAngle` | range | -360 to 360 |
| `clothingColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `glassesColor` | color (array allowed) | Hex color, `#` optional |
| `glassesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glassesColorFillStops` | range |  |
| `glassesColorAngle` | range | -360 to 360 |
| `glassesColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `hatColor` | color (array allowed) | Hex color, `#` optional |
| `hatColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hatColorFillStops` | range |  |
| `hatColorAngle` | range | -360 to 360 |
| `hatColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/pixel-art/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/pixel-art/definition.json`.

---

Source: https://www.dicebear.com/styles/pixel-art/presets/

# Pixel Art presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Four optional components switched off at once. On a 16 by 16 grid an accessory costs a lot of the pixels available, so the plain face reads better at small sizes.

```json
{
  "hatProbability": 0,
  "glassesProbability": 0,
  "beardProbability": 0,
  "accessoriesProbability": 0
}
```

## Sepia

Eight color groups all moved onto one warm ramp. Leaving the skin palette out would keep a natural face in the middle of a monochrome avatar, which is worse than doing nothing.

```json
{
  "backgroundColor": ["e7d5b8"],
  "skinColor": ["c9a678","b08d5f","8f6d43","6d5031"],
  "hairColor": ["4a3018","3a2916","5c4223","7d6038","a08256"],
  "clothingColor": ["8a6a3c","6d5031","a88b60","5a4227"],
  "eyesColor": ["4a3018"],
  "mouthColor": ["9c7147"],
  "glassesColor": ["3a2916"],
  "hatColor": ["5c4223"],
  "accessoriesColor": ["b0946a"]
}
```

## Greyscale

For a print stylesheet, a disabled state, or anywhere color already carries meaning. Pixel art holds up well here because the shapes are the identity, not the palette.

```json
{
  "backgroundColor": ["e4e4e7"],
  "skinColor": ["d4d4d8","b4b4bb","94949c","6e6e76"],
  "hairColor": ["18181b","3f3f46","71717a","a1a1aa"],
  "clothingColor": ["52525b","3f3f46","71717a","27272a"],
  "eyesColor": ["27272a"],
  "mouthColor": ["8a8a92"],
  "glassesColor": ["18181b"],
  "hatColor": ["3f3f46"],
  "accessoriesColor": ["a1a1aa"]
}
```

## Duotone

Two colors across the whole avatar. A row of these reads as one set, and only the haircut and expression tell them apart.

```json
{
  "backgroundColor": ["0f2d4a"],
  "skinColor": ["9ec9e8"],
  "hairColor": ["0f2d4a"],
  "clothingColor": ["1c4f7c"],
  "eyesColor": ["0f2d4a"],
  "mouthColor": ["6ba5cc"],
  "glassesColor": ["0f2d4a"],
  "hatColor": ["1c4f7c"],
  "accessoriesColor": ["9ec9e8"]
}
```

## Muted

The style dresses everyone in twelve saturated colors and ships lime and pillar-box red among the hair. Both move to tones that sit quietly, which helps when a table shows thirty avatars at once. Skin keeps its own palette.

```json
{
  "clothingColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58","8a7f6d"],
  "hairColor": ["4a4238","6b5a48","8a7a64","a3937c","5f6357","7b6a58"],
  "mouthColor": ["a8756b","9c6f66","b08278"]
}
```

## Electric

The same group pulled the other way, and only that group. Loud clothes under loud hair would cancel out, so the hair keeps the palette it was born with.

```json
{
  "clothingColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

The style ships no background at all, so an avatar sits on whatever is behind it. Six pale colors give it a tile of its own without pulling attention off the face.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The sprites are small and high contrast, so they hold their own against a saturated ground rather than dissolving into it.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. Hair and clothing move to light tones, because the style's default dark browns and navies vanish against a dark tile.

```json
{
  "backgroundColor": ["16161a"],
  "hairColor": ["e4e4e7","cab188","a78961","9fb8d9"],
  "clothingColor": ["e2e8f0","cbd5e1","94a3b8","a5b4fc"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. Both stops stay light so the dark outline of the sprite keeps its edge.

```json
{
  "backgroundColor": ["ffd5a8","ff9db4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

---

Source: https://www.dicebear.com/styles/pixelbot/

# Pixelbot

Pixelbot is a retro vector avatar style that draws glowing robot faces from
small pixel blocks on a dark grid. Generate neon SVG profile icons for developer
tools, games, and dark-mode interfaces.

- **Style name:** `pixelbot`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/pixelbot/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/pixelbot.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/pixelbot.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("pixelbot.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features pixelbot
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::PIXELBOT)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Pixelbot))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/pixelbot.dart';

final style = Style.parse(pixelbot);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Pixelbot);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear pixelbot
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Terminal:** Green pixels on near-black.
- **Amber:** The warm counterpart to Terminal.
- **Greyscale:** White pixels, no hue at all.
- **Duotone:** One cyan for every avatar.
- **Muted:** Dusty pixels on a slate ground.
- **Electric:** Six colors at full saturation.
- **Cool:** Blues, teals and violets only.
- **Warm:** Reds, oranges and golds only.
- **Sunrise:** A gradient behind the matrix.
- **Close Up:** Fewer grid cells, larger pixels.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/pixelbot/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `eyesVariant` | enum (array allowed) | `blocks`, `happy`, `round`, `slim`, `soft`, `tall`, `wide` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `bigSmile`, `flat`, `open`, `smile`, `tiny` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `glowColor` | color (array allowed) | Hex color, `#` optional |
| `glowColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glowColorFillStops` | range |  |
| `glowColorAngle` | range | -360 to 360 |
| `glowColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/pixelbot/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/pixelbot/definition.json`.

---

Source: https://www.dicebear.com/styles/pixelbot/presets/

# Pixelbot presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Terminal

The style is a lit dot matrix, and this is the oldest version of that: one phosphor green, one dark ground, no second color anywhere.

```json
{
  "backgroundColor": ["0a0f0a"],
  "glowColor": ["4ade80"]
}
```

## Amber

Same idea, the other phosphor. Amber on a brown-black ground reads warmer in a list than green does.

```json
{
  "backgroundColor": ["120c05"],
  "glowColor": ["ffb020"]
}
```

## Greyscale

For interfaces where color already carries meaning. The style loses nothing structural, because the shapes of the eyes and mouth are what identify an avatar.

```json
{
  "backgroundColor": ["141416"],
  "glowColor": ["f4f4f5","d4d4d8","a1a1aa"]
}
```

## Duotone

A single glow color across a whole set, so the eye and mouth shapes are the only thing that changes from one avatar to the next.

```json
{
  "backgroundColor": ["061626"],
  "glowColor": ["22d3ee"]
}
```

## Muted

The style ships nine bright colors, which is a lot of shouting in a sidebar. These six are lit enough to read on dark and quiet enough to sit still.

```json
{
  "backgroundColor": ["1b1d22"],
  "glowColor": ["9aa88f","b0a48c","8fa3ad","a894a3","b8a06f","8d9bb5"]
}
```

## Electric

Past what the style ships. On a black ground these read as actual light rather than as paint.

```json
{
  "backgroundColor": ["000000"],
  "glowColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Cool

Half the color wheel, and the counterpart to Warm. Two groups of avatars can be told apart by temperature alone.

```json
{
  "backgroundColor": ["0b1220"],
  "glowColor": ["7dd3fc","5eead4","a5b4fc","c4b5fd","67e8f9"]
}
```

## Warm

The other half of the same wheel, on a ground warmed to match.

```json
{
  "backgroundColor": ["1a0d06"],
  "glowColor": ["fdba74","fcd34d","fca5a5","fb923c","f9a8d4"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. Both stops stay dark, because the lit pixels need something to be lit against.

```json
{
  "backgroundColor": ["1e1b4b","3b0764"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45,
  "glowColor": ["fde68a","f9a8d4","c4b5fd"]
}
```

## Close Up

The face sits in the middle of a wide grid. Scaling up trades some of the grid for size, which is the trade you want at 32 pixels.

```json
{
  "scale": 1.3
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/planets/

# Planets

Planets is a space-themed vector avatar style with a single textured planet,
optional rings and moons, and a star-filled sky. Generate atmospheric SVG
profile icons for dashboards, games, and science apps.

- **Style name:** `planets`
- **Category:** Scenes
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/planets/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/planets.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/planets.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("planets.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features planets
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::PLANETS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Planets))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/planets.dart';

final style = Style.parse(planets);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Planets);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear planets
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Warm System:** Reds, oranges and golds only.
- **Cool System:** Greens, teals and blues only.
- **Greyscale:** A monochrome sky and a grey planet.
- **Duotone:** One indigo for sky, planet and moon.
- **Muted:** Dusty planets against a deep sky.
- **Electric:** Neon planets on black.
- **Daylight:** A pale sky instead of deep space.
- **Close Up:** Scaled in, so the planet fills the frame.

The full option set of each one is at https://www.dicebear.com/styles/planets/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `moonsVariant` | enum (array allowed) | `one`, `tiny`, `two` |
| `moonsProbability` | number | 0 to 100 |
| `planetVariant` | enum (array allowed) | `disc` |
| `planetProbability` | number | 0 to 100 |
| `ringVariant` | enum (array allowed) | `bold`, `double`, `thin` |
| `ringProbability` | number | 0 to 100 |
| `shadeVariant` | enum (array allowed) | `hard`, `soft` |
| `shadeProbability` | number | 0 to 100 |
| `surfaceVariant` | enum (array allowed) | `banded`, `belted`, `cap`, `cracked`, `cratered`, `marbled`, `speckled`, `spotted`, `swirl`, `terra` |
| `surfaceProbability` | number | 0 to 100 |
| `starVariant` | enum (array allowed) | `faint`, `large`, `medium`, `small`, `sparkle` |
| `starProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `planetColor` | color (array allowed) | Hex color, `#` optional |
| `planetColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `planetColorFillStops` | range |  |
| `planetColorAngle` | range | -360 to 360 |
| `planetColorOrder` | enum | `random`, `fixed` |
| `moonColor` | color (array allowed) | Hex color, `#` optional |
| `moonColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `moonColorFillStops` | range |  |
| `moonColorAngle` | range | -360 to 360 |
| `moonColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/planets/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/planets/definition.json`.

---

Source: https://www.dicebear.com/styles/planets/presets/

# Planets presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Warm System

The style ships fourteen planet colors evenly spaced around the wheel. This keeps the warm half, so a set of these reads as one system rather than a sample chart.

```json
{
  "planetColor": ["e27a8c","e37f64","d88a40","c1982a","d67cb2"]
}
```

## Cool System

The other half of the same wheel. Useful next to Warm System when two groups of avatars need to be told apart at a glance.

```json
{
  "planetColor": ["74b160","39b789","00b6af","00b1cf","47a7e7","7a9bef"]
}
```

## Greyscale

Strips the color from a style that is mostly color. What is left is the composition: a disc, a moon and a field of stars.

```json
{
  "backgroundColor": ["16181d"],
  "planetColor": ["8c8c90","6e6e72","aeaeb2"],
  "moonColor": ["d8d8dc"]
}
```

## Duotone

Three steps of the same hue. The most restrained this style gets, and the easiest to place next to an existing brand color.

```json
{
  "backgroundColor": ["141833"],
  "planetColor": ["4a55a8"],
  "moonColor": ["9aa2d2"]
}
```

## Muted

The style's planets are fully saturated. These are not, which turns them from marbles into something more like photographs.

```json
{
  "planetColor": ["9c6b58","7c9082","8e9aaf","a5a58d","b98b73"]
}
```

## Electric

The other direction: colors past anything the style ships, on the darkest of its own skies so they read as lit from within.

```json
{
  "backgroundColor": ["0a0b0f"],
  "planetColor": ["ff2e88","00e5ff","ffe600","7cff00","b400ff"]
}
```

## Daylight

The one preset that abandons the night. A light sky turns the planet into a flat disc and the stars vanish into it, which is a different picture rather than a lit version of the same one.

```json
{
  "backgroundColor": ["e6ecf5","eef1f7"],
  "moonColor": ["8c93a3"]
}
```

## Close Up

Uses scale rather than color. At avatar size the stars turn to noise, and cropping in trades them for a planet you can actually see.

```json
{
  "scale": 1.5
}
```

---

Source: https://www.dicebear.com/styles/rings/

# Rings

Rings is a geometric abstract vector avatar style that arranges segmented
concentric rings and arcs into a single monochrome composition on a transparent
background. Generate clean SVG profile icons that work as placeholders or
decorative user identifiers.

- **Style name:** `rings`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/rings/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/rings.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/rings.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("rings.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features rings
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::RINGS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Rings))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/rings.dart';

final style = Style.parse(rings);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Rings);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear rings
```

## Presets

8 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Warm brown rings on tanned paper.
- **Greyscale:** Four steps of grey.
- **Duotone:** One indigo on a pale indigo ground.
- **Muted:** Dusty rings instead of the full spectrum.
- **Electric:** Acid rings on near black.
- **Pastel Wall:** Soft backgrounds, the rings untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind the shapes.

The full option set of each one is at https://www.dicebear.com/styles/rings/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `ringVariant` | enum (array allowed) | `container` |
| `ringProbability` | number | 0 to 100 |
| `ring01Variant` | enum (array allowed) | `eighth`, `full`, `half`, `quarter` |
| `ring01Probability` | number | 0 to 100 |
| `ring02Variant` | enum (array allowed) | `eighth`, `full`, `half`, `quarter` |
| `ring02Probability` | number | 0 to 100 |
| `ring03Variant` | enum (array allowed) | `eighth`, `full`, `half`, `quarter` |
| `ring03Probability` | number | 0 to 100 |
| `ring04Variant` | enum (array allowed) | `eighth`, `full`, `half`, `quarter` |
| `ring04Probability` | number | 0 to 100 |
| `ring05Variant` | enum (array allowed) | `eighth`, `full`, `half`, `quarter` |
| `ring05Probability` | number | 0 to 100 |
| `ringColor` | color (array allowed) | Hex color, `#` optional |
| `ringColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `ringColorFillStops` | range |  |
| `ringColorAngle` | range | -360 to 360 |
| `ringColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/rings/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/rings/definition.json`.

---

Source: https://www.dicebear.com/styles/rings/presets/

# Rings presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The style has a single color group for all five rings, so one palette change carries the whole picture.

```json
{
  "backgroundColor": ["e3d2b4"],
  "ringColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

No hue anywhere. Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["ececee"],
  "ringColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

Background and rings take the same hue at two lightnesses. The most restrained this style gets, and the easiest to place next to an existing brand color.

```json
{
  "backgroundColor": ["dfe3f5"],
  "ringColor": ["3d4272"]
}
```

## Muted

The style ships sixteen colors evenly spaced around the wheel, which is a lot of rainbow. This trades them for six dusty tones that sit closer together.

```json
{
  "backgroundColor": ["ece7de"],
  "ringColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships, on a dark background so they read as lit.

```json
{
  "backgroundColor": ["101216"],
  "ringColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes only what the rings sit on. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

---

Source: https://www.dicebear.com/styles/shadows/

# Shadows

Shadows draws a bust as one filled silhouette, all of it in a single ink on a
pale ground. Seven shoulder lines and five head shapes meet a hat or a hairstyle
on three of four seeds, and the top sits behind the head so the two merge into
one outline. There are eleven inks and ten backgrounds. Generate calm,
high-contrast placeholder avatars for user lists and comment threads.

- **Style name:** `shadows`
- **Category:** Characters
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/shadows/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/shadows.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/shadows.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("shadows.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features shadows
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::SHADOWS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Shadows))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/shadows.dart';

final style = Style.parse(shadows);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Shadows);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear shadows
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No hats and no hair.
- **Sepia:** One warm brown on cream.
- **Greyscale:** The same bust without hue.
- **Duotone:** One indigo on its own pale tint.
- **Muted:** Dusty inks instead of the shipped eleven.
- **Electric:** Silhouettes past anything the style ships.
- **Pastel Wall:** Softer grounds, the ink untouched.
- **Bold Pop:** Saturated grounds behind a dark bust.
- **Night Shift:** Near black ground, pale bust.
- **Sunrise:** A warm gradient behind the bust.
- **Full Cast:** A hat or a hairstyle on everyone.
- **Close Up:** Scaled in, so the shoulders run past the edge.

The full option set of each one is at https://www.dicebear.com/styles/shadows/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `shouldersVariant` | enum (array allowed) | `narrow`, `regular`, `round`, `sloped`, `square`, `uneven`, `wide` |
| `shouldersProbability` | number | 0 to 100 |
| `headsVariant` | enum (array allowed) | `oval`, `round`, `tall`, `taper`, `wide` |
| `headsProbability` | number | 0 to 100 |
| `topsVariant` | enum (array allowed) | `afro`, `beanie`, `bowler`, `braid`, `bun`, `curls`, `flat`, `hat`, `puffs`, `quiff`, `topknot`, `tuft`, `waves` |
| `topsProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/shadows/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/shadows/definition.json`.

---

Source: https://www.dicebear.com/styles/shadows/presets/

# Shadows presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

The top is the style's one optional piece and it appears on three of four seeds. Without it a set is seven shoulder lines against five head shapes, which is the plainest thing the style draws.

```json
{
  "topsProbability": 0
}
```

## Sepia

The whole bust is a single fill, so a monochrome set here is two colors and nothing else: the ink and the ground behind it.

```json
{
  "backgroundColor": ["efe3d2"],
  "inkColor": ["6f4c33","8a6244","573a26","7d5a3f"]
}
```

## Greyscale

A filled silhouette is the kind of drawing that loses nothing without color. Useful for a print stylesheet or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["ececee"],
  "inkColor": ["3a3a3f","55555b","26262a","6a6a71"]
}
```

## Duotone

Ink and ground take the same hue at two lightnesses, which is the smallest palette the style can be given.

```json
{
  "backgroundColor": ["e2e5f2"],
  "inkColor": ["3b4380"]
}
```

## Muted

The shipped inks are already restrained. These go one step further toward grey, which suits a comment thread where a dozen busts appear in a column.

```json
{
  "backgroundColor": ["ebe8e2"],
  "inkColor": ["6b705c","7d6a5f","5f6a72","6f6470","63705f","776f5e"]
}
```

## Electric

The same lever the other way, on a near black ground. A filled shape at this saturation stops reading as a person and starts reading as a sign, which is the point.

```json
{
  "backgroundColor": ["0f0f12"],
  "inkColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes only what the bust sits on. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Louder than the shipped set and pushed toward the primaries. The inks are dark enough to hold their edge on top of it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Night Shift

For dark interfaces. The silhouette and the ground trade places, so the shape is what the light lands on.

```json
{
  "backgroundColor": ["16161a"],
  "inkColor": ["e6e2dd","d8dfe6","e6dde2","dee6d8"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Full Cast

Thirteen tops, all of them merged into the head rather than laid on top of it. At full probability they carry most of what separates one avatar from the next.

```json
{
  "topsProbability": 100
}
```

## Close Up

Uses scale rather than color. Cropping in leaves the head and the top, which is where the style puts its variation anyway.

```json
{
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/shape-grid/

# Shape Grid

Shape Grid is an abstract vector avatar style that arranges four simple shapes
(squares, circles, triangles, and hexagons) in a 2×2 grid on a tinted
background. Generate playful SVG profile icons that work as avatar placeholders
or decorative user identifiers.

- **Style name:** `shape-grid`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/shape-grid/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/shape-grid.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/shape-grid.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("shape-grid.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features shape-grid
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::SHAPE_GRID)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.ShapeGrid))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/shape_grid.dart';

final style = Style.parse(shapeGrid);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.ShapeGrid);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear shape-grid
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the grid.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the grid.
- **Stencil:** One background for everyone, only the shape varies.

The full option set of each one is at https://www.dicebear.com/styles/shape-grid/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `rowsVariant` | enum (array allowed) | `rows01`, `rows02`, `rows03`, `rows04` |
| `rowsProbability` | number | 0 to 100 |
| `shapeVariant` | enum (array allowed) | `circle`, `hexagon`, `plus`, `polygon`, `square` |
| `shapeProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `shapeColor` | color (array allowed) | Hex color, `#` optional |
| `shapeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shapeColorFillStops` | range |  |
| `shapeColorAngle` | range | -360 to 360 |
| `shapeColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/shape-grid/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/shape-grid/definition.json`.

---

Source: https://www.dicebear.com/styles/shape-grid/presets/

# Shape Grid presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the grid changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend.

```json
{
  "backgroundColor": ["16161c"]
}
```

---

Source: https://www.dicebear.com/styles/shapes/

# Shapes

Shapes is an abstract vector avatar style composed of two or three large
geometric forms (squares, circles, and triangles) layered and rotated on a
colored background. Generate minimal SVG profile icons that work as avatar
placeholders or abstract user identifiers.

- **Style name:** `shapes`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/shapes/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/shapes.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/shapes.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("shapes.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features shapes
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::SHAPES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Shapes))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/shapes.dart';

final style = Style.parse(shapes);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Shapes);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear shapes
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four steps of warm brown.
- **Greyscale:** Four steps of grey.
- **Duotone:** Four steps of one indigo.
- **Muted:** Dusty tones instead of the teal and orange.
- **Electric:** Acid shapes on near black.
- **Pastel Wall:** Soft backgrounds, the shapes untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient behind the shapes.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/shapes/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `shape01Variant` | enum (array allowed) | `ellipse`, `ellipseFilled`, `line`, `polygon`, `polygonFilled`, `rectangle`, `rectangleFilled` |
| `shape01Probability` | number | 0 to 100 |
| `shape02Variant` | enum (array allowed) | `ellipse`, `ellipseFilled`, `line`, `polygon`, `polygonFilled`, `rectangle`, `rectangleFilled` |
| `shape02Probability` | number | 0 to 100 |
| `shape03Variant` | enum (array allowed) | `ellipse`, `ellipseFilled`, `line`, `polygon`, `polygonFilled`, `rectangle`, `rectangleFilled` |
| `shape03Probability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `shape1Color` | color (array allowed) | Hex color, `#` optional |
| `shape1ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shape1ColorFillStops` | range |  |
| `shape1ColorAngle` | range | -360 to 360 |
| `shape1ColorOrder` | enum | `random`, `fixed` |
| `shape2Color` | color (array allowed) | Hex color, `#` optional |
| `shape2ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shape2ColorFillStops` | range |  |
| `shape2ColorAngle` | range | -360 to 360 |
| `shape2ColorOrder` | enum | `random`, `fixed` |
| `shape3Color` | color (array allowed) | Hex color, `#` optional |
| `shape3ColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shape3ColorFillStops` | range |  |
| `shape3ColorAngle` | range | -360 to 360 |
| `shape3ColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/shapes/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/shapes/definition.json`.

---

Source: https://www.dicebear.com/styles/shapes/presets/

# Shapes presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The style requires each shape to differ from the background and from the shapes behind it, so a monochrome set here is a four-step ladder rather than one color repeated.

```json
{
  "backgroundColor": ["e3d2b4"],
  "shape1Color": ["b08e66"],
  "shape2Color": ["7d6047"],
  "shape3Color": ["4a3526"]
}
```

## Greyscale

The same four-step ladder without any hue. Useful for a print stylesheet or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["ececee"],
  "shape1Color": ["b6b6b9"],
  "shape2Color": ["7c7c80"],
  "shape3Color": ["343437"]
}
```

## Duotone

Background and all three shapes take the same hue at four lightnesses, which is as close to two colors as the style's own constraints allow.

```json
{
  "backgroundColor": ["dfe3f5"],
  "shape1Color": ["9aa2d2"],
  "shape2Color": ["6a71a8"],
  "shape3Color": ["23264a"]
}
```

## Muted

The style ships one five-color palette shared by the background and all three shapes. This swaps it for dusty tones, which keeps the composition and drops the poster energy.

```json
{
  "backgroundColor": ["e8e4dc"],
  "shape1Color": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "shape2Color": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "shape3Color": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships, on a dark background so they read as lit rather than printed.

```json
{
  "backgroundColor": ["101216"],
  "shape1Color": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "shape2Color": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "shape3Color": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

Changes only what the shapes sit on. The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed, so a set of these drifts rather than sits still. The animation respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/slice/

# Slice

Slice takes one silhouette, cuts it into three to six horizontal bands and
shifts them sideways against each other. Ten shapes, sixteen cut patterns and a
tilt of up to 45 degrees decide how far the outline comes apart. Each band
carries a different amount of white over the body color, so the shape runs
through one hue from light to dark. Generate abstract SVG placeholders for user
accounts and empty states.

- **Style name:** `slice`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/slice/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/slice.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/slice.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("slice.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features slice
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::SLICE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Slice))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/slice.dart';

final style = Style.parse(slice);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Slice);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear slice
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** One warm brown, cut into bands.
- **Greyscale:** The ramp without hue.
- **Duotone:** One indigo for everyone.
- **Muted:** Dusty bodies instead of the shipped twelve.
- **Electric:** Bodies past anything the style ships.
- **Pastel Wall:** Colored grounds instead of the paper whites.
- **Bold Pop:** Saturated grounds behind the bands.
- **Sunrise:** A warm gradient behind the bands.
- **Stencil:** One ground for everyone, only the shape varies.
- **Shattered:** Only the widest offsets.
- **Close Up:** Scaled in, so the bands run past the edge.

The full option set of each one is at https://www.dicebear.com/styles/slice/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `cutsVariant` | enum (array allowed) | `five`, `fiveDeep`, `fiveKick`, `fiveWave`, `quad`, `quadDeep`, `quadPair`, `quadZig`, `six`, `sixDeep`, `sixStep`, `sixZig`, `tri`, `triDeep`, `triFan`, `triKick` |
| `cutsProbability` | number | 0 to 100 |
| `shapeVariant` | enum (array allowed) | `arch`, `diamond`, `disc`, `egg`, `hexagon`, `lens`, `lump`, `pill`, `square`, `squircle` |
| `shapeProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/slice/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/slice/definition.json`.

---

Source: https://www.dicebear.com/styles/slice/presets/

# Slice presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

Each band carries a different amount of white over the body color, so a single hue already covers the whole tile. Swapping that hue for brown moves the entire ramp with it.

```json
{
  "backgroundColor": ["efe6d9"],
  "bodyColor": ["6f4c33","8a6244","a2795a","5a3c28"]
}
```

## Greyscale

The style is a lightness ramp before it is a color, which is exactly the kind of drawing that survives losing hue. Useful for a print stylesheet.

```json
{
  "backgroundColor": ["eeeef0"],
  "bodyColor": ["4a4a50","63636a","37373c","757580"]
}
```

## Duotone

A single body color across a whole set, so nothing but the silhouette, the cuts and the tilt separates two avatars. The bands still give each one its own ramp.

```json
{
  "backgroundColor": ["e8eaf4"],
  "bodyColor": ["4a54a8"]
}
```

## Muted

The shipped palette is a full hue circle at one saturation. These are the same shapes in tones that hold still, which suits a list where a dozen appear at once.

```json
{
  "backgroundColor": ["ebe7df"],
  "bodyColor": ["6b705c","9c6b58","5f6a72","7c6a72","63705f","8a7a5e"]
}
```

## Electric

The same lever the other way. The ground goes near black so the top band, which is the palest one, reads as lit rather than printed.

```json
{
  "backgroundColor": ["0f0f12"],
  "bodyColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

The style ships five near white backgrounds that barely differ. Five pale colors make the ground a choice rather than a default.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Loud enough that the avatar holds its own against a busy page. The palest bands are the ones that have to work here, and they do.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near black ground, so nothing distinguishes them but the cut. That turns a set from a group of pictures into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Shattered

Four of the sixteen cut patterns push the bands as far sideways as the style goes. Kept on their own, the silhouette stops being readable as one shape, which is the far end of what the style is for.

```json
{
  "cutsVariant": ["triDeep","quadDeep","fiveDeep","sixDeep"]
}
```

## Close Up

Uses scale rather than color. Cropping in turns the composition from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/sprouts/

# Sprouts

Sprouts is a cute vector avatar style of potted plants with smiling faces and a
rotating cast of succulents, seedlings, tulips, and tiny palms. Generate
cheerful SVG profile icons for communities and forums.

- **Style name:** `sprouts`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/sprouts/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/sprouts.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/sprouts.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("sprouts.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features sprouts
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::SPROUTS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Sprouts))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/sprouts.dart';

final style = Style.parse(sprouts);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Sprouts);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear sprouts
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** Plain pot, no pattern and no blush.
- **Sepia:** A dried-out plant in a terracotta pot.
- **Greyscale:** No hue on plant, pot or bloom.
- **Duotone:** One sage green, one cream pot.
- **Muted:** A dusty nursery.
- **Electric:** Neon pots, plants left green.
- **Pastel Wall:** Pale ground under the pot.
- **Bold Pop:** Six grounds, no restraint.
- **Night Shift:** Near-black ground, plants unchanged.
- **Sunrise:** A warm gradient behind the pot.
- **Full Cast:** Every pot patterned, every face blushing.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/sprouts/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `plantVariant` | enum (array allowed) | `ball`, `buds`, `bush`, `cactus`, `flower`, `grass`, `palm`, `seedling`, `sprout`, `succulent`, `tall`, `tulip` |
| `plantProbability` | number | 0 to 100 |
| `potVariant` | enum (array allowed) | `bag`, `bowl`, `cylinder`, `rim`, `round`, `taper`, `tub` |
| `potProbability` | number | 0 to 100 |
| `patternVariant` | enum (array allowed) | `band`, `chevron`, `dots`, `ring`, `speckles`, `stripes` |
| `patternProbability` | number | 0 to 100 |
| `cheeksVariant` | enum (array allowed) | `blush`, `blushBig`, `freckles` |
| `cheeksProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `angry`, `bigPupils`, `close`, `closedLine`, `dots`, `happy`, `round`, `sideeye`, `sleepy`, `wide`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `catMouth`, `frown`, `grin`, `line`, `ooh`, `open`, `smile`, `tinySmile`, `tongue`, `tooth`, `wavy` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `potColor` | color (array allowed) | Hex color, `#` optional |
| `potColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `potColorFillStops` | range |  |
| `potColorAngle` | range | -360 to 360 |
| `potColorOrder` | enum | `random`, `fixed` |
| `plantColor` | color (array allowed) | Hex color, `#` optional |
| `plantColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `plantColorFillStops` | range |  |
| `plantColorAngle` | range | -360 to 360 |
| `plantColorOrder` | enum | `random`, `fixed` |
| `bloomColor` | color (array allowed) | Hex color, `#` optional |
| `bloomColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bloomColorFillStops` | range |  |
| `bloomColorAngle` | range | -360 to 360 |
| `bloomColorOrder` | enum | `random`, `fixed` |
| `inkColor` | color (array allowed) | Hex color, `#` optional |
| `inkColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `inkColorFillStops` | range |  |
| `inkColorAngle` | range | -360 to 360 |
| `inkColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/sprouts/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/sprouts/definition.json`.

---

Source: https://www.dicebear.com/styles/sprouts/presets/

# Sprouts presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Two optional components off at once. What is left is the plant, the pot and the face, which is the whole idea of the style at its simplest.

```json
{
  "patternProbability": 0,
  "cheeksProbability": 0
}
```

## Sepia

Three mouth variants are excluded. They show a pink tongue painted into the artwork rather than taking a color option, and one pink tongue undoes the whole set.

```json
{
  "backgroundColor": ["4a3520"],
  "potColor": ["c9a678","b08d5f","d9bd94"],
  "plantColor": ["8f6d43","a0805a","7a5c37"],
  "bloomColor": ["c4a377"],
  "inkColor": ["2b1d10"],
  "mouthVariant": ["smile","tinySmile","ooh","line","catMouth","frown","wavy","tooth"]
}
```

## Greyscale

The style leans on flat shapes and a hard drop shadow, both of which survive losing color. Same mouth exclusion as Sepia.

```json
{
  "backgroundColor": ["3f3f46"],
  "potColor": ["e4e4e7","d4d4d8","c1c1c7"],
  "plantColor": ["8a8a92","a1a1aa","71717a"],
  "bloomColor": ["b4b4bb"],
  "inkColor": ["18181b"],
  "mouthVariant": ["smile","tinySmile","ooh","line","catMouth","frown","wavy","tooth"]
}
```

## Duotone

Two colors and a shadow. Only the species of plant and the expression change from avatar to avatar.

```json
{
  "backgroundColor": ["16302a"],
  "potColor": ["e8e4d3"],
  "plantColor": ["6f9c7a"],
  "bloomColor": ["e8e4d3"],
  "inkColor": ["0d1c18"],
  "mouthVariant": ["smile","tinySmile","ooh","line","catMouth","frown","wavy","tooth"]
}
```

## Muted

The style ships bright pots and eight greens at full brightness. These are the same plants in tones that hold still, which suits a shelf of thirty of them. The tongue mouths are excluded, the same ones the monochrome presets drop, because their pink is painted in rather than picked.

```json
{
  "mouthVariant": ["smile","tinySmile","ooh","line","catMouth","frown","wavy","tooth"],
  "backgroundColor": ["3a3a3f","41413a","3a4140","3f3a41"],
  "potColor": ["a5a58d","b98b73","8e9aaf","9c8a94","b0a58c","94a3ad"],
  "plantColor": ["7c9082","6b7a5e","8a9c7a","5f7263"],
  "bloomColor": ["c4a898","b0938c","a89b7c"]
}
```

## Electric

Only one layer goes loud. Neon pots under neon foliage would cancel each other out, so the plant keeps the palette it was born with.

```json
{
  "backgroundColor": ["0f0f12"],
  "potColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Every background the style ships is dark and saturated. Pale ones turn the same plant from a spotlit specimen into something sitting on a windowsill.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

Louder than the shipped set and pushed toward the primaries. The pot and plant are both pale enough to hold their edge against it.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. Both the pot palette and the greens are already light, so nothing else has to move for the plant to stay visible.

```json
{
  "backgroundColor": ["16161a"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ff9db4","ffd5a8"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

Both optional components turned all the way up. The style ships six pot patterns that most seeds never reach at the default probability.

```json
{
  "patternProbability": 100,
  "cheeksProbability": 100
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/squircles/

# Squircles

Squircles is an abstract vector avatar style that nests rounded squares into
soft tonal layers and adds a small offset highlight. Generate calm SVG profile
icons that work as avatar placeholders or understated user identifiers.

- **Style name:** `squircles`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/squircles/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/squircles.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/squircles.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("squircles.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features squircles
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::SQUIRCLES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Squircles))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/squircles.dart';

final style = Style.parse(squircles);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Squircles);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear squircles
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the squircle.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the squircle.
- **Stencil:** One background for everyone, only the shape varies.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/squircles/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `bodyVariant` | enum (array allowed) | `quartet`, `quintet`, `trio` |
| `bodyProbability` | number | 0 to 100 |
| `accentVariant` | enum (array allowed) | `default` |
| `accentProbability` | number | 0 to 100 |
| `level1Variant` | enum (array allowed) | `default` |
| `level1Probability` | number | 0 to 100 |
| `level2Variant` | enum (array allowed) | `default` |
| `level2Probability` | number | 0 to 100 |
| `level3Variant` | enum (array allowed) | `default` |
| `level3Probability` | number | 0 to 100 |
| `level4Variant` | enum (array allowed) | `default` |
| `level4Probability` | number | 0 to 100 |
| `level5Variant` | enum (array allowed) | `default` |
| `level5Probability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `shapeColor` | color (array allowed) | Hex color, `#` optional |
| `shapeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shapeColorFillStops` | range |  |
| `shapeColorAngle` | range | -360 to 360 |
| `shapeColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/squircles/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/squircles/definition.json`.

---

Source: https://www.dicebear.com/styles/squircles/presets/

# Squircles presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the squircle changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion, and a static avatar next to an animated one stays static.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/stack/

# Stack

Stack builds a balanced pile of stones. Eleven layouts set how many stones lie
on each other and how far they lean, and each one squashes one of seven stone
shapes to its own width and height, with one of six caps on top. The stones are
painted in a light, a mid and a deep tone on a paper background. Generate calm,
abstract avatars for placeholders and user lists.

- **Style name:** `stack`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/stack/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/stack.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/stack.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("stack.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features stack
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::STACK)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Stack))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/stack.dart';

final style = Style.parse(stack);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Stack);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear stack
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Three steps of warm brown.
- **Greyscale:** Three steps of grey.
- **Duotone:** Three steps of one indigo.
- **Muted:** Dusty stones instead of the shipped eight.
- **Electric:** Stones past anything the style ships.
- **Pastel Wall:** Colored grounds instead of the paper whites.
- **Bold Pop:** Saturated grounds behind the pile.
- **Sunrise:** A warm gradient behind the pile.
- **Stencil:** One ground for everyone, only the pile varies.
- **Tower:** Only the tall piles.
- **Close Up:** Scaled in, so the pile fills the frame.

The full option set of each one is at https://www.dicebear.com/styles/stack/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `pilesVariant` | enum (array allowed) | `boulder`, `five`, `four`, `fourBelly`, `fourLean`, `pair`, `three`, `threeBelly`, `threeLean`, `threeWide`, `tower` |
| `pilesProbability` | number | 0 to 100 |
| `stoneVariant` | enum (array allowed) | `block`, `dome`, `lens`, `pebble`, `pill`, `trapezoid`, `wedge` |
| `stoneProbability` | number | 0 to 100 |
| `capVariant` | enum (array allowed) | `ball`, `cube`, `dome`, `drop`, `egg`, `slab` |
| `capProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `stoneLightColor` | color (array allowed) | Hex color, `#` optional |
| `stoneLightColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `stoneLightColorFillStops` | range |  |
| `stoneLightColorAngle` | range | -360 to 360 |
| `stoneLightColorOrder` | enum | `random`, `fixed` |
| `stoneMidColor` | color (array allowed) | Hex color, `#` optional |
| `stoneMidColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `stoneMidColorFillStops` | range |  |
| `stoneMidColorAngle` | range | -360 to 360 |
| `stoneMidColorOrder` | enum | `random`, `fixed` |
| `stoneDeepColor` | color (array allowed) | Hex color, `#` optional |
| `stoneDeepColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `stoneDeepColorFillStops` | range |  |
| `stoneDeepColorAngle` | range | -360 to 360 |
| `stoneDeepColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/stack/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/stack/definition.json`.

---

Source: https://www.dicebear.com/styles/stack/presets/

# Stack presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The style keeps a light, a mid and a deep tone and hands them out down the pile. A monochrome set moves all three at once and leaves the arrangement alone.

```json
{
  "backgroundColor": ["f0e7d9"],
  "stoneLightColor": ["e3d2b4"],
  "stoneMidColor": ["b08e66"],
  "stoneDeepColor": ["6b4a2e"]
}
```

## Greyscale

The same three step ladder without any hue. Useful for a print stylesheet or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["efeff1"],
  "stoneLightColor": ["dcdce0"],
  "stoneMidColor": ["a0a0a6"],
  "stoneDeepColor": ["4a4a50"]
}
```

## Duotone

Background and all three stones take the same hue at four lightnesses, which is as close to a single color as a pile of stones can get and still read as stacked.

```json
{
  "backgroundColor": ["eaecf7"],
  "stoneLightColor": ["c8cdea"],
  "stoneMidColor": ["7d86c0"],
  "stoneDeepColor": ["343c78"]
}
```

## Muted

The shipped tones are already quiet. These go one step further toward grey, which suits a page where the avatar should not be the loudest thing on it.

```json
{
  "backgroundColor": ["ece9e3"],
  "stoneLightColor": ["ddd8cc","e0dcd2","d8dcd6","e2dad6"],
  "stoneMidColor": ["a5a58d","b98b73","8e9aaf","9c8a94"],
  "stoneDeepColor": ["5b5b4a","6b4f40","4c5461","574a52"]
}
```

## Electric

The same lever the other way. The ground goes near black so the pile reads as lit rather than printed, and the deep tone has to come up with it: the shipped one is dark enough to lose the bottom stone against the ground.

```json
{
  "backgroundColor": ["0f0f12"],
  "stoneLightColor": ["7cff00","00e5ff","ffe600"],
  "stoneMidColor": ["ff2e88","b400ff","ff6a00"],
  "stoneDeepColor": ["c72a8c","2a8cc7","c77a2a"]
}
```

## Pastel Wall

The style ships four near white backgrounds that barely differ. Five pale colors make the ground a choice rather than a default.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

Loud enough that the avatar holds its own against a busy page. The light stones are what carry the silhouette against it.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near black ground, so nothing distinguishes them but the arrangement. That turns a set from a group of pictures into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Tower

Four of the eleven layouts stack four stones or more. Kept on their own, every avatar is a column, and the width of each stone becomes the thing that separates one from the next.

```json
{
  "pilesVariant": ["tower","five","four","fourLean"]
}
```

## Close Up

Uses scale rather than color. The bottom stone runs past the edge, which reads better at the size a comment thread gives an avatar.

```json
{
  "scale": 1.3
}
```

---

Source: https://www.dicebear.com/styles/stripes/

# Stripes

Stripes is an abstract vector avatar style of two-tone parallel bands rotated at
varying angles across a colored background. Generate graphic SVG profile icons
that work as avatar placeholders or minimalist user identifiers.

- **Style name:** `stripes`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/stripes/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/stripes.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/stripes.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("stripes.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features stripes
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::STRIPES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Stripes))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/stripes.dart';

final style = Style.parse(stripes);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Stripes);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear stripes
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the stripes.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the stripes.
- **Stencil:** One background for everyone, only the shape varies.

The full option set of each one is at https://www.dicebear.com/styles/stripes/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `bodyVariant` | enum (array allowed) | `variant05`, `variant10` |
| `bodyProbability` | number | 0 to 100 |
| `stripeVariant` | enum (array allowed) | `variant02`, `variant04`, `variant06`, `variant08`, `variant10` |
| `stripeProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `stripeColor` | color (array allowed) | Hex color, `#` optional |
| `stripeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `stripeColorFillStops` | range |  |
| `stripeColorAngle` | range | -360 to 360 |
| `stripeColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/stripes/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/stripes/definition.json`.

---

Source: https://www.dicebear.com/styles/stripes/presets/

# Stripes presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the stripes changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend.

```json
{
  "backgroundColor": ["16161c"]
}
```

---

Source: https://www.dicebear.com/styles/thumbs/

# Thumbs

Thumbs is a playful vector avatar style of rounded thumb-shaped characters in a
single solid color, with simple eyes and mouth on a tinted background. Generate
friendly SVG profile icons that work well as default user avatars.

- **Style name:** `thumbs`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/thumbs/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/thumbs.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/thumbs.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("thumbs.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features thumbs
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::THUMBS)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Thumbs))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/thumbs.dart';

final style = Style.parse(thumbs);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Thumbs);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear thumbs
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the thumb.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the thumb.
- **Stencil:** One background for everyone, only the shape varies.
- **Animated:** Turns the style's built-in animation on.
- **Close Up:** Scaled in, so the shape runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/thumbs/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `bodyVariant` | enum (array allowed) | `default` |
| `bodyProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05`, `variant06`, `variant07`, `variant08` |
| `eyesProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `default` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `variant01`, `variant02`, `variant03`, `variant04`, `variant05` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `eyesColor` | color (array allowed) | Hex color, `#` optional |
| `eyesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `eyesColorFillStops` | range |  |
| `eyesColorAngle` | range | -360 to 360 |
| `eyesColorOrder` | enum | `random`, `fixed` |
| `mouthColor` | color (array allowed) | Hex color, `#` optional |
| `mouthColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `mouthColorFillStops` | range |  |
| `mouthColorAngle` | range | -360 to 360 |
| `mouthColorOrder` | enum | `random`, `fixed` |
| `shapeColor` | color (array allowed) | Hex color, `#` optional |
| `shapeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shapeColorFillStops` | range |  |
| `shapeColorAngle` | range | -360 to 360 |
| `shapeColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/thumbs/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/thumbs/definition.json`.

---

Source: https://www.dicebear.com/styles/thumbs/presets/

# Thumbs presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture. The thumb takes the same warm palette, since it is the subject rather than a shape sitting on one.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"],
  "shapeColor": ["d8b48c","c19a70","a37e58"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast. The thumb goes grey with it; the eyes and mouth still flip to whichever of black and white contrasts more.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"],
  "shapeColor": ["c4c4c8","9a9a9e","6e6e72"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the thumb changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"],
  "shapeColor": ["9aa2d2"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "shapeColor": ["a5a58d","b98b73","7c9082","8e9aaf"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "shapeColor": ["ff2e88","00e5ff","ffe600","7cff00"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"],
  "shapeColor": ["ffffff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"],
  "shapeColor": ["ffffff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135,
  "shapeColor": ["fff4e8"]
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend. The thumb goes near white against it.

```json
{
  "backgroundColor": ["16161c"],
  "shapeColor": ["f2f2f4"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion, and a static avatar next to an animated one stays static.

```json
{
  "tags": ["animation"]
}
```

## Close Up

Uses scale rather than color. Cropping in turns the composition from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/toon-head/

# Toon Head

Toon Head is an illustrated vector avatar style of half-body character portraits
with naturalistic proportions, diverse skin tones, hairstyles, and facial hair.
Generate expressive SVG profile icons in an animated-series look, well suited to
community apps and social products.

- **Style name:** `toon-head`
- **Category:** Characters
- **Animated:** no
- **Creator:** Johan Melin (https://www.johanmelin.com)
- **Source:** https://www.figma.com/community/file/1589627891082866389
- **License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/toon-head/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/toon-head.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/toon-head.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("toon-head.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features toon-head
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::TOON_HEAD)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.ToonHead))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/toon_head.dart';

final style = Style.parse(toonHead);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.ToonHead);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear toon-head
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No beard, no hair behind the shoulders.
- **Sepia:** Skin, hair and shirt on one brown ramp.
- **Greyscale:** No hue on skin, hair or shirt.
- **Duotone:** One blue, three steps of it.
- **Muted:** Dusty shirts, skin and hair untouched.
- **Electric:** Shirts past anything the style ships.
- **Pastel Wall:** A soft ground behind the head.
- **Bold Pop:** Six saturated grounds.
- **Night Shift:** Near-black ground, pale shirts.
- **Sunrise:** A warm gradient behind the shoulders.
- **Full Cast:** Beard and long hair on everyone.
- **Close Up:** The head scaled up, shoulders cropped.

The full option set of each one is at https://www.dicebear.com/styles/toon-head/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `beardVariant` | enum (array allowed) | `chin`, `chinMoustache`, `fullBeard`, `longBeard`, `moustacheTwirl` |
| `beardProbability` | number | 0 to 100 |
| `bodyVariant` | enum (array allowed) | `body` |
| `bodyProbability` | number | 0 to 100 |
| `clothesVariant` | enum (array allowed) | `dress`, `openJacket`, `shirt`, `tShirt`, `turtleNeck` |
| `clothesProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `angry`, `happy`, `neutral`, `raised`, `sad` |
| `eyebrowsProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `bow`, `happy`, `humble`, `wide`, `wink` |
| `eyesProbability` | number | 0 to 100 |
| `hairVariant` | enum (array allowed) | `bun`, `sideComed`, `spiky`, `undercut` |
| `hairProbability` | number | 0 to 100 |
| `headVariant` | enum (array allowed) | `head` |
| `headProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `agape`, `angry`, `laugh`, `sad`, `smile` |
| `mouthProbability` | number | 0 to 100 |
| `rearHairVariant` | enum (array allowed) | `longStraight`, `longWavy`, `neckHigh`, `shoulderHigh` |
| `rearHairProbability` | number | 0 to 100 |
| `clothesColor` | color (array allowed) | Hex color, `#` optional |
| `clothesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `clothesColorFillStops` | range |  |
| `clothesColorAngle` | range | -360 to 360 |
| `clothesColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `strokeColor` | color (array allowed) | Hex color, `#` optional |
| `strokeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `strokeColorFillStops` | range |  |
| `strokeColorAngle` | range | -360 to 360 |
| `strokeColorOrder` | enum | `random`, `fixed` |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/toon-head/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/toon-head/definition.json`.

---

Source: https://www.dicebear.com/styles/toon-head/presets/

# Toon Head presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Both components appear on half the avatars by default. Off, the silhouette tightens to the head and the shirt, which reads more evenly down a list.

```json
{
  "beardProbability": 0,
  "rearHairProbability": 0
}
```

## Sepia

Two mouths are excluded: they open onto a bright tongue that is painted into the artwork rather than taking a color option. One thing stays warm through all of this: the iris is painted a dark brown that no option reaches, so each eye keeps a small colored dot.

```json
{
  "backgroundColor": ["ede2ce"],
  "skinColor": ["d9bd94","c4a377","a8865a","8a6a43","e3cdb0"],
  "hairColor": ["3a2916","4a3018","5c4223","7d6038","a08256"],
  "clothesColor": ["8a6a3c","6d5031","a88b60","5a4227","3a2916"],
  "mouthVariant": ["angry","sad","smile"]
}
```

## Greyscale

The style outlines everything in a dark line and shades with flat blocks, both of which survive losing color. Same mouth exclusion as Sepia. One thing stays warm through all of this: the iris is painted a dark brown that no option reaches, so each eye keeps a small colored dot.

```json
{
  "backgroundColor": ["ececee"],
  "skinColor": ["d4d4d8","b4b4bb","94949c","76767e","e4e4e7"],
  "hairColor": ["18181b","3f3f46","52525b","71717a","a1a1aa"],
  "clothesColor": ["3f3f46","52525b","71717a","27272a","e4e4e7"],
  "mouthVariant": ["angry","sad","smile"]
}
```

## Duotone

Skin, hair and shirt each take one step of the same hue. What separates two avatars is the haircut, the brows and the mouth. One thing stays warm through all of this: the iris is painted a dark brown that no option reaches, so each eye keeps a small colored dot.

```json
{
  "backgroundColor": ["e6ecef"],
  "skinColor": ["9ec9e8"],
  "hairColor": ["1d3d52"],
  "clothesColor": ["37718e"],
  "mouthVariant": ["angry","sad","smile"]
}
```

## Muted

The style ships ten shirt colors, most of them fully saturated. These are the same garments in tones that sit quietly next to each other.

```json
{
  "clothesColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58","8a7f6d"]
}
```

## Electric

The same group the other way, and only that group. The hair keeps its natural palette, because loud hair over a loud shirt leaves nothing for the eye to land on.

```json
{
  "clothesColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

The style ships no background at all, so an avatar sits on whatever is behind it. Six pale colors give it a tile of its own.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

Everything in this style is outlined, which is what lets it sit on a saturated ground without the edges dissolving.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The shirt palette moves to light tones, because the style's default charcoal and navy shirts merge into a dark tile.

```json
{
  "backgroundColor": ["16161a"],
  "clothesColor": ["e8e9e6","d4d4d8","eab308","f97316","9ca3af"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. Both stops stay light so the dark outline around the head keeps its edge.

```json
{
  "backgroundColor": ["ffd5a8","ff9db4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

Both optional components turned up. The style ships five beards and four back-hair shapes that half the seeds never reach.

```json
{
  "beardProbability": 100,
  "rearHairProbability": 100
}
```

## Close Up

The style frames head and shoulders, and the shoulders cost size at small dimensions. This trades them for a face that carries at 32 pixels.

```json
{
  "scale": 1.2
}
```

---

Source: https://www.dicebear.com/styles/triangles/

# Triangles

Triangles is an abstract vector avatar style that tiles a grid of two-tone
triangles into a tangram-like pattern across a colored background. Generate
graphic SVG profile icons that work as avatar placeholders or decorative user
identifiers.

- **Style name:** `triangles`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/triangles/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/triangles.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/triangles.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("triangles.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features triangles
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::TRIANGLES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Triangles))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/triangles.dart';

final style = Style.parse(triangles);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Triangles);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear triangles
```

## Presets

10 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the triangles.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the triangles.
- **Stencil:** One background for everyone, only the shape varies.
- **Close Up:** Scaled in, so the shape runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/triangles/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `bodyVariant` | enum (array allowed) | `default` |
| `bodyProbability` | number | 0 to 100 |
| `shapeVariant` | enum (array allowed) | `triangle` |
| `shapeProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `shapeColor` | color (array allowed) | Hex color, `#` optional |
| `shapeColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shapeColorFillStops` | range |  |
| `shapeColorAngle` | range | -360 to 360 |
| `shapeColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/triangles/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/triangles/definition.json`.

---

Source: https://www.dicebear.com/styles/triangles/presets/

# Triangles presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette is enough to carry the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not. The shape still flips between black and white for contrast.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar in a set shares it, and only the triangles changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships. The shape flips to whichever of black and white survives them.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together. The shape goes black against all five.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet, which is what you want in a toolbar or a legend.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Close Up

Uses scale rather than color. Cropping in turns the composition from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/voxel-art/

# Voxel Art

Voxel Art is a blocky vector avatar style that stacks small 3D cubes into
full-body characters with hair, outfits, glasses, and beards. Generate playful
SVG profile icons in a voxel-game look for games and community apps.

- **Style name:** `voxel-art`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/voxel-art/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/voxel-art.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/voxel-art.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("voxel-art.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features voxel-art
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::VOXEL_ART)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.VoxelArt))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/voxel_art.dart';

final style = Style.parse(voxelArt);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.VoxelArt);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear voxel-art
```

## Presets

13 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No beard, no glasses, no blush.
- **Sepia:** Eight groups on one brown ramp.
- **Greyscale:** No hue on any of the eight groups.
- **Duotone:** One blue, four steps of it.
- **Muted:** A dusty wardrobe, faces untouched.
- **Electric:** Neon shirts, natural hair.
- **Pastel Wall:** Six soft grounds instead of five.
- **Bold Pop:** Saturated ground behind the figure.
- **Night Shift:** Near-black ground, lit shirts.
- **Sunrise:** A warm gradient behind the figure.
- **Full Cast:** Glasses, beard and blush on everyone.
- **Close Up:** Head and torso, legs cropped away.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/voxel-art/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `outfitVariant` | enum (array allowed) | `checker`, `coat`, `dress`, `hoodie`, `jacket`, `overalls`, `plain`, `stripes`, `suit`, `tie` |
| `outfitProbability` | number | 0 to 100 |
| `beardVariant` | enum (array allowed) | `full`, `goatee`, `mustache`, `stubble` |
| `beardProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `bigSmile`, `flat`, `frown`, `grin`, `laugh`, `ooh`, `smile`, `smirk`, `tongue`, `wideSmile` |
| `mouthProbability` | number | 0 to 100 |
| `cheeksVariant` | enum (array allowed) | `blush`, `freckles`, `pixel` |
| `cheeksProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `closed`, `happy`, `open`, `side`, `sleepy`, `soft`, `star`, `wide` |
| `eyesProbability` | number | 0 to 100 |
| `eyebrowsVariant` | enum (array allowed) | `angry`, `flat`, `raised`, `soft` |
| `eyebrowsProbability` | number | 0 to 100 |
| `noseVariant` | enum (array allowed) | `block`, `small`, `tall`, `wide` |
| `noseProbability` | number | 0 to 100 |
| `glassesVariant` | enum (array allowed) | `cat`, `round`, `shades`, `square`, `visor` |
| `glassesProbability` | number | 0 to 100 |
| `topVariant` | enum (array allowed) | `afro`, `animalEars`, `beanie`, `bob`, `bowl`, `braids`, `bunnyEars`, `buns`, `cap`, `curly`, `halfShaved`, `longStraight`, `longWavy`, `mohawk`, `partedLong`, `ponytail`, `short`, `shoulderLength`, `sideSwept`, `spiky`, `twinTails` |
| `topProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `skinColor` | color (array allowed) | Hex color, `#` optional |
| `skinColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `skinColorFillStops` | range |  |
| `skinColorAngle` | range | -360 to 360 |
| `skinColorOrder` | enum | `random`, `fixed` |
| `hairColor` | color (array allowed) | Hex color, `#` optional |
| `hairColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hairColorFillStops` | range |  |
| `hairColorAngle` | range | -360 to 360 |
| `hairColorOrder` | enum | `random`, `fixed` |
| `hatColor` | color (array allowed) | Hex color, `#` optional |
| `hatColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `hatColorFillStops` | range |  |
| `hatColorAngle` | range | -360 to 360 |
| `hatColorOrder` | enum | `random`, `fixed` |
| `shirtColor` | color (array allowed) | Hex color, `#` optional |
| `shirtColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shirtColorFillStops` | range |  |
| `shirtColorAngle` | range | -360 to 360 |
| `shirtColorOrder` | enum | `random`, `fixed` |
| `pantsColor` | color (array allowed) | Hex color, `#` optional |
| `pantsColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `pantsColorFillStops` | range |  |
| `pantsColorAngle` | range | -360 to 360 |
| `pantsColorOrder` | enum | `random`, `fixed` |
| `shoesColor` | color (array allowed) | Hex color, `#` optional |
| `shoesColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `shoesColorFillStops` | range |  |
| `shoesColorAngle` | range | -360 to 360 |
| `shoesColorOrder` | enum | `random`, `fixed` |
| `jacketColor` | color (array allowed) | Hex color, `#` optional |
| `jacketColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `jacketColorFillStops` | range |  |
| `jacketColorAngle` | range | -360 to 360 |
| `jacketColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/voxel-art/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/voxel-art/definition.json`.

---

Source: https://www.dicebear.com/styles/voxel-art/presets/

# Voxel Art presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Three optional components off at once. What is left is the outfit, the hair and the face, which is where most of this style's variety lives anyway.

```json
{
  "beardProbability": 0,
  "glassesProbability": 0,
  "cheeksProbability": 0
}
```

## Sepia

Two mouths and two head pieces are excluded: the tongue mouths and the animal ears carry a printed pink that no color option reaches.

```json
{
  "backgroundColor": ["ede2ce"],
  "skinColor": ["d9bd94","c4a377","a8865a","8a6a43","e3cdb0"],
  "hairColor": ["3a2916","4a3018","5c4223","7d6038","a08256"],
  "hatColor": ["6d5031","8a6a3c","a88b60"],
  "shirtColor": ["8a6a3c","6d5031","a88b60","5a4227"],
  "pantsColor": ["4a3018","5c4223","3a2916"],
  "shoesColor": ["2b1d10","4a3018"],
  "jacketColor": ["6d5031","3a2916","a08256"],
  "mouthVariant": ["smile","bigSmile","flat","ooh","smirk","wideSmile","frown","grin"],
  "topVariant": ["short","spiky","bowl","sideSwept","curly","mohawk","buns","ponytail","bob","shoulderLength","longStraight","longWavy","partedLong","braids","twinTails","cap","beanie","afro","halfShaved"]
}
```

## Greyscale

The style shades every cube face separately, so a set of greys keeps all its depth. Same exclusions as Sepia.

```json
{
  "backgroundColor": ["ececee"],
  "skinColor": ["e4e4e7","c1c1c7","a1a1aa","76767e","d4d4d8"],
  "hairColor": ["18181b","3f3f46","52525b","71717a","a1a1aa"],
  "hatColor": ["52525b","71717a","27272a"],
  "shirtColor": ["3f3f46","52525b","71717a","27272a"],
  "pantsColor": ["27272a","3f3f46","18181b"],
  "shoesColor": ["18181b","3f3f46"],
  "jacketColor": ["52525b","18181b","a1a1aa"],
  "mouthVariant": ["smile","bigSmile","flat","ooh","smirk","wideSmile","frown","grin"],
  "topVariant": ["short","spiky","bowl","sideSwept","curly","mohawk","buns","ponytail","bob","shoulderLength","longStraight","longWavy","partedLong","braids","twinTails","cap","beanie","afro","halfShaved"]
}
```

## Duotone

Skin, hair and every garment take a step of the same hue. What separates two avatars is the haircut, the outfit shape and the face.

```json
{
  "backgroundColor": ["e6ecef"],
  "skinColor": ["9ec9e8"],
  "hairColor": ["12293a"],
  "hatColor": ["1d3d52"],
  "shirtColor": ["37718e"],
  "pantsColor": ["1d3d52"],
  "shoesColor": ["12293a"],
  "jacketColor": ["4a8bab"],
  "mouthVariant": ["smile","bigSmile","flat","ooh","smirk","wideSmile","frown","grin"],
  "topVariant": ["short","spiky","bowl","sideSwept","curly","mohawk","buns","ponytail","bob","shoulderLength","longStraight","longWavy","partedLong","braids","twinTails","cap","beanie","afro","halfShaved"]
}
```

## Muted

The style ships ten shirt colors at full strength. These are the same clothes in tones that sit quietly, which suits a list where a dozen figures appear at once.

```json
{
  "shirtColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58","8a7f6d"],
  "jacketColor": ["5f6357","7b6a58","6b7280","8a7f6d"]
}
```

## Electric

Only the shirt moves. The style already offers fantasy hair colors, and pairing those with a neon shirt leaves nothing for the eye to settle on.

```json
{
  "shirtColor": ["ff2e88","00e5ff","7cff00","ffe600","ff6a00","b400ff"]
}
```

## Pastel Wall

Close to what the style ships, with a green added and each color pulled a little further apart, so a row of tiles reads as six choices rather than five near-misses.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The five grounds the style ships are all pale. A loud one turns the same figure from a portrait into a poster.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The shirt palette moves to light tones, because the style's charcoal shirts and dark trousers merge into a dark tile.

```json
{
  "backgroundColor": ["16161a"],
  "shirtColor": ["f1f3f5","fab005","40c057","228be6","e64980"],
  "pantsColor": ["7a86a8","4a4e69","495057"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd5a8","ff9db4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Full Cast

Three optional components turned up. The style ships five pairs of glasses and four beards that most seeds never reach.

```json
{
  "glassesProbability": 100,
  "beardProbability": 100,
  "cheeksProbability": 100
}
```

## Close Up

The full figure is small at avatar sizes and its identity is in the face. This crops to the top two thirds and keeps the hair.

```json
{
  "scale": 1.25
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/voxel-bot/

# Voxel Bot

Voxel Bot is a blocky vector avatar style of small 3D robots with glowing screen
faces, antennas, and two-tone bodies. Generate friendly SVG robot icons for
developer tools, chat bots, and tech products.

- **Style name:** `voxel-bot`
- **Category:** Characters
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/voxel-bot/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/voxel-bot.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/voxel-bot.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("voxel-bot.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features voxel-bot
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::VOXEL_BOT)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.VoxelBot))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/voxel_bot.dart';

final style = Style.parse(voxelBot);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.VoxelBot);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear voxel-bot
```

## Presets

12 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Bare:** No head fitting, no chest panel.
- **Sepia:** One warm brown across every face of the cube.
- **Greyscale:** Steel, with the screen still darker than the shell.
- **Duotone:** One teal shell, one lime screen.
- **Muted:** A dusty chassis palette.
- **Electric:** Neon indicator lights, quiet shell.
- **Pastel Wall:** Soft ground, the style's own chassis.
- **Bold Pop:** Saturated ground behind a pastel bot.
- **Night Shift:** Dark room, lit screen.
- **Sunrise:** A warm gradient behind the bot.
- **Close Up:** Head and torso, feet cropped away.
- **Animated:** Turns the style's built-in animation on.

The full option set of each one is at https://www.dicebear.com/styles/voxel-bot/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `chestVariant` | enum (array allowed) | `buttons`, `dial`, `heart`, `screen`, `slot`, `vents` |
| `chestProbability` | number | 0 to 100 |
| `eyesVariant` | enum (array allowed) | `cyclops`, `happy`, `plus`, `round`, `sleepy`, `square`, `visor` |
| `eyesProbability` | number | 0 to 100 |
| `mouthVariant` | enum (array allowed) | `grill`, `line`, `smile`, `speaker`, `zigzag` |
| `mouthProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `topVariant` | enum (array allowed) | `antenna`, `dish`, `fin`, `lightbar`, `siren`, `studs`, `twin` |
| `topProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `bodyColor` | color (array allowed) | Hex color, `#` optional |
| `bodyColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `bodyColorFillStops` | range |  |
| `bodyColorAngle` | range | -360 to 360 |
| `bodyColorOrder` | enum | `random`, `fixed` |
| `accentColor` | color (array allowed) | Hex color, `#` optional |
| `accentColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `accentColorFillStops` | range |  |
| `accentColorAngle` | range | -360 to 360 |
| `accentColorOrder` | enum | `random`, `fixed` |
| `screenColor` | color (array allowed) | Hex color, `#` optional |
| `screenColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `screenColorFillStops` | range |  |
| `screenColorAngle` | range | -360 to 360 |
| `screenColorOrder` | enum | `random`, `fixed` |
| `glowColor` | color (array allowed) | Hex color, `#` optional |
| `glowColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `glowColorFillStops` | range |  |
| `glowColorAngle` | range | -360 to 360 |
| `glowColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/voxel-bot/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/voxel-bot/definition.json`.

---

Source: https://www.dicebear.com/styles/voxel-bot/presets/

# Voxel Bot presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Bare

Both of those components are optional already. Off, what is left is the chassis itself, and the face is the only thing that varies.

```json
{
  "topProbability": 0,
  "chestProbability": 0
}
```

## Sepia

The chest panel skips its button variant here. Those buttons are painted red in the artwork rather than taking a color option, and one red dot undoes a monochrome set.

```json
{
  "backgroundColor": ["e7d5b8"],
  "bodyColor": ["b39572","9c7d5c","c7ab8a"],
  "accentColor": ["4a3826","6b5138"],
  "screenColor": ["2a1d12"],
  "glowColor": ["d9b98c","e8d3ae"],
  "chestVariant": ["vents","screen","heart","dial","slot"]
}
```

## Greyscale

The style shades every cube face separately, so a set of greys keeps all its depth. Same exclusion as Sepia for the red buttons.

```json
{
  "backgroundColor": ["e4e4e7"],
  "bodyColor": ["d4d4d8","a1a1aa","e4e4e7"],
  "accentColor": ["3f3f46","52525b"],
  "screenColor": ["18181b"],
  "glowColor": ["fafafa","d4d4d8"],
  "chestVariant": ["vents","screen","heart","dial","slot"]
}
```

## Duotone

Two colors and their shading. Only the eyes, mouth and head fitting change from avatar to avatar, which makes a set read as one production run.

```json
{
  "backgroundColor": ["0d3b3f"],
  "bodyColor": ["3fa8a0"],
  "accentColor": ["10403f"],
  "screenColor": ["07211f"],
  "glowColor": ["bef264"],
  "chestVariant": ["vents","screen","dial","slot"]
}
```

## Muted

The style's shell colors are candy-bright. These are the same idea in tones that hold still, for a list where a dozen bots appear at once. The red button panel is excluded, since one saturated dot is enough to break a quiet set.

```json
{
  "chestVariant": ["vents","screen","heart","dial","slot"],
  "backgroundColor": ["ddd8cd"],
  "bodyColor": ["a8a396","8c9b8f","9a8f80","8896a3","a0919b","b0a58c"],
  "glowColor": ["c8b98f","9fb0a6","b09a9a"]
}
```

## Electric

Only the lit parts go loud. Bright shell and bright glow together cancel each other out, so the chassis stays pale and the screen carries the color.

```json
{
  "backgroundColor": ["0f0f12"],
  "bodyColor": ["e9ecef","ced4da"],
  "accentColor": ["23262b"],
  "screenColor": ["07070a"],
  "glowColor": ["ff2e88","00e5ff","7cff00","ffe600","b400ff"]
}
```

## Pastel Wall

Six backgrounds instead of the five the style ships, all of them light enough that the dark screen stays the darkest thing in the frame.

```json
{
  "backgroundColor": ["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","d9f2d9"]
}
```

## Bold Pop

The chassis colors are soft, so a loud background pushes them forward instead of competing with them.

```json
{
  "backgroundColor": ["ff2e63","00c2a8","ffb300","3d5afe","8e24aa","00e676"]
}
```

## Night Shift

For dark interfaces. The chassis keeps its light metal so the bot does not disappear into the ground, and the screen glow becomes the brightest thing on the tile.

```json
{
  "backgroundColor": ["141418"],
  "bodyColor": ["e9ecef","aeb8c2","b6a6f5","74c0fc"],
  "screenColor": ["07070a"],
  "glowColor": ["3bc9db","69db7c","ffd43b","e599f7"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top, so the light comes from either side across a set.

```json
{
  "backgroundColor": ["ffd5a8","ff9db4"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 45
}
```

## Close Up

The full bot is small at avatar sizes and most of its identity is in the face. This crops to the top two thirds and keeps whatever is mounted on the head.

```json
{
  "scale": 1.2
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

---

Source: https://www.dicebear.com/styles/waves/

# Waves

Waves is an abstract vector avatar style that layers rippling wave bands in
shades of a single color. Generate serene SVG profile icons that work as avatar
placeholders or decorative backgrounds.

- **Style name:** `waves`
- **Category:** Minimalist
- **Animated:** yes
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/waves/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/waves.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/waves.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("waves.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features waves
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::WAVES)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Waves))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/waves.dart';

final style = Style.parse(waves);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Waves);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear waves
```

## Presets

11 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Four warm browns behind the waves.
- **Greyscale:** Four greys, no hue at all.
- **Duotone:** One indigo, one shape color.
- **Muted:** Six dusty backgrounds instead of the bright ones.
- **Electric:** Six backgrounds at full saturation.
- **Pastel Wall:** Five soft backgrounds.
- **Bold Pop:** Five saturated backgrounds.
- **Sunrise:** A warm gradient behind the waves.
- **Stencil:** One background for everyone, only the drawing varies.
- **Animated:** Turns the style's built-in animation on.
- **Close Up:** Scaled in, so the pattern runs past the edge.

The full option set of each one is at https://www.dicebear.com/styles/waves/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `rotationVariant` | enum (array allowed) | `free`, `none`, `quarter` |
| `rotationProbability` | number | 0 to 100 |
| `bodyQuarterVariant` | enum (array allowed) | `default` |
| `bodyQuarterProbability` | number | 0 to 100 |
| `bodyFreeVariant` | enum (array allowed) | `default` |
| `bodyFreeProbability` | number | 0 to 100 |
| `bodyVariant` | enum (array allowed) | `quartet`, `quintet`, `sextet`, `trio` |
| `bodyProbability` | number | 0 to 100 |
| `layerVariant` | enum (array allowed) | `calm`, `ripple`, `rolling`, `surge`, `swell` |
| `layerProbability` | number | 0 to 100 |
| `animationVariant` | enum (array allowed) | `fast`, `fastest`, `medium`, `none`, `slow`, `slowest` |
| `animationProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `waveColor` | color (array allowed) | Hex color, `#` optional |
| `waveColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `waveColorFillStops` | range |  |
| `waveColorAngle` | range | -360 to 360 |
| `waveColorOrder` | enum | `random`, `fixed` |
| `tags` | enum (array allowed) | `animation` (further values allowed) |

The same table is available as JSON at
`https://api.dicebear.com/10.x/waves/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/waves/definition.json`.

---

Source: https://www.dicebear.com/styles/waves/presets/

# Waves presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The shape color follows the background automatically, picking whichever of black and white contrasts more, so changing the palette carries the whole picture.

```json
{
  "backgroundColor": ["8a6a48","6b4f35","a3855f","54402c"]
}
```

## Greyscale

Useful for a print stylesheet, a disabled state, or anywhere color would carry meaning it should not.

```json
{
  "backgroundColor": ["343437","5e5e62","8c8c90","b6b6b9"]
}
```

## Duotone

A single background hue means every avatar shares it and only the waves changes. The most restrained this style gets.

```json
{
  "backgroundColor": ["3d4272"]
}
```

## Muted

The style ships a saturated background palette. This trades it for dusty tones, for interfaces where the avatar should be present without being the loudest thing on screen.

```json
{
  "backgroundColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships.

```json
{
  "backgroundColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"]
}
```

## Pastel Wall

The lightest way to make a set of avatars feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle. The seed still decides which of the two ends up on top.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Stencil

Every avatar gets the same near-black ground, so nothing distinguishes them but the drawing itself. That turns a set from a group of portraits into an icon sheet.

```json
{
  "backgroundColor": ["16161c"]
}
```

## Animated

The style ships an animation component that is off by default. The `animation` tag switches it on and lets the seed pick a speed. It respects prefers-reduced-motion.

```json
{
  "tags": ["animation"]
}
```

## Close Up

Uses scale rather than color. Cropping in turns the composition from a complete picture into a detail of a larger one, which reads better at small sizes.

```json
{
  "scale": 1.4
}
```

---

Source: https://www.dicebear.com/styles/weave/

# Weave

Weave is an abstract vector avatar style that crosses translucent pastel stripes
into a plaid-like woven pattern. Generate colorful SVG profile icons that work
as avatar placeholders or decorative user identifiers.

- **Style name:** `weave`
- **Category:** Minimalist
- **Animated:** no
- **Creator:** DiceBear (https://www.dicebear.com)
- **Source:** https://www.dicebear.com
- **License:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)

## Usage

Every library below produces the same SVG for the same seed and options.

HTTP API:

```
https://api.dicebear.com/10.x/weave/svg?seed=John
```

JavaScript:

```
npm install @dicebear/core @dicebear/styles --save
```

```js
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/weave.json' with { type: 'json' };

const style = new Style(definition);
const avatar = new Avatar(style, { seed: 'John' });

const svg = avatar.toString();
```

PHP:

```
composer require dicebear/core dicebear/styles
```

```php
<?php

use Composer\InstalledVersions;
use DiceBear\Style;
use DiceBear\Avatar;

$basePath = InstalledVersions::getInstallPath('dicebear/styles');
$style = Style::fromJson(file_get_contents($basePath . '/src/weave.json'));

$avatar = new Avatar($style, ['seed' => 'John']);

$svg = (string) $avatar;
```

Python:

```
pip install dicebear-core dicebear-styles
```

```python
from importlib.resources import files

from dicebear import Avatar, Style

style = Style.from_json(
    files("dicebear_styles").joinpath("weave.json").read_text("utf-8")
)

avatar = Avatar(style, {"seed": "John"})

svg = avatar.to_string()
```

Rust:

```
cargo add dicebear-core serde_json
cargo add dicebear-styles --features weave
```

```rust
use dicebear_core::{Avatar, Style};
use serde_json::json;

let style = Style::from_str(dicebear_styles::WEAVE)?;
let avatar = Avatar::new(&style, json!({ "seed": "John" }))?;

let svg = avatar.to_svg();
```

Go:

```
go get github.com/dicebear/dicebear-go/v10
go get github.com/dicebear/styles/v10
```

```go
import (
	dicebear "github.com/dicebear/dicebear-go/v10"
	"github.com/dicebear/styles/v10"
)

style, _ := dicebear.NewStyle([]byte(styles.Weave))
avatar, _ := dicebear.NewAvatar(style, map[string]any{"seed": "John"})

svg := avatar.SVG()
```

Dart:

```
dart pub add dicebear_core dicebear_styles
```

```dart
import 'package:dicebear_core/dicebear_core.dart';
import 'package:dicebear_styles/weave.dart';

final style = Style.parse(weave);
final avatar = Avatar(style, {'seed': 'John'});

final svg = avatar.svg;
```

C#:

```
dotnet add package DiceBear.Core
dotnet add package DiceBear.Styles
```

```csharp
using System.Text.Json.Nodes;
using DiceBear;

var style = Style.Parse(Styles.Weave);
var avatar = new Avatar(style, new JsonObject { ["seed"] = "John" });

var svg = avatar.ToSvg();
```

CLI:

```
npm install --global dicebear
```

```
dicebear weave
```

## Presets

9 ready-made option sets for this style. Each is a plain set of
render options: pass it to any of the libraries or send it as HTTP-API query
parameters. You do not need to install anything for them, and any option a
preset leaves out keeps varying with the seed.

- **Sepia:** Three browns woven on tanned paper.
- **Greyscale:** Three greys, no hue at all.
- **Duotone:** Three steps of one indigo.
- **Muted:** Dusty bands instead of the bright ones.
- **Electric:** Acid bands at full saturation.
- **Pastel Wall:** Soft backgrounds, the weave untouched.
- **Bold Pop:** Saturated backgrounds, loud on purpose.
- **Sunrise:** A warm gradient under the weave.
- **Close Up:** Scaled in, so fewer bands fill the frame.

The full option set of each one is at https://www.dicebear.com/styles/weave/presets/index.md.

## Options

Every option below works in all libraries and as a query parameter of the HTTP
API. The ones built from a component name (`<component>Variant`,
`<component>Probability`) or from a color group (`<group>Color`,
`<group>ColorFill`, `<group>ColorFillStops`, `<group>ColorAngle`,
`<group>ColorOrder`) belong to this style; the rest are
[core options](https://www.dicebear.com/customize/options/) that every style accepts.

| Option | Type | Values |
| --- | --- | --- |
| `seed` | string |  |
| `size` | number | 1 to 4096 |
| `idRandomization` | boolean |  |
| `title` | string |  |
| `flip` | enum (array allowed) | `none`, `horizontal`, `vertical`, `both` |
| `fontFamily` | string (array allowed) |  |
| `fontWeight` | number (array allowed) | 1 to 1000 |
| `scale` | range | 0 to 10 |
| `borderRadius` | range | 0 to 50 |
| `rotate` | range | -360 to 360 |
| `translateX` | range | -1000 to 1000 |
| `translateY` | range | -1000 to 1000 |
| `weaveVariant` | enum (array allowed) | `diagonal`, `diagonalBack`, `straight` |
| `weaveProbability` | number | 0 to 100 |
| `latticeVariant` | enum (array allowed) | `default` |
| `latticeProbability` | number | 0 to 100 |
| `bandAVariant` | enum (array allowed) | `medium`, `thin`, `twin`, `wide` |
| `bandAProbability` | number | 0 to 100 |
| `bandB02Variant` | enum (array allowed) | `medium`, `thin`, `twin`, `wide` |
| `bandB02Probability` | number | 0 to 100 |
| `bandC02Variant` | enum (array allowed) | `medium`, `thin`, `twin`, `wide` |
| `bandC02Probability` | number | 0 to 100 |
| `bandBVariant` | enum (array allowed) | `medium`, `thin`, `twin`, `wide` |
| `bandBProbability` | number | 0 to 100 |
| `bandCVariant` | enum (array allowed) | `medium`, `thin`, `twin`, `wide` |
| `bandCProbability` | number | 0 to 100 |
| `lineAccentVariant` | enum (array allowed) | `default` |
| `lineAccentProbability` | number | 0 to 100 |
| `backgroundColor` | color (array allowed) | Hex color, `#` optional |
| `backgroundColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `backgroundColorFillStops` | range |  |
| `backgroundColorAngle` | range | -360 to 360 |
| `backgroundColorOrder` | enum | `random`, `fixed` |
| `colorAColor` | color (array allowed) | Hex color, `#` optional |
| `colorAColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `colorAColorFillStops` | range |  |
| `colorAColorAngle` | range | -360 to 360 |
| `colorAColorOrder` | enum | `random`, `fixed` |
| `colorBColor` | color (array allowed) | Hex color, `#` optional |
| `colorBColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `colorBColorFillStops` | range |  |
| `colorBColorAngle` | range | -360 to 360 |
| `colorBColorOrder` | enum | `random`, `fixed` |
| `colorCColor` | color (array allowed) | Hex color, `#` optional |
| `colorCColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `colorCColorFillStops` | range |  |
| `colorCColorAngle` | range | -360 to 360 |
| `colorCColorOrder` | enum | `random`, `fixed` |
| `lineColor` | color (array allowed) | Hex color, `#` optional |
| `lineColorFill` | enum (array allowed) | `solid`, `linear`, `radial` |
| `lineColorFillStops` | range |  |
| `lineColorAngle` | range | -360 to 360 |
| `lineColorOrder` | enum | `random`, `fixed` |

The same table is available as JSON at
`https://api.dicebear.com/10.x/weave/options.json`, and the
raw definition at
`https://api.dicebear.com/10.x/weave/definition.json`.

---

Source: https://www.dicebear.com/styles/weave/presets/

# Weave presets

Every preset here is an ordinary set of render options. Nothing needs to be
installed, and the same values work in all seven libraries and as HTTP-API query
parameters. Pick one to read its code, or open it in the playground and change
whatever you like.

Options a preset does not set keep varying with the seed, so most of these stay
as unique per user as the plain style does. Each preset lists how many distinct
avatars it still leaves you.

## Sepia

The three band colors have to differ from each other, so a monochrome weave is really a three-step ladder. The accent line goes with them.

```json
{
  "backgroundColor": ["e3d2b4"],
  "colorAColor": ["8a6a48"],
  "colorBColor": ["6b4f35"],
  "colorCColor": ["a3855f"],
  "lineColor": ["54402c"]
}
```

## Greyscale

The same three-step ladder without color. The weave structure carries the picture on its own.

```json
{
  "backgroundColor": ["ececee"],
  "colorAColor": ["5e5e62"],
  "colorBColor": ["8c8c90"],
  "colorCColor": ["343437"],
  "lineColor": ["b6b6b9"]
}
```

## Duotone

Background and all three bands take the same hue at different lightnesses, which is as close to two colors as the style's own constraints allow.

```json
{
  "backgroundColor": ["dfe3f5"],
  "colorAColor": ["9aa2d2"],
  "colorBColor": ["6a71a8"],
  "colorCColor": ["3d4272"],
  "lineColor": ["23264a"]
}
```

## Muted

The style ships eight saturated band colors. This trades them for dusty tones, which turns the tartan from a beach towel into a wool blanket.

```json
{
  "backgroundColor": ["ece7de"],
  "colorAColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "colorBColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "colorCColor": ["6b705c","a5a58d","b98b73","7c9082","8e9aaf","9c6b58"],
  "lineColor": ["54402c"]
}
```

## Electric

The other direction on the same lever: six colors past anything the style ships.

```json
{
  "backgroundColor": ["101216"],
  "colorAColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "colorBColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "colorCColor": ["ff2e88","00e5ff","ffe600","7cff00","ff6a00","b400ff"],
  "lineColor": ["ffe600"]
}
```

## Pastel Wall

Changes only what the weave sits on. The lightest way to make a set feel like it belongs together.

```json
{
  "backgroundColor": ["ffe3ea","e3edff","e2f5e9","fdf1d4","efe6ff"]
}
```

## Bold Pop

The loud counterpart to Pastel Wall, strong enough that the avatar holds its own against a busy page.

```json
{
  "backgroundColor": ["ff5d8f","ffb703","43aa8b","4d96ff","b57bff"]
}
```

## Sunrise

Shows the gradient background options: two colors, a linear fill and a fixed angle.

```json
{
  "backgroundColor": ["ffd9b0","ffa8bf"],
  "backgroundColorFill": "linear",
  "backgroundColorAngle": 135
}
```

## Close Up

Uses scale rather than color. Fewer, larger bands read better at the size a comment thread gives an avatar.

```json
{
  "scale": 1.5
}
```
