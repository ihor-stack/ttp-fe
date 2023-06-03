export const DASHBOARD_COLLUMN_DEFS = [
  {
    targets: [0],
    orderable: false,
    data: row => `<div class="td-resizable">${row.property}</div>`,
    createdCell: td => {
      td.classList.add('resizable');
      td.setAttribute('data-column', 'title');
    },
  },

  {
    targets: [1],
    // width: '40%',
    orderable: false,
    data: row => `<div class="td-resizable">${row.brand}</div>`,
    createdCell: td => {
      td.classList.add('resizable');
      td.setAttribute('data-column', 'brand');
    },
  },

  {
    targets: [2],
    // width: '15%',
    orderable: false,
    data: function (row) {
      const membersAvatar = row.members
        .map((item, index) => {
          return `<div class="dashboard-table__avatar ${
            item.img ? 'dashboard-table__avatar-picture' : ''
          } ${
            index > 4 && !row.showHidden ? 'dashboard-table__avatar-hidden' : ''
          }
            ">
              ${item.img ? `<img src="${item.img}" />` : ''}
              ${item.name}
            </div>`;
        })
        .reverse()
        .join('');

      const membersAvatarHidden =
        row.members.length > 5 && !row.showHidden
          ? `<div class="dashboard-table__avatar dashboard-table__avatar-amount" data-event="show-avatars">
                    +${row.members.length - 5}
                  </div>`
          : '';

      const membersAvatarPlus = `<div class="dashboard-table__avatar dashboard-table__avatar-plus">
          <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5.00537" y="0.75" width="0.75" height="10.5" rx="0.375" fill="#333333"/>
            <rect x="10.5835" y="5.67188" width="0.75" height="10.5" rx="0.375" transform="rotate(90 10.5835 5.67188)" fill="#333333"/>
          </svg>
        </div>`;

      const members = `<div><div class="dashboard-table__avatar-wrapper">${membersAvatarPlus}${membersAvatarHidden}${membersAvatar}</div></div>`;

      return members;
    },
    createdCell: function (td) {
      td.setAttribute('data-column', 'members');
    },
  },

  {
    targets: [3],
    // width: '15%',
    orderable: false,
    data: row => `<div class="td-resizable">${row.added}</div>`,
    createdCell: td => {
      td.classList.add('resizable');
      td.setAttribute('data-column', 'added');
    },
  },

  {
    targets: [4],
    // width: '20%',
    orderable: false,
    data: row => `<div class="td-resizable">
        <div class="dashboard-table__avatar">
          ${row.addedBy.img ? `<img src="${row.addedBy.img}" />` : ''}
          ${row.addedBy.name}
        </div>
      </div>`,
    createdCell: td => {
      td.classList.add('resizable');
      td.setAttribute('data-column', 'addedBy');
    },
  },

  {
    targets: [5],
    // width: '20%',
    orderable: false,
    data: row => `<div class="td-resizable">${row.status}</div>`,
    createdCell: td => {
      td.classList.add('resizable');
      td.setAttribute('data-column', 'status');
    },
  },

  {
    targets: [6],
    // width: '7%',
    orderable: false,
    data: function () {
      const actionIcon = `
          <div class="event-actions" data-event="actions">
            <div class="event-actions-icon"  data-event="event-actions-icon">
              <svg width="18" height="4" viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M1.49783 3.5C2.32506 3.5 2.99566 2.82843 2.99566 2C2.99566 1.17157 2.32506 0.5 1.49783 0.5C0.670601 0.5 0 1.17157 0 2C0 2.82843 0.670601 3.5 1.49783 3.5Z" fill="#333333"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.99978 3.5C9.82701 3.5 10.4976 2.82843 10.4976 2C10.4976 1.17157 9.82701 0.5 8.99978 0.5C8.17255 0.5 7.50195 1.17157 7.50195 2C7.50195 2.82843 8.17255 3.5 8.99978 3.5Z" fill="#333333"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5017 3.5C17.329 3.5 17.9996 2.82843 17.9996 2C17.9996 1.17157 17.329 0.5 16.5017 0.5C15.6745 0.5 15.0039 1.17157 15.0039 2C15.0039 2.82843 15.6745 3.5 16.5017 3.5Z" fill="#333333"/>
              </svg>
              <ttp-tooltip title="More Actions" position="left"></ttp-tooltip>
            </div>
            
            <ul class="event-actions-menu" data-event="action-menu">
              <li class="event-actions-menu__item" data-action-menu="action">Some action</li>
            </ul>
          </div>
        `;

      return actionIcon;
    },
    createdCell: function (td) {
      td.classList.add('td-action');
    },
  },
];

/* TODO: all svg should be save and connect from svg-sprite */

export const SVG_PAGINATE_NEXT = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 18L15 12L9 6" stroke="#333333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
export const SVG_PAGINATE_PREV = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 6L9 12L15 18" stroke="#333333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export const LOAD_STYLES = [
  '/assets/css/components/dashboard.css',
  'https://cdn.jsdelivr.net/npm/js-datepicker@5.18.0/dist/datepicker.min.css',
  'https://cdn.jsdelivr.net/npm/jqueryui@1.11.1/jquery-ui.min.css',
  'https://cdn.datatables.net/v/dt/dt-1.12.1/sc-2.0.7/datatables.min.css',
];

export const TABLE_ID = 'dashboard-table';

export const TABLE_LENGTH = 25;

export const HEIGHT_BODY = '174px';

export const HEIGHT_PAGINATION = '74px';
