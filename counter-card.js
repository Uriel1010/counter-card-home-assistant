// Prefer the built-in Home Assistant lit bundle instead of an external CDN to avoid CSP/network issues.
const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const CARD_VERSION = '1.1.8';
const CARD_TYPE = 'counter-card';

console.info(
  `%c COUNTER-CARD %c ${CARD_VERSION} `,
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);

class CounterCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
      _step: { state: true },
    };
  }

  constructor() {
    super();
    this._step = Number.NaN;
  }

  setConfig(config) {
    try {
      if (!config || !config.entity) {
        throw new Error('You need to define an entity');
      }
      this._config = { ...config };
      const configuredStep = Number(config.step);
      this._step =
        !Number.isNaN(configuredStep) && configuredStep > 0 ? configuredStep : Number.NaN;
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { entity, title } = this._config;
    if (!entity || !entity.startsWith('counter.')) {
      return html`
        <ha-card>
          <div class="card-content">
            <div class="warning">
              Invalid entity: ${entity || 'unknown'}. Please select a counter helper.
            </div>
          </div>
        </ha-card>
      `;
    }

    const stateObj = this.hass.states[entity];
    if (!stateObj) {
      return html`
        <ha-card>
          <div class="card-content">
            <div class="warning">Entity not found: ${entity}</div>
          </div>
        </ha-card>
      `;
    }

    const {
      friendly_name: friendlyName,
      minimum,
      maximum,
      step: nativeStep,
    } = stateObj.attributes ?? {};

    const defaultStep = Number(nativeStep);
    const hasCustomStep = Number.isFinite(this._step) && this._step > 0;
    const fallbackStep =
      Number.isFinite(defaultStep) && defaultStep > 0 ? defaultStep : 1;
    const effectiveStep = hasCustomStep ? this._step : fallbackStep;
    const stepDisplayValue = hasCustomStep ? String(this._step) : '';
    const hasConfiguredTitle = Boolean(title);
    const inlineTitle = hasConfiguredTitle ? '' : friendlyName || 'Counter';
    const icon = this._config.icon ?? stateObj.attributes?.icon ?? '';
    const iconColor = this._config.icon_color ?? '';
    const iconStyle = iconColor ? `color: ${iconColor};` : '';
    const accentColor = this._config.accent_color ?? '';
    const hostStyle = accentColor ? `--counter-card-accent-color: ${accentColor};` : '';
    const metaItems = [
      Number.isFinite(defaultStep) ? `Step ${defaultStep}` : '',
      minimum !== undefined ? `Min ${minimum}` : '',
      maximum !== undefined ? `Max ${maximum}` : '',
    ].filter(Boolean);
    const metaLine = metaItems.join(' | ');

    return html`
      <ha-card .header=${hasConfiguredTitle ? title : undefined}>
        <div class="card-content" style=${hostStyle}>
          <div class="top-row">
            ${icon
              ? html`
                  <div class="icon-wrapper" style=${iconStyle}>
                    <ha-icon .icon=${icon}></ha-icon>
                  </div>
                `
              : ''}
            <div class="value-block">
              ${inlineTitle
                ? html`<div class="inline-title">${inlineTitle}</div>`
                : ''}
              <div class="value-row">
                <div class="counter-value">${stateObj.state}</div>
              </div>
              ${metaLine ? html`<div class="meta">${metaLine}</div>` : ''}
            </div>
            <div class="primary-controls">
              <button
                type="button"
                class="action action--primary"
                aria-label="Decrease"
                @click=${this._handleDecrement}
              >
                <ha-icon .icon=${'mdi:minus'}></ha-icon>
              </button>
              <button
                type="button"
                class="action action--primary"
                aria-label="Increase"
                @click=${this._handleIncrement}
              >
                <ha-icon .icon=${'mdi:plus'}></ha-icon>
              </button>
            </div>
          </div>
          <div class="bottom-row">
            <div class="step-input">
              <span class="step-label">Step</span>
              <input
                id="counter-step"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                .value=${stepDisplayValue}
                placeholder=${String(fallbackStep)}
                @input=${this._handleStepInput}
              />
            </div>
            <div class="secondary-controls">
              <button
                type="button"
                class="action action--tonal"
                aria-label="Decrease by custom step"
                @click=${() => this._applyDelta(-effectiveStep)}
              >
                <ha-icon .icon=${'mdi:minus-circle-outline'}></ha-icon>
              </button>
              <button
                type="button"
                class="action action--outline"
                aria-label="Reset to initial value"
                @click=${this._handleReset}
              >
                <ha-icon .icon=${'mdi:restart'}></ha-icon>
              </button>
              <button
                type="button"
                class="action action--tonal"
                aria-label="Increase by custom step"
                @click=${() => this._applyDelta(effectiveStep)}
              >
                <ha-icon .icon=${'mdi:plus-circle-outline'}></ha-icon>
              </button>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  _handleIncrement() {
    this._callService('increment');
  }

  _handleDecrement() {
    this._callService('decrement');
  }

  _handleReset() {
    this._callService('reset');
  }

  _handleStepInput(event) {
    const input = Number(event.target.value);
    if (Number.isFinite(input) && input > 0) {
      this._step = input;
    } else if (event.target.value === '') {
      this._step = NaN;
    }
  }

  _applyDelta(delta) {
    const entityId = this._config?.entity;
    if (!entityId) {
      return;
    }
    const stateObj = this.hass.states[entityId];
    if (!stateObj) {
      return;
    }

    const current = Number(stateObj.state);
    if (Number.isNaN(current)) {
      return;
    }

    let target = current + delta;
    const minAttr = stateObj.attributes?.minimum;
    const maxAttr = stateObj.attributes?.maximum;

    if (minAttr !== undefined) {
      target = Math.max(minAttr, target);
    }
    if (maxAttr !== undefined) {
      target = Math.min(maxAttr, target);
    }

    target = Math.round(target);

    if (target === current) {
      return;
    }

    this._callService('set_value', { value: target });
  }

  _callService(service, data = {}) {
    if (!this.hass || !this._config?.entity) {
      return;
    }
    this.hass.callService('counter', service, {
      entity_id: this._config.entity,
      ...data,
    });
  }

  getCardSize() {
    return 3;
  }

  static async getConfigElement() {
    return document.createElement('counter-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'counter.example',
    };
  }

  static get styles() {
    return css`
      :host {
        --ha-card-header-font-size: 1rem;
        --ha-card-header-font-weight: 500;
        --ha-card-header-padding: 10px 14px 0;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: var(--counter-card-content-padding, 0);
      }

      .top-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 10px;
        background: var(
          --counter-card-icon-background,
          rgba(var(--rgb-primary-color, 3, 169, 244), 0.12)
        );
        color: var(
          --counter-card-icon-color,
          var(--counter-card-accent-color, var(--primary-color))
        );
      }

      .icon-wrapper ha-icon {
        --mdc-icon-size: 18px;
      }

      .value-block {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
      }

      .inline-title {
        font-size: 0.62rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      .value-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }

      .counter-value {
        font-size: 1.7rem;
        font-weight: 600;
        letter-spacing: -0.012em;
        color: var(--primary-text-color);
      }

      .meta {
        font-size: 0.72rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .primary-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }

      .bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .step-input {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 8px;
        border-radius: 999px;
        background: var(
          --counter-card-input-background,
          rgba(var(--rgb-primary-color, 3, 169, 244), 0.12)
        );
        color: var(--secondary-text-color);
      }

      .step-label {
        font-size: 0.65rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .step-input input {
        width: 44px;
        border: none;
        background: transparent;
        font-size: 0.85rem;
        text-align: center;
        color: var(--primary-text-color);
        outline: none;
      }

      .step-input input:focus {
        color: var(--counter-card-accent-color, var(--primary-color));
      }

      .secondary-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .warning {
        color: var(--error-color);
        background-color: rgba(var(--rgb-error-color, 244, 67, 54), 0.2);
        padding: 12px;
        border-radius: 6px;
        text-align: center;
      }

      .action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--counter-card-action-shape, 16px);
        background: transparent;
        color: var(--counter-card-accent-color, var(--primary-color));
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease,
          box-shadow 120ms ease, transform 120ms ease;
      }

      .action ha-icon {
        --mdc-icon-size: 18px;
      }

      .action:focus-visible {
        outline: 2px solid
          var(
            --counter-card-action-focus,
            var(--counter-card-accent-color, var(--primary-color))
          );
        outline-offset: 2px;
      }

      .action:hover {
        transform: translateY(-1px);
      }

      .action:active {
        transform: translateY(0);
        filter: brightness(0.98);
      }

      .action--primary {
        background: var(
          --counter-card-action-primary-bg,
          var(--counter-card-accent-color, var(--primary-color))
        );
        color: var(--counter-card-action-on-primary, #fff);
        box-shadow: var(
          --counter-card-action-primary-shadow,
          0 6px 16px rgba(0, 0, 0, 0.15)
        );
      }

      .action--primary:hover {
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
      }

      .action--tonal {
        background: var(
          --counter-card-action-tonal-bg,
          rgba(var(--rgb-primary-color, 3, 169, 244), 0.16)
        );
        color: var(
          --counter-card-action-tonal-fg,
          var(--counter-card-accent-color, var(--primary-color))
        );
      }

      .action--tonal:hover {
        background: var(
          --counter-card-action-tonal-bg-hover,
          rgba(var(--rgb-primary-color, 3, 169, 244), 0.2)
        );
      }

      .action--outline {
        background: transparent;
        border: 1px solid
          var(
            --counter-card-action-outline-border,
            rgba(var(--rgb-primary-color, 3, 169, 244), 0.35)
          );
        color: var(--counter-card-subtle-color, var(--secondary-text-color));
      }

      .action--outline:hover {
        border-color: var(
          --counter-card-action-outline-border-hover,
          rgba(var(--rgb-primary-color, 3, 169, 244), 0.6)
        );
        color: var(
          --counter-card-action-outline-fg-hover,
          var(--counter-card-accent-color, var(--primary-color))
        );
      }
    `;
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, CounterCard);
}

class CounterCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
    };
  }

  setConfig(config) {
    this._config = { ...config };
  }

  get _entity() {
    return this._config?.entity || '';
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    return html`
      <div class="editor">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._entity}
          .label=${this.hass.localize(
            'ui.panel.lovelace.editor.card.generic.entity'
          )}
          .configValue=${'entity'}
          domain-filter="counter"
          @value-changed=${this._valueChanged}
        ></ha-entity-picker>
        <ha-textfield
          .value=${this._config?.title || ''}
          .label=${this.hass.localize(
            'ui.panel.lovelace.editor.card.generic.title'
          )}
          .configValue=${'title'}
          @input=${this._valueChanged}
        ></ha-textfield>
        <ha-icon-picker
          .value=${this._config?.icon || ''}
          .label=${this.hass.localize(
            'ui.panel.lovelace.editor.card.generic.icon'
          )}
          .configValue=${'icon'}
          @value-changed=${this._valueChanged}
        ></ha-icon-picker>
        <ha-textfield
          .value=${this._config?.icon_color || ''}
          label="Icon color (CSS value)"
          .configValue=${'icon_color'}
          @input=${this._valueChanged}
        ></ha-textfield>
        <ha-textfield
          .value=${this._config?.accent_color || ''}
          label="Accent color (CSS value)"
          .configValue=${'accent_color'}
          @input=${this._valueChanged}
        ></ha-textfield>
        <ha-textfield
          .value=${this._config?.step ?? ''}
          label="Custom step"
          type="number"
          min="1"
          step="1"
          .configValue=${'step'}
          @input=${this._valueChanged}
        ></ha-textfield>
      </div>
    `;
  }

  _valueChanged(event) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = event.target;
    const configValue = target.configValue;
    if (!configValue) {
      return;
    }

    let value;
    if (event.detail && event.detail.value !== undefined) {
      value = event.detail.value;
    } else if (target.value !== undefined) {
      value = target.value;
    }

    if (value === this._config[configValue]) {
      return;
    }

    const newConfig = { ...this._config };

    if (value === '' || value === undefined || value === null) {
      delete newConfig[configValue];
    } else if (configValue === 'step') {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        newConfig.step = numeric;
      } else {
        delete newConfig.step;
      }
    } else {
      newConfig[configValue] = value;
    }

    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  static get styles() {
    return css`
      .editor {
        display: grid;
        gap: 12px;
      }
    `;
  }
}

if (!customElements.get('counter-card-editor')) {
  customElements.define('counter-card-editor', CounterCardEditor);
}
