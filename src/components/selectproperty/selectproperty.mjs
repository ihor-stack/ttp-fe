export function createSelectPropertyComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  selectpropertyApi
}) {
  createComponent(
    'ttp-select-property',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      state() {
        return {}
      },
      mounted() {
        loadStyles({
          component: this,
          src: ['/assets/css/components/selectproperty.css'],
        })

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            eventBus.publish(('ttp-hide-loader'), {
              component: 'ttp-planer',
              resp: 'OK',
            });

            setTimeout(() => {
              this.setState(state => {
                return {...state, isLoading: false};
              })
            }, 500)
          }
        )
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe()
      },

      onCreateNewProperty(event) {
        event.preventDefault();
        const fromHref = window.location.pathname;
        eventBus.publish('navigation', {
          toHref: '/newpropertysetup',
          fromHref,
        })
      },

      render(){
        return html`
          <div class="wrapper">
            <div class="logo-wrapper">
              <div >
                <ttp-svg-icon-loader
                  src="/assets/img/logo-visiting-media.svg"
                ></ttp-svg-icon-loader>
              </div>
            </div>
            <div class="select-cards-container">
              <div class="select-card select-card-inactive">
                <div class="select-card-box">
                  <ttp-svg-icon-loader
                    src="/assets/icons/import.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="select-card-title">
                  <p>
                    Import Property from <span>TRUETOUR&#8482;<span>
                  </p>
                  <p class="coming-soon">
                    COMING SOON
                  </p>
                </div>
              </div>
              <div
                class="select-card"
                @click=${this.onCreateNewProperty}
              >
                <div class="select-card-box">
                  <ttp-svg-icon-loader
                    src="/assets/icons/big-plus.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="select-card-title">
                  <p>Add a New Property</p>
                </div>
              </div>
              <div class="select-card">
                <div class="select-card-box">
                  <ttp-svg-icon-loader
                    src="/assets/icons/geo-point.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="select-card-title">
                  <p>Join An Existing Property</p>
                </div>
              </div>
            </div>
          </div>
        `
      }
    }),
  )
}
