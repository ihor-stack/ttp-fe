import { createSvgIconLoaderComponent } from "../svg-loader/svg-loader.mjs";

export function createInputSelectComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-input-select',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          isInvalid: false,
        };
      },
      created() {},

      mounted() {},

      props: {
        value: {
          type: String,
          default: '',
        },
        label: {
          type: String,
          default: '',
        },
        name: {
          type: String,
          default: '',
          require: true,
        },
        type: {
          type: String,
          default: 'text',
        },
        inputId: {
          type: String,
          default: '',
        },
        list: {
          type: String,
          default: '',
        },
        isError: {
          type: Boolean,
          default: false,
        },
        required: {
          type: Boolean,
          default: false,
        },
        disabled: {
          type: Boolean,
          default: false,
        },
        readonly: {
          type: Boolean,
          default: false,
        },
        src: {
          type: String,
          default: '',
        },
        autocompleteSelect: {
          type: Boolean,
          default: false,
        }
      },

      computed: {
        getList() {
          const parsed = this.props.list.split(',');
          return parsed;
        },
      },

      onFocusInput(event) {
        event.preventDefault();
        const target = event.currentTarget;

        const parent = target.closest('.input-container');
        const nearestParent = target.closest('.input');

        const timeType = nearestParent.dataset.type;

        parent.classList.add('focused');

        if (timeType) {
          const selectWrapper = parent.querySelector(`[data-js="${timeType}"]`);
          selectWrapper.classList.add('show');
        }
        const icon = parent.querySelector('.icon');
        if (icon) {
          icon.classList.add('rotate');
        }
      },

      onBlurInput(event) {
        event.preventDefault();
        const target = event.currentTarget;

        const parent = target.closest('.input-container');

        const nearestParent = target.closest('.input');

        const timeType = nearestParent.dataset.type;

        const selectWrapper = parent.querySelector(`[data-js="${timeType}"]`);
        if (selectWrapper) {
          selectWrapper.classList.remove('show');
        }

        const icon = parent.querySelector('.icon')
        if (icon) {
          icon.classList.remove('rotate');
        }

        parent.classList.remove('focused');
        this.setState(state => {
          return { ...state, isInvalid: false };
        });
      },

      onSelect(event) {
        event.preventDefault();
        const target = event.target;
        const currentTarget = event.currentTarget;

        const parent = currentTarget.parentNode;
        const value = target.dataset.value;

        parent.classList.remove('show');
        eventBus.publish('input-select', { value, name: this.props.name });

        //Unfocus input after selection
        const input = this.querySelector(`#${this.props.inputId}`);
        input.blur();
        const icon = parent.parentNode.querySelector('.icon');
        if (icon) {
          icon.classList.remove('rotate');
        }
      },

      invalid() {
        // ev.preventDefault();
        this.setState(state => {
          return { ...state, isInvalid: true };
        });
      },

      onChange(ev) {
        if (ev.target.validity.valid) {
          this.setState(state => {
            return { ...state, isInvalid: false };
          });
        }
      },

      onKeyDown(ev) {
        if (!this.props.autocompleteSelect) {
          // Prevent user from typing in, this component only meant to allow user
          // to select from the drop down
          ev.preventDefault();
          return false;
        }
      },

      onInput(event) {
        if (this.props.autocompleteSelect) {
          const target = event.currentTarget;

          const value = target.value;

          eventBus.publish(
            'input-select-autocomplete', {
              value,
              name: this.props.name,
              method: 'onChange',
              event: event,
            }
          );
        }
      },

      render() {
        return html`
          <div
            class="input-container ${this.props.isError || this.state.isInvalid
              ? 'input-container--error'
              : ''}"
          >
            <div class="input" data-type=${this.props.name}>
              <input
                type="text"
                class="input__input"
                placeholder=" "
                id="${this.props.inputId}"
                autocomplete="off"
                .value=${this.props.value}
                @blur=${this.onBlurInput}
                @focus=${this.onFocusInput}
                name=${this.props.name}
                .required=${this.props.required}
                .disabled=${this.props.disabled}
                .readonly=${this.props.readonly}
                @invalid=${this.invalid}
                @change=${this.onChange}
                @keydown=${this.onKeyDown}
                @input=${this.onInput}
              />

              <label class="input__label" for="${this.props.id}"
                ><span>${this.props.label}</span></label
              >
              ${this.props.src.length ?
                html`
                  <div class="icon">
                    <ttp-svg-icon-loader
                      src=${this.props.src}
                    ></ttp-svg-icon-loader>
                  </div>` : null}
            </div>
            <div class="select-wrapper " data-js=${this.props.name}>
              <ul class="select" @mousedown=${this.onSelect}>
                ${this.getList.map(item => {
                  return html`<li data-value=${item}>${item}</li>`;
                })}
              </ul>
            </div>
          </div>
        `;
      },
    })
  );
}
