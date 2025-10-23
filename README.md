# Counter Card

A Lovelace card for Home Assistant to control counter helpers.

![Example](./example.png)

## Features

- Increment and decrement the counter.
- Increment and decrement the counter by a custom step value.
- Reset the counter to its initial value.
- Error handling for when the entity is not a counter.

## Installation

1. Copy `counter-card.js` to your `www` directory in your Home Assistant configuration directory.
2. Add the card to your Lovelace UI:
   a. In Home Assistant, go to `Settings` > `Dashboards`.
   b. Click the three dots menu in the top right corner and select `Resources`.
   c. Click `Add Resource`.
   d. Set `Url` as `/local/counter-card.js`.
   e. Set `Resource type` as `JavaScript Module`.
   f. Click `Create`.

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
