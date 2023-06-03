export function createButtonSelectComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-button-select',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          isOpen: false,
        };
      },

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
        list: {
          type: String,
          default: '',
        },
        selectStyle: {
          type: String,
          default: '', //eg. toolbar
        },
      },

      computed: {
        getList() {
          const parsed = this.getListValues();
          return parsed;
        },
      },

      getListValues() {
        const list = JSON.parse(this.props.list);
        return list;
      },

      onSelect(event) {
        event.preventDefault();
        const target = event.target;
        const value = target.dataset.value;

        this.setState(state => {
          return { ...state, isOpen: false };
        });

        eventBus.publish('ttp-button-select', { value, name: this.props.name });
      },

      onShowTimeNotation(event) {
        event.preventDefault();
        this.setState(state => {
          return { ...state, isOpen: !this.state.isOpen };
        });
      },

      onHideTimeNotation(event) {
        event.preventDefault();
        this.setState(state => {
          return { ...state, isOpen: false };
        });
      },

      render() {
        return html`
          <div
            class="select-button ${this.props.selectStyle === 'toolbar' &&
            'select-button--toolbar'} ${this.state.isOpen && 'active'}"
          >
            <button
              @click=${this.onShowTimeNotation}
              @blur=${this.onHideTimeNotation}
              data-type=${this.props.name}
            >
              <span>${this.props.value}</span>
              <span class="arrow-icon ${this.state.isOpen ? 'rotate' : ''}"
                ><ttp-svg-icon-loader
                  src="/assets/icons/arrow-down.svg"
                ></ttp-svg-icon-loader>
              </span>
            </button>

            <div
              class="select-wrapper ${this.state.isOpen ? 'show' : ''}"
              data-js=${this.props.name}
            >
              <ul class="select" @mousedown=${this.onSelect}>
                ${this.getList.map(item => {
                  return html`<li data-value=${item.value}>${item.title}</li>`;
                })}
              </ul>
            </div>
          </div>
        `;
      },
    })
  );
}
