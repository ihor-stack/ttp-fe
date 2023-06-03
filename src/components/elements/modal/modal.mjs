const MODAL_DIRECTION = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
};

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createModalComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        position: {
          type: String,
          default: MODAL_DIRECTION.BOTTOM,
        },
        isModalVisible: {
          type: Boolean,
          default: false,
        },
      },

      render() {
        return html`
          <div
            class="modal-wrapper ${this.props.isModalVisible ? 'visible' : ''}"
          >
            <div class="modal">${this.slots.body}</div>
          </div>
        `;
      },
    })
  );
}
