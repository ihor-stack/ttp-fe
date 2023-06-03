const LABEL_POSITION = {
  INSIDE: 'inside',
  TOP: 'top',
};
const DEFAULT_PADDING = 16;

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createInputComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-input',
    withEventBus(eventBus, {
      root: 'standard',
      renderer,
      state() {
        return {
          isInvalid: false,
        };
      },
      props: {
        value: {
          type: String,
          default: '',
        },
        label: {
          type: String,
          default: '',
        },
        placeholder: {
          type: String,
          default: ' ',
        },
        name: {
          type: String,
          default: '',
          require: true,
        },
        title: {
          type: String,
          default: '',
        },
        type: {
          type: String,
          default: 'text',
        },
        inputId: {
          type: String,
          default: '',
        },
        disabled: {
          type: Boolean,
          default: false,
        },
        readonly: {
          type: Boolean,
          default: false,
        },
        pattern: {
          type: String,
          default: '.+',
        },
        labelPosition: {
          type: String,
          default: LABEL_POSITION.INSIDE,
        },
        postFix: {
          type: String,
          default: '',
        },
        postFixIcon: {
          type: String,
          default: '',
        },
        maxlength: {
          type: Number,
          default: 200,
        },
        isError: {
          type: Boolean,
          default: false,
        },
        errorMessage: {
          type: String,
          default: '',
        },
        required: {
          type: Boolean,
          default: false,
        },
        autofocus: {
          type: Boolean,
          default: false,
        },
        postFixFontSize: {
          type: String,
          default: '',
        },
        onlyNumbers: {
          type: Boolean,
          default: false,
        },
        noUserTypeIn: {
          type: Boolean,
          default: false,
        },
        inputStyle: {
          type: String,
          default: '', //eg. toolbar
        },
      },
      created() {},

      mounted() {
        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            const postFixText = this.querySelector('[data-js="postfix-text"]');

            if (postFixText) {
              postFixText.style.fontSize = this.props.postFixFontSize;
            }

            const postFixWrapper = this.querySelector('[data-js=postfix]');

            if (postFixWrapper) {
              const postFixWrapperWidth =
                postFixWrapper.getBoundingClientRect().width;

              const input = this.querySelector('[data-js=input]');
              let totalRightPadding = DEFAULT_PADDING + postFixWrapperWidth;

              if (this.props.inputStyle === 'setup') {
                totalRightPadding = totalRightPadding + 6;
              }

              input.style.paddingRight = totalRightPadding + 'px';
            }
          }
        );
      },

      updated() {
        // console.log('this.props.value', this.props);
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
      },

      onInput(event) {
        const target = event.target;

        const value = target.value;

        eventBus.publish('ttp-input', {
          value,
          name: this.props.name,
          method: 'onInput',
        });
      },

      onFocusInput(event) {
        event.preventDefault();
        const target = event.currentTarget;

        const parent = target.closest('.input-container');

        parent.classList.add('focused');
        target.select();

        eventBus.publish('ttp-input', {
          value: this.props.value,
          name: this.props.name,
          method: 'onFocusInput',
        });
      },

      onBlurInput(event) {
        event.preventDefault();
        const target = event.currentTarget;

        const parent = target.closest('.input-container');

        parent.classList.remove('focused');

        this.setState(state => {
          return { ...state, isInvalid: false };
        });

        eventBus.publish('ttp-input', {
          name: this.props.name,
          method: 'onBlurInput',
        });
      },

      invalid() {
        // ev.preventDefault();
        this.setState(state => {
          return { ...state, isInvalid: true };
        });
      },

      onChange(event) {
        const target = event.currentTarget;

        const value = target.value;
        eventBus.publish('ttp-input', {
          value,
          name: this.props.name,
          method: 'onChange',
          event: event,
        });
        if (event.target.validity.valid) {
          this.setState(state => {
            return { ...state, isInvalid: false };
          });
        }
      },

      onKeyUp(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
          const target = event.currentTarget;

          const value = target.value;
          eventBus.publish('ttp-input', {
            value,
            name: this.props.name,
            method: 'onKeyUp',
            eventKey: 'enter',
            event: event,
          });
          target.blur();
        }
      },

      onKeyDown(ev) {
        if (this.props.noUserTypeIn) {
          console.log('noUserTypeIn', this.props);
          // Prevent user from typing in, this component only meant to allow user
          // to select from the drop down
          ev.preventDefault();
          return false;
        }
      },

      render() {
        const inputStyle = this.props.inputStyle.length
          ? `input-container--${this.props.inputStyle}`
          : '';

        return html`
          <div
            class="input-container  ${this.props.postFix.length
              ? 'input-container--haspostfix'
              : ''}  ${inputStyle} ${this.props.isError || this.state.isInvalid
              ? 'input-container--error'
              : ''}"
          >
            <div class="input">
              <!-- Autofocus works well only on page load, so better to handle it yourslef -->
              <input
                @input=${this.onInput}
                @invalid=${this.invalid}
                @blur=${this.onBlurInput}
                @focus=${this.onFocusInput}
                @change=${this.onChange}
                @keyup=${this.onKeyUp}
                @keydown=${this.onKeyDown}
                .value=${this.props.value}
                .autofocus=${this.props.autofocus}
                .required=${this.props.required}
                .disabled=${this.props.disabled}
                .readonly=${this.props.readonly}
                type=${this.props.type}
                class="input__input"
                placeholder=${this.props.placeholder}
                id="${this.props.inputId}"
                autocomplete="off"
                name=${this.props.name}
                maxlength=${this.props.maxlength}
                data-js="input"
                pattern=${this.props.pattern}
                title=${this.props.title}
              />
              <label class="input__label" for=${this.props.inputId}
                ><span>${this.props.label}</span></label
              >
            </div>
            ${this.props.postFix.length || this.props.postFixIcon.length
              ? html`<div class="postfix" data-js="postfix">
                  ${this.props.postFix.length
                    ? html`<div class="postfix__text" data-js="postfix-text">
                        ${this.props.postFix}
                      </div>`
                    : ''}
                  ${this.props.postFixIcon.length
                    ? html`<div class="postfix__icon">
                        <ttp-svg-icon-loader
                          src="${this.props.postFixIcon}"
                        ></ttp-svg-icon-loader>
                      </div>`
                    : ''}
                </div>`
              : ''}
            ${this.props.errorMessage && this.props.errorMessage.length
              ? html`<div class="input-error-message">
                  ${this.props.errorMessage}
                </div>`
              : ''}
          </div>
        `;
      },
    })
  );
}
