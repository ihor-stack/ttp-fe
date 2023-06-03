export function createSlotsComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-slots',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      created() {},
      mounted() {
        eventBus.publish('ttp-hide-loader', {
          component: 'ttp-preplanner',
          resp: 'OK',
        });
      },

      render() {
        return html`
          <style>
            :host .wrapper {
              padding: 16px;
              text-align: left;
            }
            :host .slots-wrapper {
              display: flex;
              align-items: center;
              column-gap: 16px;
            }
            :host [slot='who'] {
              font-size: 14px;
              font-style: italic;
              font-weight: 300;
            }
          </style>
          <div class="wrapper">
            <div class="slots-wrapper">
              ${this.slots.quote} ${this.slots.who}
            </div>
          </div>
        `;
      },
    })
  );
}
