import { createModalComponent } from '../../elements/elements.mjs';
/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createShareModalComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-share-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        isModalVisible: {
          type: Boolean,
          default: true,
        },
        shareUrl: {
          type: String,
          default: '',
        },
      },
      state() {
        return {
          recipientCount: 1,
          animationIsDone: false,
        };
      },

      updated() {
        if (this.props.isModalVisible) {
          setTimeout(() => {
            this.setState(state => {
              return { ...state, animationIsDone: true };
            });
          }, 300);
        }
      },
      async created() {
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createModalComponent({ ...propsForComponents });
      },

      hideShareModal() {
        eventBus.publish('ttp-share-modal', {
          method: 'hideShareModal',
          value: false,
        });
      },

      addRecipient() {
        const parent = this.querySelector('[data-js="participants"]');

        const getIconBlock = this.querySelector('[data-js="share-icon"]');
        const clonedIconBlock = getIconBlock.cloneNode(true);

        parent.append(clonedIconBlock);
        const getInputBlock = this.querySelector('[data-js="share-element"]');

        const clonedInputBlock = getInputBlock.cloneNode(true);

        this.setState(state => {
          return { ...state, recipientCount: ++this.state.recipientCount };
        });
        parent.append(clonedInputBlock);
      },

      /**
       * @description Display tooltip
       * @param {object} event event that has target element
       * @param {number} distance how far tooltip shown from the triggered element
       */
      onShowTooltip(event, distance) {
        const target = event.currentTarget;

        const tooltip = target.querySelector('ttp-tooltip');

        tooltip.title = 'Click to copy';
        tooltip.distance = distance;
        tooltip.visible = true;
      },

      /**
       * @description  Hide tooltip
       * @param {object} event event that has target element
       */
      onHideTooltip(event) {
        const target = event.currentTarget;
        const tooltip = target.querySelector('ttp-tooltip');

        tooltip.distance = 0;
        tooltip.visible = false;
      },

      copyToClipboard(event) {
        const currentTarget = event.currentTarget;
        const url = currentTarget.dataset.url;

        /* Copy the text inside the text field */
        navigator.clipboard.writeText(url);

        const tooltip = currentTarget.querySelector('ttp-tooltip');
        tooltip.title = 'Copied!';
      },

      render() {
        return html`
          <ttp-modal is-modal-visible=${this.props.isModalVisible}>
            <div slot="body">
              <div class="share">
                <div class="share__header"><h3>Share</h3></div>
                <div class="share__body">
                  <form class="share-form">
                    <div class="share-form__content">
                      <div
                        class="share-form__content__group"
                        data-js="participants"
                      >
                        <div
                          class="share-form__content__group__icon"
                          data-js="share-icon"
                        >
                          <ttp-svg-icon-loader
                            src="/assets/icons/icon-profile.svg"
                          ></ttp-svg-icon-loader>
                        </div>
                        <div
                          class="share-form__content__group__element"
                          data-js="share-element"
                        >
                          <input
                            type="text"
                            placeholder="Enter an email or phone number"
                            class="share-input"
                            name="email"
                            id="recipient_1"
                          />
                        </div>
                      </div>

                      ${this.state.recipientCount < 5
                        ? html`<div class="share-form__content__group">
                            <div class="share-form__content__group__element">
                              <button
                                class="btn-add-recipient"
                                type="button"
                                @click=${this.addRecipient}
                              >
                                + add another recipient
                              </button>
                            </div>
                          </div>`
                        : ''}

                      <div class="share-form__content__group" data-css="share">
                        <div class="share-form__content__group__icon">
                          <ttp-svg-icon-loader
                            src="/assets/icons/icon-pdf.svg"
                          ></ttp-svg-icon-loader>
                        </div>
                        <div class="share-form__content__group__element">
                          <div class="radio-wrapper">
                            <label class="radio">
                              <input
                                type="radio"
                                name="share-as-pdf"
                                id="share-as-pdf"
                              />
                              <span class="radio__title">Share as pdf</span>
                              <span class="radio__checkmark"></span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div class="share-form__content__group">
                        <div class="share-form__content__group__icon">
                          <ttp-svg-icon-loader
                            src="/assets/icons/icon-sharelink.svg"
                          ></ttp-svg-icon-loader>
                        </div>
                        <div class="share-form__content__group__element">
                          <label>Copy Shareable Link</label>
                        </div>
                        <div
                          class="share-form__content__group__element"
                          @mouseenter=${ev => this.onShowTooltip(ev, 5)}
                          @mouseleave=${this.onHideTooltip}
                          @click=${this.copyToClipboard}
                          data-url=${this.props.shareUrl}
                          title=${this.props.shareUrl}
                        >
                          <div class="share-link-wrapper">
                            <div class="share-link">${this.props.shareUrl}</div>
                          </div>
                          <ttp-tooltip
                            title="Click to copy"
                            position="top"
                            parent-visible=${this.state.animationIsDone}
                          ></ttp-tooltip>
                        </div>
                      </div>
                    </div>

                    <div class="share-group-btn">
                      <button
                        @click=${this.hideShareModal}
                        type="button"
                        class="btn share-btn-cancel"
                      >
                        cancel
                      </button>
                      <button
                        @click=${this.hideShareModal}
                        type="submit"
                        class="btn share-btn-submit"
                        disabled
                      >
                        share
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </ttp-modal>
        `;
      },
    })
  );
}
