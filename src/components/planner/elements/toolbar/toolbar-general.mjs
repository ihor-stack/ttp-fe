/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createToolbarGeneralComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-toolbar-general',
    withEventBus(eventBus, {
      renderer,

      props: {
        // Showing toolbar for multiple assets
        isBulk: {
          type: Boolean,
          default: false,
        },
        // List of the assets id's
        bulkAssetsIds: {
          type: String,
          default: '',
        },

        assetId: {
          type: String,
          default: '',
        },
      },

      onShowDuplicateBulkInput() {
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onDuplicateFurnitureBulk',
          data: {
            ids: this.props.bulkAssetsIds,
          },
        });

        // const target = event.currentTarget;

        // const tooltip = target.querySelector('ttp-tooltip');

        // tooltip.distance = 10;
        // tooltip.visible = true;
      },

      onRemoveAsset() {
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onRemoveAsset',
          isBulk: this.props.isBulk,
          assetId: this.props.assetId,
          bulkAssetsIds: this.props.bulkAssetsIds,
        });
      },

      render() {
        return html`
          <ul class="toolbar-content">
            <li class="toolbar-item toolbar-item--duplicate">
              <div
                class="duplicate-icon"
                @click=${this.onShowDuplicateBulkInput}
              >
                <div class="toolbar-item__icon">
                  <ttp-svg-icon-loader
                    src="/assets/icons/duplicate.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <span class="toolbar-item__label">Duplicate</span>
                <!-- <ttp-tooltip
                          title="There is not enough space to duplicate these objects"
                          position="top"
                        ></ttp-tooltip> -->
              </div>
            </li>
            <li
              class="toolbar-item toolbar-item--remove"
              @click=${this.onRemoveAsset}
            >
              <div class="toolbar-item__icon">
                <ttp-svg-icon-loader
                  src="/assets/icons/trash.svg"
                ></ttp-svg-icon-loader>
              </div>
              <span class="toolbar-item__label">Remove</span>
            </li>
          </ul>
        `;
      },
    })
  );
}
