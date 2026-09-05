<!-- Source: https://www.dicebear.com/styles/glass/ -->
<!-- Documentation for DiceBear 10.7.0. The complete docs as one file: https://www.dicebear.com/llms-full.txt -->

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
