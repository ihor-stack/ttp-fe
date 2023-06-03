import { ENUM_CATEGORY } from '../../enums.mjs';

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createToolbarSetupTheaterComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-toolbar-setup-theater',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          toolbarLevel: 1,
          isRows: false,
          isChairs: false,
          isAisles: false,
        };
      },
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

        assetCategory: {
          type: String,
          default: '',
        },
        assetType: {
          type: String,
          default: '',
        },
        assetId: {
          type: String,
          default: '',
        },
        assetRotation: {
          type: Number,
          default: 0,
        },
        chairs: {
          type: String,
          default: '[]',
        },

        setup: {
          type: String,
          default: '',
        },
      },

      computed: {
        getComputedSetup() {
          const setup = this.getSetup();

          return setup;
        },

        getSetupChairTitle() {
          let assetTitle = '';
          let setup = this.getSetup();

          const chairsList = this.getChairsList().map(chair => {
            return { type: chair.type, title: chair.title };
          });

          const getSelectedChairTitle = this.getSelectTitle(
            chairsList,
            setup.chair_type
          );

          assetTitle = getSelectedChairTitle;

          return assetTitle;
        },

        getChairsDropdownList() {
          const chairsList = this.getChairsList().map(chair => {
            return { type: chair.type, title: chair.title };
          });

          const filterOutSelectedChair = this.excludeSelectedAsset(
            chairsList,
            this.props.assetType
          );

          const ttpSelect = filterOutSelectedChair.map(chair => {
            return { value: chair.type, title: chair.title };
          });

          return JSON.stringify(ttpSelect);
        },

        getSetupDropdownRotation() {
          const degrees = this.assetRotationDegreeList();
          const degreesWithSymbol = degrees.map(degree => {
            return { value: degree, title: `${degree}˚` };
          });
          return JSON.stringify(degreesWithSymbol);
        },
      },

      mounted() {
        this.ttpButtonSelectUnsubscribe = eventBus.subscribe(
          'ttp-button-select',
          data => {
            let value = data.value;

            if (data.name === 'assetRotation') {
              const splitDegrees = data.value.split('˚')[0];
              value = splitDegrees;
              this.onAssetRotation(value);
            }
          }
        );

        this.ttpInputUnsubscribe = eventBus.subscribe('ttp-input', data => {
          // When typing in on the toolbar the number of chairs to add, show the preview of the
          // chairs near to the table
          if (data.method === 'onInput') {
            if (data.name === `${this.props.assetId}_duplicate`) {
              const value = data.value;
              this.duplicatePreview(value);
            }
          }

          if (data.method === 'onFocusInput') {
            if (data.name === `${this.props.assetId}_duplicate`) {
              const input = this.querySelector(
                `#${this.props.assetId}_duplicate`
              );
              const value2 = input.value;

              this.duplicatePreview(value2);
            }
          }

          if (data.method === 'onBlurInput') {
            // console.log('data.method', data.method);
          }

          // if (data.method === 'onKeyUp' && data.eventKey === 'enter') {
          // }
        });
      },

      removed() {
        this.ttpButtonSelectUnsubscribe();
        this.ttpInputUnsubscribe();
      },

      getSetup() {
        return JSON.parse(this.props.setup);
      },

      getChairsList() {
        return JSON.parse(this.props.chairs);
      },

      assetRotationDegreeList() {
        const step = 90; // table rotation 90 degree step
        const degrees = [];
        for (let i = 0; i <= 360; i += step) {
          degrees.push(i);
        }
        return degrees;
      },

      excludeSelectedAsset(list, type) {
        return list.filter(asset => asset.type !== type && asset);
      },

      getSelectTitle(list, type) {
        let title = '';
        list.map(asset => {
          if (asset.type === type) {
            title = asset.title;
          }
        });
        return title;
      },

      onRemoveAsset() {
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onRemoveAsset',
          isBulk: this.props.isBulk,
          assetId: this.props.assetId,
          bulkAssetsIds: this.props.bulkAssetsIds,
        });
      },

      /**
       * @description sending to the parent new degree to rotate the furniture
       * @param {number} degree from 0 till 360
       */
      onAssetRotation(degree) {
        let id = this.props.assetId;
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onAssetRotation',
          data: {
            id,
            rotation: +degree,
            isBulk: this.props.isBulk,
            bulkAssetsIds: this.props.bulkAssetsIds,
          },
        });
        this.onResetDuplicate();
      },

      hideDuplicateInput() {
        const duplicateInput = this.querySelector('[data-js="duplicate"]');
        if (duplicateInput) {
          duplicateInput.classList.remove('show');

          const input = this.querySelector(`#${this.props.assetId}_duplicate`);
          input.value = 1;
        }
      },

      showDuplicateInput() {
        const duplicateInput = this.querySelector('[data-js="duplicate"]');
        duplicateInput.classList.add('show');
      },

      onShowDuplicateInput() {
        const duplicateInput = this.querySelector('[data-js="duplicate"]');
        const hasShow = duplicateInput.classList.contains('show');

        if (!hasShow) {
          this.showDuplicateInput();

          const inputDuplicate = this.querySelector(
            `#${this.props.assetId}_duplicate`
          );

          if (inputDuplicate) {
            inputDuplicate.focus();
          }
        }
      },

      validateDuplicateValue(value) {
        //TODO add more validation only numbers
        value = Number(value);

        if (isNaN(value)) {
          return;
        }

        return value;
      },

      duplicatePreview(value) {
        const valueValid = this.validateDuplicateValue(value);
        let maxAmount = 50;

        if (this.props.assetCategory === ENUM_CATEGORY.TABLE) {
          maxAmount = 10;
        }

        if (valueValid > 0 && valueValid <= maxAmount) {
          eventBus.publish('ttp-toolbar-asset', {
            method: 'onDuplicateFurniturePreview',
            data: {
              id: this.props.assetId,
              value: valueValid,
              category: this.props.assetCategory,
              type: this.props.assetType,
            },
          });
        }
      },

      onDuplicateConfirm() {
        const input = this.querySelector(`#${this.props.assetId}_duplicate`);
        const value = this.validateDuplicateValue(input.value);
        let maxAmount = 50;

        if (this.props.assetCategory === ENUM_CATEGORY.TABLE) {
          maxAmount = 10;
        }

        if (value > 0 && value <= maxAmount) {
          eventBus.publish('ttp-toolbar-asset', {
            method: 'onDuplicateFurniture',
            data: {
              id: this.props.assetId,
              value,
              category: this.props.assetCategory,
              type: this.props.assetType,
            },
          });
        }
        input.blur();
        this.hideDuplicateInput();
      },

      onResetDuplicate() {
        const input = this.querySelector(`#${this.props.assetId}_duplicate`);

        if (input) {
          input.blur();
          this.hideDuplicateInput();
          eventBus.publish('ttp-toolbar-asset', {
            method: 'onDuplicateFurnitureReset',
            data: {
              id: this.props.assetId,
            },
          });
        }
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

      onShowRows() {
        this.onResetDuplicate();
        this.setState(state => {
          return { ...state, toolbarLevel: 2, isRows: true };
        });
      },

      onShowChairs() {
        this.onResetDuplicate();
        this.setState(state => {
          return { ...state, toolbarLevel: 2, isChairs: true };
        });
      },

      onShowAisles() {
        this.onResetDuplicate();
        this.setState(state => {
          return { ...state, toolbarLevel: 2, isAisles: true };
        });
      },

      onToolbarGoBack() {
        this.setState(state => {
          return {
            ...state,
            toolbarLevel: 1,
            isRows: false,
            isChairs: false,
            isAisles: false,
          };
        });
      },

      render() {
        const isParent = this.state.toolbarLevel === 1;

        return html`
          <ul class="toolbar-content">
            ${isParent
              ? html`<li class="toolbar-item toolbar-item--horizontal">
                    <div class="toolbar-item__label">Rows</div>
                    <div class="duplicate-icon" @click=${this.onShowRows}>
                      <svg
                        width="8"
                        height="14"
                        viewBox="0 0 8 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 13L7 7L1 1"
                          stroke="#333333"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  </li>
                  <li class="toolbar-item toolbar-item--horizontal">
                    <div class="toolbar-item__label">Chairs</div>
                    <div class="duplicate-icon" @click=${this.onShowChairs}>
                      <svg
                        width="8"
                        height="14"
                        viewBox="0 0 8 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 13L7 7L1 1"
                          stroke="#333333"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  </li>

                  <li class="toolbar-item toolbar-item--horizontal">
                    <div class="toolbar-item__label">Aisles</div>
                    <div class="duplicate-icon" @click=${this.onShowAisles}>
                      <svg
                        width="8"
                        height="14"
                        viewBox="0 0 8 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 13L7 7L1 1"
                          stroke="#333333"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  </li>
                  <li class="toolbar-item">
                    <ttp-button-select
                      name="assetRotation"
                      value="${this.props.assetRotation}˚"
                      list=${this.getSetupDropdownRotation}
                      select-style="toolbar"
                    ></ttp-button-select>
                    <span class="toolbar-item__label">Rotate</span>
                  </li>
                  ${this.props.isBulk
                    ? html`<li
                        class="toolbar-item toolbar-item--duplicate ${isParent
                          ? ''
                          : 'hide'}"
                      >
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
                      </li>`
                    : html`<li
                        class="toolbar-item toolbar-item--duplicate ${isParent
                          ? ''
                          : 'hide'}"
                      >
                        <div
                          class="duplicate-icon"
                          @click=${this.onShowDuplicateInput}
                        >
                          <div class="toolbar-item__icon">
                            <ttp-svg-icon-loader
                              src="/assets/icons/duplicate.svg"
                            ></ttp-svg-icon-loader>
                          </div>
                          <span class="toolbar-item__label">Duplicate</span>
                        </div>
                        <div
                          data-js="duplicate"
                          class="input-duplicate-wrapper"
                        >
                          <div class="form-add-chairs">
                            <ttp-input
                              name="${this.props.assetId}_duplicate"
                              value="1"
                              input-id="${this.props.assetId}_duplicate"
                              maxlength="2"
                              input-style="toolbar"
                            ></ttp-input>
                            <div class="btn-group show">
                              <button @click=${this.onDuplicateConfirm}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1 9.02619L6.41935 15L15 1"
                                    stroke="#333333"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </button>
                              <button @click=${this.onResetDuplicate}>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M0.793256 1.47099C0.614576 1.29231 0.628018 0.98917 0.82328 0.793908C1.01854 0.598645 1.32168 0.585203 1.50036 0.763884L11.2062 10.4698C11.3849 10.6484 11.3715 10.9516 11.1762 11.1468C10.981 11.3421 10.6778 11.3556 10.4991 11.1769L0.793256 1.47099Z"
                                    fill="#333333"
                                  />
                                  <path
                                    d="M10.4987 0.823529C10.6774 0.644849 10.9806 0.658291 11.1758 0.853553C11.3711 1.04882 11.3845 1.35196 11.2058 1.53064L1.49996 11.2365C1.32128 11.4152 1.01814 11.4018 0.822878 11.2065C0.627616 11.0112 0.614174 10.7081 0.792854 10.5294L10.4987 0.823529Z"
                                    fill="#333333"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>`}
                  <li
                    class="toolbar-item toolbar-item--remove ${isParent
                      ? ''
                      : 'hide'}"
                    @click=${this.onRemoveAsset}
                  >
                    <div class="toolbar-item__icon">
                      <ttp-svg-icon-loader
                        src="/assets/icons/trash.svg"
                      ></ttp-svg-icon-loader>
                    </div>
                    <span class="toolbar-item__label">Remove</span>
                  </li>`
              : html`<div
                  class="toolbar-go-back"
                  @click=${this.onToolbarGoBack}
                >
                  <svg
                    width="8"
                    height="14"
                    viewBox="0 0 8 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 1L0.999999 7L7 13"
                      stroke="#333333"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>`}

            <!-- ROWS -->
            ${!isParent && this.state.isRows
              ? html`<li class="toolbar-item ">
                    <div data-js="rows" class="input-add-chairs show">
                      <div class="form-add-chairs">
                        <ttp-input
                          name="${this.props.assetId}_rowsTotal_${this.props
                            .assetType}"
                          input-id="${this.props.assetId}_rowsTotal_${this.props
                            .assetType}"
                          maxlength="4"
                          input-style="toolbar-setup"
                          value=${this.getComputedSetup.rows_total}
                        ></ttp-input>
                        <div data-js="add-chairs-buttons" class="btn-group">
                          <button @click=${this.onTableChairsConfirm}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 9.02619L6.41935 15L15 1"
                                stroke="#333333"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                          <button>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0.793256 1.47099C0.614576 1.29231 0.628018 0.98917 0.82328 0.793908C1.01854 0.598645 1.32168 0.585203 1.50036 0.763884L11.2062 10.4698C11.3849 10.6484 11.3715 10.9516 11.1762 11.1468C10.981 11.3421 10.6778 11.3556 10.4991 11.1769L0.793256 1.47099Z"
                                fill="#333333"
                              />
                              <path
                                d="M10.4987 0.823529C10.6774 0.644849 10.9806 0.658291 11.1758 0.853553C11.3711 1.04882 11.3845 1.35196 11.2058 1.53064L1.49996 11.2365C1.32128 11.4152 1.01814 11.4018 0.822878 11.2065C0.627616 11.0112 0.614174 10.7081 0.792854 10.5294L10.4987 0.823529Z"
                                fill="#333333"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <span class="toolbar-item__label">Rows</span>
                  </li>
                  <li class="toolbar-item ">
                    <div data-js="rows" class="input-add-chairs show">
                      <div class="form-add-chairs">
                        <ttp-input
                          name="${this.props.assetId}_rowSpacing_${this.props
                            .assetType}"
                          input-id="${this.props.assetId}_rowSpacing_${this
                            .props.assetType}"
                          maxlength="4"
                          input-style="toolbar-setup"
                          post-fix="FT"
                          value=${this.getComputedSetup.row_spacing_ft}
                        ></ttp-input>
                        <div data-js="add-chairs-buttons" class="btn-group">
                          <button @click=${this.onTableChairsConfirm}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 9.02619L6.41935 15L15 1"
                                stroke="#333333"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                          <button>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0.793256 1.47099C0.614576 1.29231 0.628018 0.98917 0.82328 0.793908C1.01854 0.598645 1.32168 0.585203 1.50036 0.763884L11.2062 10.4698C11.3849 10.6484 11.3715 10.9516 11.1762 11.1468C10.981 11.3421 10.6778 11.3556 10.4991 11.1769L0.793256 1.47099Z"
                                fill="#333333"
                              />
                              <path
                                d="M10.4987 0.823529C10.6774 0.644849 10.9806 0.658291 11.1758 0.853553C11.3711 1.04882 11.3845 1.35196 11.2058 1.53064L1.49996 11.2365C1.32128 11.4152 1.01814 11.4018 0.822878 11.2065C0.627616 11.0112 0.614174 10.7081 0.792854 10.5294L10.4987 0.823529Z"
                                fill="#333333"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <span class="toolbar-item__label">Row Spacing</span>
                  </li>`
              : ''}

            <!-- CHAIRS -->
            ${!isParent && this.state.isChairs
              ? html`
                  <li class="toolbar-item">
                    <ttp-button-select
                      name="toolbarSetupChairNameSelected"
                      value=${this.getSetupChairTitle}
                      list=${this.getChairsDropdownList}
                      select-style="toolbar"
                    ></ttp-button-select>
                    <span class="toolbar-item__label">Chair Type</span>
                  </li>
                  <li class="toolbar-item">
                    <ttp-input
                      name="${this.props.assetId}_chairs_${this.props
                        .assetType}"
                      input-id="${this.props.assetId}_chairs_${this.props
                        .assetType}"
                      maxlength="4"
                      input-style="toolbar-setup"
                      value=${this.getComputedSetup.chairs_total}
                    ></ttp-input>
                    <span class="toolbar-item__label">Chairs</span>
                  </li>
                  <li class="toolbar-item">
                    <div class="toolbar-item__icon-input">
                      <svg
                        width="20"
                        height="18"
                        viewBox="0 0 20 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0.666016 1H4.66602V17H0.666016"
                          stroke="black"
                        />
                        <path
                          d="M19.333 17L15.333 17L15.333 1L19.333 1"
                          stroke="black"
                        />
                        <path
                          d="M4.7568 8.20211C4.56154 8.39737 4.56154 8.71396 4.7568 8.90922L7.93878 12.0912C8.13404 12.2865 8.45062 12.2865 8.64589 12.0912C8.84115 11.8959 8.84115 11.5794 8.64589 11.3841L5.81746 8.55566L8.64589 5.72724C8.84115 5.53197 8.84115 5.21539 8.64589 5.02013C8.45062 4.82487 8.13404 4.82487 7.93878 5.02013L4.7568 8.20211ZM14.7972 8.90922C14.9925 8.71396 14.9925 8.39737 14.7972 8.20211L11.6153 5.02013C11.42 4.82487 11.1034 4.82487 10.9082 5.02013C10.7129 5.21539 10.7129 5.53197 10.9082 5.72724L13.7366 8.55566L10.9082 11.3841C10.7129 11.5794 10.7129 11.8959 10.9082 12.0912C11.1034 12.2865 11.42 12.2865 11.6153 12.0912L14.7972 8.90922ZM5.11035 9.05566H14.4437V8.05566H5.11035V9.05566Z"
                          fill="black"
                        />
                      </svg>
                      <ttp-input
                        name="${this.props.assetId}_chairSpacing_${this.props
                          .assetType}"
                        input-id="${this.props.assetId}_chairSpacing_${this
                          .props.assetType}"
                        maxlength="4"
                        input-style="toolbar-setup"
                        post-fix="IN"
                        value=${this.getComputedSetup.chair_spacing_inch}
                      ></ttp-input>
                    </div>
                    <span class="toolbar-item__label">Chair Spacing</span>
                  </li>
                  <li class="toolbar-item">
                    <ttp-input
                      name="${this.props.assetId}_chairsPerRow_${this.props
                        .assetType}"
                      input-id="${this.props.assetId}_chairsPerRow_${this.props
                        .assetType}"
                      maxlength="4"
                      input-style="toolbar-setup"
                      value=${this.getComputedSetup.chairs_per_row}
                    ></ttp-input>
                    <span class="toolbar-item__label">Chairs per row</span>
                  </li>
                `
              : ''}

            <!-- AISLES -->
            ${!isParent && this.state.isAisles
              ? html`<li class="toolbar-item ">
                    <div data-js="rows" class="input-add-chairs show">
                      <div class="form-add-chairs">
                        <ttp-input
                          name="${this.props.assetId}_aisles_${this.props
                            .assetType}"
                          input-id="${this.props.assetId}_aisles_${this.props
                            .assetType}"
                          maxlength="4"
                          input-style="toolbar-setup"
                          value=${this.getComputedSetup.aisles}
                        ></ttp-input>
                        <div data-js="add-chairs-buttons" class="btn-group">
                          <button @click=${this.onTableChairsConfirm}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 9.02619L6.41935 15L15 1"
                                stroke="#333333"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                          <button>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0.793256 1.47099C0.614576 1.29231 0.628018 0.98917 0.82328 0.793908C1.01854 0.598645 1.32168 0.585203 1.50036 0.763884L11.2062 10.4698C11.3849 10.6484 11.3715 10.9516 11.1762 11.1468C10.981 11.3421 10.6778 11.3556 10.4991 11.1769L0.793256 1.47099Z"
                                fill="#333333"
                              />
                              <path
                                d="M10.4987 0.823529C10.6774 0.644849 10.9806 0.658291 11.1758 0.853553C11.3711 1.04882 11.3845 1.35196 11.2058 1.53064L1.49996 11.2365C1.32128 11.4152 1.01814 11.4018 0.822878 11.2065C0.627616 11.0112 0.614174 10.7081 0.792854 10.5294L10.4987 0.823529Z"
                                fill="#333333"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <span class="toolbar-item__label">Aisles</span>
                  </li>
                  <li class="toolbar-item ">
                    <div data-js="rows" class="input-add-chairs show">
                      <div class="form-add-chairs">
                        <ttp-input
                          name="${this.props.assetId}_aisleWidth_${this.props
                            .assetType}"
                          input-id="${this.props.assetId}_aisleWidth_${this
                            .props.assetType}"
                          maxlength="4"
                          input-style="toolbar-setup"
                          post-fix="FT"
                          value=${this.getComputedSetup.aisle_width_ft}
                        ></ttp-input>
                        <div data-js="add-chairs-buttons" class="btn-group">
                          <button @click=${this.onTableChairsConfirm}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 9.02619L6.41935 15L15 1"
                                stroke="#333333"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                          <button>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0.793256 1.47099C0.614576 1.29231 0.628018 0.98917 0.82328 0.793908C1.01854 0.598645 1.32168 0.585203 1.50036 0.763884L11.2062 10.4698C11.3849 10.6484 11.3715 10.9516 11.1762 11.1468C10.981 11.3421 10.6778 11.3556 10.4991 11.1769L0.793256 1.47099Z"
                                fill="#333333"
                              />
                              <path
                                d="M10.4987 0.823529C10.6774 0.644849 10.9806 0.658291 11.1758 0.853553C11.3711 1.04882 11.3845 1.35196 11.2058 1.53064L1.49996 11.2365C1.32128 11.4152 1.01814 11.4018 0.822878 11.2065C0.627616 11.0112 0.614174 10.7081 0.792854 10.5294L10.4987 0.823529Z"
                                fill="#333333"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <span class="toolbar-item__label">Aisle Width</span>
                  </li>`
              : ''}
          </ul>
        `;
      },
    })
  );
}
