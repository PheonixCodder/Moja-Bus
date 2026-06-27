# Overview (/v5)

{/* # Overview */}

## What is Nativewind?

Nativewind allows you to use [Tailwind CSS](https://tailwindcss.com) to style your components in React Native. Styled components can be shared between all React Native platforms, using the best style engine for that platform; CSS StyleSheet on web and StyleSheet.create for native. Its goals are to provide a consistent styling experience across all platforms, improving Developer UX, component performance and code maintainability.

On native platforms, Nativewind performs two functions. First, at build time, it compiles your Tailwind CSS styles into `StyleSheet.create` objects and determines the conditional logic of styles (e.g. hover, focus, active, etc). Second, it has an efficient runtime system that applies the styles to your components. This means you can use the full power of Tailwind CSS, including media queries, container queries, and custom values, while still having the performance of a native style system.

On web, Nativewind is a small polyfill for adding `className` support to React Native Web.

## Key Features

🌐 **Universal** Uses the best style system for each platform.

🖥️ **DevUX** Plugins for simple setup and improving intellisense support

✨ **Media & Container queries** Use modern mobile styling features like media and container queries [(docs)](../core-concepts/states#hover-focus-and-active)

👪 **Custom values (CSS Variables)** Create themes, sub-themes and dynamic styles using custom values

✨ **Pseudo classes** hover / focus / active on compatible components [(docs)](../core-concepts/states#hover-focus-and-active)

👪 **Parent state styles** automatically style children based upon parent pseudo classes [(docs)](../core-concepts/states#hover-focus-and-active#styling-based-on-parent-state)

🔥 **Lots of other features**

- dark mode
- arbitrary classes
- platform selectors
- plugins

## How is this different StyleSheet.create?

A full featured style system should have

- Static styles
- UI state styles (active, hover, focus, etc)
- Responsive styles (media queries, dynamic units)
- Container queries (styling based upon parent appearance)
- Device state styles (orientation, color scheme)
- Use the best rendering engine available

React Native's StyleSheet system only provides static styles, with other features left for the user to implement. By using Nativewind you can focus on writing your system instead of building your own custom style system.

On the web, it avoids injecting a StyleSheet at runtime by reusing the existing Tailwind CSS stylesheet, allowing you to use Server Side Rendering and much better initial page load performance.

## In action

Nativewind handles both the Tailwind CSS compilation and the runtime styles. It works via a JSX transform, meaning there is no need for custom wrappers/boilerplate.

As all React components are transformed with JSX, it works with 3rd party modules.

```tsx
import { CustomText } from "third-party-text-component";

export function BoldText(props) {
  // You just need to write `className="<your styles>"`
  return <CustomText className="text-bold" {...props} />;
}
```

Styling can be dynamic and you can perform conditional logic and build up complex style objects.

```tsx
import { Text } from "react-native";

export function MyText({ bold, italic, lineThrough, ...props }) {
  const classNames = [];

  if (bold) classNames.push("font-bold");
  if (italic) classNames.push("italic");
  if (lineThrough) classNames.push("line-through");

  return <Text className={classNames.join(" ")} {...props} />;
}
```

By default Nativewind maps `className`->`style`, but it can handle the mapping of complex components.

```tsx
remapProps(FlatList, {
  className: "style",
  ListFooterComponentClassName: "ListFooterComponentStyle",
  ListHeaderComponentClassName: "ListHeaderComponentStyle",
  columnWrapperClassName: "columnWrapperStyle",
  contentContainerClassName: "contentContainerStyle",
});

<FlatList
  {...}
  className="bg-black"
  ListHeaderComponentClassName="bg-black text-white"
  ListFooterComponentClassName="bg-black text-white"
  columnWrapperClassName="bg-black"
  contentContainerClassName="bg-black"
  indicatorClassName="bg-black"
/>
```

And can even work with components that expect style attributes as props

```tsx
import { Text } from "react-native";
import { cssInterop } from "nativewind";
import { Svg, Circle } from "react-native-svg";

/**
 * Svg uses `height`/`width` props on native and className on web
 */
const StyledSVG = cssInterop(Svg, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
    },
  },
});
/**
 * Circle uses `fill`/`stroke`/`strokeWidth` props on native and className on web
 */
const StyledCircle = cssInterop(Circle, {
  className: {
    target: "style",
    nativeStyleToProp: {
      fill: true,
      stroke: true,
      strokeWidth: true,
    },
  },
});

export function BoldText(props) {
  return (
    <Svg className="w-1/2 h-1/2" viewBox="0 0 100 100">
      <StyledCircle
        className="fill-green-500 stroke-blue-500 stroke-2"
        cx="50"
        cy="50"
        r="45"
      />
    </Svg>
  );
}
```

# cssInterop & remapProps (/v5/api/css-interop)

{/* # cssInterop & remapProps */}

These functions enable `className` support on components that don't natively handle it. They are primarily used for third-party components.

<Callout type="info">
For your own components, you don't need these functions. Simply accept and pass through `className`. See [Writing Custom Components](../guides/custom-components).
</Callout>

## cssInterop

`cssInterop` tags a component so the Nativewind runtime resolves `className` strings into styles. Use it when a third-party component accepts a `style` prop but doesn't pass through `className`.

```tsx
import { cssInterop } from "nativewind";
import { MapView } from "react-native-maps";

cssInterop(MapView, { className: "style" });

// Now you can use className
<MapView className="w-full h-64" />
```

### Mapping to specific props

Some components use props other than `style` for styling:

```tsx
cssInterop(component, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
    },
  },
});
```

With `nativeStyleToProp`, style properties are extracted from the resolved styles and passed as individual props. This is useful for components like SVGs that expect `height`/`width` as props on native.

### Multiple className props

Components with multiple style props can accept multiple className props:

```tsx
cssInterop(FlatList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

<FlatList
  className="bg-white"
  contentContainerClassName="p-4"
/>
```

## remapProps

`remapProps` is a simpler alternative to `cssInterop` for components that just need prop renaming:

```tsx
import { remapProps } from "nativewind";

const CustomButton = remapProps(ThirdPartyButton, {
  buttonClass: "buttonStyle",
  labelClass: "labelStyle",
});

<CustomButton buttonClass="bg-blue-500" labelClass="text-white" />
```

Options:

```tsx
// Map a new prop to an existing style prop
remapProps(component, { newProp: "existingStyleProp" });

// Override an existing prop to accept className
remapProps(component, { existingProp: true });
```

# styled (/v5/api/styled)

{/* # styled */}

`styled` is a function from `react-native-css` (re-exported by Nativewind) that creates a wrapper component with `className` support and optional prop/style mapping. It is primarily used for third-party native components that don't pass through the `className` prop.

## Basic Usage

```tsx
import { styled } from "nativewind";
import { SomeNativeComponent } from "third-party-library";

const StyledComponent = styled(SomeNativeComponent);

<StyledComponent className="bg-blue-500 p-4" />
```

## Mapping Styles to Props

Some React Native components expect style values as direct props rather than inside a `style` object. Use `styled` to extract specific style properties and pass them as props:

```tsx
import { styled } from "nativewind";
import { Svg, Circle } from "react-native-svg";

const StyledSvg = styled(Svg, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
    },
  },
});

const StyledCircle = styled(Circle, {
  className: {
    target: "style",
    nativeStyleToProp: {
      fill: true,
      stroke: true,
      strokeWidth: true,
    },
  },
});

<StyledSvg className="w-24 h-24" viewBox="0 0 100 100">
  <StyledCircle
    className="fill-green-500 stroke-blue-500 stroke-2"
    cx="50"
    cy="50"
    r="45"
  />
</StyledSvg>
```

<Callout type="info">
For most custom components you write yourself, you don't need `styled`. Simply accept and pass through the `className` prop. `styled` is for third-party components that don't support `className`. See the [third-party components guide](../guides/third-party-components) for more details.
</Callout>

# useColorScheme (/v5/api/use-color-scheme)

{/* # useColorScheme */}

<Callout type="warn" title="Deprecated">
The `useColorScheme` hook from `nativewind` is deprecated in v5. Use `useColorScheme` from `react-native` and `Appearance.setColorScheme()` directly instead.
</Callout>

## Migration

Replace the Nativewind import with the React Native equivalent:

```diff
- import { useColorScheme } from "nativewind";
+ import { useColorScheme, Appearance } from "react-native";
```

The v4 API returned `{ colorScheme, setColorScheme, toggleColorScheme }`. In v5, use the React Native APIs directly:

```tsx
import { useColorScheme, Appearance } from "react-native";

function ThemeToggle() {
  const colorScheme = useColorScheme();

  const setColorScheme = (scheme) => {
    Appearance.setColorScheme(scheme);
  };

  const toggleColorScheme = () => {
    Appearance.setColorScheme(
      Appearance.getColorScheme() === "dark" ? "light" : "dark"
    );
  };

  return (
    <Pressable onPress={toggleColorScheme}>
      <Text>Current: {colorScheme}</Text>
    </Pressable>
  );
}
```

See the [Dark Mode](../core-concepts/dark-mode) guide for more details.

# vars() & useUnstableNativeVariable() (/v5/api/vars)

{/* # vars() & useUnstableNativeVariable() */}

## vars()

`vars` is a function that takes a dictionary of CSS variables and returns a style object. When applied to a component's `style` prop, the variables flow down the component tree, just like CSS custom properties.

```tsx
import { View, Text } from "react-native";
import { vars } from "nativewind";

function ThemedSection({ brandColor }) {
  return (
    <View style={vars({ "--brand-color": brandColor })}>
      <Text className="text-[--brand-color]">Themed text</Text>
    </View>
  );
}
```

Variables set with `vars()` can be consumed by any descendant component using `var()` in their class names or CSS.

### Combining with styles

`vars()` returns a style object, so you can spread it alongside other styles:

```tsx
<View style={[{ padding: 16 }, vars({ "--accent": "blue" })]} />
```

## VariableContextProvider

`VariableContextProvider` sets CSS variables via React context rather than the `style` prop. This is useful when you need variables available to components that aren't direct style descendants:

```tsx
import { VariableContextProvider } from "nativewind";

function App() {
  return (
    <VariableContextProvider variables={{ "--theme-color": "#3b82f6" }}>
      <Text className="text-[--theme-color]">Blue text</Text>
    </VariableContextProvider>
  );
}
```

## useUnstableNativeVariable()

<Callout type="warn">
This API is unstable and may change in future releases.
</Callout>

`useUnstableNativeVariable` reads the current value of a CSS variable from the nearest variable context. This is useful for cases where you need a variable value in JavaScript rather than in a class name:

```tsx
import { useUnstableNativeVariable } from "nativewind";

function MyComponent() {
  const themeColor = useUnstableNativeVariable("--theme-color");
  // Use themeColor in JavaScript logic
}
```

# withNativewind (/v5/api/with-nativewind)

{/* # withNativewind */}

`withNativewind` is a function that wraps your Metro configuration to enable Nativewind. It is a thin wrapper around `react-native-css`'s `withReactNativeCSS`, with Nativewind-specific defaults.

```tsx title="metro.config.js"
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

## Options

`withNativewind` accepts an optional second argument with the same options as `withReactNativeCSS` from `react-native-css/metro`. The following defaults are applied:

| Option | Default | Description |
| --- | --- | --- |
| `globalClassNamePolyfill` | `true` | Enables the babel transform that rewrites imports to add `className` support to all React Native components |
| `typescriptEnvPath` | `"nativewind-env.d.ts"` | Path for the generated TypeScript declaration file that adds `className` types |

You can override any option:

```tsx title="metro.config.js"
module.exports = withNativewind(config, {
  globalClassNamePolyfill: false,
  typescriptEnvPath: "custom-env.d.ts",
});
```

<Callout type="info">
In v4 this function was called `withNativeWind` (capital W). Both spellings work in v5, but `withNativewind` is preferred.
</Callout>

# Dark Mode (/v5/core-concepts/dark-mode)

{/* # Dark Mode */}

Nativewind v5 supports dark mode through the system preference using the `prefers-color-scheme` media query. This works automatically with React Native's `Appearance` API on native and the CSS media query on web.

## System Preference (Automatic)

By default, Tailwind CSS's `dark:` variant uses the system color scheme. No additional configuration is needed:

```tsx
import { View, Text } from "react-native";

function Card() {
  return (
    <View className="bg-white dark:bg-gray-900">
      <Text className="text-black dark:text-white">
        Adapts to system theme
      </Text>
    </View>
  );
}
```

Under the hood, `dark:` maps to `@media (prefers-color-scheme: dark)`, which is reactive on both native and web. When the user changes their system theme, styles update automatically.

## Manual Selection (User Toggle)

To allow users to manually toggle between light and dark mode, use React Native's `Appearance` API:

```tsx
import { Appearance } from "react-native";

function ThemeToggle() {
  const toggleTheme = () => {
    Appearance.setColorScheme(
      Appearance.getColorScheme() === "dark" ? "light" : "dark"
    );
  };

  return (
    <Pressable onPress={toggleTheme} className="p-4 bg-gray-200 dark:bg-gray-800">
      <Text className="text-black dark:text-white">Toggle Theme</Text>
    </Pressable>
  );
}
```

You can read the current color scheme using React Native's `useColorScheme` hook:

```tsx
import { useColorScheme } from "react-native";

function MyComponent() {
  const colorScheme = useColorScheme();
  // colorScheme is "light" | "dark" | null
}
```

See a full implementation with an animated toggle at [nativewind/theme-toggle-v5 on GitHub](https://github.com/nativewind/theme-toggle-v5).

<Callout type="info">
Nativewind v4 provided a custom `useColorScheme` hook from `nativewind`. In v5 this is deprecated -- use `useColorScheme` from `react-native` and `Appearance.setColorScheme()` directly instead.
</Callout>

## Best Practices

Always provide both light and dark mode styles. React Native can have issues with conditionally applied styles:

```tsx
{/* Always specify both variants */}
<Text className="text-black dark:text-white" />

{/* Avoid only specifying one */}
<Text className="dark:text-white" />
```

# Functions & Directives (/v5/core-concepts/functions-and-directives)

{/* # Functions & Directives */}

## Overview

Nativewind v5 uses Tailwind CSS v4, which introduces a CSS-first configuration model. Please refer to the [Tailwind CSS v4 documentation](https://tailwindcss.com/docs/functions-and-directives) for the full directive reference.

## Tailwind CSS v4 Directives

| Directive | Purpose |
| --- | --- |
| `@import` | Import Tailwind layers and other CSS files |
| `@theme` | Define design tokens (colors, spacing, fonts, etc.) |
| `@utility` | Define custom utilities |
| `@custom-variant` | Define custom variants |
| `@source` | Specify content sources for class detection |
| `@plugin` | Load a Tailwind plugin |
| `@apply` | Inline utility classes within custom CSS |

### Example CSS setup

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
```

The `nativewind/theme` import adds React Native-specific theme values (elevation, platform fonts, safe area utilities) and custom variants (`ios:`, `android:`, `native:`, `web:`, `tv:`).

## CSS Functions

These CSS functions are polyfilled on native by `react-native-css`:

### var()

`var()` allows you to use CSS custom properties (variables). Variables can be set in CSS or from JavaScript using the `vars()` function.

```css
:root {
  --brand-color: #3b82f6;
}

.branded {
  color: var(--brand-color);
}
```

```tsx
import { View, Text } from "react-native";
import { vars } from "nativewind";

function ThemedSection({ brandColor }) {
  return (
    <View style={vars({ "--brand-color": brandColor })}>
      <Text className="text-[--brand-color]">Themed text</Text>
    </View>
  );
}
```

Variables are inherited through the component tree, just like CSS.

### calc()

`calc()` performs arithmetic in CSS values. Supported unit types:

- **Numerical** (`px`): `calc(10px + 100px)` resolves to `110`
- **Percentage** (`%`): `calc(var(--width) + 20%)` resolves correctly
- **`rem` units**: `calc(2rem * 5)` resolves using the platform rem value
- **`em` units**: `calc(2em * 2)` resolves relative to the element's font size
- **CSS variables**: `calc(var(--variable) + 20px)` resolves at runtime
- **Inside color functions**: `hsl(calc(var(--H) + 20), 50%, 50%)` works for dynamic colors

```css
.element {
  width: calc(10px + 100px);
  padding: calc(2rem * 3);
  margin: calc(var(--spacing) + 8px);
}
```

<Callout type="warn" title="Limitation: Mixing unit types">
React Native's layout engine does not support mixing numerical and percentage units. `calc(100% - 20px)` will not work. Ensure all operands use the same unit type.
</Callout>

### env()

`env()` accesses device-specific environment values. Supported values:

```css
env(safe-area-inset-top);
env(safe-area-inset-bottom);
env(safe-area-inset-left);
env(safe-area-inset-right);
```

See [Safe Area Insets](../tailwind/new-concepts/safe-area-insets) for more information.

### color-mix()

`color-mix()` blends two colors together in a given color space:

```css
.element {
  color: color-mix(in oklch, red 50%, blue);
}
```

## React Native Functions

Nativewind provides additional functions for React Native-specific values:

### hairlineWidth()

Returns the thinnest visible line width on the device (maps to `StyleSheet.hairlineWidth`):

```css
.thin-border {
  border-width: hairlineWidth();
}
```

### roundToNearestPixel()

Rounds a value to the nearest pixel boundary:

```css
.precise {
  height: roundToNearestPixel(32.4);
}
```

### getPixelSizeForLayoutSize()

Converts a layout size to pixel size:

```css
.pixel-precise {
  width: getPixelSizeForLayoutSize(100);
}
```

### platformColor()

Access platform-specific named colors:

```css
.system-blue {
  color: platformColor(systemBlue);
}
```

# Responsive Design (/v5/core-concepts/responsive-design)

{/* # Responsive Design */}

Nativewind supports responsive design using Tailwind CSS breakpoint variants and CSS media queries.

## Breakpoint Variants

Tailwind's responsive variants (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) work on native by using media queries based on window width. Please refer to the [Tailwind CSS responsive design documentation](https://tailwindcss.com/docs/responsive-design) for the full API.

```tsx
<Text className="text-sm md:text-base lg:text-lg">
  Responsive text
</Text>
```

## Media Queries

Nativewind supports the following media query types on native:

| Media Feature | Example | Notes |
| --- | --- | --- |
| `width` | `@media (width: 500px)` | Exact and range syntax supported |
| `min-width` | `@media (min-width: 768px)` | |
| `max-width` | `@media (max-width: 1024px)` | |
| `prefers-color-scheme` | `@media (prefers-color-scheme: dark)` | Uses React Native Appearance API |
| `resolution` | `@media (resolution: 2dppx)` | `dppx` and `dpi` units |
| `min-resolution` | `@media (min-resolution: 2dppx)` | |
| `max-resolution` | `@media (max-resolution: 160dpi)` | |

### Platform Media Queries

Nativewind extends standard media queries with platform-specific selectors:

```css
@media ios { /* iOS only */ }
@media android { /* Android only */ }
@media native { /* All native platforms */ }
```

These are available as custom variants in your classes: `ios:`, `android:`, `native:`, `web:`, `tv:`.

```tsx
<Text className="font-sans ios:font-[System] android:font-[Roboto]">
  Platform-specific font
</Text>
```

## Reactive Updates

Media queries on native are reactive. When the window dimensions change (e.g. device rotation, split screen), styles update automatically without re-rendering.

# States & Pseudo-classes (/v5/core-concepts/states)

{/* # States & Pseudo-classes */}

## Hover, Focus, and Active

Nativewind supports the `:hover`, `:focus`, and `:active` pseudo-classes. These work by mapping to the corresponding React Native event props on the component.

| Pseudo-class | Tailwind Modifier | Activating Event | Deactivating Event |
| --- | --- | --- | --- |
| `:hover` | `hover:` | `onHoverIn` | `onHoverOut` |
| `:active` | `active:` | `onPressIn` | `onPressOut` |
| `:focus` | `focus:` | `onFocus` | `onBlur` |

```tsx
import { Pressable, Text } from "react-native";

function MyButton() {
  return (
    <Pressable className="bg-blue-500 active:bg-blue-700">
      <Text className="text-white">Press Me</Text>
    </Pressable>
  );
}
```

<Callout type="info">
The component must support the relevant event prop for the modifier to work. For example, `hover:` requires `onHoverIn`/`onHoverOut`, which is available on `Pressable` and `TextInput` but not `View` or `Text`.
</Callout>

### Combining Pseudo-classes

Multiple pseudo-classes can be combined. All conditions must be met for the styles to apply:

```tsx
<TextInput className="hover:active:focus:border-blue-500" />
```

## Disabled and Empty

Nativewind supports the `:disabled` and `:empty` pseudo-classes.

| Pseudo-class | Tailwind Modifier | Condition |
| --- | --- | --- |
| `:disabled` | `disabled:` | Component has `disabled={true}` prop |
| `:empty` | `empty:` | Component has no children |

```tsx
import { TextInput } from "react-native";

function MyInput({ disabled }) {
  return (
    <TextInput
      className="border disabled:opacity-50 disabled:bg-gray-200"
      disabled={disabled}
    />
  );
}
```

## Selection and Placeholder

The `selection:` and `placeholder:` modifiers style text selection and placeholder text respectively:

```tsx
<TextInput
  className="selection:text-black placeholder:text-gray-400"
  placeholder="Enter text..."
/>
```

## Data Attribute Selectors

Nativewind supports `[data-*]` attribute selectors, allowing you to style components based on data attributes:

```tsx
import { View, Text } from "react-native";

function StatusBadge({ active }) {
  return (
    <View
      className="[&[data-active]]:bg-green-500 [&[data-active='false']]:bg-gray-500"
      {...{ dataSet: { active: active } }}
    >
      <Text>Status</Text>
    </View>
  );
}
```

## Styling Based on Parent State

You can style child components based on the state of a parent using the `group` utility. Add `group/{name}` to the parent and use `group-hover/{name}:`, `group-active/{name}:`, or `group-focus/{name}:` modifiers on children.

```tsx
import { Pressable, Text, View } from "react-native";

function Card() {
  return (
    <Pressable className="group/card">
      <View className="group-active/card:bg-blue-100">
        <Text className="group-active/card:text-blue-700">
          Press the card to see child styles change
        </Text>
      </View>
    </Pressable>
  );
}
```

### How it works

1. The parent component is tagged with `group/{name}` (e.g. `group/item`)
2. Children use `group-{modifier}/{name}:` to react to the parent's state
3. When the parent's state changes (e.g. pressed), child styles update automatically

### Arbitrary Group Selectors

You can use arbitrary values with groups to match specific class names or props:

```tsx
<View className="group-[.test]:text-white" />
<View className="group-[[accessibilityLabel=works]]:text-white" />
```

## LTR and RTL

Use `ltr:` and `rtl:` to apply styles based on the text direction:

```tsx
<Text className="ltr:text-left rtl:text-right">
  Direction-aware text
</Text>
```

# Style Specificity (/v5/core-concepts/style-specificity)

{/* # Style Specificity */}

Nativewind employs a specificity model that aligns with CSS rules, augmented to accommodate the inline-style nature of React Native.

## How Specificity Works

When multiple classes target the same property, the last class in the stylesheet wins (following CSS source order), not the order in `className`:

```tsx
// Both "blue" and "red" set `color`. The one declared later in CSS wins.
<Text className="text-blue-500 text-red-500" />
```

## Specificity Order

Styles are applied in the following order of precedence (lowest to highest):

1. **Base styles** -- Regular utility classes (e.g. `text-red-500`)
2. **Modifier styles** -- Styles with pseudo-class modifiers (e.g. `hover:text-blue-500`) have higher specificity
3. **Inline styles** -- The `style` prop takes precedence over `className`
4. **Important styles** -- `!important` overrides everything, including inline styles

```tsx
// Inline style (color: "black") wins over className (text-white → color: "#fff")
<Text className="text-white" style={{ color: "black" }} />
```

## Important

The `!` prefix (Tailwind's `!important` syntax) overrides both normal class styles and inline styles:

```tsx
// !text-white overrides the inline style
<Text className="!text-white" style={{ color: "black" }} />
// Result: color is "#fff"
```

## Merging className and style

Nativewind automatically merges `className` styles with the `style` prop. When the same property is set in both, the `style` prop wins (unless `!important` is used in the class):

```tsx
// className sets padding, style sets color — both are applied
<View className="p-4" style={{ backgroundColor: "red" }} />
// Result: { padding: 16, backgroundColor: "red" }
```

When they target the same property, `style` takes precedence:

```tsx
// Both set color — inline style wins
<Text className="text-white" style={{ color: "black" }} />
// Result: { color: "black" }
```

## Component Composition

When building custom components that accept `className`, styles compose naturally through string concatenation:

```tsx
function MyText({ className, ...props }) {
  return <Text className={`text-base text-black ${className}`} {...props} />;
}

// User's className takes effect via CSS source order
<MyText className="text-red-500" />
```

# Built on Tailwind CSS (/v5/core-concepts/tailwindcss)

{/* # Built on Tailwind CSS */}

Nativewind is built upon the Tailwind CSS style language. Nativewind v5 uses **Tailwind CSS v4**, which introduces a CSS-first configuration approach. We recommend reading the Tailwind CSS guides on:

- [Utility-First Fundamentals](https://tailwindcss.com/docs/utility-first)
- [Reusing Styles](https://tailwindcss.com/docs/reusing-styles)
- [Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)

Since Nativewind compiles your Tailwind CSS at build time, the full Tailwind CSS language is available. The entire set of utilities, variants, functions, and directives will work on web. On native, Nativewind applies the subset that React Native's style engine supports.

## Supporting React Native

Nativewind works similarly to CSS on the web: it accepts all classes but only applies styles that are supported on the current platform. For example, `grid` will work on web but not on native (where React Native only supports flexbox layout).

You can always use a platform variant to apply styles selectively:

```tsx
<View className="flex native:flex-col web:grid web:grid-cols-3">
  {/* flexbox on native, CSS grid on web */}
</View>
```

## Tailwind CSS v4 Changes

Nativewind v5 uses Tailwind CSS v4, which has significant differences from v3:

- **CSS-first configuration**: Theming is done via `@theme` blocks in CSS instead of `tailwind.config.js`
- **New directives**: `@import`, `@theme`, `@utility`, `@custom-variant`, `@source` replace `@tailwind`, `@apply`, `@layer`
- **No config file required**: `tailwind.config.js` is optional (use `@config` to reference one if needed)

See the [Configuration](../customization/configuration) page for details on setting up your project.

# Units (/v5/core-concepts/units)

{/* # Units */}

## Supported Units

Nativewind v5 supports the following CSS units on native:

<table>
  <tbody>
    <tr>
      <th>Unit</th>
      <th>Name</th>
      <th>Description</th>
    </tr>
    <tr>
      <td>`px`</td>
      <td>Pixels</td>
      <td>Treated as density-independent pixels (dp) on native. `10px` becomes `10` in React Native.</td>
    </tr>
    <tr>
      <td>`%`</td>
      <td>Percentage</td>
      <td>Relative to the parent container, same as CSS.</td>
    </tr>
    <tr>
      <td>`vw`</td>
      <td>Viewport Width</td>
      <td>Polyfilled using `Dimensions.get('window').width`. Reactive to window size changes.</td>
    </tr>
    <tr>
      <td>`vh`</td>
      <td>Viewport Height</td>
      <td>Polyfilled using `Dimensions.get('window').height`. Reactive to window size changes.</td>
    </tr>
    <tr>
      <td>`rem`</td>
      <td>Root EM</td>
      <td>Relative to the root font size. Default is `14` on native, `16` on web.</td>
    </tr>
    <tr>
      <td>`em`</td>
      <td>EM</td>
      <td>Relative to the current element's font size.</td>
    </tr>
  </tbody>
</table>

## Ratios

Ratio values like `aspect-ratio: 16 / 9` are supported natively.

## dp vs px

React Native's default unit is density-independent pixels (dp) while the web uses pixels (px). Nativewind treats them as equivalent: `10px` in CSS becomes `10` in React Native's style system. When defining values in your theme, use `px` units and Nativewind will handle the conversion.

## rem Sizing

React Native's `<Text />` renders with a default `fontSize: 14`, while the web default is `16px`. Nativewind uses an `rem` value of `14` on native and `16` on web to maintain visual consistency with Tailwind's spacing scale.

You can override the `rem` value using CSS:

```css
:root {
  font-size: 16px;
}
```

Or inline using a CSS variable on a parent component.

# Colors (/v5/customization/colors)

{/* # Colors */}

Nativewind v5 supports all Tailwind CSS color utilities and several additional color features on native.

## Theme Colors

In Tailwind CSS v4, colors are defined in `@theme`:

```css
@theme {
  --color-brand: #3b82f6;
  --color-brand-dark: #1e40af;
  --color-surface: oklch(0.95 0 0);
}
```

These are available as `text-brand`, `bg-brand-dark`, `border-surface`, etc.

## CSS Variable Colors

Use CSS variables for dynamic colors that can change at runtime:

```css
:root {
  --color-primary: #3b82f6;
}
```

```tsx
import { vars } from "nativewind";

<View style={vars({ "--color-primary": userColor })}>
  <Text className="text-[--color-primary]">Dynamic color</Text>
</View>
```

## Special Values

| Value | Behavior |
| --- | --- |
| `transparent` | Fully transparent (`rgba(0,0,0,0)`) |
| `currentColor` / `current` | Inherits the current text color |
| `inherit` | Inherits the value from the parent |

```tsx
<View className="text-red-500">
  <Text className="border-current">
    {/* border color is red, inherited from parent text color */}
  </Text>
</View>
```

## Color Functions

### color-mix()

Blend two colors in a given color space:

```css
.blended {
  color: color-mix(in oklch, red 50%, blue);
}
```

### Opacity Modifier

Tailwind's opacity modifier syntax works on native:

```tsx
<View className="bg-blue-500/50" />
{/* 50% opacity blue background */}
```

## HSL and HSLA

HSL color values are supported in various syntaxes:

```css
.element {
  color: hsl(200, 100%, 50%);
  background-color: hsla(200, 100%, 50%, 0.5);
  border-color: hsl(200 100% 50% / 0.8);
}
```

CSS variables can be used inside color functions:

```css
:root {
  --hue: 200;
}

.element {
  color: hsl(var(--hue), 100%, 50%);
}
```

# Configuration (/v5/customization/configuration)

{/* # Configuration */}

Nativewind v5 uses Tailwind CSS v4, which introduces a **CSS-first configuration** model. Instead of a `tailwind.config.js` file, you configure your project directly in CSS.

## CSS Setup

Your main CSS file should import Tailwind's layers and the Nativewind theme:

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
```

The `nativewind/theme` import provides:

- Elevation scale (`--elevation-xs` through `--elevation-2xl`)
- Platform-specific font families (System/Georgia/Menlo on iOS, system defaults on Android)
- Custom utilities (`elevation-*`, `tint-*`, `ripple-*`, `corner-*`, `color-*`)
- Custom variants (`ios:`, `android:`, `native:`, `web:`, `tv:`)
- A `leading-*` override for unit-less line-height values
- Safe area utilities via `tailwindcss-safe-area`

## Metro Configuration

Configure Metro using `withNativewind` in your Metro config:

```js title="metro.config.js"
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

See the [withNativewind API reference](../api/with-nativewind) for available options.

## Babel Configuration

Nativewind v5 does not require any Babel configuration. The babel plugin is applied automatically by the Metro config. If you had `nativewind/babel` in your `babel.config.js` from v4, remove it.

## Optional: tailwind.config.js

Tailwind CSS v4 still supports a JavaScript config file for advanced use cases. Reference it with `@config`:

```css title="global.css"
@config "./tailwind.config.js";
```

However, most configuration can be done directly in CSS using `@theme`, `@utility`, and `@custom-variant`. See the [Theme](./theme) page for details.

## Content Sources

Tailwind CSS v4 automatically detects your source files. You can explicitly configure content sources using `@source`:

```css title="global.css"
@source "../components/**/*.tsx";
@source "../screens/**/*.tsx";
```

# Theme (/v5/customization/theme)

{/* # Theme */}

In Tailwind CSS v4, the theme is defined in CSS using the `@theme` directive instead of `tailwind.config.js`. Nativewind builds on this with additional React Native-specific theme values.

## Defining Theme Values

Use `@theme` to add design tokens:

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-brand: #3b82f6;
  --color-brand-light: #93c5fd;
  --font-display: "CustomFont";
  --spacing-18: 4.5rem;
}
```

These become available as utilities: `text-brand`, `bg-brand-light`, `font-display`, `p-18`, etc.

## Nativewind Default Theme

The `nativewind/theme` import adds the following:

### Elevation Scale

```css
@theme {
  --elevation-xs: 1;
  --elevation-sm: 3;
  --elevation-md: 6;
  --elevation-lg: 8;
  --elevation-xl: 13;
  --elevation-2xl: 24;
  --elevation-none: 0;
}
```

Used via the `elevation-*` utilities (Android shadow elevation).

### Platform Fonts

Platform-specific default fonts are set on `:root`:

- **iOS**: `--font-sans: System`, `--font-serif: Georgia`, `--font-mono: Menlo`
- **Android**: `--font-sans: SystemAndroid`, `--font-serif: sans-serif`, `--font-mono: monospace`

## Custom Utilities

Define custom utilities with `@utility`:

```css
@utility my-shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

Then use it as `className="my-shadow"`.

Nativewind's theme defines several custom utilities:

- `elevation-*` -- Android shadow elevation
- `tint-*` -- Image tint color
- `ripple-*` -- Android ripple effect (color, borderless, radius)
- `corner-*` -- Corner shape (`rounded`, `squircle`)
- `color-*` -- Shorthand for text color

## Custom Variants

Define custom variants with `@custom-variant`:

```css
@custom-variant dark (@media (prefers-color-scheme: dark));
@custom-variant landscape (@media (orientation: landscape));
```

Nativewind provides these platform variants:

```css
@custom-variant ios (@media ios);
@custom-variant android (@media android);
@custom-variant native (@media native);
@custom-variant tv (@media (display-mode: tv));
@custom-variant web (@supports selector(div > div));
```

Use them as modifiers: `ios:text-red-500`, `android:p-4`, `native:flex-col`, `web:grid`.

## Plugins

Load Tailwind plugins using `@plugin`:

```css
@plugin "./my-plugin.js";
@plugin "tailwindcss-safe-area";
```

# Editor Setup (/v5/getting-started/editor-setup)

{/* # Editor Setup */}

## Editor Support for Custom ClassName Props

When using non-className props (e.g `headerClassName`) you may need to configure your editor to recognize these new props for proper IntelliSense and autocomplete.

For detailed information about working with third-party components and creating custom className props, see the [Styling Third-Party Components](../guides/third-party-components) guide.

### VS Code Configuration

If you're using VS Code with the Tailwind CSS IntelliSense extension, you can add custom className props to the `tailwindCSS.classAttributes` setting:

```json
{
  (...)
  "files.associations": {
    "*.css": "tailwindcss",
  },
  "tailwindCSS.classAttributes": [
    "class",
    "className",
    "headerClassName"
  ]
}
```

This will enable autocomplete and IntelliSense for your custom className props

# Troubleshooting (/v5/getting-started/troubleshooting)

{/* # Troubleshooting */}

<Callout type="tip">
While troubleshooting, always start your application without the cache!

- Expo: `npx expo start --clear`
- Framework-less React Native: `npx react-native start --reset-cache`
</Callout>

Before troubleshooting Nativewind, it's crucial to ensure that Tailwind CSS itself is functioning correctly. Nativewind uses the Tailwind CLI to compile your styles, so any issues with the Tailwind CLI should be resolved first. 

Using the command `npx tailwindcss --input <input.css> --output output.css`, the Tailwind CLI will generate an `output.css` file. **The `<input.css>` should be your project's main CSS file (typically `global.css` or `styles.css`) that contains the `@import 'tailwindcss';` directive.**

For example:
```bash
npx @tailwindcss/cli --input ./global.css --output output.css
```

If you are troubleshooting a class that is not working, ensure that the CSS rule is present in the `output.css` file. This will help you determine if the issue is with Tailwind compilation or with Nativewind's runtime.

## Verifying Nativewind Installation

Nativewind provides a utility function `verifyInstallation()` designed to help confirm that the package has been correctly installed.

Import the `verifyInstallation` function from the Nativewind package and run it within the scope of a React component. **Do not invoke this function on the global scope**; it should be run within a component.

```tsx
import React from 'react';
import { verifyInstallation } from 'nativewind';

function App() {
    // Ensure to call inside a component, not globally
    verifyInstallation();

    return (
      // Your component JSX here...
    );
}

export default App;
```

## Enabling debug mode

Nativewind supports the `DEBUG` environment variable and will output various debug information while your server is running. **Run this command in your project's root directory where your `package.json` file is located.**

The `<start-command>` should be replaced with your project's actual start command:

- **Expo**: `npx expo start --clear`
- **Framework-less React Native**: `npx react-native start --reset-cache`
- **Next.js**: `npm run dev` or `yarn dev`
- **Other frameworks**: Use your project's standard development start command

<Tabs groupId="Troubleshooting" items={['Mac / Linux', 'Windows']}>
  <Tab value="Mac / Linux" label="Mac / Linux">
    ```bash
    DEBUG=nativewind <start-command>
    ```
  </Tab>
  <Tab value="Windows" label="Windows">
    ```cmd
    set "DEBUG=nativewind" && <start-command>
    ```
  </Tab>
</Tabs>

<Callout type="warn">
@react-native-community/cli may create multiple terminal sessions. You will need to ensure all sessions have `DEBUG=nativewind` set.
</Callout>

By itself, this information may or may not be useful to you, but it is extremely useful when reporting issues to the developers on GitHub. You can record the terminal output by redirecting the output to a file.

<Tabs groupId="Troubleshooting" items={['Mac / Linux', 'Windows']}>
  <Tab value="Mac / Linux" label="Mac / Linux">
    ```bash
    DEBUG=nativewind script output.log <start-command>
    ```
  </Tab>
  <Tab value="Windows" label="Windows">
    ```cmd
    set "DEBUG=nativewind" && script output.log <start-command>
    ```
    
    **Note:** For older Windows versions, use:
    ```cmd
    set "DEBUG=nativewind" && <start-command> > output.log 2>output.log
    ```
    
    **For PowerShell:**
    ```powershell
    $env:DEBUG="nativewind"; <start-command> *> output.log
    ```
  </Tab>
</Tabs>

## Common Issues

### Your cache is loading old data

Always reset your cache before troubleshooting an issue.

### Colors are not working

React Native styling is much more restrictive than the web. This code will work on the web, but not on React Native:

```tsx title=App.tsx
export function App() {
  return (
    <View className="text-red-500">
      <Text>Hello, World!</Text>
    </View>
  );
}
```

The reason is that `<View />` does not accept a `color` style and will not cascade the style! Instead, you must move the color classes to the `<Text />` element.

### Modifiers are not working

Ensure the component you are applying the style to supports both the style and the required props (e.g., `hover:text-white` - does the component support `color` styles and have an `onHover` prop?).

### Explicit styles

React Native has various issues when conditionally applying styles. To prevent these issues, it's best to declare all styles explicitly.

For example, instead of only applying a text color for dark mode, provide both a light and dark mode text color.

### dp vs px

React Native's default unit is density-independent pixels (dp) while the web's default is pixels (px). These two units are different; however, Nativewind treats them as if they are equivalent. Additionally, Nativewind's compiler requires a unit for most numeric values, forcing some styles to use a `px` unit.

### Flex

React Native uses a different base flex definition than the web. This can be fixed by adding `flex-1` to your classes, which forces the platforms to align.

### Flex Direction

React Native uses a different default `flex-direction` than the web. This can be fixed by explicitly setting a `flex-direction`.

# Typescript (/v5/getting-started/typescript)

{/* # Typescript */}

Nativewind extends the React Native types via declaration merging. The simplest method to include the types is to create a new `nativewind-env.d.ts` file and add a [triple-slash directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) referencing the types.

```tsx
/// <reference types="nativewind/types" />
```

<Callout type="warn" title="CAUTION">
Do not call this file:

- `nativewind.d.ts`
- The same name as a file or folder in the same directory e.g `app.d.ts` when an `/app` folder exists
- The same name as a folder in `node_modules`, e.g `react.d.ts`

By doing so, your types will not be picked up by the TypeScript compiler.
</Callout>

# Writing Custom Components (/v5/guides/custom-components)

{/* # Writing Custom Components */}
  
<Callout type="tip">
This guide is about writing your own components. If you are looking for a guide on how to use Nativewind with third-party components, see the [third-party components](./third-party-components) guide.

Unless you are styling a custom native component, you should never have to use `cssInterop` or `remapProps` when writing your own components. These are only used when working with third-party components.
</Callout>

## Your first component

Nativewind works by passing class names to components. This is the same pattern as Tailwind CSS, which uses utility classes to style elements.

To create a component with default styles, simply merge the className string.

```tsx
function MyComponent({ className }) {
  const defaultStyles = "text-black dark:text-white";
  return <Text className={`${defaultStyles} ${className}`} />;
}

<MyComponent className="font-bold" />;
```

You can expand this pattern to create more complex components. For example, you can create a `Button` component with different variants.

```tsx
const variantStyles = {
  default: "rounded",
  primary: "bg-blue-500 text-white",
  secondary: "bg-white-500 text-black",
};

function MyComponent({ variant, className, ...props }) {
  return (
    <Text
      className={`
        ${variantStyles.default}
        ${variantStyles[variant]}
        ${className}
      `}
      {...props }
    />
  );
}
```

Creating your own variants can quickly become complex. We recommend using a class name management library to simplify the process.

- [tailwind-variants](https://www.tailwind-variants.org/)
- [cva](https://cva.style/docs)
- [tw-classed](https://tw-classed.vercel.app)
- [clsx](https://www.npmjs.com/package/clsx)
- [classnames](https://www.npmjs.com/package/classnames)

## Merging with inline styles

Nativewind will automatically merge with inline-styles. [Read more about style specificity](./../core-concepts/style-specificity) documentation.

```tsx
<Text className="text-white" style={{ color: "black" }} /> // Will be black
```

## Handling components with multiple style props

Custom components can have multiple style props. For example, a `Button` component may have an `outerClassName` and an `innerClassName`.

```tsx title=MyComponent.tsx
function MyComponent({ className, textClassName }) {
  return (
    <View className={className}>
      <Text className={textClassName}>Hello, Nativewind!</Text>
    </View>
  );
}
```

# Custom Fonts (/v5/guides/custom-fonts)

How to load and use custom fonts with Nativewind v5 and Expo

{/* # Custom Fonts */}

React Native handles fonts differently from the web. There is no `@font-face`, no automatic font discovery, and no fallback font stacks. Every font weight is a separate file, and the file name matters. This guide walks through the full setup.

<Callout type="info">
  A complete working example is available at [nativewind/custom-fonts-example-v5](https://github.com/nativewind/custom-fonts-example-v5).
</Callout>

## Prerequisites

- An Expo project with Nativewind v5 installed
- A custom font you want to use (this guide uses [Inter](https://rsms.me/inter/))

## Step 1: Choose your font files

**Use OTF or TTF format.** OTF files render slightly better and have a smaller file size. Either format works across iOS, Android, and web.

**Variable fonts do not work on React Native.** You must download individual static weight files. For Inter, that means separate files for Regular, Bold, Italic, Medium, etc.

Download the static font files from your font's release page. For Inter, grab the OTF files from the [GitHub releases](https://github.com/rsms/inter/releases).

## Step 2: Name files correctly

Place font files in your project, for example `assets/fonts/`:

```
assets/
  fonts/
    Inter-Regular.otf
    Inter-Bold.otf
    Inter-Italic.otf
    Inter-BoldItalic.otf
    Inter-Medium.otf
    Inter-SemiBold.otf
```

**The file name must match the PostScript name of the font.** iOS uses the PostScript name to look up fonts at runtime. If the names don't match, the font silently fails to load on iOS while appearing to work on Android.

You can check a font's PostScript name by opening it in Font Book (macOS) or using a tool like [fontdrop.info](https://fontdrop.info).

## Step 3: Load fonts with expo-font

The simplest approach is to use the `expo-font` config plugin in `app.json`:

```bash
bun add expo-font
```

```json title="app.json"
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Inter-Regular.otf",
            "./assets/fonts/Inter-Bold.otf",
            "./assets/fonts/Inter-Italic.otf",
            "./assets/fonts/Inter-BoldItalic.otf",
            "./assets/fonts/Inter-Medium.otf",
            "./assets/fonts/Inter-SemiBold.otf"
          ]
        }
      ]
    ]
  }
}
```

Alternatively, load fonts at runtime with the `useFonts` hook:

```tsx title="App.tsx"
import { useFonts } from "expo-font";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter-Regular.otf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.otf"),
  });

  if (!fontsLoaded) return null;

  return <>{/* your app */}</>;
}
```

The `app.json` approach is preferred because fonts are available immediately without a loading state.

## Step 4: Verify with inline styles

Before touching your CSS theme, confirm the fonts actually loaded:

```tsx
<Text style={{ fontFamily: "Inter-Regular" }}>
  This should render in Inter
</Text>
```

If this does not work, the issue is with font loading, not with Nativewind. Check your file names and `app.json` config.

## Step 5: Add to your CSS theme

In v5, fonts are defined in CSS using the `@theme` directive in your `global.css`:

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";

@theme {
  --font-inter: "Inter-Regular";
  --font-inter-bold: "Inter-Bold";
  --font-inter-italic: "Inter-Italic";
  --font-inter-bold-italic: "Inter-BoldItalic";
  --font-inter-medium: "Inter-Medium";
  --font-inter-semibold: "Inter-SemiBold";
}
```

Each `--font-*` variable becomes a `font-*` utility class automatically.

<Callout type="warn">
  React Native does not support fallback fonts. The value must be a single font name, not a comma-separated list.
</Callout>

## Step 6: Use in components

```tsx
<Text className="font-inter">Regular text</Text>
<Text className="font-inter-bold">Bold text</Text>
<Text className="font-inter-medium">Medium text</Text>
<Text className="font-inter-semibold">SemiBold text</Text>
<Text className="font-inter-italic">Italic text</Text>
```

## v5 vs v4

In v4, fonts were configured in JavaScript via `tailwind.config.js`:

```js
// v4 approach (tailwind.config.js)
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter-Regular"],
        "inter-bold": ["Inter-Bold"],
      },
    },
  },
};
```

In v5, this moves to CSS, which is simpler and consistent with how Tailwind CSS v4 works:

```css
/* v5 approach (global.css) */
@theme {
  --font-inter: "Inter-Regular";
  --font-inter-bold: "Inter-Bold";
}
```

The usage in components (`className="font-inter"`) is identical in both versions.

## Common pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Font works on Android but not iOS | File name doesn't match PostScript name | Rename the file to match exactly |
| Font doesn't render at all | Font not loaded by expo-font | Check `app.json` plugin config or `useFonts` hook |
| Using `font-bold` doesn't make Inter bold | `font-bold` sets `fontWeight`, not `fontFamily` | Use `font-inter-bold` to set the bold font family |
| Variable font doesn't work | React Native doesn't support variable fonts | Download static weight files instead |
| Font renders as system default | PostScript name mismatch | Open font in Font Book and verify the PostScript name |

## Platform-specific fonts

Use the `ios:` and `android:` variants for platform-specific font overrides:

```tsx
<Text className="font-inter ios:font-inter-medium android:font-inter-semibold">
  Different weights per platform
</Text>
```

Or override the default system fonts in your theme:

```css title="global.css"
@theme {
  --font-sans: "Inter-Regular";
}
```

This makes `font-sans` (the default) use Inter instead of the system font.

# Migrate from v4 (/v5/guides/migrate-from-v4)

import { Callout } from "@/components/callout";
import { CopyMigrationButton } from "@/components/copy-migration-button";

<div className="mb-4">
  <CopyMigrationButton />
</div>

## Migration steps

The simplest way to migrate from Nativewind v4 to v5 is to follow these steps:

### Step 1: Update Dependencies

Install the new versions of required packages:

```bash
# Using Expo CLI (recommended)
npx expo install nativewind@preview react-native-css@latest react-native-reanimated react-native-safe-area-context

# Install Tailwind CSS v4 and PostCSS as dev dependencies
npx expo install --dev tailwindcss @tailwindcss/postcss postcss
```

### Step 2: Update CSS File

Replace your old CSS directives with the new Tailwind v4 imports in your `global.css` (or equivalent):

```diff
- @tailwind base;
- @tailwind components;
- @tailwind utilities;

+ @import "tailwindcss/theme.css" layer(theme);
+ @import "tailwindcss/preflight.css" layer(base);
+ @import "tailwindcss/utilities.css";
+
+ @import "nativewind/theme";
```

### Step 3: Update Babel Config

Remove Nativewind from your `babel.config.js`:

```diff
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
-      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
-      "nativewind/babel",
+      "babel-preset-expo",
    ],
  };
};
```

### Step 4: Create PostCSS Config

Create a `postcss.config.mjs` file in the root of your project:

```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Step 5: Update Metro Config

Update the `withNativewind` function call (no longer requires a second argument):

```diff
- module.exports = withNativeWind(config, { input: './global.css' })
+ module.exports = withNativewind(config);
```

Note: While `withNativeWind` was renamed to `withNativewind`, either will work.

### 6. Override the lightningcss version

Force `lightningcss` to a specific version in your `package.json`:

<Tabs groupId="v5-npm-install" items={["npm", "yarn", "pnpm", "bun"]}>
  <Tab value="npm">
    ```json title="package.json"
    {
      "overrides": {
        "lightningcss": "1.30.1"
      }
    }
    ```
  </Tab>
  <Tab value="yarn">
    ```json title="package.json"
    {
      "resolutions": {
        "lightningcss": "1.30.1"
      }
    }
    ```
  </Tab>
  <Tab value="pnpm">
    ```json title="package.json"
    {
      "pnpm": {
        "overrides": {
          "lightningcss": "1.30.1"
        }
      }
    }
    ```
  </Tab>
  <Tab value="bun">
    ```json title="package.json"
    {
      "overrides": {
        "lightningcss": "1.30.1"
      }
    }
    ```
  </Tab>
</Tabs>

<Callout type="warn">
  If you don't pin the `lightningcss` version, you may encounter deserialization errors with respect to `global.css` when building your app.
</Callout>

### Step 7: Clear Cache and Restart

```bash
npx expo start --clear
```

You should now be running Nativewind v5 🎉

### Troubleshooting Common Issues

If you encounter issues, here are some common problems and solutions:

**JSX Transform Errors**: Ensure you removed `nativewind` from your babel config and cleared the Metro cache with `npx expo start --clear`.

**Incorrect CSS atRules**: Verify you updated to the new atRules in your CSS file (see Step 2 above).

**Metro Config Issues**: The `withNativewind` function no longer requires a second argument. Ensure your config matches Step 5.

**Missing PostCSS Config**: Ensure the `postcss.config.mjs` file was created with the correct content.

## Breaking Changes & Prerequisites

Before upgrading to Nativewind v5, your project **must** meet the following version requirements:

### Tailwind CSS v4.1+

Nativewind v5 is built on top of Tailwind v4.1+. You must upgrade your Tailwind configuration and tooling, accordingly.

<Callout type="tip">
  **Migration Tip:** Refer to the [Tailwind CSS v4 Upgrade
  Guide](https://tailwindcss.com/docs/upgrade-guide) for detailed steps.
</Callout>

### React Native 0.81+

React Native 0.81 introduces architectural changes that Nativewind v5 relies on, including improvements to the StyleSheet and layout engines.

> Use `react-native upgrade` or migrate your setup manually to update.

<Callout type="info">

Earlier versions of React Native can work, albeit with limited functionality. Nativewind only provides support for React Native 0.81+.

</Callout>

### React Native New Architecture

A number of styles require the new architecture.

<Callout type="info">

The old architecture can work with limited functionality. However, we only provide support for the new React Native architecture.

</Callout>

### React Native Reanimated v4+

Nativewind v5 uses internal features that depend on Reanimated v4+. Ensure your project uses this version to avoid runtime crashes or build issues.

> **Note:** Reanimated v4 introduces its own breaking changes — please consult the [Reanimated v4 changelog](https://docs.swmansion.com/react-native-reanimated/) when upgrading.

### React Native CSS

Nativewind previously used a transient dependency on a library called `react-native-css-interop`. This library has been renamed to `react-native-css`, has been moved to be a peer dependency, and will require separate installation.

Nativewind will no longer be tied to a specific version of `react-native-css` and the two libraries can be updated individually.

## Breaking changes

### Tailwind CSS changes

Please ensure you are familiar with the [Tailwind CSS upgrade guide](https://tailwindcss.com/docs/upgrade-guide). It has a number of breaking changes, renamed styles and deprecations.

### Classname changes

Tailwind v4 changed the standard for its classnames. As such, these Nativewind classes have also been renamed:

- `elevation-sm` has been renamed to `elevation-xs`
- `elevation` has been renamed to `elevation-sm`

### Animation changes

Nativewind has switched from using a custom animation engine to Reanimated CSS animations. You may find there are implementation differences between the two engines.

### JavaScript Theme Functions

The JavaScript theme functions have been removed and replaced with CSS equivalent functions. Please see the [Tailwind CSS functions and directives](https://tailwindcss.com/docs/functions-and-directives#functions) documentation for more information.

### `shadow-*`

The `shadow-*` classes now use `boxShadow` style. Previously they used `shadowColor`, `shadowOffset`, `shadowOpacity` and `shadowRadius`. There may be a visual difference.

### Line Height

Line height numeric values are parsed as if they had the `em` unit. Previously they were parsed as a unit-less value. To migrate, simply divide the old value by the font-size.

### rem

`rem` is no longer exported and cannot be changed at runtime. If you require Tailwind CSS to dynamically change values, you should update your theme to use a CSS variable instead of `rem`

### Dynamic mapping modifier

The dynamic mapping modifier has been renamed to `@prop`.

```diff
- {}-[inputColor]:color-black
+ @prop-[inputColor]:color-black
```

### `vars()` → Replaced by `VariableContextProvider`

The `vars()` function for dynamic theming is deprecated. Use the `VariableContextProvider` component instead:

```diff
- import { vars } from "nativewind";
+ import { VariableContextProvider } from "nativewind";

- const theme = vars({ "--color-primary": "red" });

- <View style={theme}>
-   {children}
- </View>

+ <VariableContextProvider value={{ "--color-primary": "red" }}>
+   {children}
+ </VariableContextProvider>
```

See the [Dynamic Themes](/v5/guides/themes) guide for full examples.

## Deprecations

Nativewind v5 preserves its existing API. Your usage of:

- `className`
- `styled`

...will continue to work without modification.

However, several features are being **deprecated** and will emit runtime warnings during development. These features will be **removed in a future major release**.

<Callout type="warn">
  **Warning:** Deprecated features will continue to function in v5 but should be
  migrated away from as soon as possible.
</Callout>

However, there will be a number of breaking changes to how Nativewind functions and its configuration file that may affect you.

## JSX Transform → Replaced by Import Rewrites

Nativewind v5 **removes the JSX transform** that previously injected Tailwind support into individual JSX elements. This has been replaced by a new **import rewrite system**.

This does not require any configuration change, but may affect your app if you are performing your own import rewrites. Previously Nativewind would change this code:

```jsx
import { View, Text } from "react-native";

<View className="bg-red-500 p-4">
  <Text className="text-white">Hello</Text>
</View>;
```

Now the `import` will be rewritten to `import { View, Text } from 'react-native-css/react-native'`

The move to import rewrites is driven by a broader shift in the React Native ecosystem of publishing compiled libraries. Nativewind previously took advantage of the fact that libraries were always compiled locally, which allowed us to override the `jsxImportSource`. When libraries are compiled externally, their JSX is already transformed. The new shift to import rewrites is similar to how existing libraries such as `react-native-web` work.

## `cssInterop` / `remapProps` → Replaced by `styled()`

The `cssInterop` and `remapProps` APIs are deprecated and have been replaced with a unified `styled` API. It accepts the same options as `cssInterop`/`remapProps` and returns the same component. The `remapProps` mode is available via a new 3rd parameter:

```jsx
// Same as cssInterop()
styled(View, { className: "style" });

// Same as remapProps()
styled(View, { className: "style" }, { passThrough: true });
```

By default `styled()` enables the transform globally for that component, but this can be disabled by setting `global` to false:

```jsx
const MyComponent = styled(View, { className: "style" }, { global: false });
```

## Native functions

The `nativewind/theme` export has been removed. You can now access these functions as CSS functions.

### `platformColor`

`platformColor()` is available as a CSS function:

```css
@theme {
  --color-error: platformColor(systemRed, red);
}
```

### `hairlineWidth`

`hairlineWidth()` is available as a CSS function:

```css
@theme {
  --spacing-hairline: hairlineWidth();
}
```

### `pixelRatio`

`pixelRatio()` is available as a CSS function:

```css
@theme {
  --spacing-doublePixelRatio: calc(pixelRatio(2) * 2);
}
```

### `fontScale`

`fontScale()` is available as a CSS function:

```css
@theme {
  --spacing-doubleFontScale: calc(fontScale(2) * 2);
}
```

### `getPixelSizeForLayoutSize`

`getPixelSizeForLayoutSize()` is available as a CSS function:

```css
@theme {
  --spacing-custom: getPixelSizeForLayoutSize(42);
}
```

### `roundToNearestPixel`

`roundToNearestPixel()` is available as a CSS function:

```css
@theme {
  --spacing-custom: roundToNearestPixel(calc(10 / 3));
}
```

### `platformSelect`

Now use a media query that sets the platform as the media type:

```css
@theme {
  --color-error: var(--my-color, green);
}

@media ios {
  :root {
    --my-color: red;
  }
}

@media android {
  :root {
    --my-color: blue;
  }
}
```

### `pixelRatioSelect` / `fontScaleSelect`

Now use a media query:

```css
@theme {
  --spacing-custom-pixel: 11;
  --spacing-custom-font: 11;
}

@media (pixelRatio() > 2) {
  :root {
    --spacing-custom-pixel: 3;
  }
}

@media (fontScale() > 2) {
  :root {
    --spacing-custom-font: 3;
  }
}
```

## New CSS Features

Nativewind v5 adds support for the new React Native styling features:

- `position: static` ([Tailwind](https://tailwindcss.com/docs/position)) ([Yoga](https://www.yogalayout.dev/blog/announcing-yoga-3.0#position-static))
- `align-content: space-evenly` ([Tailwind](https://tailwindcss.com/docs/place-content#space-evenly)) ([Yoga](https://www.yogalayout.dev/blog/announcing-yoga-3.0#better-support-for-multiline-containers))
- `filter()` ([Tailwind](https://tailwindcss.com/docs/filter)) ([React Native](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture#box-shadow-and-filter-style-props))
- `backgroundImage()` ([Tailwind](https://tailwindcss.com/docs/background-image)) (gradients only)
- `box-sizing` ([Tailwind](https://tailwindcss.com/docs/box-sizing))
- `display: contents` ([Tailwind](https://tailwindcss.com/docs/display#contents))

# Other Bundlers (/v5/guides/other-bundlers)

{/* Other Bundlers */}

**Coming soon**

# Dynamic Themes (/v5/guides/themes)

import { Callout } from "@/components/callout";

{/* # Dynamic Themes */}

Nativewind v5 supports dynamic theming through CSS variables and the `VariableContextProvider` component. This lets you change colors, spacing, and other design tokens at runtime without rebuilding your stylesheet.

For static theme customization (adding custom colors, fonts, spacing), see the [Theme](/v5/customization/theme) documentation. For dark mode specifically, see [Dark Mode](/v5/core-concepts/dark-mode).

## How It Works

1. Define CSS variables in your `global.css` using `@theme` and `:root`
2. Reference those variables in your utility classes (e.g. `bg-primary`, `text-secondary`)
3. Override the variables at runtime using `VariableContextProvider`

The provider uses React context, so any component wrapped by it (and its children) will pick up the overridden values.

## Basic Example

First, define your theme variables in CSS:

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}

:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}
```

<Callout type="info">
  You need to define the variables in both `@theme` (so Tailwind generates the utility classes) and `:root` (so the CSS variables have default values at runtime).
</Callout>

Then override them at runtime:

```tsx title="App.tsx"
import { View, Text } from "react-native";
import { VariableContextProvider } from "nativewind";

const christmasTheme = {
  "--color-primary": "red",
  "--color-secondary": "green",
};

export default function App() {
  return (
    <View>
      <Text className="text-primary">Blue (default)</Text>

      <VariableContextProvider value={christmasTheme}>
        <Text className="text-primary">Red (christmas)</Text>
        <Text className="text-secondary">Green (christmas)</Text>
      </VariableContextProvider>
    </View>
  );
}
```

## Multiple Themes with Light/Dark Mode

Combine `VariableContextProvider` with `useColorScheme` from `react-native` to support multiple themes that each have light and dark variants:

```tsx title="components/ThemeProvider.tsx"
import { useColorScheme } from "react-native";
import { VariableContextProvider } from "nativewind";

const themes = {
  brand: {
    light: {
      "--color-foreground": "#000000",
      "--color-muted-foreground": "#64748b",
      "--color-primary": "#3b82f6",
      "--color-secondary": "#8b5cf6",
    },
    dark: {
      "--color-foreground": "#ffffff",
      "--color-muted-foreground": "#a1a1a1",
      "--color-primary": "#60a5fa",
      "--color-secondary": "#a78bfa",
    },
  },
  christmas: {
    light: {
      "--color-foreground": "#000000",
      "--color-muted-foreground": "#64748b",
      "--color-primary": "#dc2626",
      "--color-secondary": "#16a34a",
    },
    dark: {
      "--color-foreground": "#ffffff",
      "--color-muted-foreground": "#a1a1a1",
      "--color-primary": "#f87171",
      "--color-secondary": "#4ade80",
    },
  },
};

export function ThemeProvider({
  name,
  children,
}: {
  name: keyof typeof themes;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <VariableContextProvider value={themes[name][colorScheme]}>
      {children}
    </VariableContextProvider>
  );
}
```

```tsx title="app/_layout.tsx"
import "../global.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider name="brand">
      <Stack />
    </ThemeProvider>
  );
}
```

## Nesting Themes

`VariableContextProvider` inherits from its parent context. You can nest providers to override specific variables while keeping the rest:

```tsx
<VariableContextProvider value={{ "--color-primary": "blue" }}>
  <Text className="text-primary">Blue</Text>

  <VariableContextProvider value={{ "--color-primary": "red" }}>
    <Text className="text-primary">Red (overridden)</Text>
  </VariableContextProvider>
</VariableContextProvider>
```

## Migrating from v4

If you used `vars()` in v4, replace it with `VariableContextProvider`:

```diff
- import { vars } from "nativewind";
+ import { VariableContextProvider } from "nativewind";

- const theme = vars({ "--color-primary": "red" });

- <View style={theme}>
-   {children}
- </View>

+ <VariableContextProvider value={{ "--color-primary": "red" }}>
+   {children}
+ </VariableContextProvider>
```

`vars()` is deprecated and will be removed in a future release.

## Platform-Specific Theme Values

Use CSS media queries to set platform-specific defaults:

```css title="global.css"
@theme {
  --color-error: var(--error-color, green);
}

@media ios {
  :root {
    --error-color: red;
  }
}

@media android {
  :root {
    --error-color: blue;
  }
}
```

These can still be overridden at runtime via `VariableContextProvider`.

# Styling Third-Party Components (/v5/guides/third-party-components)

{/* # Styling third-party components */}

A third-party component is a component that is a dependency of your application and not a core React Native component. Nativewind works by passing the `className` prop to the core React Native components. Unfortunately, its not always obvious what third-party components implement this behavior without checking their source code.

This is an example of a 3rd party component that does not pass the `className` prop down:

```tsx
// ❌ This component will not work with Nativewind
// This component is 'picking' the props.
// Any props that are not explicitly defined will not be passed down
function ThirdPartyComponent({ style }) {
  return <View style={style} />;
}

// ✅ This component will work with Nativewind
function ThirdPartyComponent({ style, ...props }) {
  return <View style={style} {...props} />;
}
```

## Improving 3rd party components

If you encounter a 3rd party component 'picks' its props, you should consider submitting a pull request to modify the component so it passes all props down. Components that 'pick' their props can be very limiting, and not just for Nativewind! React Native often adds new APIs and 'picking' props prevents you from using these new features.

```tsx
function ThirdPartyComponent({ style }) {
  return <View style={style} />;
}

// aria-label was added in 0.71, but this component will not work with it!
<ThirdPartyComponent aria-label="My Label" />;
```

## Handling components with multiple style props

Some components will pass the `className` prop down, but they may also have multiple style props. For example, React Native's `<FlatList />` component has a `style` and `contentContainerStyle` prop. The `remapProps` function can be used to create new `className` props for these components.

```tsx
// This component has two 'style' props
function ThirdPartyComponent({ style, contentContainerStyle, ...props }) {
  return (
    <FlatList
      style={style}
      contentContainerStyle={contentContainerStyle}
      {...props}
    />
  );
}

// Call this once at the entry point of your app
remapProps(ThirdPartyComponent, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

// Now you can use the component with Nativewind
<ThirdPartyComponent className="p-5" contentContainerClassName="p-2" />;
```

<Callout type="tip">
Nativewind's style objects are more complex than the objected created `StyleSheet.create`. To not break third-party components, `remapProps` will pass a special object to the target prop. To the third-party component this will appear as an empty object.
</Callout>

## Handling components with style attribute props

Some components may require style attributes to be passed as props (for example, React Native's `<StatusBar />` component accepts a `backgroundColor` prop), or they may access the `style` prop directly.

```tsx
/*
 * This component will not work as expected with Nativewind
 *   - borderColor will not work as it is a prop
 *   - backgroundColor will not work as it is based on the style.color value
 */
function ThirdPartyComponent({ borderColor, style, ...props }) {
  // The background color is based on the style prop
  const backgroundColor = style.color === "white" ? "black" : "white";
  return (
    <View
      style={{
        ...style,
        borderColor,
        backgroundColor,
      }}
    />
  );
}
```

To support these components, you can use the [`cssInterop`](./../api/css-interop) function. You can think of `cssInterop` as a "className termination". It a marker that Nativewind needs to convert the `className` props into style objects.

<Callout type="warn" title="CAUTION">
Enabling the `cssInterop` for a component comes at a performance cost. Nativewind will need to resolve the styles, add event handlers, inject context, etc.
</Callout>

## Handling multiple props with similar properties

Sometimes a component will have multiple props that are similar.

```tsx
function ThirdPartyComponent({ labelColor, inputColor, ...props }) {
  return (
    <>
      <Text style={color: labelColor}>Label</Text>
      <TextInput style={color: labelColor} />
    </>
  );
}
```

You could creating a new mapping for each props, but it can be cumbersome to manage multiple props with className management libraries

```tsx
// This is possible
cssInterop(ThirdPartyComponent, {
  labelColorClassName: {
    target: false
    nativeStyleToProps: { color: 'labelColor' }
  }
  inputColorClassName: {
    target: false
    nativeStyleToProps: { color: 'inputColor' }
  }
})

function Wrapper() {
  // Need to create a new className for each prop
  const labelStyle = cva('color-black')
  const inputStyle = cva('color-black')

  return (
    <ThirdPartyComponent
      labelColorClassName={labelStyle}
      inputColorClassName={inputStyle}
    />
  )
}
```

Instead, you can use the dynamic mapping modifier to move props.

```tsx
cssInterop(ThirdPartyComponent, {
  className: "style",
});

function Wrapper() {
  // Need to create a new className for each prop
  const style = cva("{}-[inputColor]:color-black {}-[labelColor]:color-black");

  return <ThirdPartyComponent className={style} />;
}
```

## Dynamic mapping modifier

The dynamic mapping modifier allows you to move props from one prop to another. This is useful when you have multiple props that are similar, or you want to manage the styles in a single prop.

There are two ways to use the dynamic mapping modifier:

- `{}-[<propName>]`: This will move the values the style to the `propName` prop. If a className sets multiple properties, the last property will be used.
- `{}-[<propName>]:style-property`: This will move the `propName` prop to the `style-property` of the `className` prop, but only for the specified `style-property`

Both `propName` and `style-property` can be written using dot notation to access nested properties.

```tsx
//This class
{}-[screenOptions.tabBarTintColor]/color:color-red-500
// Will output
{ screenOptions: { tabBarTintColor: 'color-red-500' } }
```

## TypeScript

Both `remapProps` and `cssInterop` will return a typed version of your component. However, you can globally defined the types in a new declaration file.

```tsx title=custom-components-env.d.ts
declare module "<3rd party package>" {
  interface 3rdPartyComponentProps {
    customClassName?: string;
  }
}
```

**Example**

Setting global types requires in-depth knowledge of TypeScript. Your interface declaration needs to **exactly match** the 3rd party declaration (including `extends` and generics).

For example, Nativewind uses the follow types for React Native's `<FlatList />`, which uses multiple interfaces for its props, across multiple packages.

```tsx title=custom-components-env.d.ts
import {
  ScrollViewProps,
  ScrollViewPropsAndroid,
  ScrollViewPropsIOS,
  Touchable,
  VirtualizedListProps,
} from "react-native";

declare module "@react-native/virtualized-lists" {
  export interface VirtualizedListWithoutRenderItemProps<ItemT>
    extends ScrollViewProps {
    ListFooterComponentClassName?: string;
    ListHeaderComponentClassName?: string;
  }
}

declare module "react-native" {
  interface ScrollViewProps
    extends ViewProps,
      ScrollViewPropsIOS,
      ScrollViewPropsAndroid,
      Touchable {
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }
  interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
    columnWrapperClassName?: string;
  }
  interface ViewProps {
    className?: string;
  }
}
```

# Using with Monorepos (/v5/guides/using-with-monorepos)

Learn how to set up Nativewind in monorepo environments like NX

{/* # Using with Monorepos */}

Nativewind can be used in an Nx Monorepo that is already configured to use Expo and the corresponding plugin [@nx/expo](https://nx.dev/nx-api/expo)

## NX Monorepo Setup

When working with Nativewind in an NX monorepo, there are some specific configurations needed to ensure proper integration. The main challenge is correctly configuring the Metro bundler to work with both NX and Nativewind.

### Prerequisites

Simply configure your Expo project in Nx as per [the Expo setup guide](../getting-started/installation)

> Skip the `metro.config.js` setup as we will address this part here.

### Modify your metro.config.js

Add the Nativewind plugin to your `metro.config.js` using a promise chain as shown below:

```js title="metro.config.js"
const { withNativeWind } = require("nativewind/metro");

// ... existing Nx configuration

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // ... existing Nx config
}).then((config) => withNativeWind(config));
```

## Additional Resources

For more complex monorepo setups or specific issues, refer to:

- [NX documentation for React Native](https://nx.dev/recipes/react/react-native)
- [NX documentation for Expo](https://nx.dev/nx-api/expo)
- [Expo documentation for monorepos](https://docs.expo.dev/guides/monorepos/)

# _compatibility.mdx (/v5/tailwind/_compatibility)

import Legend from "./_legend.mdx";

<table>
  <tbody>
    <tr>
      <th className="w-[40%] whitespace-nowrap">Class</th>
      <th>Support</th>
    </tr>
    {(props.supported || []).map((value, index) => (
      <tr key={`supported-${index}`}>
        <td>
          <pre>
            <code>{value}</code>
          </pre>
        </td>
        <td>✅ Full Support</td>
      </tr>
    ))}
    {(props.experimental || []).map((value, index) => (
      <tr key={`experimental-${index}`}>
        <td>
          <pre>
            <code>{value}</code>
          </pre>
        </td>
        <td>🧪 Experimental Support</td>
      </tr>
    ))}
    {(props.native || []).map((value, index) => (
      <tr key={`native-${index}`}>
        <td>
          <pre>
            <code>{value}</code>
          </pre>
        </td>
        <td>📱 Native only</td>
      </tr>
    ))}
    {(props.partial || []).map((value, index) => (
      <tr key={`partial-${index}`}>
        <td>
          <pre>
            <code>{value}</code>
          </pre>
        </td>
        <td>✔️ Partial Support</td>
      </tr>
    ))}
    {(props.none || []).map((value, index) => (
      <tr key={`none-${index}`}>
        <td>
          <pre>
            <code>{value}</code>
          </pre>
        </td>
        <td>🌐 Web only</td>
      </tr>
    ))}
  </tbody>
</table>

<>{props.legend || props.legend === undefined ? <Legend /> : <></>}</>

# _legend.mdx (/v5/tailwind/_legend)

<details className="bg-fd-primary/20 border-fd-primary border rounded-xl p-4 text-fd-foreground cursor-pointer max-w-full w-[500px]">
  <summary>Legend</summary>

### Class

`-{n}` Supports values from theme

`-[n]` Supports arbitrary values

### Icon

✅ Full support

✔️ Partial support on native

🧪 Experimental support on native

📱 Native only

🌐 Web only

</details>

# Additional Setup Guides (/v5/getting-started/installation/_additional-guides)

## Additional Setup Guides

- [Editor Setup](./editor-setup) - Learn how to set up your editor to use Nativewind
- [Other Bundlers](/docs/guides/other-bundlers) - Learn how to use Nativewind with other bundlers

# _install helper (/v5/getting-started/installation/_install)

import NPM from "./_npm.mdx";

You will need to install `nativewind` and its peer dependencies `tailwindcss`, `react-native-css`, `react-native-reanimated`, and `react-native-safe-area-context`.

<NPM
  framework={props.framework}
  deps={[
    "nativewind@preview",
    "react-native-css@latest",
    "react-native-reanimated",
    "react-native-safe-area-context",
  ]}
/>

# _npm helper (/v5/getting-started/installation/_npm)

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";

<Tabs
  groupId="v5-npm-install"
  items={
    props.expo === false
      ? ["npm", "yarn", "pnpm", "bun"]
      : ["expo", "npm", "yarn", "pnpm", "bun"]
  }
>
  {props.expo !== false ? (
    <Tab value="expo" label="Expo">
      <CodeBlock language="bash">
        <Pre>
          {[
            props.deps?.length
              ? `npx expo install ${props.deps.join(" ")}`
              : undefined,
            props.devDeps?.length
              ? `npx expo install --dev ${props.devDeps.join(" ")}`
              : undefined,
          ]
            .filter(Boolean)
            .join("\n")}
        </Pre>
      </CodeBlock>
    </Tab>
  ) : (
    <></>
  )}
  <Tab value="npm">
    <CodeBlock language="bash">
      <Pre>
        {[
          props.deps?.length
            ? `npm install ${props.deps.join(" ")}`
            : undefined,
          props.devDeps?.length
            ? `npm install --dev ${props.devDeps.join(" ")}`
            : undefined,
        ]
          .filter(Boolean)
          .join("\n")}
      </Pre>
    </CodeBlock>
  </Tab>
  <Tab value="yarn">
    <CodeBlock language="bash">
      <Pre>
        {[
          props.deps?.length ? `yarn add ${props.deps.join(" ")}` : undefined,
          props.devDeps?.length
            ? `yarn add --dev ${props.devDeps.join(" ")}`
            : undefined,
        ]
          .filter(Boolean)
          .join("\n")}
      </Pre>
    </CodeBlock>
  </Tab>
  <Tab value="pnpm">
    <CodeBlock language="bash">
      <Pre>
        {[
          props.deps?.length
            ? `pnpm install ${props.deps.join(" ")}`
            : undefined,
          props.devDeps?.length
            ? `pnpm install --save-dev ${props.devDeps.join(" ")}`
            : undefined,
        ]
          .filter(Boolean)
          .join("\n")}
      </Pre>
    </CodeBlock>
  </Tab>
  <Tab value="bun">
    <CodeBlock language="bash">
      <Pre>
        {[
          props.deps?.length
            ? `bun install ${props.deps.join(" ")}`
            : undefined,
          props.devDeps?.length
            ? `bun install --dev ${props.devDeps.join(" ")}`
            : undefined,
        ]
          .filter(Boolean)
          .join("\n")}
      </Pre>
    </CodeBlock>
  </Tab>
</Tabs>

# _tailwind helper (/v5/getting-started/installation/_tailwind)

import NPM from "./_npm.mdx";
import { Callout } from "@/components/callout";

**Install Tailwind CSS**

<NPM
  framework={props.framework}
  devDeps={["tailwindcss", "@tailwindcss/postcss", "postcss"]}
/>

Optionally, install `prettier-plugin-tailwindcss` as a dev dependency to automatically format your Tailwind CSS code.

# Try it out (/v5/getting-started/installation/_try-it-out)

## Try it out!

Create a simple component to test your Nativewind setup:

```tsx title="App.tsx"
import "./global.css"
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
    </View>
  );
}
```

This example shows:
- Using `className` prop to style components
- Tailwind utility classes like `flex-1`, `items-center`, `justify-center`
- Color utilities like `bg-white`, `text-blue-500`
- Typography utilities like `text-xl`, `font-bold`

If you see the styled text centered on a white background, Nativewind is working correctly!

# TypeScript Setup (/v5/getting-started/installation/_typescript)

<Callout type="tip">
  You can bypass manually creating this file by running `npx expo start --clear` in your Expo project's root directory.
</Callout>

If you're using TypeScript in your project, you'll need to set up the type definitions. Nativewind extends the React Native types via declaration merging. The simplest method to include the types is to create a new `nativewind-env.d.ts` file and add a [triple-slash directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) referencing the types.

```tsx
/// <reference types="react-native-css/types" />

// NOTE: This file should not be edited and should be committed with your source code. It is generated by react-native-css. If you need to move or disable this file, please see the documentation.
```

<Callout type="warn" title="CAUTION">
Do not call this file:

- `nativewind.d.ts`
- The same name as a file or folder in the same directory e.g `app.d.ts` when an `/app` folder exists
- The same name as a folder in `node_modules`, e.g `react.d.ts`

By doing so, your types will not be picked up by the TypeScript compiler.

</Callout>

# Installation (/v5/getting-started/installation/frameworkless)

import NPM from "./_npm.mdx";
import { Callout } from "@/components/callout";

{/* # Installation */}

> Nativewind v5

<a
  href="./"
  className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4"
>
  {"Expo"}
</a>
{" | "} <a
  href="./frameworkless"
  className="underline underline-offset-8 text-fd-primary hover:opacity-100 p-4"
>
  {"Framework-less"}
</a>
{/* {" | "} <a
  href="./nextjs"
  className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4"
>
  {"Next.js"}
</a> */}

## Installation with Framework-less React Native

Framework-less Metro does not parse CSS files and without modification it is incompatible with Nativewind. As the Expo SDK is modular, you can add the Expo Metro config to enable this functionality. This does not require you to switch to the Expo CLI or use an Expo clients.

### Install @expo/metro-config

<NPM expo={false} deps={["@expo/metro-config"]} />

After installation, follow the [Expo](../) installation guide, but replace `expo/metro-config` with `@expo/metro-config` inside your Metro config file.

# Installation (/v5/getting-started/installation)

import { Tab, Tabs } from "fumadocs-ui/components/tabs";

import Install from "./_install.mdx";
import TailwindInstall from "./_tailwind.mdx";
import { Callout } from "@/components/callout";

{/* # Installation */}

{/* <a
  href="./installation/"
  className="underline underline-offset-8 text-fd-primary hover:opacity-100 p-4"
>
  {"Expo"}
</a>
{/* {" | "} <a
  href="./installation/frameworkless"
  className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4"
>
  {"Framework-less"}
</a> */}
{/* {" | "} <a
  href="./installation/nextjs"
  className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4"
>
  {"Next.js"}
</a> */}

<Callout type="tip">
 If you'd like to skip manual setup and use Nativewind, you can use the following command to initialize a new Expo project with Nativewind v5, Expo SDK 54, and Tailwind CSS.

<Tabs groupId="v5-npm-install" items={["npm", "yarn", "pnpm", "bun"]}>
  <Tab value="npm">
```bash
npx rn-new@next --nativewind
```
  </Tab>
  <Tab value="yarn">
```bash
yarn dlx rn-new@next --nativewind
```
  </Tab>
  <Tab value="pnpm">
```bash
pnpx rn-new@next --nativewind
```
  </Tab>
  <Tab value="bun">
```bash
bunx rn-new@next --nativewind
```
  </Tab>
</Tabs>

</Callout>

## Installation with Expo

### 1. Install Nativewind

<Install framework="expo" />

### 2. Setup Tailwind CSS

<TailwindInstall framework="expo" />

**Add Tailwind to your PostCSS configuration**

Create a `postcss.config.mjs` file in the root of your Expo project if you don't already have one, then add `@tailwindcss/postcss` there, or wherever PostCSS is configured in your project.

```jsx title="postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Create a `global.css` file and add the Tailwind directives.

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
```

> From here onwards, replace `./global.css` with the relative path to the CSS file you just created.

<Callout type="tip">
  Instead of using the standard `@tailwind`, Nativewind recommends using the
  at-rules above which provide better compatibility with `react-native-web`
</Callout>

### 3. Create or modify your metro.config.js

Run `npx expo customize metro.config.js` to create a `metro.config.js` file if you don't already have one, then wrap the default config with `withNativewind`.

```js title="metro.config.js"
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

### 4. Import your CSS file

```js title="App.js"
import "./global.css"

export default App() {
  /* Your App */
}
```

<Callout type="warn">
  You should import your CSS file inside the same file as the top-most component of
  your app. Do **not** import it in the same file that calls
  `AppRegistry.registerComponent` or your app will not Fast Refresh properly.
</Callout>

### 5. Override the lightningcss version

Force `lightningcss` to a specific version in your `package.json`:

<Tabs groupId="v5-npm-install" items={["npm", "yarn", "pnpm", "bun"]}>
  <Tab value="npm">
    ```json title="package.json"
    {
      "overrides": {
        "lightningcss": "1.30.1"
      }
    }
    ```
  </Tab>
  <Tab value="yarn">
    ```json title="package.json"
    {
      "resolutions": {
        "lightningcss": "1.30.1"
      }
    }
    ```
  </Tab>
  <Tab value="pnpm">
    ```json title="package.json"
    {
      "pnpm": {
        "overrides": {
          "lightningcss": "1.30.1"
        }
      }
    }
    ```
  </Tab>
  <Tab value="bun">
    ```json title="package.json"
    {
      "overrides": {
        "lightningcss": "1.30.1"
      }
    }
    ```
  </Tab>
</Tabs>

<Callout type="warn">
  If you don't pin the `lightningcss` version, you may encounter deserialization errors with respect to `global.css` when building your app.
</Callout>

### 6. TypeScript setup (optional)

<include>./_typescript.mdx</include>

<include>./_try-it-out.mdx</include>

<include>./_additional-guides.mdx</include>

# Installation (/v5/getting-started/installation/nextjs)

{/* # Installation */}

> Nativewind works with both Expo and framework-less React Native projects but Expo provides a more streamlined experience.
> 
> **Web**: If you'd like to use Metro to bundle for a website or App Clip and you are **not** using Expo, you will need either Expo's Metro config `@expo/metro-config` or to manually use Tailwind CLI to generate a CSS file.


<a href="./" className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4">Expo</a> 
| <a href="./frameworkless" className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4">Framework-less</a> 
| <a href="./nextjs" className="underline underline-offset-8 text-fd-primary hover:opacity-100 p-4">Next.js</a>

## Installation with Next.js

Nativewind can be used in a Next.js project that is already configured to use Expo or framework-less React Native Web.

Setting up a new Next.js project to use React Native Web is out of scope for these instructions.

> Nativewind will only work with the `/pages` router or on `"use client"` routes. RSC support is in progress.

### 1. Setup Tailwind CSS

Simply configure Next.js as per [the Tailwind CSS Next.js setup guide](https://v3.tailwindcss.com/docs/guides/nextjs)

### 2. Add the Nativewind preset

```diff title="tailwind.config.js"

module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
+ presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
}
```

### 3. Update import source

Nativewind requires the `jsxImportSource` to be set to `nativewind`. The option to configure this depends on how you are compiling your Next.js project.

<Tabs groupId="compiler" items={["SWC","Babel"]} className="bg-fd-secondary">
  <Tab value="swc" className="bg-fd-card p-1 rounded-xl border [&>p]:px-4 [&>p]:pt-4">
    
    Next.js uses a `jsconfig.json`/`tsconfig.json` file to configure the `jsxImportSource`.

    ```json title="tsconfig.json"
    {
      "compilerOptions": {
        "jsxImportSource": "nativewind"
      }
    }
    ```
  </Tab>
  <Tab value="babel" className="bg-fd-card rounded-xl">
    ```diff title="babel.config.js"
    module.exports = {
      presets: ["next/babel"],
    +  plugins: [
    +    [
    +      "@babel/plugin-transform-react-jsx",
    +      {
    +        runtime: "automatic",
    +        importSource: "nativewind",
    +      },
    +    ],
    +  ],
    };

    ```
  </Tab>
</Tabs>

### 4. Transpile Nativewind

```diff title="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
+  transpilePackages: ["nativewind", "react-native-css-interop"],
}
```

## Common issues

### Errors about package imports.

```
import typeof AccessibilityInfo from './Libraries/Components/AccessibilityInfo/AccessibilityInfo';
^^^^^^

SyntaxError: Cannot use import statement outside a module
```

This signals that you have incorrectly setup React Native Web and/or a dependency needs to be added to `transpilePackages`. This is out of scope for Nativewind.

### Styles are not being applied

A common issue with Next.js is your styles are imported, but are being overridden by another StyleSheet due to the stylesheet import order.

A simple fix is simply make the Tailwind styles a higher specificity.

```diff title=tailwind.config.json
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
  plugins: [require('nativewind/tailwind/css')],
+ important: 'html',
  theme: {
    extend: {},
  },
}
```

## Additional Setup Guides

- [Using with Monorepos](./using-with-monorepos) - Learn how to set up Nativewind in monorepo environments like NX
- [Other Bundlers](/docs/guides/other-bundlers) - Learn how to use Nativewind with other bundlers

# Screen Readers (/v5/tailwind/accessibility/screen-readers)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Screen Readers */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["sr-only"]}
  none={["not-sr-only"]}
/>

# Background Attachment (/v5/tailwind/backgrounds/background-attachment)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Attachment */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-fixed", "bg-local", "bg-scroll"]}
/>

# Background Clip (/v5/tailwind/backgrounds/background-clip)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Clip */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-clip-border", "bg-clip-padding", "bg-clip-content", "bg-clip-text"]}
/>

# Background Color (/v5/tailwind/backgrounds/background-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["bg-{color}", "bg-[color]", "bg-current", "bg-transparent"]}
/>

# Background Image (/v5/tailwind/backgrounds/background-image)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Image */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-none", "bg-gradient-to-t", "bg-gradient-to-tr", "bg-gradient-to-r", "bg-gradient-to-br", "bg-gradient-to-b", "bg-gradient-to-bl", "bg-gradient-to-l", "bg-gradient-to-tl"]}
/>

# Background Origin (/v5/tailwind/backgrounds/background-origin)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Origin */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-origin-border", "bg-origin-padding", "bg-origin-content"]}
/>

# Background Position (/v5/tailwind/backgrounds/background-position)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Position */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-bottom", "bg-center", "bg-left", "bg-left-bottom", "bg-left-top", "bg-right", "bg-right-bottom", "bg-right-top", "bg-top"]}
/>

# Background Repeat (/v5/tailwind/backgrounds/background-repeat)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Repeat */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-repeat", "bg-no-repeat", "bg-repeat-x", "bg-repeat-y", "bg-repeat-round", "bg-repeat-space"]}
/>

# Background Size (/v5/tailwind/backgrounds/background-size)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Size */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-auto", "bg-cover", "bg-contain"]}
/>

# Gradient Color Stops (/v5/tailwind/backgrounds/gradient-color-stops)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Gradient Color Stops */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["from-{color}", "via-{color}", "to-{color}"]}
/>

# Border Color (/v5/tailwind/borders/border-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Border Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["border-{color}", "border-[color]", "border-x-{color}", "border-y-{color}", "border-t-{color}", "border-r-{color}", "border-b-{color}", "border-l-{color}", "border-current", "border-inherit"]}
/>

# Border Radius (/v5/tailwind/borders/border-radius)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Border Radius */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["rounded-{n}", "rounded-[n]", "rounded-t-{n}", "rounded-b-{n}", "rounded-l-{n}", "rounded-r-{n}", "rounded-tl-{n}", "rounded-tr-{n}", "rounded-bl-{n}", "rounded-br-{n}", "rounded-full", "rounded-none"]}
/>

# Border Style (/v5/tailwind/borders/border-style)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Border Style */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["border-solid", "border-dashed", "border-dotted", "border-none"]}
  none={["border-double", "border-hidden"]}
/>

# Border Width (/v5/tailwind/borders/border-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Border Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["border-{n}", "border-[n]", "border-x-{n}", "border-y-{n}", "border-t-{n}", "border-r-{n}", "border-b-{n}", "border-l-{n}", "border-s-{n}", "border-e-{n}"]}
/>

# Divide Color (/v5/tailwind/borders/divide-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Divide Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["divide-{color}"]}
/>

# Divide Style (/v5/tailwind/borders/divide-style)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Divide Style */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["divide-solid", "divide-dashed", "divide-dotted", "divide-double", "divide-none"]}
/>

# Divide Width (/v5/tailwind/borders/divide-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Divide Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["divide-x-{n}", "divide-y-{n}"]}
/>

# Outline Color (/v5/tailwind/borders/outline-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Outline Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["outline-{color}", "outline-[color]"]}
/>

# Outline Offset (/v5/tailwind/borders/outline-offset)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Outline Offset */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["outline-offset-{n}", "-outline-offset-{n}"]}
/>

# Outline Style (/v5/tailwind/borders/outline-style)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Outline Style */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["outline-solid", "outline-dashed", "outline-dotted", "outline-double"]}
/>

# Outline Width (/v5/tailwind/borders/outline-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Outline Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["outline-{n}", "outline-[n]"]}
/>

# Ring Color (/v5/tailwind/borders/ring-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Ring Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["ring-{color}"]}
/>

# Ring Offset Color (/v5/tailwind/borders/ring-offset-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Ring Offset Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["ring-offset-{color}"]}
/>

# Ring Offset Width (/v5/tailwind/borders/ring-offset-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Ring Offset Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["ring-offset-{n}"]}
/>

# Ring Width (/v5/tailwind/borders/ring-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Ring Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["ring-{n}"]}
/>

# Background Blend Mode (/v5/tailwind/effects/background-blend-mode)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Background Blend Mode */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["bg-blend-normal", "bg-blend-multiply", "bg-blend-screen", "bg-blend-overlay", "bg-blend-darken", "bg-blend-lighten", "bg-blend-color-dodge", "bg-blend-color-burn", "bg-blend-hard-light", "bg-blend-soft-light", "bg-blend-difference", "bg-blend-exclusion", "bg-blend-hue", "bg-blend-saturation", "bg-blend-color", "bg-blend-luminosity"]}
/>

# Box Shadow Color (/v5/tailwind/effects/box-shadow-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Box Shadow Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["shadow-{color}"]}
/>

# Box Shadow (/v5/tailwind/effects/box-shadow)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Box Shadow */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-none"]}
/>

# Mix Blend Mode (/v5/tailwind/effects/mix-blend-mode)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Mix Blend Mode */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["mix-blend-normal", "mix-blend-multiply", "mix-blend-screen", "mix-blend-overlay", "mix-blend-darken", "mix-blend-lighten", "mix-blend-color-dodge", "mix-blend-color-burn", "mix-blend-hard-light", "mix-blend-soft-light", "mix-blend-difference", "mix-blend-exclusion", "mix-blend-hue", "mix-blend-saturation", "mix-blend-color", "mix-blend-luminosity", "mix-blend-plus-darker", "mix-blend-plus-lighter"]}
/>

# Opacity (/v5/tailwind/effects/opacity)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Opacity */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["opacity-{n}", "opacity-[n]"]}
/>

# Backdrop Blur (/v5/tailwind/filters/backdrop-blur)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Blur */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-blur-none", "backdrop-blur-sm", "backdrop-blur", "backdrop-blur-md", "backdrop-blur-lg", "backdrop-blur-xl", "backdrop-blur-2xl", "backdrop-blur-3xl"]}
/>

# Backdrop Brightness (/v5/tailwind/filters/backdrop-brightness)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Brightness */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-brightness-{n}", "backdrop-brightness-[n]"]}
/>

# Backdrop Contrast (/v5/tailwind/filters/backdrop-contrast)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Contrast */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-contrast-{n}", "backdrop-contrast-[n]"]}
/>

# Backdrop Grayscale (/v5/tailwind/filters/backdrop-grayscale)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Grayscale */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-grayscale", "backdrop-grayscale-0"]}
/>

# Backdrop Hue Rotate (/v5/tailwind/filters/backdrop-hue-rotate)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Hue Rotate */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-hue-rotate-{n}", "backdrop-hue-rotate-[n]"]}
/>

# Backdrop Invert (/v5/tailwind/filters/backdrop-invert)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Invert */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-invert", "backdrop-invert-0"]}
/>

# Backdrop Opacity (/v5/tailwind/filters/backdrop-opacity)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Opacity */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-opacity-{n}", "backdrop-opacity-[n]"]}
/>

# Backdrop Saturate (/v5/tailwind/filters/backdrop-saturate)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Saturate */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-saturate-{n}", "backdrop-saturate-[n]"]}
/>

# Backdrop Sepia (/v5/tailwind/filters/backdrop-sepia)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Backdrop Sepia */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["backdrop-sepia", "backdrop-sepia-0"]}
/>

# Blur (/v5/tailwind/filters/blur)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Blur */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["blur-none", "blur-sm", "blur", "blur-md", "blur-lg", "blur-xl", "blur-2xl", "blur-3xl"]}
/>

# Brightness (/v5/tailwind/filters/brightness)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Brightness */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["brightness-{n}", "brightness-[n]"]}
/>

# Contrast (/v5/tailwind/filters/contrast)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Contrast */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["contrast-{n}", "contrast-[n]"]}
/>

# Drop Shadow (/v5/tailwind/filters/drop-shadow)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Drop Shadow */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["drop-shadow", "drop-shadow-sm", "drop-shadow-md", "drop-shadow-lg", "drop-shadow-xl", "drop-shadow-2xl", "drop-shadow-none"]}
/>

# Grayscale (/v5/tailwind/filters/grayscale)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grayscale */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["grayscale", "grayscale-0"]}
/>

# Hue Rotate (/v5/tailwind/filters/hue-rotate)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Hue Rotate */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["hue-rotate-{n}", "hue-rotate-[n]"]}
/>

# Invert (/v5/tailwind/filters/invert)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Invert */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["invert", "invert-0"]}
/>

# Saturate (/v5/tailwind/filters/saturate)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Saturate */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["saturate-{n}", "saturate-[n]"]}
/>

# Sepia (/v5/tailwind/filters/sepia)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Sepia */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["sepia", "sepia-0"]}
/>

# Align Content (/v5/tailwind/flexbox/align-content)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Align Content */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["content-center", "content-start", "content-end", "content-between", "content-around", "content-evenly", "content-stretch"]}
/>

# Align Items (/v5/tailwind/flexbox/align-items)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Align Items */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["items-center", "items-start", "items-end", "items-baseline", "items-stretch"]}
/>

# Align Self (/v5/tailwind/flexbox/align-self)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Align Self */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["self-auto", "self-start", "self-end", "self-center", "self-stretch", "self-baseline"]}
/>

# Flex Basis (/v5/tailwind/flexbox/flex-basis)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Flex Basis */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["basis-auto", "basis-{n}", "basis-[n]"]}
/>

# Flex Direction (/v5/tailwind/flexbox/flex-direction)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Flex Direction */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["flex-row", "flex-col", "flex-row-reverse", "flex-col-reverse"]}
/>

# Flex Grow (/v5/tailwind/flexbox/flex-grow)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Flex Grow */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["grow", "grow-0", "grow-[n]"]}
/>

# Flex Shrink (/v5/tailwind/flexbox/flex-shrink)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Flex Shrink */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["shrink", "shrink-0"]}
/>

# Flex Wrap (/v5/tailwind/flexbox/flex-wrap)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Flex Wrap */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["flex-wrap", "flex-nowrap", "flex-wrap-reverse"]}
/>

# Flex (/v5/tailwind/flexbox/flex)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Flex */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["flex-1", "flex-auto", "flex-initial", "flex-none"]}
/>

# Gap (/v5/tailwind/flexbox/gap)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Gap */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["gap-{n}", "gap-[n]", "gap-x-{n}", "gap-x-[n]", "gap-y-{n}", "gap-y-[n]"]}
/>

# Grid Auto Columns (/v5/tailwind/flexbox/grid-auto-columns)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Auto Columns */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["auto-cols-auto", "auto-cols-min", "auto-cols-max", "auto-cols-fr"]}
/>

# Grid Auto Flow (/v5/tailwind/flexbox/grid-auto-flow)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Auto Flow */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["grid-flow-row", "grid-flow-col", "grid-flow-dense", "grid-flow-row-dense", "grid-flow-col-dense"]}
/>

# Grid Auto Rows (/v5/tailwind/flexbox/grid-auto-rows)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Auto Rows */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["auto-rows-auto", "auto-rows-min", "auto-rows-max", "auto-rows-fr"]}
/>

# Grid Column Start / End (/v5/tailwind/flexbox/grid-column)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Column Start / End */}

## Usage

<Usage href="grid-column" />

## Compatibility

<Compatibility
  none={["col-span-{n}", "col-start-{n}", "col-end-{n}"]}
/>

# Grid Row Start / End (/v5/tailwind/flexbox/grid-row)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Row Start / End */}

## Usage

<Usage href="grid-row" />

## Compatibility

<Compatibility
  none={["row-span-{n}", "row-start-{n}", "row-end-{n}"]}
/>

# Grid Template Columns (/v5/tailwind/flexbox/grid-template-columns)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Template Columns */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["grid-cols-{n}", "grid-cols-[n]"]}
/>

# Grid Template Rows (/v5/tailwind/flexbox/grid-template-rows)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Grid Template Rows */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["grid-rows-{n}", "grid-rows-[n]"]}
/>

# Justify Content (/v5/tailwind/flexbox/justify-content)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Justify Content */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["justify-start", "justify-end", "justify-center", "justify-between", "justify-around", "justify-evenly"]}
/>

# Justify Items (/v5/tailwind/flexbox/justify-items)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Justify Items */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["justify-items-start", "justify-items-end", "justify-items-center", "justify-items-stretch"]}
/>

# Justify Self (/v5/tailwind/flexbox/justify-self)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Justify Self */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["justify-self-auto", "justify-self-start", "justify-self-end", "justify-self-center", "justify-self-stretch"]}
/>

# Order (/v5/tailwind/flexbox/order)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Order */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["order-{n}", "order-first", "order-last", "order-none"]}
/>

# Place Content (/v5/tailwind/flexbox/place-content)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Place Content */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["place-content-center", "place-content-start", "place-content-end", "place-content-between", "place-content-around", "place-content-evenly", "place-content-stretch"]}
/>

# Place Items (/v5/tailwind/flexbox/place-items)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Place Items */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["place-items-start", "place-items-end", "place-items-center", "place-items-stretch"]}
/>

# Place Self (/v5/tailwind/flexbox/place-self)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Place Self */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["place-self-auto", "place-self-start", "place-self-end", "place-self-center", "place-self-stretch"]}
/>

# Accent Color (/v5/tailwind/interactivity/accent-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Accent Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["accent-{color}"]}
/>

# Appearance (/v5/tailwind/interactivity/appearance)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Appearance */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["appearance-none"]}
/>

# Caret Color (/v5/tailwind/interactivity/caret-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Caret Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["caret-{color}", "caret-[color]", "caret-current", "caret-inherit"]}
/>

# Cursor (/v5/tailwind/interactivity/cursor)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Cursor */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["cursor-auto", "cursor-default", "cursor-pointer", "cursor-wait", "cursor-text", "cursor-move", "cursor-help", "cursor-not-allowed", "cursor-none", "cursor-context-menu", "cursor-progress", "cursor-cell", "cursor-crosshair", "cursor-vertical-text", "cursor-alias", "cursor-copy", "cursor-no-drop", "cursor-grab", "cursor-grabbing", "cursor-all-scroll", "cursor-col-resize", "cursor-row-resize", "cursor-n-resize", "cursor-e-resize", "cursor-s-resize", "cursor-w-resize", "cursor-ne-resize", "cursor-nw-resize", "cursor-se-resize", "cursor-sw-resize", "cursor-ew-resize", "cursor-ns-resize", "cursor-nesw-resize", "cursor-nwse-resize", "cursor-zoom-in", "cursor-zoom-out"]}
/>

# Pointer Events (/v5/tailwind/interactivity/pointer-events)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Pointer Events */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["pointer-events-none", "pointer-events-auto"]}
/>

# Resize (/v5/tailwind/interactivity/resize)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Resize */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["resize-none", "resize-y", "resize-x", "resize"]}
/>

# Scroll Behavior (/v5/tailwind/interactivity/scroll-behavior)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scroll Behavior */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["scroll-auto", "scroll-smooth"]}
/>

# Scroll Margin (/v5/tailwind/interactivity/scroll-margin)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scroll Margin */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["scroll-m-{n}", "scroll-mx-{n}", "scroll-my-{n}", "scroll-ms-{n}", "scroll-me-{n}", "scroll-mt-{n}", "scroll-mr-{n}", "scroll-mb-{n}", "scroll-ml-{n}"]}
/>

# Scroll Padding (/v5/tailwind/interactivity/scroll-padding)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scroll Padding */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["scroll-p-{n}", "scroll-px-{n}", "scroll-py-{n}", "scroll-ps-{n}", "scroll-pe-{n}", "scroll-pt-{n}", "scroll-pr-{n}", "scroll-pb-{n}", "scroll-pl-{n}"]}
/>

# Scroll Snap Align (/v5/tailwind/interactivity/scroll-snap-align)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scroll Snap Align */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["snap-start", "snap-end", "snap-center", "snap-align-none"]}
/>

# Scroll Snap Stop (/v5/tailwind/interactivity/scroll-snap-stop)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scroll Snap Stop */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["snap-normal", "snap-always"]}
/>

# Scroll Snap Type (/v5/tailwind/interactivity/scroll-snap-type)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scroll Snap Type */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["snap-none", "snap-x", "snap-y", "snap-both", "snap-mandatory", "snap-proximity"]}
/>

# Touch Action (/v5/tailwind/interactivity/touch-action)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Touch Action */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["touch-auto", "touch-none", "touch-pan-x", "touch-pan-left", "touch-pan-right", "touch-pan-y", "touch-pan-up", "touch-pan-down", "touch-pinch-zoom", "touch-manipulation"]}
/>

# User Select (/v5/tailwind/interactivity/user-select)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # User Select */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["select-none", "select-text", "select-all", "select-auto"]}
/>

# Will Change (/v5/tailwind/interactivity/will-change)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Will Change */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["will-change-auto", "will-change-scroll", "will-change-contents", "will-change-transform"]}
/>

# Aspect Ratio (/v5/tailwind/layout/aspect-ratio)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Aspect Ratio */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["aspect-square", "aspect-video", "aspect-{n}", "aspect-[n]"]}
/>

# Box Decoration Break (/v5/tailwind/layout/box-decoration-break)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Box Decoration Break */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["box-decoration-clone", "box-decoration-slice"]}
/>

# Box Sizing (/v5/tailwind/layout/box-sizing)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Box Sizing */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["box-border", "box-content"]}
/>

# Break After (/v5/tailwind/layout/break-after)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Break After */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["break-after-auto", "break-after-avoid", "break-after-all", "break-after-avoid-page", "break-after-page", "break-after-left", "break-after-right", "break-after-column"]}
/>

# Break Before (/v5/tailwind/layout/break-before)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Break Before */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["break-before-auto", "break-before-avoid", "break-before-all", "break-before-avoid-page", "break-before-page", "break-before-left", "break-before-right", "break-before-column"]}
/>

# Break Inside (/v5/tailwind/layout/break-inside)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Break Inside */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["break-inside-auto", "break-inside-avoid", "break-inside-avoid-page", "break-inside-avoid-column"]}
/>

# Clear (/v5/tailwind/layout/clear)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Clear */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["clear-left", "clear-right", "clear-both", "clear-none"]}
/>

# Columns (/v5/tailwind/layout/columns)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Columns */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["columns-{n}", "columns-[n]"]}
/>

# Container (/v5/tailwind/layout/container)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Container */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["container"]}
/>

# Display (/v5/tailwind/layout/display)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Display */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["flex", "hidden", "contents"]}
  none={["block", "inline-block", "inline", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "list-item"]}
/>

# Float (/v5/tailwind/layout/float)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Float */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["float-right", "float-left", "float-none"]}
/>

# Isolation (/v5/tailwind/layout/isolation)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Isolation */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["isolate", "isolation-auto"]}
/>

# Object Fit (/v5/tailwind/layout/object-fit)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Object Fit */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["object-contain", "object-cover", "object-fill", "object-none", "object-scale-down"]}
/>

# Object Position (/v5/tailwind/layout/object-position)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Object Position */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["object-bottom", "object-center", "object-left", "object-left-bottom", "object-left-top", "object-right", "object-right-bottom", "object-right-top", "object-top"]}
/>

# Overflow (/v5/tailwind/layout/overflow)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Overflow */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["overflow-auto", "overflow-clip", "overflow-scroll", "overflow-hidden", "overflow-visible", "overflow-x-auto", "overflow-x-clip", "overflow-x-scroll", "overflow-x-hidden", "overflow-x-visible", "overflow-y-auto", "overflow-y-clip", "overflow-y-scroll", "overflow-y-hidden", "overflow-y-visible"]}
/>

# Overscroll Behavior (/v5/tailwind/layout/overscroll-behavior)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Overscroll Behavior */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["overscroll-auto", "overscroll-contain", "overscroll-none", "overscroll-x-auto", "overscroll-x-contain", "overscroll-x-none", "overscroll-y-auto", "overscroll-y-contain", "overscroll-y-none"]}
/>

# Position (/v5/tailwind/layout/position)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Position */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["absolute", "relative", "static"]}
  partial={["fixed", "sticky"]}
/>

# Top / Right / Bottom / Left (/v5/tailwind/layout/top-right-bottom-left)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Top / Right / Bottom / Left */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["top-{n}", "top-[n]", "right-{n}", "right-[n]", "bottom-{n}", "bottom-[n]", "left-{n}", "left-[n]", "inset-{n}", "inset-[n]", "inset-x-{n}", "inset-x-[n]", "inset-y-{n}", "inset-y-[n]", "inset-auto", "inset-x-auto", "inset-y-auto"]}
/>

# Visibility (/v5/tailwind/layout/visibility)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Visibility */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["visible", "invisible"]}
/>

# Z-Index (/v5/tailwind/layout/z-index)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Z-Index */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["z-{n}", "z-[n]"]}
  none={["z-auto"]}
/>

# Safe Area Insets (/v5/tailwind/new-concepts/safe-area-insets)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Safe Area Insets */}

These utilities come from the `tailwindcss-safe-area` plugin, which is included automatically via `nativewind/theme`. They use `env(safe-area-inset-*)` values to ensure your content respects device safe areas such as notches, home indicators, and rounded corners.

## Compatibility

<Compatibility
  supported={[
    "m-safe", "mx-safe", "my-safe", "ms-safe", "me-safe", "mt-safe", "mr-safe", "mb-safe", "ml-safe",
    "p-safe", "px-safe", "py-safe", "ps-safe", "pe-safe", "pt-safe", "pr-safe", "pb-safe", "pl-safe",
    "min-h-screen-safe", "max-h-screen-safe", "h-screen-safe",
    "inset-safe", "top-safe", "right-safe", "bottom-safe", "left-safe",
    "pb-safe-offset-{n}", "pb-safe-or-{n}"
  ]}
/>

# Container Queries (/v5/tailwind/plugins/container-queries)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Container Queries */}

Nativewind supports container queries, allowing you to style elements based on the size of a parent container rather than the viewport. Use `@container` to mark an element as a query container, then apply responsive styles with container query variants like `@sm:`, `@md:`, `@lg:`, etc.

## Usage

<Usage href="container-queries" />

## Compatibility

<Compatibility
  supported={["@container", "@container/{name}", "@sm:", "@md:", "@lg:", "@xl:", "@2xl:", "@3xl:", "@4xl:", "@5xl:", "@6xl:", "@7xl:"]}
/>

# Height (/v5/tailwind/sizing/height)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Height */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["h-{n}", "h-[n]", "h-auto", "h-full", "h-screen", "h-min", "h-max", "h-fit"]}
/>

# Max-Height (/v5/tailwind/sizing/max-height)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Max-Height */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["max-h-{n}", "max-h-[n]", "max-h-full", "max-h-screen", "max-h-min", "max-h-max", "max-h-fit", "max-h-none"]}
/>

# Max-Width (/v5/tailwind/sizing/max-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Max-Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["max-w-{n}", "max-w-[n]", "max-w-full", "max-w-min", "max-w-max", "max-w-fit", "max-w-none"]}
/>

# Min-Height (/v5/tailwind/sizing/min-height)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Min-Height */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["min-h-{n}", "min-h-[n]", "min-h-full", "min-h-screen", "min-h-min", "min-h-max", "min-h-fit"]}
/>

# Min-Width (/v5/tailwind/sizing/min-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Min-Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["min-w-{n}", "min-w-[n]", "min-w-full", "min-w-min", "min-w-max", "min-w-fit"]}
/>

# Width (/v5/tailwind/sizing/width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["w-{n}", "w-[n]", "w-auto", "w-full", "w-screen", "w-min", "w-max", "w-fit", "w-1/2"]}
/>

# Margin (/v5/tailwind/spacing/margin)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Margin */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["m-{n}", "m-[n]", "mx-{n}", "mx-[n]", "my-{n}", "my-[n]", "mt-{n}", "mt-[n]", "mr-{n}", "mr-[n]", "mb-{n}", "mb-[n]", "ml-{n}", "ml-[n]", "ms-{n}", "ms-[n]", "me-{n}", "me-[n]", "m-auto", "mx-auto", "mt-auto", "mb-auto", "ms-auto", "me-auto"]}
/>

# Padding (/v5/tailwind/spacing/padding)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Padding */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["p-{n}", "p-[n]", "px-{n}", "px-[n]", "py-{n}", "py-[n]", "pt-{n}", "pt-[n]", "pr-{n}", "pr-[n]", "pb-{n}", "pb-[n]", "pl-{n}", "pl-[n]", "ps-{n}", "ps-[n]", "pe-{n}", "pe-[n]"]}
/>

# Space Between (/v5/tailwind/spacing/space-between)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Space Between */}

## Usage

<Usage href="space" />

## Compatibility

<Compatibility
  none={["space-x-{n}", "space-x-[n]", "space-y-{n}", "space-y-[n]"]}
/>

# Fill (/v5/tailwind/svg/fill)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Fill */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["fill-{color}", "fill-[color]"]}
/>

# Stroke Width (/v5/tailwind/svg/stroke-width)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Stroke Width */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["stroke-{n}", "stroke-[n]"]}
/>

# Stroke (/v5/tailwind/svg/stroke)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Stroke */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["stroke-{color}", "stroke-[color]"]}
/>

# Border Collapse (/v5/tailwind/tables/border-collapse)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Border Collapse */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["border-collapse", "border-separate"]}
/>

# Border Spacing (/v5/tailwind/tables/border-spacing)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Border Spacing */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["border-spacing-{n}", "border-spacing-x-{n}", "border-spacing-y-{n}"]}
/>

# Caption Side (/v5/tailwind/tables/caption-side)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Caption Side */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["caption-top", "caption-bottom"]}
/>

# Table Layout (/v5/tailwind/tables/table-layout)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Table Layout */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["table-auto", "table-fixed"]}
/>

# Rotate (/v5/tailwind/transforms/rotate)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Rotate */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["rotate-{n}", "rotate-[n]"]}
/>

# Scale (/v5/tailwind/transforms/scale)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Scale */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["scale-{n}", "scale-[n]", "scale-x-{n}", "scale-y-{n}"]}
/>

# Skew (/v5/tailwind/transforms/skew)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Skew */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["skew-x-{n}", "skew-y-{n}"]}
/>

# Transform Origin (/v5/tailwind/transforms/transform-origin)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Transform Origin */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["origin-center", "origin-top", "origin-top-right", "origin-right", "origin-bottom-right", "origin-bottom", "origin-bottom-left", "origin-left", "origin-top-left"]}
/>

# Translate (/v5/tailwind/transforms/translate)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Translate */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["translate-x-{n}", "translate-x-[n]", "translate-y-{n}", "translate-y-[n]", "translate-x-full", "translate-y-full", "translate-x-1/2", "translate-y-1/2"]}
/>

# Animation (/v5/tailwind/transitions-animation/animation)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Animation */}

## Usage

<Usage />

## Compatibility

<Compatibility
  experimental={["animate-spin", "animate-ping", "animate-pulse", "animate-bounce", "animate-none"]}
/>

# Transition Delay (/v5/tailwind/transitions-animation/transition-delay)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Transition Delay */}

## Usage

<Usage />

## Compatibility

<Compatibility
  experimental={["delay-{n}", "delay-[n]"]}
/>

# Transition Duration (/v5/tailwind/transitions-animation/transition-duration)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Transition Duration */}

## Usage

<Usage />

## Compatibility

<Compatibility
  experimental={["duration-{n}", "duration-[n]"]}
/>

# Transition Property (/v5/tailwind/transitions-animation/transition-property)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Transition Property */}

## Usage

<Usage />

## Compatibility

<Compatibility
  experimental={["transition", "transition-all", "transition-colors", "transition-opacity", "transition-shadow", "transition-transform", "transition-none"]}
/>

# Transition Timing Function (/v5/tailwind/transitions-animation/transition-timing-function)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Transition Timing Function */}

## Usage

<Usage />

## Compatibility

<Compatibility
  experimental={["ease-linear", "ease-in", "ease-out", "ease-in-out"]}
/>

# Content (/v5/tailwind/typography/content)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Content */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["content-none"]}
/>

# Font Family (/v5/tailwind/typography/font-family)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Font Family */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["font-sans", "font-serif", "font-mono", "font-{n}", "font-[n]"]}
/>

# Font Size (/v5/tailwind/typography/font-size)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Font Size */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-{n}", "text-[n]"]}
/>

# Font Smoothing (/v5/tailwind/typography/font-smoothing)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Font Smoothing */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["antialiased", "subpixel-antialiased"]}
/>

# Font Style (/v5/tailwind/typography/font-style)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Font Style */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["italic", "not-italic"]}
/>

# Font Variant Numeric (/v5/tailwind/typography/font-variant-numeric)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Font Variant Numeric */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["normal-nums", "ordinal", "slashed-zero", "lining-nums", "oldstyle-nums", "proportional-nums", "tabular-nums", "diagonal-fractions", "stacked-fractions"]}
/>

# Font Weight (/v5/tailwind/typography/font-weight)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Font Weight */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["font-thin", "font-extralight", "font-light", "font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold", "font-black"]}
/>

# Hyphens (/v5/tailwind/typography/hyphens)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Hyphens */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["hyphens-none", "hyphens-manual", "hyphens-auto"]}
/>

# Letter Spacing (/v5/tailwind/typography/letter-spacing)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Letter Spacing */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest", "tracking-{n}", "tracking-[n]"]}
/>

# Line Clamp (/v5/tailwind/typography/line-clamp)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Line Clamp */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["line-clamp-{n}", "line-clamp-none"]}
/>

# Line Height (/v5/tailwind/typography/line-height)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Line Height */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["leading-{n}", "leading-[n]"]}
/>

# List Style Image (/v5/tailwind/typography/list-style-image)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # List Style Image */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["list-image-none", "list-image-[url]"]}
/>

# List Style Position (/v5/tailwind/typography/list-style-position)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # List Style Position */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["list-inside", "list-outside"]}
/>

# List Style Type (/v5/tailwind/typography/list-style-type)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # List Style Type */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["list-none", "list-disc", "list-decimal"]}
/>

# Text Align (/v5/tailwind/typography/text-align)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Align */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["text-left", "text-center", "text-right", "text-justify"]}
/>

# Text Color (/v5/tailwind/typography/text-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["text-{color}", "text-[color]", "text-inherit", "text-current", "text-transparent"]}
/>

# Text Decoration Color (/v5/tailwind/typography/text-decoration-color)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Decoration Color */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["decoration-{color}", "decoration-[color]", "decoration-current", "decoration-inherit", "decoration-transparent"]}
/>

# Text Decoration Style (/v5/tailwind/typography/text-decoration-style)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Decoration Style */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["decoration-solid", "decoration-double", "decoration-dotted", "decoration-dashed", "decoration-wavy"]}
/>

# Text Decoration Thickness (/v5/tailwind/typography/text-decoration-thickness)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Decoration Thickness */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["decoration-auto", "decoration-from-font", "decoration-{n}"]}
/>

# Text Decoration (/v5/tailwind/typography/text-decoration)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Decoration */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["underline", "overline", "line-through", "no-underline"]}
/>

# Text Indent (/v5/tailwind/typography/text-indent)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Indent */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["indent-{n}", "indent-[n]"]}
/>

# Text Overflow (/v5/tailwind/typography/text-overflow)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Overflow */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["text-ellipsis", "text-clip"]}
/>

# Text Transform (/v5/tailwind/typography/text-transform)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Transform */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["uppercase", "lowercase", "capitalize", "normal-case"]}
/>

# Text Underline Offset (/v5/tailwind/typography/text-underline-offset)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Text Underline Offset */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["underline-offset-auto", "underline-offset-{n}"]}
/>

# Vertical Align (/v5/tailwind/typography/vertical-align)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Vertical Align */}

## Usage

<Usage />

## Compatibility

<Compatibility
  supported={["align-baseline", "align-top", "align-middle", "align-bottom", "align-text-top", "align-text-bottom", "align-sub", "align-super"]}
/>

# Whitespace (/v5/tailwind/typography/whitespace)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Whitespace */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap", "whitespace-break-spaces"]}
/>

# Word Break (/v5/tailwind/typography/word-break)

import Compatibility from "../_compatibility.mdx";
import Usage from "../_usage.tsx";

{/* # Word Break */}

## Usage

<Usage />

## Compatibility

<Compatibility
  none={["break-normal", "break-words", "break-all", "break-keep"]}
/>