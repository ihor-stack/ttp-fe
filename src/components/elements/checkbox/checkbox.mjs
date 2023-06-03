export function createCheckboxComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-checkbox',
    withEventBus(eventBus, {
      renderer,
      props: {
        label: {
          type: String,
          default: '',
        },
        name: {
          type: String,
          default: '',
        },
        checkboxId: {
          type: String,
          default: '',
        },
        isError: {
          type: Boolean,
          default: false,
        },
        checked: {
          type: Boolean,
          default: false,
        },
      },
      created() {},

      mounted() {},

      onChange() {
        eventBus.publish('ttp-ev-checkbox', {
          name: this.props.name,
          checked: !this.props.checked,
        });
      },

      render() {
        return html`
          <div class="checkbox-wrapper">
            <label class="checkbox"
              ><span class="checkbox__title">${this.props.label}</span>
              <input
                type="checkbox"
                @change=${this.onChange}
                name=${this.props.name}
                id=${this.props.checkboxId}
                ?checked=${this.props.checked}
              />
              <span class="checkbox__checkmark"></span>
            </label>
          </div>
        `;
      },
    })
  );
}
