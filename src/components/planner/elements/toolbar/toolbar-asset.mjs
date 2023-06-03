import { createToolbarComponent } from '../../../elements/elements.mjs';
import { ENUM_CATEGORY, ENUM_SETUP_TYPE } from '../../enums.mjs';
import { createToolbarChairComponent } from './toolbar-chair.mjs';
import { createToolbarTableComponent } from './toolbar-table.mjs';
import { createToolbarSetupTheaterComponent } from './toolbar-setup-theater.mjs';
import { createToolbarSetupClassroomComponent } from './toolbar-setup-classroom.mjs';
import { createToolbarGeneralComponent } from './toolbar-general.mjs';
import { createToolbarSetupBanquetComponent } from './toolbar-setup-banquet.mjs';
/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createToolbarAssetComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-toolbar-asset',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          // toolbarTableLinenSelected: 'None',
          width: 0,
        };
      },
      props: {
        isToolbarVisible: {
          type: Boolean,
          default: true,
        },
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
        isSimpleToolbar: {
          type: Boolean,
          default: false,
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
        setup: {
          type: String,
          default: '',
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
        createToolbarComponent({ ...propsForComponents });
        createToolbarChairComponent({ ...propsForComponents });
        createToolbarTableComponent({ ...propsForComponents });
        createToolbarSetupTheaterComponent({ ...propsForComponents });
        createToolbarGeneralComponent({ ...propsForComponents });
        createToolbarSetupClassroomComponent({ ...propsForComponents });
        createToolbarSetupBanquetComponent({ ...propsForComponents });
      },

      updated() {
        // Adjusting the size of the toolbar, to calculate properly the position
        if (this.props.assetId.length && this.props.isToolbarVisible) {
          // console.log('this.pros', this.props, this.props.assetRotation);
          const body = this.querySelector('[slot="body"]');
          const width = body.getBoundingClientRect().width;

          if (this.state.width !== width) {
            this.setState(state => {
              return { ...state, width };
            });
          }
        }
      },

      render() {
        return html`
          <ttp-toolbar
            is-toolbar-visible=${this.props.isToolbarVisible}
            asset-id=${this.props.isBulk
              ? 'main-selection'
              : this.props.assetId}
            child-width=${this.state.width}
          >
            <div slot="body">
              ${!this.props.isSimpleToolbar &&
              this.props.assetCategory === ENUM_CATEGORY.CHAIR
                ? html`<ttp-toolbar-chair
                    is-bulk=${this.props.isBulk}
                    bulk-assets-ids=${this.props.bulkAssetsIds}
                    asset-category=${this.props.assetCategory}
                    asset-type=${this.props.assetType}
                    asset-id=${this.props.assetId}
                    asset-rotation=${this.props.assetRotation}
                    chairs=${this.props.chairs}
                  ></ttp-toolbar-chair>`
                : ''}
              ${!this.props.isSimpleToolbar &&
              this.props.assetCategory === ENUM_CATEGORY.TABLE
                ? html`<ttp-toolbar-table
                    is-bulk=${this.props.isBulk}
                    bulk-assets-ids=${this.props.bulkAssetsIds}
                    asset-category=${this.props.assetCategory}
                    asset-type=${this.props.assetType}
                    asset-id=${this.props.assetId}
                    asset-rotation=${this.props.assetRotation}
                    chairs=${this.props.chairs}
                    tables=${this.props.tables}
                    linens=${this.props.linens}
                    table-chairs-count=${this.props.tableChairsCount}
                    table-chairs-type=${this.props.tableChairsType}
                    table-linen=${this.props.tableLinen}
                  ></ttp-toolbar-table>`
                : ''}
              ${!this.props.isSimpleToolbar &&
              this.props.assetCategory === ENUM_CATEGORY.SETUP &&
              this.props.assetType === ENUM_SETUP_TYPE.THEATER
                ? html`<ttp-toolbar-setup-theater
                    is-bulk=${this.props.isBulk}
                    bulk-assets-ids=${this.props.bulkAssetsIds}
                    asset-category=${this.props.assetCategory}
                    asset-type=${this.props.assetType}
                    asset-id=${this.props.assetId}
                    setup=${this.props.setup}
                    asset-rotation=${this.props.assetRotation}
                    chairs=${this.props.chairs}
                  ></ttp-toolbar-setup-theater>`
                : ''}
              ${!this.props.isSimpleToolbar &&
              this.props.assetCategory === ENUM_CATEGORY.SETUP &&
              this.props.assetType === ENUM_SETUP_TYPE.CLASSROOM
                ? html`<ttp-toolbar-setup-classroom
                    is-bulk=${this.props.isBulk}
                    bulk-assets-ids=${this.props.bulkAssetsIds}
                    asset-category=${this.props.assetCategory}
                    asset-type=${this.props.assetType}
                    asset-id=${this.props.assetId}
                    setup=${this.props.setup}
                    asset-rotation=${this.props.assetRotation}
                    chairs=${this.props.chairs}
                    tables=${this.props.tables}
                    linens=${this.props.linens}
                    table-chairs-count=${this.props.tableChairsCount}
                    table-chairs-type=${this.props.tableChairsType}
                    table-linen=${this.props.tableLinen}
                  ></ttp-toolbar-setup-classroom>`
                : ''}
              ${!this.props.isSimpleToolbar &&
              this.props.assetCategory === ENUM_CATEGORY.SETUP &&
              this.props.assetType === ENUM_SETUP_TYPE.BANQUET
                ? html`<ttp-toolbar-setup-banquet
                    is-bulk=${this.props.isBulk}
                    bulk-assets-ids=${this.props.bulkAssetsIds}
                    asset-category=${this.props.assetCategory}
                    asset-type=${this.props.assetType}
                    asset-id=${this.props.assetId}
                    setup=${this.props.setup}
                    asset-rotation=${this.props.assetRotation}
                    chairs=${this.props.chairs}
                    tables=${this.props.tables}
                    linens=${this.props.linens}
                    table-chairs-count=${this.props.tableChairsCount}
                    table-chairs-type=${this.props.tableChairsType}
                    table-linen=${this.props.tableLinen}
                  ></ttp-toolbar-setup-banquet>`
                : ''}
              ${this.props.isSimpleToolbar && this.props.isBulk
                ? html`<ttp-toolbar-general
                    is-bulk=${this.props.isBulk}
                    bulk-assets-ids=${this.props.bulkAssetsIds}
                    asset-id=${this.props.assetId}
                  ></ttp-toolbar-general>`
                : ''}
            </div>
          </ttp-toolbar>
        `;
      },
    })
  );
}
