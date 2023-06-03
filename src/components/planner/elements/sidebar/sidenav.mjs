import { ENUM_SHAPES, ENUM_CATEGORY, ENUM_SETUP_TYPE } from '../../enums.mjs';
import { createTheaterSetupComponent } from './theater-setup.mjs';
import { createClassroomSetupComponent } from './classroom-setup.mjs';
import { createBanquetSetupComponent } from './banquet-setup.mjs';

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createSideNavComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-sidenav',
    withEventBus(eventBus, {
      renderer,
      props: {
        chairs: {
          type: String,
          default: '',
        },
        tables: {
          type: String,
          default: '',
        },
      },
      state() {
        return {
          chairs: [],
          tables: [],
          dimensions: '',
          selectedAsset: {},
          showAssetType: '',
          setupType: '',
          isTheaterSetupValid: true,
        };
      },
      computed: {
        getChairs() {
          return this.state.chairs;
        },
        getTables() {
          return this.state.tables;
        },
      },

      created() {
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createTheaterSetupComponent({ ...propsForComponents });
        createClassroomSetupComponent({ ...propsForComponents });
        createBanquetSetupComponent({ ...propsForComponents });
      },

      mounted() {
        this.ubsubscribeTheaterSetup = eventBus.subscribe(
          'ttp-theater-setup-modal',
          data => {
            if (data.method === 'goBackSetup') {
              this.goBackSetup();
            }
          }
        );

        this.ubsubscribeClassroomSetup = eventBus.subscribe(
          'ttp-classroom-setup-modal',
          data => {
            if (data.method === 'goBackSetup') {
              this.goBackSetup();
            }
          }
        );

        this.ubsubscribeClassroomSetup = eventBus.subscribe(
          'ttp-banquet-setup-modal',
          data => {
            if (data.method === 'goBackSetup') {
              this.goBackSetup();
            }
          }
        );
      },
      updated() {
        if (
          typeof this.props.chairs !== 'undefined' &&
          this.props.chairs.length &&
          this.state.chairs.length === 0
        ) {
          const chairs = JSON.parse(this.props.chairs);
          this.setState(state => {
            return { ...state, chairs: [...chairs] };
          });
        }

        if (
          typeof this.props.tables !== 'undefined' &&
          this.props.tables.length &&
          this.state.tables.length === 0
        ) {
          const tables = JSON.parse(this.props.tables);
          this.setState(state => {
            return { ...state, tables: [...tables] };
          });
        }
      },

      removed() {
        this.ubsubscribeTheaterSetup();
        this.ubsubscribeClassroomSetup();
        this.ubsubscribeClassroomSetup();
      },

      /**
       * @description Show Asset Dropdown/Popup
       * @param {object} event onclick event
       */
      showAssetsPopup(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const type = target.dataset.type;

        if (type === this.state.showAssetType) {
          this.hideAssetsPopup();
          return;
        }

        this.onHideTooltip(event);

        this.setState(state => {
          return {
            ...state,
            showAssetType: type,
          };
        });
        this.resetAssets();
      },

      hideAssetsPopup() {
        //reset all state
        this.setState(state => {
          return {
            ...state,
            showAssetType: '',
          };
        });
        this.resetAssets();
      },

      /**
       * @description Display tooltip
       * @param {object} event event that has target element
       * @param {number} distance how far tooltip shown from the triggered element
       */
      onShowTooltip(event, distance) {
        const target = event.currentTarget;
        const type = target.dataset.type;

        // Do not show tooltip for the toolbar item when mouse over the same item as selected
        if (typeof type !== 'undefined' && type === this.state.showAssetType)
          return;

        const tooltip = target.querySelector('ttp-tooltip');

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

      /**
       * @description Select the chair asset from the sidenav popup
       * @param {object} event event that has target element
       */
      onAssetChairSelect(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const assetType = target.dataset.type;

        const findAsset = this.state.chairs.filter(
          asset => asset.type === assetType
        )[0];

        const dimensions = `W ${findAsset.dimensions.width} IN x D ${findAsset.dimensions.depth} IN x H ${findAsset.dimensions.height} IN`;

        this.setState(state => {
          return { ...state, dimensions, selectedAsset: { ...findAsset } };
        });

        eventBus.publish('ttp-sidenav', {
          method: 'ttp-add-chair',
          selectedAsset: findAsset,
        });
      },

      onAssetTableSelect(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const assetType = `${target.dataset.type}`;

        const findAsset = this.state.tables.filter(
          asset => asset.type === assetType
        )[0];

        let dimensions = `L ${findAsset.dimensions.length} IN x W ${findAsset.dimensions.width} IN x H ${findAsset.dimensions.height} IN`;
        if (assetType === ENUM_SHAPES.ROUND) {
          dimensions = `D ${findAsset.dimensions.width} IN x H ${findAsset.dimensions.height} IN`;
        }

        this.setState(state => {
          return { ...state, dimensions, selectedAsset: { ...findAsset } };
        });

        eventBus.publish('ttp-sidenav', {
          method: 'ttp-add-table',
          selectedAsset: findAsset,
        });
      },

      resetAssets() {
        this.setState(state => {
          return {
            ...state,
            dimensions: '',
            selectedAsset: {},
            setupType: '',
          };
        });

        eventBus.publish('ttp-sidenav', {
          method: 'ttp-reset',
          selectedAsset: {},
        });
      },

      getAssetsLength() {
        let assetsLength = 2;

        if (this.state.showAssetType === ENUM_CATEGORY.CHAIR) {
          assetsLength = this.state.chairs.length;
        }

        if (this.state.showAssetType === ENUM_CATEGORY.TABLE) {
          assetsLength = this.state.tables.length;
        }

        return assetsLength;
      },

      getModalTitle() {
        const assetType = this.state.showAssetType;

        let title = '';

        switch (assetType) {
          case ENUM_CATEGORY.CHAIR:
            title = 'Chair Type';
            break;
          case ENUM_CATEGORY.TABLE:
            title = 'Table Type';
            break;
          case ENUM_CATEGORY.SETUP:
            title = 'Set ups';
            break;
          default:
            title = '';
            break;
        }

        return title;
      },

      onAssetTheaterSelect() {
        this.setState(state => {
          return { ...state, setupType: ENUM_SETUP_TYPE.THEATER };
        });
      },

      onAssetClassroomSelect() {
        this.setState(state => {
          return { ...state, setupType: ENUM_SETUP_TYPE.CLASSROOM };
        });
      },

      onAssetBanquetSelect() {
        this.setState(state => {
          return { ...state, setupType: ENUM_SETUP_TYPE.BANQUET };
        });
      },

      goBackSetup() {
        this.setState(state => {
          return { ...state, setupType: '' };
        });
      },

      placeSetup(event) {
        event.preventDefault();
        const target = event.target;

        const chairsTotal = target.querySelector('#chairs-total').value;
        const chairSpacing = target.querySelector('#chair-spacing').value;
        const chairsPerRow = target.querySelector('#chairs-per-row').value;
        const rowsTotal = target.querySelector('#rows-total').value;
        const rowSpacing = target.querySelector('#row-spacing').value;
        const aisles = target.querySelector('#aisles').value;
        const aisleWidth = target.querySelector('#aisle-width').value;

        //Data object should contain properties of type Number
        eventBus.publish('ttp-sidenav', {
          method: 'ttp-add-setup',
          type: ENUM_SETUP_TYPE.THEATER,
          data: {
            chairsTotal: +chairsTotal,
            chairSpacing: +chairSpacing, //in
            chairsPerRow: +chairsPerRow,
            rowsTotal: +rowsTotal,
            rowSpacing: +rowSpacing, //ft
            aisles: +aisles,
            aisleWidth: +aisleWidth, //ft
          },
        });
      },

      render() {
        const assetsWrapperClass =
          this.state.showAssetType === ENUM_CATEGORY.SETUP
            ? 'assets-wrapper--setup'
            : '';
        return html`
          <div class="sidenav">
            <ul class="sidenav-nav">
              <li
                class="sidenav-nav__item ${this.state.showAssetType ===
                  ENUM_CATEGORY.SETUP && 'selected'}"
                data-tooltip="Add Set Up"
                data-type=${ENUM_CATEGORY.SETUP}
                @mouseenter=${ev => this.onShowTooltip(ev, 10)}
                @mouseleave=${this.onHideTooltip}
                @click=${this.showAssetsPopup}
              >
                <ttp-svg-icon-loader
                  src="/assets/icons/sidebar-setup.svg"
                ></ttp-svg-icon-loader>
                <ttp-tooltip title="Add Set Up" position="right"></ttp-tooltip>
              </li>
              <hr class="sidenav-nav__hr" />
              <li
                class="sidenav-nav__item ${this.state.showAssetType ===
                  ENUM_CATEGORY.TABLE && 'selected'}"
                data-tooltip="Add Table"
                data-type=${ENUM_CATEGORY.TABLE}
                @mouseenter=${ev => this.onShowTooltip(ev, 10)}
                @mouseleave=${this.onHideTooltip}
                @click=${this.showAssetsPopup}
              >
                <ttp-svg-icon-loader
                  src="/assets/icons/sidebar-table.svg"
                ></ttp-svg-icon-loader>
                <ttp-tooltip title="Add Table" position="right"></ttp-tooltip>
              </li>
              <hr class="sidenav-nav__hr" />
              <li
                class="sidenav-nav__item ${this.state.showAssetType ===
                  ENUM_CATEGORY.CHAIR && 'selected'}"
                data-tooltip="Add Chair"
                data-type=${ENUM_CATEGORY.CHAIR}
                @mouseenter=${ev => this.onShowTooltip(ev, 10)}
                @mouseleave=${this.onHideTooltip}
                @click=${this.showAssetsPopup}
              >
                <ttp-svg-icon-loader
                  src="/assets/icons/sidebar-chair.svg"
                ></ttp-svg-icon-loader>
                <ttp-tooltip title="Add Chair" position="right"></ttp-tooltip>
              </li>
            </ul>
            <div
              class="assets-wrapper ${assetsWrapperClass} ${typeof this.state
                .showAssetType !== 'undefined' &&
              this.state.showAssetType.length &&
              this.state.setupType === '' &&
              'show'}"
            >
              <div class="assets">
                <div class="assets__header">
                  <div class="assets__header__title">
                    ${typeof this.state.showAssetType !== 'undefined' &&
                    this.state.showAssetType.length &&
                    this.getModalTitle()}
                  </div>
                  <div
                    class="assets__header__close-icon"
                    @click=${this.hideAssetsPopup}
                  >
                    <ttp-svg-icon-loader
                      src="/assets/icons/close.svg"
                    ></ttp-svg-icon-loader>
                  </div>
                </div>
                <div
                  class="body-wrapper"
                  style="height: ${this.getAssetsLength() > 4
                    ? '300px'
                    : 'auto'}"
                >
                  <div class="assets__body">
                    <div class="assets_list">
                      ${this.state.showAssetType === ENUM_CATEGORY.SETUP
                        ? html`<div
                              class="asset"
                              id="theater"
                              data-type=${ENUM_SETUP_TYPE.THEATER}
                              data-category=${ENUM_CATEGORY.SETUP}
                              @click=${this.onAssetTheaterSelect}
                            >
                              <div class="asset__svg">
                                <ttp-svg-icon-loader
                                  src="/assets/icons/setup-theater.svg"
                                ></ttp-svg-icon-loader>
                              </div>
                              <div class="asset__title">THEATER</div>
                            </div>
                            <div
                              class="asset"
                              id="classroom"
                              data-type=${ENUM_SETUP_TYPE.CLASSROOM}
                              data-category=${ENUM_CATEGORY.SETUP}
                              @click=${this.onAssetClassroomSelect}
                            >
                              <div class="asset__svg">
                                <ttp-svg-icon-loader
                                  src="/assets/icons/setup-classroom.svg"
                                ></ttp-svg-icon-loader>
                              </div>
                              <div class="asset__title">CLASSROOM</div>
                            </div>
                            <div
                              class="asset"
                              id="banquet"
                              data-type=${ENUM_SETUP_TYPE.BANQUET}
                              data-category=${ENUM_CATEGORY.SETUP}
                              @click=${this.onAssetBanquetSelect}
                            >
                              <div class="asset__svg">
                                <ttp-svg-icon-loader
                                  src="/assets/icons/setup-banquet.svg"
                                ></ttp-svg-icon-loader>
                              </div>
                              <div class="asset__title">BANQUET</div>
                            </div>`
                        : ''}
                      ${this.state.showAssetType === ENUM_CATEGORY.CHAIR
                        ? this.getChairs.map(chair => {
                            return html`<div
                              class="asset ${this.state.selectedAsset.type ===
                                chair.type && 'selected'}"
                              id="${chair.id}"
                              data-type=${chair.type}
                              data-category=${chair.category}
                              @click=${this.onAssetChairSelect}
                            >
                              <div class="asset__img">
                                <img src="${chair.src}" />
                              </div>
                              <div class="asset__title">${chair.title}</div>
                            </div>`;
                          })
                        : ''}
                      ${this.state.showAssetType === ENUM_CATEGORY.TABLE
                        ? this.getTables.map(table => {
                            return html`<div
                              class="asset ${this.state.selectedAsset.type ===
                                table.type && 'selected'}"
                              id="${table.id}"
                              @click=${this.onAssetTableSelect}
                              data-type=${table.type}
                              data-category=${table.category}
                            >
                              <div class="asset__img">
                                <img src="${table.src}" />
                              </div>
                              <div class="asset__title">${table.title}</div>
                            </div>`;
                          })
                        : ''}
                    </div>
                  </div>
                </div>
                ${typeof this.state.dimensions !== 'undefined' &&
                this.state.dimensions.length
                  ? html`<div class="assets__footer">
                      <div class="dimensions">
                        <div class="dimensions__title">Dimensions</div>
                        <div class="dimensions__sizes">
                          ${this.state.dimensions}
                        </div>
                      </div>
                    </div>`
                  : ''}
              </div>
            </div>
            <ttp-theater-setup-modal
              is-theater-setup-visible=${this.state.showAssetType ===
                ENUM_CATEGORY.SETUP &&
              this.state.setupType === ENUM_SETUP_TYPE.THEATER}
            ></ttp-theater-setup-modal>
            <ttp-classroom-setup-modal
              is-classroom-setup-visible=${this.state.showAssetType ===
                ENUM_CATEGORY.SETUP &&
              this.state.setupType === ENUM_SETUP_TYPE.CLASSROOM}
            ></ttp-classroom-setup-modal>
            <ttp-banquet-setup-modal
              is-banquet-setup-visible=${this.state.showAssetType ===
                ENUM_CATEGORY.SETUP &&
              this.state.setupType === ENUM_SETUP_TYPE.BANQUET}
            ></ttp-banquet-setup-modal>
          </div>
        `;
      },
    })
  );
}
