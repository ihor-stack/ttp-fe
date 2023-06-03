import { ENUM_SETUP_TYPE } from '../../enums.mjs';

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createClassroomSetupComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-classroom-setup-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        isClassroomSetupVisible: {
          type: Boolean,
          default: false,
        },
      },
      state() {
        return {
          isClassroomSetupValid: true,
        };
      },

      goBackSetup() {
        eventBus.publish('ttp-classroom-setup-modal', {
          method: 'goBackSetup',
        });
      },

      placeSetup(event) {
        event.preventDefault();
        const target = event.target;

        const tablesTotal = +target.querySelector('#tables-total').value;
        const tableSpacing = +target.querySelector('#table-spacing').value;
        const tablesPerRow = +target.querySelector('#tables-per-row').value;
        let rowsTotal = +target.querySelector('#rows-total').value;
        let chairsPerTable = +target.querySelector('#chairs-per-table').value;
        const rowSpacing = +target.querySelector('#row-spacing').value;
        const aisles = +target.querySelector('#aisles').value;
        const aisleWidth = +target.querySelector('#aisle-width').value;

        if (chairsPerTable > 12) {
          chairsPerTable = 12;
        }

        if (rowsTotal <= 0) {
          rowsTotal = 1;
        }
        //Data object should contain properties of type Number
        eventBus.publish('ttp-sidenav', {
          method: 'ttp-add-setup',
          type: ENUM_SETUP_TYPE.CLASSROOM,
          data: {
            tablesTotal: tablesTotal,
            tableSpacing: tableSpacing, //in
            tablesPerRow: tablesPerRow,
            rowsTotal: rowsTotal,
            rowSpacing: rowSpacing, //ft
            chairsPerTable: chairsPerTable,
            aisles: aisles,
            aisleWidth: aisleWidth, //ft
          },
        });
      },

      render() {
        return html`
          <div
            class="assets-wrapper ${this.props.isClassroomSetupVisible
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
                    src="/assets/icons/setup-classroom.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <div class="setup-title">
                  <div>classroom</div>
                  <div>set up</div>
                </div>
              </div>
              <div class="body-wrapper">
                <div class="assets-setup__body">
                  <form class="form-setup" @submit=${this.placeSetup}>
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
                          value="0"
                          input-id="table-spacing"
                          maxlength="4"
                          post-fix="IN"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Tables Per Row</div>
                      <div class="input-block">
                        <ttp-input
                          name="tablesPerRow"
                          value="4"
                          input-id="tables-per-row"
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
                          value="2"
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
                      <div class="input-label">Chairs Per Table</div>
                      <div class="input-block">
                        <ttp-input
                          name="chairsPerTable"
                          value="3"
                          input-id="chairs-per-table"
                          maxlength="4"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <div class="input-row">
                      <div class="input-label">Aisles</div>
                      <div class="input-block">
                        <ttp-input
                          name="aisles"
                          value="1"
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
                          value="8"
                          input-id="aisle-width"
                          maxlength="4"
                          post-fix="FT"
                          input-style="setup"
                        ></ttp-input>
                      </div>
                    </div>
                    <button
                      class="btn btn-setup ${!this.state.isClassroomSetupValid
                        ? 'disabled'
                        : ''}"
                      type="submit"
                      .disabled=${!this.state.isClassroomSetupValid}
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
