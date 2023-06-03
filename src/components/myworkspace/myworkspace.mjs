/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.loadStyles loadstyle func
 * @param  {object} webcomponent.api events api
 */
export function createMyWorkspaceComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  api,
}) {
  createComponent(
    'ttp-myworkspace',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',

      async mounted() {
        loadStyles({
          component: this,
          src: ['/assets/css/components/myworkspace.css'],
        });

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          async () => {
            //Hide loader has a delay of 300ms
            eventBus.publish('ttp-hide-loader', {
              component: 'ttp-planner',
              resp: 'OK',
            });
          }
        );
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
      },

      state() {
        return {
          firstName: 'First Name',
          isFirstVisit: true,
        };
      },

      render() {
        return html`
          <div class="myworkspace-wrapper">
            <div class="myworkspace-container">
              <div class="myworkspace-header">
                <div class="myworkspace-header__title">
                  Welcome, ${this.state.firstName}!
                </div>
                <div class="myworkspace-header__buttons">
                  <div class="myworkspace-header__btn">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="8.5" stroke="#333333" />
                      <path
                        d="M10 6.5L12 12L14.5 13.5"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M5 12H6"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M18 12H19"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M7.34277 16.6562L8.04988 15.9491"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16.2422 7.75781L16.9493 7.05071"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16.6562 16.6562L15.9491 15.9491"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M7.75684 7.75781L7.04973 7.05071"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M12 19L12 18"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                      <path
                        d="M12 6L12 5"
                        stroke="#333333"
                        stroke-linecap="round"
                      />
                    </svg>

                    <span>Recently Viewed</span>
                  </div>
                  <div class="myworkspace-header__btn">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 20L11.8719 14.403L6 20V4H18V20Z"
                        stroke="#333333"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span>Favorites</span>
                  </div>
                </div>
              </div>
              <div class="myworkspace-body">
                <div class="myworkspace-body__label">
                  ${this.state.isFirstVisit
                    ? 'Congratulations on setting up your account.'
                    : 'No Recent Activity Yet'}
                </div>
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
