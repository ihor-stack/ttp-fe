import { createPlanEventComponent } from './plan-event/plan-event.mjs';
import { createFloorPlanComponent } from './create-floor-plan/create-floor-plan.mjs';

const STEPS = {
  VIEW_PLAN_EVENT: 1,
  VIEW_CREATE_FLOOR_PLAN: 2,
};

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.loadStyles loadstyle func
 * @param  {object} webcomponent.prePlannerApi pre-planner api
 */
export function createPrePlannerComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  prePlannerApi,
}) {
  createComponent(
    'ttp-preplanner',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      state() {
        return {
          step: STEPS.VIEW_PLAN_EVENT,
          stylesLoaded: false,
        };
      },

      async created() {
        loadStyles({
          component: this,
          src: [
            '/assets/css/components/preplanner.css',
            'https://cdn.jsdelivr.net/npm/js-datepicker@5.18.0/dist/datepicker.min.css',
          ],
        });
        const search = window.location.search;

        const params = new URLSearchParams(search);
        const eventId = params.get('id');

        if (eventId) {
          this.setState(state => {
            return { ...state, step: STEPS.VIEW_CREATE_FLOOR_PLAN };
          });
        }

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            this.setState(state => {
              return { ...state, stylesLoaded: true };
            });
          }
        );
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          prePlannerApi,
        };

        createPlanEventComponent({ ...propsForComponents });
        createFloorPlanComponent({ ...propsForComponents });
      },

      mounted() {
        this.ttpShowComponentUnsubscribe = eventBus.subscribe(
          'ttp-show-component',
          data => {
            this.setState(state => {
              return { ...state, step: data.component };
            });
          }
        );
      },

      updated() {
        if (this.state.stylesLoaded) {
          eventBus.publish('ttp-hide-loader', {
            component: 'ttp-preplanner',
            resp: 'OK',
          });
        }
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
        this.ttpShowComponentUnsubscribe();
      },

      render() {
        return html`
          <div class="wrapper">
            <div class="preplanner-container" id="preplanner-container">
              ${this.state.step === STEPS.VIEW_PLAN_EVENT
                ? html`<ttp-plan-event></ttp-plan-event>`
                : html`<ttp-create-floor-plan></ttp-create-floor-plan>`}
            </div>
          </div>
        `;
      },
    })
  );
}
