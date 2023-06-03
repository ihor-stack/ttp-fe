import { ENUM_SETUP_TYPE } from '../../enums.mjs';

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createTheaterSetupComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-theater-setup-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        isTheaterSetupVisible: {
          type: Boolean,
          default: false,
        },
      },

      state() {
        return {
          isTheaterSetupValid: true,
        };
      },

      goBackSetup() {
        eventBus.publish('ttp-theater-setup-modal', {
          method: 'goBackSetup',
        });
      },

      placeSetup(event) {
        event.preventDefault();
        const target = event.target;

        const chairsTotal = +target.querySelector('#chairs-total').value;
        const chairSpacing = +target.querySelector('#chair-spacing').value;
        const chairsPerRow = +target.querySelector('#chairs-per-row').value;
        const rowsTotal = +target.querySelector('#rows-total').value;
        const rowSpacing = +target.querySelector('#row-spacing').value;
        const aisles = +target.querySelector('#aisles').value;
        let aisleWidth = +target.querySelector('#aisle-width').value;

        // Default to 2 aisleWidth if user didnt set it
        if (aisles !== 0) {
          aisleWidth = aisleWidth === 0 ? 2 : aisleWidth;
        }

        //Data object should contain properties of type Number
        eventBus.publish('ttp-sidenav', {
          method: 'ttp-add-setup',
          type: ENUM_SETUP_TYPE.THEATER,
          data: {
            chairsTotal: chairsTotal,
            chairSpacing: chairSpacing, //in
            chairsPerRow: chairsPerRow,
            rowsTotal: rowsTotal,
            rowSpacing: rowSpacing, //ft
            aisles: aisles,
            aisleWidth: aisleWidth, //ft
          },
        });
      },

      render() {
        return html`
          <div
            class="assets-wrapper ${this.props.isTheaterSetupVisible
              ? 'show'
              : ''}"
          >
            <div class="assets-setup">
              <div class="assets-setup__header">
                <div class="setup-arrow-back" @click=${this.goBackSetup}>
                  <ttp-svg-icon-loader
                    src="/assets/icons/arrow-left.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="setup-icon">
                  <ttp-svg-icon-loader
                    src="/assets/icons/setup-theater.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="setup-title">
                  <div>theater</div>
                  <div>set up</div>
                </div>
              </div>
              <div class="body-wrapper">
                <div class="assets-setup__body">
                  <form class="form-setup" @submit=${this.placeSetup}>
                    <div class="input-row">
                      <div class="input-label">Chairs Total</div>
                      <div class="input-block">
                        <ttp-input
                          name="chairsTotal"
                          value="32"
                          input-id="chairs-total"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Chair Spacing</div>
                      <div class="input-block">
                        <ttp-input
                          name="chairSpacing"
                          value="2"
                          input-id="chair-spacing"
                          maxlength="4"
                          post-fix="IN"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Chairs Per Row</div>
                      <div class="input-block">
                        <ttp-input
                          name="chairsPerRow"
                          value="8"
                          input-id="chairs-per-row"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Rows Total</div>
                      <div class="input-block">
                        <ttp-input
                          name="rowsTotal"
                          value="4"
                          input-id="rows-total"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Row Spacing</div>
                      <div class="input-block">
                        <ttp-input
                          name="rowSpacing"
                          value="2"
                          input-id="row-spacing"
                          maxlength="4"
                          post-fix="FT"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Aisles</div>
                      <div class="input-block">
                        <ttp-input
                          name="aisles"
                          value="0"
                          input-id="aisles"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Aisle Width</div>
                      <div class="input-block">
                        <ttp-input
                          name="aisleWidth"
                          value="2"
                          input-id="aisle-width"
                          maxlength="4"
                          post-fix="FT"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <button
                      class="btn btn-setup ${!this.state.isTheaterSetupValid
                        ? 'disabled'
                        : ''}"
                      type="submit"
                      .disabled=${!this.state.isTheaterSetupValid}
                    >
                      Place Set Up
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
