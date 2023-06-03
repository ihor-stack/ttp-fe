/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createEventDeleteModalComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-event-delete-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        isModalVisible: {
          type: Boolean,
          default: false,
        },
        eventId: {
          type: String,
          default: '',
        },
        eventTitle: {
          type: String,
          default: '',
        },
      },

      state() {
        return {
          animationIsDone: false,
        };
      },

      async created() {},

      mounted() {},

      updated() {
        if (this.props.isModalVisible) {
          setTimeout(() => {
            this.setState(state => {
              return { ...state, animationIsDone: true };
            });
          }, 300);
        }
      },

      removed() {},

      closeModal(event) {
        event.preventDefault();
        eventBus.publish('ttp-event-delete-modal', {
          method: 'hideEventPlanModal',
          value: false,
        });
        this.setState(state => {
          return { ...state, isEditable: false };
        });
      },

      onSubmit(event) {
        event.preventDefault();
        //save form
        // this.closeModal(event);

        eventBus.publish('ttp-event-delete-modal', {
          method: 'deleteEvent',
          data: {
            id: this.props.eventId,
          },
        });
      },

      render() {
        return html`
          <div
            class="modal-delete-wrapper ${this.props.isModalVisible
              ? 'visible'
              : ''}"
          >
            <div class="modal">
              <div class="eventplan-modal-body">
                <div class="eventplan-modal-body__body">
                  <div class="plan-event-container">
                    <div class="plan-title-delete">
                      Are you sure you want to delete
                      <span class="plan-title">${this.props.eventTitle}</span> ?
                    </div>
                    <div class="plan-event-form-container">
                      <form class="plan-event-form" @submit=${this.onSubmit}>
                        <div class="form-button-group">
                          <button class="btn-cancel" @click=${this.closeModal}>
                            Cancel
                          </button>
                          <button type="submit" class="btn-edit">Delete</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
