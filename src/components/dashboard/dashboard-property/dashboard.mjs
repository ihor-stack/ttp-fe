import { createButtonSelectComponent } from '../../elements/button-select/button-select.mjs';
import { createInputComponent } from '../../elements/input/input.mjs';
import { createTooltipComponent } from '../../elements/tooltip/tooltip.mjs';
import {
  DASHBOARD_COLLUMN_DEFS,
  SVG_PAGINATE_NEXT,
  SVG_PAGINATE_PREV,
  LOAD_STYLES,
  HEIGHT_BODY,
  HEIGHT_PAGINATION,
  TABLE_ID,
  TABLE_LENGTH,
} from './constants.mjs';

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.loadStyles loadstyle func
 * @param  {object} webcomponent.api api
 */
export function createDashboardComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  api,
}) {
  createComponent(
    'ttp-dashboard',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',

      state() {
        return {
          properties: [],
          sort: 'sort',
          isEmpty: false,
        };
      },

      async mounted() {
        loadStyles({
          component: this,
          src: LOAD_STYLES,
        });

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          async () => {
            await this.loadDataTable({ isResize: false });

            //Add listeners once
            this.tableListeners();
            //Hide loader has a delay of 300ms
            eventBus.publish('ttp-hide-loader', {
              component: 'ttp-planner',
              resp: 'OK',
            });
          }
        );

        this.ttpSearchUnsubscribe = eventBus.subscribe('ttp-input', data => {
          if (data.method === 'onInput' && data.name === 'search') {
            this.table.search(data.value).draw();
          }
        });

        this.ttpSortUnsubscribe = eventBus.subscribe(
          'ttp-button-select',
          data => {
            this.setState(state => {
              return { ...state, [data.name]: data.value };
            });

            if (data.name === 'sort') {
              this.table.order([0, data.value]).draw();
            }
          }
        );
      },

      async created() {
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };

        createInputComponent({ ...propsForComponents });
        createButtonSelectComponent({ ...propsForComponents });
        createTooltipComponent({ ...propsForComponents });
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
        this.ttpSearchUnsubscribe();
        this.ttpSortUnsubscribe();
      },

      handleActionMenu(id) {
        const findRow = this.shadowRoot.getElementById(id);
        const actionTd = findRow.querySelector('[data-event="actions"]');

        this.hideActionMenus();

        actionTd.classList.add('active');
      },

      hideActionMenus() {
        const getAllMenus = this.shadowRoot.querySelectorAll(
          '.active[data-event="actions"]'
        );

        getAllMenus.forEach(menu => {
          menu.classList.remove('active');
        });
      },

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

      tableListeners() {
        //Show/hide action menu
        this.table.on('click', '[data-event="event-actions-icon"]', event => {
          const target = event.currentTarget;

          const tr = target.closest('tr');
          const id = tr.id;
          this.handleActionMenu(id);
        });

        this.table.on('click', '[data-event="show-avatars"]', event => {
          const target = event.currentTarget;

          this.handleShowHiddenMembers(target);

          setTimeout(() => this.handleHideAllHiddenMembers(), 5000);
        });

        this.table.on(
          'mouseenter',
          '[data-event="event-actions-icon"]',
          event => {
            this.onShowTooltip(event, 10);
          }
        );

        this.table.on(
          'mouseleave',
          '[data-event="event-actions-icon"]',
          event => {
            this.onHideTooltip(event);
          }
        );
      },

      handleShowHiddenMembers(target) {
        const tr = target.closest('tr');
        const id = tr.id;
        const index = Number(id?.replace('dashboard_tr_', ''));

        this.setState(state => {
          const properties = this.state.properties.map((item, i) => ({
            ...item,
            showHidden: index === i,
          }));

          return { ...state, properties };
        });

        const avatarsHidden = target
          .closest('.dashboard-table__avatar-wrapper')
          .querySelectorAll('.dashboard-table__avatar-hidden');

        avatarsHidden.forEach(element => {
          element.style.display = 'flex';
        });
        target.style.display = 'none';

        this.loadDataTable({ isResize: true });
      },

      handleHideAllHiddenMembers() {
        this.setState(state => {
          const properties = this.state.properties.map(item => ({
            ...item,
            showHidden: false,
          }));

          return { ...state, properties };
        });

        const avatarsHidden = this.shadowRoot.querySelectorAll(
          '.dashboard-table__avatar-hidden'
        );

        avatarsHidden.forEach(element => {
          element.style.display = 'none';
        });

        const avatarsAmountHiddenButton = this.shadowRoot.querySelectorAll(
          '.dashboard-table__avatar-amount'
        );

        avatarsAmountHiddenButton.forEach(element => {
          element.style.display = 'flex';
        });

        this.loadDataTable({ isResize: true });
      },

      async getProperties() {
        let data = await api.getProperties();

        this.setState(state => {
          return { ...state, properties: [...data] };
        });

        return data;
      },

      async loadDataTable({ isResize = false }) {
        const dashboard = this;
        const shadowRoot = this.shadowRoot;

        let data;

        if (isResize) {
          data = this.state.properties;
        } else {
          data = await this.getProperties();
        }

        const tableEl = shadowRoot.getElementById(TABLE_ID);

        this.table = new window.DataTable(tableEl, {
          destroy: true,
          autoWidth: false,
          data: data,

          scrollX: true,
          scrollCollapse: true,
          scroller: true,
          columnDefs: DASHBOARD_COLLUMN_DEFS,

          language: {
            emptyTable: 'No Properties have been added yet.',
            info: '_PAGE_ of _PAGES_',
            paginate: {
              next: SVG_PAGINATE_NEXT,
              previous: SVG_PAGINATE_PREV,
            },
          },

          infoCallback: function (settings, start, end, max, total, pre) {
            const api = this.api();
            const pageInfo = api.page.info();
            const tableInfo = shadowRoot.querySelector('.table-info');
            const paginateInfo = shadowRoot.querySelector('.paginate_info');
            const scrollBody = settings.nScrollBody;
            const hasPagination = total >= TABLE_LENGTH;

            scrollBody.style.maxHeight = `calc(100vh - ${HEIGHT_BODY} - ${
              hasPagination ? HEIGHT_PAGINATION : '0px'
            })`;
            tableInfo.style.display = hasPagination ? 'flex' : 'none';

            dashboard.setState(state => {
              return { ...state, isEmpty: !total };
            });

            if (!hasPagination) return;

            const str = pageInfo.page + 1 + ' of ' + pageInfo.pages;

            if (paginateInfo) {
              paginateInfo.innerHTML = str;
            } else {
              const paginateButtonPrev = shadowRoot.querySelector(
                '.paginate_button.previous'
              );

              const span = document.createElement('span');
              span.classList.add('paginate_info');
              span.innerHTML = str;

              paginateButtonPrev.after(span);
            }
          },

          createdRow: function (row, data, index) {
            // set id for each row
            row.id = `dashboard_tr_${index}`;
          },

          info: true,
          paging: true,
          pagingType: 'simple',
          pageLength: TABLE_LENGTH,
          // lengthChange: false,
          dom: 't<".table-info"ip>',
        });
      },

      render() {
        return html`
          <div class="dashboard-wrapper">
            <div class="dashboard-container">
              <div class="dashboard-header">
                <div class="dashboard-header__title">Properties</div>
                <div class="dashboard-header__search">
                  <ttp-input
                    type="text"
                    name="search"
                    input-id="search"
                    placeholder="search"
                    autocomplete="off"
                    post-fix-icon="/assets/icons/search.svg"
                    required
                    class="input-full input-light"
                  ></ttp-input>
                </div>
                <div class="dashboard-header__sort">
                  <ttp-button-select
                    name="sort"
                    value=${this.state.sort}
                    list="${JSON.stringify([
                      { value: 'desc', title: 'desc' },
                      { value: 'asc', title: 'asc' },
                    ])}"
                    id="sort"
                    class="btn-select-link"
                  ></ttp-button-select>
                </div>
                <div class="dashboard-header__button">
                  <button class="btn-primary btn-lg">Add a Property</button>
                </div>
              </div>

              <div
                class="dashboard-table__wrapper ${this.state.isEmpty
                  ? 'table__empty'
                  : ''}"
                style="width: 100%"
              >
                <table
                  id="dashboard-table"
                  class="dashboard-table nowrap"
                  width="100%"
                >
                  <thead>
                    <tr>
                      <th class="resizable" data-column="property">Property</th>
                      <th class="resizable" data-column="brand">Brand</th>
                      <th data-column="members">Members</th>
                      <th class="resizable" data-column="added">Added</th>
                      <th class="resizable" data-column="addedBy">Added by</th>
                      <th class="resizable" data-column="status">Status</th>
                      <th class="th-action" data-column="action">Action</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
