/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createToolbarComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-toolbar',
    withEventBus(eventBus, {
      renderer,
      props: {
        isToolbarVisible: {
          type: Boolean,
          default: false,
        },
        assetId: {
          type: String,
          default: '',
        },

        // triggers rerendering to recalculate the width of toolbar
        childWidth: {
          type: Number,
          default: 0,
        },
      },

      updated() {
        if (this.props.assetId.length && this.props.isToolbarVisible) {
          this.getToolbarPositions();
        }
      },

      getToolbarPositions() {
        const assetId = this.props.assetId;

        const toolBar = this.querySelector('[data-js="toolbar"]');

        const toolBarBoundingBox = toolBar.getBoundingClientRect();

        const chairToolBarBoundingBoxWidth = toolBarBoundingBox.width;
        const toolBarBoundingBoxHeight = toolBarBoundingBox.height;

        const assetIcon = this.parentNode.parentNode.querySelector(
          `#${assetId}`
        );

        const assetBoundingBox = assetIcon.getBoundingClientRect();

        const assetX = assetBoundingBox.x;
        const assetY = assetBoundingBox.y;
        const windowHeight = window.innerHeight;
        const workingArea = this.parentNode.parentNode;
        const workingAreaHeight = workingArea.getBoundingClientRect().height;
        const substractHeaderHeight = windowHeight - workingAreaHeight;
        const workingAreaBoundingClient = workingArea.getBoundingClientRect();
        const workingAreaBoundingClientWidth = workingAreaBoundingClient.width;
        const delta = 60;
        const yPos =
          assetY - substractHeaderHeight - toolBarBoundingBoxHeight - delta;
        const xPos =
          assetX + chairToolBarBoundingBoxWidth >=
          workingAreaBoundingClientWidth
            ? workingAreaBoundingClientWidth -
              chairToolBarBoundingBoxWidth -
              delta
            : assetX;

        toolBar.style.transform = `translate(${xPos}px, ${yPos}px)`;
      },

      render() {
        return html`
          <div
            class="toolbar-wrapper ${this.props.isToolbarVisible
              ? 'visible'
              : ''}"
            data-js="toolbar"
          >
            ${this.slots.body}
          </div>
        `;
      },
    })
  );
}
