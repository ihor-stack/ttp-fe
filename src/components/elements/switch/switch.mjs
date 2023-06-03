export function createSwitchComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-switch',
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
        switchId: {
          type: String,
          default: '',
        },
        checked: {
          type: Boolean,
          default: false,
        },
        isError: {
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
          <div class="switch-container">
            <label class="switch-container__label" for=${this.props.switchId}
              >${this.props.label}</label
            >
            <label class="switch">
              <input
                type="checkbox"
                @change=${this.onChange}
                name=${this.props.name}
                id=${this.props.switchId}
                ?checked=${this.props.checked}
              />
              <span class="switch__toggle"></span>
            </label>
          </div>
        `;
      },
    })
  );
}
