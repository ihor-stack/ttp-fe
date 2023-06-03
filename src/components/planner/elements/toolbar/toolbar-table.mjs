import { ENUM_SHAPES } from '../../enums.mjs';
/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createToolbarTableComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-toolbar-table',
    withEventBus(eventBus, {
      renderer,

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
        tables: {
          type: String,
          default: '[]',
        },
        linens: {
          type: String,
          default: '[]',
        },
        tableChairsCount: {
          type: Number,
          default: -1,
        },
        tableChairsType: {
          type: String,
          default: 'chiavari',
        },
        tableLinen: {
          type: String,
          default: 'None',
        },
      },

      computed: {
        getAssetTitle() {
          let assetTitle = '';

          const tablesList = this.props.tables.length
            ? this.getTablesList().map(table => {
                return { type: table.type, title: table.title };
              })
            : [];

          const getSelectedTableTitle = this.getSelectTitle(
            tablesList,
            this.props.assetType
          );

          assetTitle = getSelectedTableTitle;

          return assetTitle;
        },

        getTableChairsTitle() {
          const chairsList = this.getChairsList().map(chair => {
            return { type: chair.type, title: chair.title };
          });

          const getSelectedChairTitle = this.getSelectTitle(
            chairsList,
            this.props.tableChairsType
          );

          const tableChairTitle = getSelectedChairTitle;

          return tableChairTitle;
        },

        getTableDropdownRotation() {
          const degrees = this.tableRotationDegreeList();
          const degreesWithSymbol = degrees.map(degree => {
            return { value: degree, title: `${degree}˚` };
          });
          return JSON.stringify(degreesWithSymbol);
        },

        getTablesDropdown() {
          const tablesList = this.props.tables.length
            ? this.getTablesList().map(table => {
                return { type: table.type, title: table.title };
              })
            : [];

          const filterOutSelectedTable = this.excludeSelectedAsset(
            tablesList,
            this.props.assetType
          );

          const ttpSelect = filterOutSelectedTable.map(table => {
            return { value: table.type, title: table.title };
          });

          return JSON.stringify(ttpSelect);
        },

        getTablesLinenDropdown() {
          const linens = this.props.linens.length
            ? this.getTablesLinens().map(linen => {
                return { type: linen, title: linen };
              })
            : [];

          const filterOutSelectedLinen = this.excludeSelectedAsset(
            linens,
            this.props.tableLinen
          );

          const ttpSelect = filterOutSelectedLinen.map(linen => {
            return { value: linen.type, title: linen.title };
          });

          return JSON.stringify(ttpSelect);
        },

        getTableChairsDropdown() {
          const chairsList = this.getChairsList().map(chair => {
            return { type: chair.type, title: chair.title };
          });

          const filterOutSelectedChair = this.excludeSelectedAsset(
            chairsList,
            this.props.tableChairsType
          );

          const ttpSelect = filterOutSelectedChair.map(chair => {
            return { value: chair.type, title: chair.title };
          });

          return JSON.stringify(ttpSelect);
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

            if (data.name === 'toolbarTableTypeSelected') {
              this.onChangeTableType(value);
            }

            if (data.name === 'toolbarTableChairNameSelected') {
              this.onChangeTableChairType(value);
            }

            if (data.name === 'toolbarTableLinen') {
              this.onChangeTableLinen(value);
            }
          }
        );

        this.ttpInputUnsubscribe = eventBus.subscribe('ttp-input', data => {
          // When typing in on the toolbar the number of chairs to add, show the preview of the
          // chairs near to the table
          if (data.method === 'onInput') {
            if (
              data.name ===
              `${this.props.assetId}_addChairs_${this.props.assetType}`
            ) {
              const value = data.value;
              this.onChairsPreview(value);
            }

            if (data.name === `${this.props.assetId}_duplicate`) {
              const value = data.value;
              this.duplicatePreview(value);
            }
          }

          if (data.method === 'onFocusInput') {
            if (
              data.name ===
              `${this.props.assetId}_addChairs_${this.props.assetType}`
            ) {
              const input = this.querySelector(
                `#${this.props.assetId}_addChairs_${this.props.assetType}`
              );
              const value2 = input.value;

              this.showChairsConfirmButtons();

              this.onChairsPreview(value2);
            }

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

          if (data.method === 'onKeyUp' && data.eventKey === 'enter') {
            if (
              data.name ===
              `${this.props.assetId}_addChairs_${this.props.assetType}`
            ) {
              const value = +data.value;
              this.confirmTableChairs(value);
            }
          }
        });
      },

      removed() {
        this.ttpButtonSelectUnsubscribe();
        this.ttpInputUnsubscribe();
      },

      getChairsList() {
        return JSON.parse(this.props.chairs);
      },

      getTablesList() {
        return JSON.parse(this.props.tables);
      },

      getTablesLinens() {
        return JSON.parse(this.props.linens);
      },

      tableRotationDegreeList() {
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

      onChangeTableChairType(type) {
        let id = this.props.assetId;
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onChangeTableChairType',
          data: {
            id,
            chairType: type,
            type: this.props.assetType,
            isBulk: this.props.isBulk,
            bulkAssetsIds: this.props.bulkAssetsIds,
          },
        });
        this.onResetDuplicate();
      },

      onChangeTableType(value) {
        let id = this.props.assetId;
        this.onResetDuplicate();
        this.resetChairs();
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onChangeTableType',
          data: {
            id,
            type: value,
            isBulk: this.props.isBulk,
            bulkAssetsIds: this.props.bulkAssetsIds,
          },
        });
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

      onChairsPreview(value) {
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onChairsPreview',
          data: {
            id: this.props.assetId,
            chairType: this.props.tableChairsType,
            value: +value,
            type: this.props.assetType,
            isBulk: this.props.isBulk,
            bulkAssetsIds: this.props.bulkAssetsIds,
          },
        });
        this.onResetDuplicate();
      },

      onTableChairsConfirm(event) {
        event.preventDefault();
        const input = this.querySelector(
          `#${this.props.assetId}_addChairs_${this.props.assetType}`
        );
        const value = +input.value;

        this.confirmTableChairs(value);
      },

      confirmTableChairs(value) {
        const type = this.props.assetType;
        const max = type === ENUM_SHAPES.ROUND ? 12 : 6;

        if (value === 0) {
          this.removeChairs();
        } else if (value > 0 && value <= max) {
          eventBus.publish('ttp-toolbar-asset', {
            method: 'onTableChairsConfirm',
            data: {
              id: this.props.assetId,
              value,
              chairType: this.props.tableChairsType,
              type: this.props.assetType,
              isBulk: this.props.isBulk,
              bulkAssetsIds: this.props.bulkAssetsIds,
            },
          });
          this.removeFocus();
          this.hideChairsConfirmButtons();
        } else {
          this.resetChairs();
        }
      },

      removeChairs() {
        console.log('remove chairs');
        this.hideChairsInput();
        this.hideChairsConfirmButtons();
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onTableChairsRemove',
          data: {
            id: this.props.assetId,
            chairType: this.props.tableChairsType,
            type: this.props.assetType,
            isBulk: this.props.isBulk,
            bulkAssetsIds: this.props.bulkAssetsIds,
          },
        });
      },

      onResetChairs(event) {
        event.preventDefault();

        this.resetChairs();
      },

      resetChairs() {
        console.log('-reset chairs');
        const input = this.querySelector(
          `#${this.props.assetId}_addChairs_${this.props.assetType}`
        );

        if (input) {
          const prevVal = this.props.tableChairsCount;

          if (prevVal === -1) {
            this.removeChairs();
          } else {
            input.value = prevVal;

            eventBus.publish('ttp-toolbar-asset', {
              method: 'onResetChairs',
              data: {
                id: this.props.assetId,
                value: this.props.tableChairsCount,
                chairType: this.props.tableChairsType,
                type: this.props.assetType,
                isBulk: this.props.isBulk,
                bulkAssetsIds: this.props.bulkAssetsIds,
              },
            });
          }
        }
        this.hideChairsConfirmButtons();
      },

      showChairsInput() {
        const inputWrapper = this.querySelector('[data-js="add-chairs"]');
        if (inputWrapper) {
          inputWrapper.classList.add('show');
        }
      },

      hideChairsInput() {
        const inputWrapper = this.querySelector('[data-js="add-chairs"]');
        if (inputWrapper) {
          inputWrapper.classList.remove('show');
        }
      },

      showChairsConfirmButtons() {
        const inputWrapper = this.querySelector(
          '[data-js="add-chairs-buttons"]'
        );
        if (inputWrapper) {
          inputWrapper.classList.add('show');
        }
      },

      hideChairsConfirmButtons() {
        const inputWrapper = this.querySelector(
          '[data-js="add-chairs-buttons"]'
        );
        if (inputWrapper) {
          inputWrapper.classList.remove('show');
        }
      },

      onShowAddChairsInput(event) {
        event.preventDefault();
        const inputWrapper = this.querySelector('[data-js="add-chairs"]');
        const isShown = inputWrapper.classList.contains('show');
        // Set the focus on the input if there is no chairs yet added, and have the
        // default value to 12

        if (!isShown && this.props.tableChairsCount === -1) {
          this.showChairsInput();
          const findInputChairs = this.querySelector(
            `#${this.props.assetId}_addChairs_${this.props.assetType}`
          );

          if (findInputChairs) {
            findInputChairs.focus();
          }
        }
        this.onResetDuplicate();
      },

      removeFocus() {
        const input = this.querySelector(
          `#${this.props.assetId}_addChairs_${this.props.assetType}`
        );
        this.hideChairsConfirmButtons();

        input.blur();
      },

      onChangeTableLinen(value) {
        let id = this.props.assetId;
        eventBus.publish('ttp-toolbar-asset', {
          method: 'onChangeTableLinen',
          data: {
            id,
            value,
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
        this.resetChairs();
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

        const maxAmount = 10;

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
        this.resetChairs();
      },

      onDuplicateConfirm() {
        const input = this.querySelector(`#${this.props.assetId}_duplicate`);
        const value = this.validateDuplicateValue(input.value);
        const maxAmount = 10;

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

      render() {
        const chairsValue =
          this.props.tableChairsCount === -1 ? 12 : this.props.tableChairsCount;

        const chairsValueRectangular =
          this.props.tableChairsCount === -1 ? 6 : this.props.tableChairsCount;

        return html`
          <ul class="toolbar-content">
            <li class="toolbar-item">
              <ttp-button-select
                name="toolbarTableTypeSelected"
                value=${this.getAssetTitle}
                list=${this.getTablesDropdown}
                select-style="toolbar"
              ></ttp-button-select>
              <span class="toolbar-item__label">Table Type</span>
            </li>
            ${this.props.assetType === 'rectangular'
              ? html`<li class="toolbar-item">
                  <ttp-button-select
                    name="assetRotation"
                    value="${this.props.assetRotation}˚"
                    list=${this.getTableDropdownRotation}
                    select-style="toolbar"
                  ></ttp-button-select>
                  <span class="toolbar-item__label">Rotate</span>
                </li>`
              : ''}
            <li class="toolbar-item">
              <ttp-button-select
                name="toolbarTableLinen"
                value="${this.props.tableLinen}"
                list=${this.getTablesLinenDropdown}
                select-style="toolbar"
              ></ttp-button-select>
              <span class="toolbar-item__label">Table Linen</span>
            </li>
            <li class="toolbar-item toolbar-item--add-chairs">
              <div class="chairs-icon" @click=${this.onShowAddChairsInput}>
                <div class="toolbar-item__icon">
                  <ttp-svg-icon-loader
                    src="/assets/icons/toolbar-add-chairs.svg"
                  ></ttp-svg-icon-loader>
                </div>
                <span class="toolbar-item__label">Chairs</span>
              </div>
              <div
                data-js="add-chairs"
                class="input-add-chairs ${this.props.tableChairsCount > 0
                  ? 'show'
                  : ''}"
              >
                <div class="form-add-chairs">
                  <ttp-input
                    name="${this.props.assetId}_addChairs_${this.props
                      .assetType}"
                    value=${this.props.assetType === ENUM_SHAPES.ROUND
                      ? chairsValue
                      : chairsValueRectangular}
                    input-id="${this.props.assetId}_addChairs_${this.props
                      .assetType}"
                    maxlength="2"
                    input-style="toolbar"
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
                    <button @click=${this.onResetChairs}>
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
            </li>
            ${this.props.tableChairsCount > 0
              ? html`<li class="toolbar-item">
                  <ttp-button-select
                    name="toolbarTableChairNameSelected"
                    value=${this.getTableChairsTitle}
                    list=${this.getTableChairsDropdown}
                    select-style="toolbar"
                  ></ttp-button-select>
                  <span class="toolbar-item__label">Chair Type</span>
                </li>`
              : ''}
            ${this.props.isBulk
              ? html`<li class="toolbar-item toolbar-item--duplicate">
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
              : html`<li class="toolbar-item toolbar-item--duplicate">
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
                  <div data-js="duplicate" class="input-duplicate-wrapper">
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
              class="toolbar-item toolbar-item--remove"
              @click=${this.onRemoveAsset}
            >
              <div class="toolbar-item__icon">
                <ttp-svg-icon-loader
                  src="/assets/icons/trash.svg"
                ></ttp-svg-icon-loader>
              </div>
              <span class="toolbar-item__label">Remove</span>
            </li>
          </ul>
        `;
      },
    })
  );
}
