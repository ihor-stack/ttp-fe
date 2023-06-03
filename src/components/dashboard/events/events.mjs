import { createEventEditModalComponent } from './elements/event-edit-modal.mjs';
import { createEventDuplicateModalComponent } from './elements/event-duplicate-modal.mjs';
import { createEventDeleteModalComponent } from './elements/event-delete-modal.mjs';
import { createTooltipComponent } from '../../elements/tooltip/tooltip.mjs';

const DataTable = window.DataTable;

const ENUM_ACTION_TYPES = {
  DETAILS: 'details',
  DUPLICATE: 'duplicate',
  LAUNCH_PLANNER: 'launch',
  DELETE: 'delete',
};

const ENUM_TABS = {
  ALL: 'all',
  FAVORITES: 'favorites',
};

const ENUM_TABLE_ID = 'events-table';

const jQuery = window.jQuery;
/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.loadStyles loadstyle func
 * @param  {object} webcomponent.eventsApi events api
 */
export function createEventsComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  eventsApi,
}) {
  createComponent(
    'ttp-events',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',

      state() {
        return {
          isEventEditModal: false,
          isEventEditModalAnimate: false,
          isEventDuplicateModal: false,
          isEventDuplicateModalAnimate: false,
          isEventDeleteModal: false,
          isEventDeleteModalAnimate: false,
          events: [],
          activeTab: ENUM_TABS.ALL,
          tableHeight: 0,
          tableWidth: 0,
          scrollPos: 0,
        };
      },

      async created() {
        this.search = window.location.search;

        let params = new URLSearchParams(this.search);
        this.eventId = params.get('id');

        this.readOnlyEventId = params.get('e');

        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createEventEditModalComponent({ ...propsForComponents });
        createEventDuplicateModalComponent({ ...propsForComponents });
        createEventDeleteModalComponent({ ...propsForComponents });
        createTooltipComponent({ ...propsForComponents });
      },

      async mounted() {
        loadStyles({
          component: this,
          src: [
            '/assets/css/components/events.css',
            'https://cdn.jsdelivr.net/npm/js-datepicker@5.18.0/dist/datepicker.min.css',
            'https://cdn.jsdelivr.net/npm/jqueryui@1.11.1/jquery-ui.min.css',
            'https://cdn.datatables.net/v/dt/dt-1.12.1/sc-2.0.7/datatables.min.css',
          ],
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

        this.ttpEventEditModalUnsubscribe = eventBus.subscribe(
          'ttp-event-edit-modal',
          data => {
            if (data.method === 'hideEventPlanModal') {
              this.setState(state => {
                return { ...state, isEventEditModalAnimate: data.value };
              });
              setTimeout(() => {
                this.setState(state => {
                  return { ...state, isEventEditModal: data.value };
                });
              }, 200);
            }

            if (data.method === 'updateEvent') {
              const { id, title, startDate, endDate } = data.data;

              this.updateEvent(id, title, startDate, endDate);
            }
          }
        );

        this.ttpEventDuplicateModalUnsubscribe = eventBus.subscribe(
          'ttp-event-duplicate-modal',
          data => {
            if (data.method === 'hideEventPlanModal') {
              this.setState(state => {
                return { ...state, isEventDuplicateModalAnimate: data.value };
              });
              setTimeout(() => {
                this.setState(state => {
                  return { ...state, isEventDuplicateModal: data.value };
                });
              }, 200);
            }

            if (data.method === 'duplicateEvent') {
              const { id, title, startDate, endDate } = data.data;

              this.duplicateEvent(id, title, startDate, endDate);
            }
          }
        );

        this.ttpEventDeleteModalUnsubscribe = eventBus.subscribe(
          'ttp-event-delete-modal',
          data => {
            if (data.method === 'hideEventPlanModal') {
              this.setState(state => {
                return { ...state, isEventDeleteModalAnimate: data.value };
              });
              setTimeout(() => {
                this.setState(state => {
                  return { ...state, isEventDeleteModal: data.value };
                });
              }, 200);
            }

            if (data.method === 'deleteEvent') {
              const { id } = data.data;

              this.deleteEvent(id);
            }
          }
        );
      },

      removed() {
        //Destroy the table and event listeners
        this.table.destroy(true);
        this.ttpStylesLoadedUnsubscribe();
        this.ttpEventEditModalUnsubscribe();
        this.ttpEventDuplicateModalUnsubscribe();
        this.ttpEventDeleteModalUnsubscribe();
      },

      async loadDataTable({ isResize = false }) {
        const ttpEvent = this;
        const shadowRoot = ttpEvent.shadowRoot;

        let data;
        if (isResize) {
          data = this.state.events;
        } else {
          data = await this.getEvents();
        }

        const tableEl = this.shadowRoot.getElementById(ENUM_TABLE_ID);

        const tableWrapper = this.shadowRoot.querySelector(
          '.events-table-wrapper'
        );

        const getBoundingBox = tableWrapper.getBoundingClientRect();
        let getHeight =
          this.state.tableHeight === 0
            ? getBoundingBox.height - 120
            : this.state.tableHeight;

        this.columnDefs = this.getColumnDefs();

        if (data.length) {
          // Adjust any columnDef widths set by the user
          this.setUserColumnsDefWidths();
        } else {
          this.resetUserColumnsDefWidths();
        }

        this.table = new DataTable(tableEl, {
          destroy: true,
          autoWidth: false,
          data: data,

          scrollY: getHeight + 'px',
          scrollX: true,
          scrollCollapse: true,
          scroller: true,
          stateSave: true,
          columnDefs: this.columnDefs,
          language: {
            emptyTable: 'No Events have been planned yet.',
            info: '_PAGE_ of _PAGES_',
            paginate: {
              first: '<<',
              last: '>>',
              next: "<svg width='8' height='14' viewBox='0 0 8 14' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1 13L7 7L1 1' stroke-linecap='round' stroke-linejoin='round'/></svg>",
              previous:
                "<svg width='8' height='14' viewBox='0 0 8 14' fill='none'><path d='M7 1L0.999999 7L7 13'  stroke-linecap='round' stroke-linejoin='round'/></svg>",
            },
          },

          infoCallback: function (settings, start, end, max, total, pre) {
            const api = this.api();
            const pageInfo = api.page.info();

            const str = pageInfo.page + 1 + ' of ' + pageInfo.pages;
            const span = document.createElement('span');
            span.classList.add('paginate_info');
            span.innerHTML = str;

            if (jQuery('.paginate_info').length > 0) {
              jQuery('.paginate_info').html(str);
            } else {
              const paginateButtonPrev = shadowRoot.querySelector(
                '.paginate_button.previous'
              );
              paginateButtonPrev.after(span);
            }

            const tableInfo = shadowRoot.querySelector('.table-info');
            if (pageInfo.pages === 1 || pageInfo.pages === 0) {
              tableInfo.classList.add('hide');
            } else {
              tableInfo.classList.remove('hide');
            }
            return '';
          },

          createdRow: function (row, data, index) {
            // set id for each row
            row.id = data.id;
          },

          initComplete: function () {
            if (data.length) {
              const el = jQuery('ttp-events')[0].shadowRoot;
              const tableJq = jQuery(el).find(
                '#events-table_wrapper .dataTables_scrollHead thead th.resizable'
              );

              const tableAlso = jQuery(el).find(
                '#events-table_wrapper .dataTables_scrollHead table'
              );

              const scrollBody = jQuery(el).find(
                `#events-table_wrapper .dataTables_scrollBody`
              )[0];

              jQuery(scrollBody).scrollTop(ttpEvent.state.scrollPos);

              jQuery(tableJq).resizable({
                handles: 'e',
                alsoResize: tableAlso,
                minWidth: 150,
                resize: function (e, ui) {
                  const data = this.getAttribute('data-column');
                  const hiddenTh = jQuery(el).find(
                    `#events-table_wrapper .dataTables_scrollBody th[data-column="${data}"]`
                  )[0];
                  hiddenTh.style.width = ui.size.width + 'px';
                  // ttpEvent.table.columns.adjust();
                  // ttpEvent.saveColumnSettings();
                  // ttpEvent.loadDataTable(true);
                },
                stop: function (e, ui) {
                  ttpEvent.saveColumnSettings();
                  ttpEvent.loadDataTable({ isResize: true });
                },
              });
            }
          },

          searching: false,

          info: true,

          paging: true,
          pagingType: 'simple',
          pageLength: 25,
          ordering: false,
          // dom: '<".table-actions"lBr>t<".table-info"ip>',
          dom: 't<".table-info"ip>',
        });

        this.setEmptyText(data);
      },

      tableListeners() {
        const tableWrapper = this.shadowRoot.querySelector(
          '.events-table-wrapper'
        );

        let ro = new ResizeObserver(entries => {
          for (let entry of entries) {
            const cr = entry.contentRect;
            // console.log('Element:', entry.target);
            // console.log(`Element size: ${cr.width}px x ${cr.height}px`);
            // console.log(`Element padding: ${cr.top}px ; ${cr.left}px`);

            const tableHeight = cr.height - 120;
            const tableWidth = cr.width;
            if (this.state.tableHeight !== tableHeight) {
              this.setTableHeight(tableHeight);
            }

            if (this.state.tableWidth !== tableWidth) {
              this.setTableWidth(tableWidth);

              localStorage.removeItem(ENUM_TABLE_ID);
              this.loadDataTable({ isResize: true });
            }
          }
        });

        ro.observe(tableWrapper);

        // Click on the title
        this.table.on('click', '[data-event="title"]', event => {
          const target = event.currentTarget;
          const tr = target.closest('tr');
          const id = tr.id;
          this.navigateToEvent(id);
        });

        // @mouseenter=${ev => this.onShowTooltip(ev, 10)}
        //     @mouseleave=${this.onHideTooltip}

        this.table.on('click', '[data-event="favorite"]', event => {
          const target = event.currentTarget;
          const tr = target.closest('tr');
          const id = tr.id;
          this.handleFavorite(id);
        });

        this.table.on('mouseenter', '[data-event="favorite"]', event => {
          this.onShowTooltip(event, 10);
        });

        this.table.on('mouseleave', '[data-event="favorite"]', event => {
          this.onHideTooltip(event);
        });

        //Show/hide action menu
        this.table.on('click', '[data-event="event-actions-icon"]', event => {
          const target = event.currentTarget;

          const tr = target.closest('tr');
          const id = tr.id;
          this.handleActionMenu(id);
        });

        //Show/hide action menu
        this.table.on('click', '[data-event="action-menu"]', event => {
          const target = event.target;
          const tr = target.closest('tr');
          const id = tr.id;
          const actionType = target.getAttribute('data-action-menu');
          switch (actionType) {
            case ENUM_ACTION_TYPES.DETAILS: {
              this.handleActionMenu(id);
              const event = this.state.events.filter(
                event => event.id === id && event
              )[0];

              this.setState(state => {
                return { ...state, isEventEditModal: true, event };
              });
              setTimeout(() => {
                this.setState(state => {
                  return { ...state, isEventEditModalAnimate: true };
                });
              }, 0);
              break;
            }
            case ENUM_ACTION_TYPES.DUPLICATE: {
              this.handleActionMenu(id);
              const event = this.state.events.filter(
                event => event.id === id && event
              )[0];

              const newEvent = Object.assign({}, event);
              newEvent.title = `COPY ${newEvent.title}`;

              this.setState(state => {
                return {
                  ...state,
                  isEventDuplicateModal: true,
                  event: newEvent,
                };
              });
              setTimeout(() => {
                this.setState(state => {
                  return {
                    ...state,
                    isEventDuplicateModalAnimate: true,
                  };
                });
              }, 0);
              break;
            }
            case ENUM_ACTION_TYPES.LAUNCH_PLANNER: {
              this.navigateToEvent(id);
              break;
            }
            case ENUM_ACTION_TYPES.DELETE: {
              this.handleActionMenu(id);
              const event = this.state.events.filter(
                event => event.id === id && event
              )[0];

              this.setState(state => {
                return { ...state, isEventDeleteModal: true, event };
              });
              setTimeout(() => {
                this.setState(state => {
                  return { ...state, isEventDeleteModalAnimate: true };
                });
              }, 0);
              break;
            }
          }
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

        this.table.on('draw', () => {
          // console.log('Redraw occurred at: ' + new Date().getTime());
          // var hash = Math.round(_dtSettings.oScroller.s.baseRowTop);
        });
      },

      setTableHeight(height) {
        this.setState(state => {
          return { ...state, tableHeight: height };
        });
      },

      setTableWidth(width) {
        this.setState(state => {
          return { ...state, tableWidth: width };
        });
      },

      setEmptyText(data) {
        const tableEl = this.shadowRoot.getElementById(ENUM_TABLE_ID);

        if (tableEl) {
          if (this.state.activeTab === ENUM_TABS.ALL) {
            if (!data.length) {
              tableEl.classList.add('events-table--no-events');
            }
          } else {
            if (!data.length) {
              const emptyText =
                this.shadowRoot.querySelector('.dataTables_empty');

              if (emptyText) {
                emptyText.innerHTML = 'No Favorite Events';
              }
            }
          }
        }
      },

      setUserColumnsDefWidths() {
        let userColumnDef;

        // Get the settings for this table from localStorage
        let userColumnDefs =
          JSON.parse(localStorage.getItem(ENUM_TABLE_ID)) || [];

        if (userColumnDefs.length === 0) return;

        this.columnDefs.forEach(function (columnDef) {
          // Check if there is a width specified for this column
          userColumnDef = userColumnDefs.find(function (column) {
            return column.targets === columnDef.targets[0];
          });

          // If there is, set the width of this columnDef in px
          if (userColumnDef) {
            columnDef.width = userColumnDef.width + 'px';
          }
        });
      },

      resetUserColumnsDefWidths() {
        this.columnDefs = this.getColumnDefs();
      },

      getColumnDefs() {
        const columnDefs = [
          {
            targets: [0],
            // width: '3%',
            data: function (row, type, val, meta) {
              const isFav = row.favorite;
              const favText = isFav ? 'Unfavorite' : 'Favorite';
              const icon = `<div class="event-fav ${
                isFav ? 'event-fav--fav' : ''
              }" data-event="favorite" data-is-favorite="${isFav}"><svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 17L6.87192 11.403L1 17V1H13V17Z"  stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <ttp-tooltip title="${favText}" position="right"></ttp-tooltip>
                </div>`;

              return icon;
            },
            createdCell: function (td, cellData, rowData, row, col) {
              td.id = `td_${rowData.id}`;
              td.classList.add('td-favorite');
            },
          },
          {
            targets: [1],
            // width: '40%',
            data: function (row, type, val, meta) {
              const title = `<div class="td-resizable">${row.title}</div>`;
              return title;
            },
            createdCell: function (td, cellData, rowData, row, col) {
              td.setAttribute('data-event', 'title');
              td.classList.add('event-title');
              td.classList.add('resizable');
              td.setAttribute('data-column', 'title');
            },
          },
          {
            targets: [2],
            // width: '15%',
            data: function (row, type, val, meta) {
              const date = `<div class="td-resizable">${row.date}</div>`;
              return date;
            },
            createdCell: function (td, cellData, rowData, row, col) {
              td.setAttribute('data-column', 'date');
              td.classList.add('resizable');
            },
          },
          {
            targets: [3],
            // width: '15%',
            data: function (row, type, val, meta) {
              const time = `<div class="td-resizable">${row.time}</div>`;
              return time;
            },
            createdCell: function (td, cellData, rowData, row, col) {
              td.setAttribute('data-column', 'time');
              td.classList.add('resizable');
            },
          },
          {
            targets: [4],
            // width: '20%',
            data: function (row, type, val, meta) {
              const roomName = `<div class="td-resizable">${row.roomName}</div>`;
              return roomName;
            },
            createdCell: function (td, cellData, rowData, row, col) {
              td.setAttribute('data-column', 'room');
              // td.classList.add('resizable');
            },
          },
          {
            targets: [5],
            // width: '7%',
            data: function (row, type, val, meta) {
              const favText = row.favorite ? 'Unfavorite' : 'Favorite';
              const actionIcon = `<div class="event-actions" data-event="actions">
                  <div class="event-actions-icon"  data-event="event-actions-icon"><svg width="18" height="4" viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.49783 3.5C2.32506 3.5 2.99566 2.82843 2.99566 2C2.99566 1.17157 2.32506 0.5 1.49783 0.5C0.670601 0.5 0 1.17157 0 2C0 2.82843 0.670601 3.5 1.49783 3.5Z" fill="#333333"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.99978 3.5C9.82701 3.5 10.4976 2.82843 10.4976 2C10.4976 1.17157 9.82701 0.5 8.99978 0.5C8.17255 0.5 7.50195 1.17157 7.50195 2C7.50195 2.82843 8.17255 3.5 8.99978 3.5Z" fill="#333333"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5017 3.5C17.329 3.5 17.9996 2.82843 17.9996 2C17.9996 1.17157 17.329 0.5 16.5017 0.5C15.6745 0.5 15.0039 1.17157 15.0039 2C15.0039 2.82843 15.6745 3.5 16.5017 3.5Z" fill="#333333"/>
                  </svg><ttp-tooltip title="More Actions" position="left"></ttp-tooltip></div>
                  <ul class="event-actions-menu" data-event="action-menu">
                    <li class="event-actions-menu__item" data-action-menu="launch">Launch in Planner</li>
                    <li class="event-actions-menu__item" data-action-menu="details">View Details</li>
                    <li class="event-actions-menu__item" data-action-menu="duplicate">Duplicate</li>
                    <li class="event-actions-menu__item" data-action-menu="delete">Delete</li>
                  </ul>

                </div>
                `;
              return actionIcon;
            },
            createdCell: function (td, cellData, rowData, row, col) {
              td.classList.add('td-action');
            },
          },
        ];
        return columnDefs;
      },

      saveColumnSettings() {
        const userColumnDefs =
          JSON.parse(localStorage.getItem(ENUM_TABLE_ID)) || [];

        let width, header, existingSetting;

        this.table.columns().every(function (targets) {
          // Check if there is a setting for this column in localStorage
          existingSetting = userColumnDefs.findIndex(function (column) {
            return column.targets === targets;
          });

          // Get the width of this column
          header = this.header();
          width = jQuery(header).width();

          if (existingSetting !== -1) {
            // Update the width
            userColumnDefs[existingSetting].width = width;
          } else {
            // Add the width for this column
            userColumnDefs.push({
              targets: targets,
              width: width,
            });
          }
        });

        // Save (or update) the settings in localStorage
        localStorage.setItem(ENUM_TABLE_ID, JSON.stringify(userColumnDefs));
      },

      async duplicateEvent(id, title, startDate, endDate) {
        await eventsApi.duplicateEvent(id, title, startDate, endDate);
        this.setState(state => {
          return { ...state, isEventDuplicateModalAnimate: false };
        });
        setTimeout(() => {
          this.setState(state => {
            return { ...state, isEventDuplicateModal: false };
          });
        }, 200);

        this.loadDataTable({ isResize: false });
      },

      async deleteEvent(id) {
        await eventsApi.deleteEvent(id);

        this.setState(state => {
          return { ...state, isEventDeleteModalAnimate: false };
        });
        setTimeout(() => {
          this.setState(state => {
            return { ...state, isEventDeleteModal: false };
          });
        }, 200);

        this.loadDataTable({ isResize: false });
      },

      async updateEvent(id, title, startDate, endDate) {
        const data = await eventsApi.updateEvent(id, title, startDate, endDate);

        this.setState(state => {
          return { ...state, isEventEditModalAnimate: false };
        });

        setTimeout(() => {
          this.setState(state => {
            return { ...state, isEventEditModal: false };
          });
        }, 200);

        const findTr = this.shadowRoot.getElementById(id);

        this.table.row(findTr).data(data).draw();

        //???? Update app event state, when there is an update in the row,
        // to prevent make another api call
        await this.getEvents();
      },

      async getEvents() {
        let data;
        if (this.state.activeTab === ENUM_TABS.ALL) {
          data = await this.getAllEvents();
        } else {
          data = await this.getFavoriteEvents();
        }
        this.setState(state => {
          return { ...state, events: [...data] };
        });
        return data;
      },

      async getAllEvents() {
        return await eventsApi.getEvents();
      },

      async getFavoriteEvents() {
        return await eventsApi.getFavoriteEvents();
      },

      async handleFavorite(id) {
        const findTr = this.shadowRoot.getElementById(id);
        const target = findTr.querySelector('[data-event="favorite"]');

        const getFav = target.getAttribute('data-is-favorite');
        const isFav = getFav === 'true' && true;

        if (this.state.activeTab === ENUM_TABS.ALL) {
          if (isFav) {
            const data = await this.unSetFavorite(id);

            this.table.row(findTr).data(data);
          } else {
            const data = await this.setFavorite(id);

            this.table.row(findTr).data(data);
          }
        } else {
          if (isFav) {
            await this.unSetFavorite(id);
          } else {
            await this.setFavorite(id);
          }
          this.loadDataTable({ isResize: false });
        }
      },

      async setFavorite(id) {
        return await eventsApi.setFavorite(id);
      },

      async unSetFavorite(id) {
        return await eventsApi.unSetFavorite(id);
      },

      handleActionMenu(id) {
        const findRow = this.shadowRoot.getElementById(id);
        const actionTd = findRow.querySelector('[data-event="actions"]');
        const isShown = actionTd.classList.contains('active');

        this.hideOpenActionMenus();
        if (isShown) {
          actionTd.classList.remove('active');
        } else {
          actionTd.classList.add('active');
        }
      },

      hideOpenActionMenus() {
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

      async setTab(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const tab = target.dataset.tab;

        if (this.state.activeTab !== tab) {
          this.setState(state => {
            return { ...state, activeTab: tab };
          });
          this.loadDataTable({ isResize: false });
        }
      },

      launchPlanner() {
        eventBus.publish('navigation', {
          toHref: '/pre-planner',
        });
      },

      navigateToEvent(id) {
        eventBus.publish('navigation', {
          toHref: `/planner`,
          params: `?id=${id}`,
        });
      },

      render() {
        return html`
          <div class="events-wrapper">
            <div class="events-container">
              <div class="events-header">
                <div class="events-tabs">
                  <div
                    class="events-tabs__item ${
                      this.state.activeTab === ENUM_TABS.ALL ? 'active' : ''
                    }"
                    @click=${this.setTab}
                    data-tab=${ENUM_TABS.ALL}
                  >
                    All
                  </div>
                  <div
                  @click=${this.setTab}
                  data-tab=${ENUM_TABS.FAVORITES}
                  class="events-tabs__item ${
                    this.state.activeTab === ENUM_TABS.FAVORITES ? 'active' : ''
                  }"">Favorites</div>
                  <div class="events-tabs__item">Shared</div>
                </div>
                <div>
                  <button class="btn-primary" @click=${this.launchPlanner}>
                    Launch Planner
                  </button>
                </div>
              </div>
              <div  class="events-table-wrapper" style="width: 100%">
                  <table id="events-table" class="events-table nowrap" width="100%">
                    <thead>
                      <tr>
                        <th class="th-favorite"></th>
                        <th class=${
                          this.state.events.length ? 'resizable' : ''
                        } data-column="title">
                          Event Title
                        </th>
                        <th class=${
                          this.state.events.length ? 'resizable' : ''
                        } data-column="date">Event Date</th>
                        <th class=${
                          this.state.events.length ? 'resizable' : ''
                        } data-column="time">Event Time (PST)</th>
                        <th data-column="room">Room</th>
                        <th class="th-action" >Action</th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
              </div>
            </div>
            ${
              this.state.isEventEditModal
                ? html`<ttp-event-edit-modal
                    is-modal-visible=${this.state.isEventEditModalAnimate}
                    event=${JSON.stringify(this.state.event)}
                  ></ttp-event-edit-modal>`
                : ''
            }
            ${
              this.state.isEventDuplicateModal
                ? html`<ttp-event-duplicate-modal
                    is-modal-visible=${this.state.isEventDuplicateModalAnimate}
                    event=${JSON.stringify(this.state.event)}
                  ></ttp-event-duplicate-modal>`
                : ''
            }
            ${
              this.state.isEventDeleteModal
                ? html`<ttp-event-delete-modal
                    is-modal-visible=${this.state.isEventDeleteModalAnimate}
                    event-id=${this.state.event.id}
                    event-title=${this.state.event.title}
                  ></ttp-event-delete-modal>`
                : ''
            }
          </div>
        `;
      },
    })
  );
}
