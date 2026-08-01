---
type: Foundation
title: Typography
description: Rem-based type scale where weight compensates for size to keep typographic colour even.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
locked: true
---
# Typography

Rem-based type scale for NUI.

The rationale of typographic weights is to keep the general [[Typographic color]] even: When the type size gets larger, the weight of the typeface compensates by getting lighter. All should appear an even level of grey.

The only exception to this rule is h6, which is considerably lighter and aligns to the typographic color of rules.


Values sync to `NUI/theme.css` section 1b. Each style has four properties, like these:

```
--nui-body
--nui-leading-body
--nui-weight-body
--nui-tracking-body
```

Below is a documentation with examples of the styles, rendered in the styles themselves.

###### Body

Sample paragraph in body type. Body is the rem base for the ladder. 

| Element | Size | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| body    | 1rem | 140%    | 400    | 0        |

###### Heading one
# The largest headline

The first headline is the same as the note inline title. This headline marks the beginning of a new major section in the document.

| Element | Size | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| h1      | 2rem | 110%    | 200    | 0        |

###### Heading two
## The second largest headline

This is the second headline level. It is used for most headings.

| Element | Size    | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| h2      | 1.66rem | 110%    | 250    | 0.01em   |

###### Heading three
### The third headline level

Sample paragraph in body type.

| Element | Size     | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| h3      | 1.33rem  | 115%    | 300    | 0.005em  |

###### Heading four
#### The fourth heading level

Sample paragraph in body type. The leading is set so that one line of h4 is the same as a line of body copy.

| Element | Size | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| h4      | 1rem | =body   | 400    | 0.05em   |

###### Heading five
##### The fifth heading level

This heading is the bold version of `h6`.

| Element | Size     | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| h5      | 0.66rem  | 120%    | 550    | 0.15em   |

###### Heading six
###### The Sixth heading level

This heading level is also used as label, table header and sometimes as kicker (overline above the actual heading).

| Element | Size     | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| h6      | 0.66rem  | 120%    | 350    | 0.15em   |

###### Block quote

> The blockquote lede

Used for opening ledes and pull quotes. Bookish Grades upright (`GRAD` axis); italic uses Bookish Italic. Size tracks the prose column (`6.5cqw`), not rem. No left rule or indent.

| Element    | Size    | Leading | Grade | Tracking |
| ---------- | ------- | ------- | ----- | -------- |
| blockquote | 6.1cqw  | 110%    | 350   | 0        |

###### Supporting roles

| Element            | Size     | Leading | Weight | Tracking |
| ------- | ---- | ------- | ------ | -------- |
| code               | 0.875rem | 120%    | 500    | -0.01em  |
| inline title       | = h1     | 100%    | 220    | 0        |
| table header       | = h6     | = h6    | = h6   | = h6     |
| embed title        | = h6     | = h6    | = h6   | = h6     |
| timeline bar title | = h6     | = h6    | = h6   | = h6     |

h4–h6 use uppercase and tracking in the theme.
