const TOOLTIP_DIRECTION = {
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
export function createTooltipComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-tooltip',
    withEventBus(eventBus, {
      renderer,
      computed: {},
      props: {
        title: {
          type: String,
          default: '',
        },
        position: {
          type: String,
          default: TOOLTIP_DIRECTION.RIGHT,
        },
        visible: {
          type: Boolean,
          default: false,
        },
        distance: {
          type: Number,
          default: 0,
        },
        parentVisible: {
          type: Boolean,
          default: false,
        },
      },

      mounted() {
        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            setTimeout(() => {
              this.getTooltipPositions();
            }, 300);
          }
        );
      },

      removed() {
        if (typeof this.ttpStylesLoadedUnsubscribe !== 'undefined') {
          this.ttpStylesLoadedUnsubscribe();
        }
      },

      getTooltipPositions() {
        const parent = this.parentNode;

        const parentBounderies = parent.getBoundingClientRect();

        const tooltip = this.querySelector('.tooltip-wrapper');

        // small hack, that prevents tooltip flickering on page load, and when navigating
        // between the views
        tooltip.classList.remove('hide');

        const tooltipBounderies = tooltip.getBoundingClientRect();

        const tooltipWidth = tooltipBounderies.width;
        const tooltipX = tooltipBounderies.x;
        const parentX = parentBounderies.x;

        switch (this.props.position) {
          case TOOLTIP_DIRECTION.RIGHT: {
            tooltip.classList.add('right');
            break;
          }
          case TOOLTIP_DIRECTION.BOTTOM: {
            const left =
              tooltipX -
              parentX +
              (parentBounderies.width - tooltipWidth) / 2 +
              'px';

            tooltip.style.left = left;

            tooltip.classList.add('bottom');

            break;
          }
          case TOOLTIP_DIRECTION.LEFT: {
            const left = parentX - tooltipX - tooltipWidth + 'px';

            tooltip.style.left = left;
            tooltip.classList.add('left');
            break;
          }
          case TOOLTIP_DIRECTION.TOP: {
            tooltip.style.left =
              tooltipX -
              parentX +
              (parentBounderies.width - tooltipWidth) / 2 +
              'px';

            tooltip.classList.add('top');
            break;
          }
        }
      },

      render() {
        return html`
          <div
            class="tooltip-wrapper hide ${this.props.visible
              ? 'show'
              : ''} ${this.props.position}"
          >
            <div class="tooltip">
              <span>${this.props.title}</span>
              <span class="position-${this.props.position}"></span>
            </div>
          </div>
        `;
      },
    })
  );
}
