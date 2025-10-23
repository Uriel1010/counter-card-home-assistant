# Counter Card

A Lovelace card for Home Assistant to control counter helpers.

## Features

- Increment and decrement the counter.
- Increment and decrement the counter by a custom step value.
- Reset the counter to its initial value.
- Error handling for when the entity is not a counter.

## Installation

1. Copy `counter-card.js` to your `www` directory in your Home Assistant configuration directory.
2. Add the card to your Lovelace UI.

## Usage

Add the following to your Lovelace YAML:

```yaml
- type: custom:counter-card
  entity: counter.my_counter
  title: My Counter
  step: 1
```

## Version

1.1.8
