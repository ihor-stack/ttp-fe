import { ENUM_SETUP_TYPE } from '../../enums.mjs';

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createBanquetSetupComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-banquet-setup-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        isBanquetSetupVisible: {
          type: Boolean,
          default: false,
        },
      },
      state() {
        return {
          isBanquetSetupValid: true,
          isAligned: true,
        };
      },

      goBackSetup() {
        eventBus.publish('ttp-banquet-setup-modal', {
          method: 'goBackSetup',
        });
      },

      placeSetup(event) {
        event.preventDefault();
        const target = event.target;

        const tablesTotal = +target.querySelector('#tables-total').value;
        const tableSpacing = +target.querySelector('#table-spacing').value;
        let rowsTotal = +target.querySelector('#rows-total').value;
        let chairsPerTable = +target.querySelector('#chairs-per-table').value;

        if (rowsTotal <= 0) {
          rowsTotal = 1;
        }
        if (chairsPerTable > 12) {
          chairsPerTable = 12;
        }
        //Data object should contain properties of type Number
        eventBus.publish('ttp-sidenav', {
          method: 'ttp-add-setup',
          type: ENUM_SETUP_TYPE.BANQUET,
          data: {
            isAligned: this.state.isAligned,
            tablesTotal: tablesTotal,
            tableSpacing: tableSpacing, //ft
            rowsTotal: rowsTotal,
            chairsPerTable: chairsPerTable,
          },
        });
      },

      render() {
        return html`
          <div
            class="assets-wrapper ${this.props.isBanquetSetupVisible
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
                    src="/assets/icons/setup-banquet.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="setup-title">
                  <div>banquet</div>
                  <div>set up</div>
                </div>
              </div>
              <div class="body-wrapper">
                <div class="assets-setup__body">
                  <form class="form-setup" @submit=${this.placeSetup}>
                    <div class="btn-group-type-selection">
                      <button
                        type="button"
                        @click=${event => {
                          //test
                          event.preventDefault();
                          this.setState(state => {
                            return { ...state, isAligned: true };
                          });
                        }}
                        class="btn-banquet-icon ${this.state.isAligned
                          ? 'selected'
                          : ''}"
                      >
                        <ttp-svg-icon-loader
                          src="/assets/icons/banquet-aligned.svg"
                        ></ttp-svg-icon-loader>
                        <span>aligned</span>
                      </button>
                      <button
                        type="button"
                        @click=${event => {
                          event.preventDefault();
                          this.setState(state => {
                            return { ...state, isAligned: false };
                          });
                        }}
                        class="btn-banquet-icon ${!this.state.isAligned
                          ? 'selected'
                          : ''}"
                      >
                        <ttp-svg-icon-loader
                          src="/assets/icons/banquet-offset.svg"
                        ></ttp-svg-icon-loader>
                        <span>offset</span>
                      </button>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Tables Total</div>
                      <div class="input-block">
                        <ttp-input
                          name="tablesTotal"
                          value="8"
                          input-id="tables-total"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Table Spacing</div>
                      <div class="input-block">
                        <ttp-input
                          name="tableSpacing"
                          value="6"
                          input-id="table-spacing"
                          maxlength="4"
                          post-fix="FT"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Rows Total</div>
                      <div class="input-block">
                        <ttp-input
                          name="rowsTotal"
                          value="2"
                          input-id="rows-total"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Chairs Per Table</div>
                      <div class="input-block">
                        <ttp-input
                          name="chairsPerTable"
                          value="10"
                          input-id="chairs-per-table"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <button
                      class="btn btn-setup ${!this.state.isBanquetSetupValid
                        ? 'disabled'
                        : ''}"
                      type="submit"
                      .disabled=${!this.state.isBanquetSetupValid}
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
