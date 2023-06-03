/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.loadStyles loadstyle func
 */
export function createDashboardSidenavComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
}) {
  createComponent(
    'ttp-dashboard-sidenav',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',

      async created() {
        this.search = window.location.search;

        let params = new URLSearchParams(this.search);
        this.eventId = params.get('id');

        this.readOnlyEventId = params.get('e');
      },

      async mounted() {
        loadStyles({
          component: this,
          src: ['/assets/css/components/dashboard-sidenav.css'],
        });

        const pathname = window.location.pathname;
        const cleanPath = pathname.replace(/\/\s*$/, '');
        this.setActiveMenuItem(cleanPath);
        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            //Hide loader has a delay of 300ms
            // eventBus.publish('ttp-hide-loader', {
            //   component: 'ttp-planner',
            //   resp: 'OK',
            // });
          }
        );
      },

      navigateTo(path) {
        this.setActiveMenuItem(path);
        const fromHref = window.location.pathname;
        eventBus.publish('navigation', { toHref: path, fromHref: fromHref });
      },

      setActiveMenuItem(path) {
        const menuList = ['plans', 'events'];
        const allMenus = this.shadowRoot.querySelectorAll('[data-menu]');

        allMenus.forEach(menu => {
          menu.classList.remove('active');
        });
        menuList.forEach(menu => {
          const menuS = `/${menu}`;
          if (menuS === path) {
            const fineItem = this.shadowRoot.querySelector(
              `[data-menu="${menu}"]`
            );
            fineItem.classList.add('active');
          }
        });
      },

      render() {
        return html`
          <div class="dashboard-sidenav">
            <div class="sidebar-title">
              <span>Fairmont Tremblant</span>
            </div>
            <div class="sidebar-wrapper">
              <ul class="sidebar-menu">
                <li
                  class="sidebar-menu__item"
                  data-menu="plans"
                  @click=${() => this.navigateTo('/plans')}
                >
                  <div class="sidebar-menu__item__icon">
                    <svg
                      width="16"
                      height="20"
                      viewBox="0 0 16 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M13.3996 6.22589C13.3996 7.21804 13.1139 8.1446 12.618 8.93651L8.00032 16.4286L3.39462 8.95535L3.29939 8.79976C2.85356 8.04064 2.59961 7.16222 2.59961 6.22589C2.59961 3.33804 5.01709 1 8.00032 1C10.9828 1 13.3996 3.33804 13.3996 6.22589Z"
                        stroke="#333333"
                        stroke-linejoin="round"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M9.79971 6.39961C9.79971 7.39342 8.99406 8.19961 8.00006 8.19961C7.00606 8.19961 6.19971 7.39342 6.19971 6.39961C6.19971 5.4058 7.00606 4.59961 8.00006 4.59961C8.99406 4.59961 9.79971 5.4058 9.79971 6.39961Z"
                        stroke="#333333"
                      />
                      <path
                        d="M11.9026 13.7412C13.8869 14.2499 15.1998 15.1355 15.1998 16.1427C15.1998 17.7205 11.9762 18.9996 8.00009 18.9996C4.02344 18.9996 0.799805 17.7205 0.799805 16.1427C0.799805 15.0339 2.38978 14.0737 4.7138 13.5996"
                        stroke="#333333"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-dasharray="2 3"
                      />
                    </svg>
                  </div>
                  <div class="sidebar-menu__item__title">
                    <span>Property Details</span>
                  </div>
                </li>
                <li class="sidebar-menu__item">
                  <div class="sidebar-menu__item__icon">
                    <svg
                      width="22"
                      height="20"
                      viewBox="0 0 22 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.9273 8L15.9273 12.9254H21V19H12"
                        stroke="#333333"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M7.25 12H1V1H16V4.16667"
                        stroke="#333333"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M16 16V19"
                        stroke="#333333"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M7 19H4V12"
                        stroke="#333333"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12 12H16"
                        stroke="#333333"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="sidebar-menu__item__title">
                    <span>Floor Plans</span>
                  </div>
                </li>
                <li class="sidebar-menu__item">
                  <div class="sidebar-menu__item__icon">
                    <svg
                      width="16"
                      height="22"
                      viewBox="0 0 16 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.65037 14.3779L4.97266 16.3914"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6.23828 7.93555L6.32864 8.56195"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M0.726562 20.5972L2.53379 15.1834L2.35307 14.3333L0.816924 5.42945L5.06391 1.22363"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M2.35156 14.333H9.94192C10.5293 14.333 10.9811 14.7804 10.9811 15.3621V20.776"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M1.94592 11.8279L2.39773 11.6489C2.98508 11.3805 3.34653 10.7541 3.21098 10.0829L2.53327 6.36928C2.44291 5.83237 1.9911 5.47443 1.44894 5.42969H0.816406"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M2.08203 12.7673H9.13022C9.80793 12.7673 10.3049 13.3043 10.3049 13.9307V14.3781L14.5519 10.1723V9.72483C14.5519 9.05369 14.0097 8.56152 13.3772 8.56152H6.32902"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M14.5957 10.1719C15.0023 10.3061 15.2734 10.7088 15.2734 11.1562V16.5701"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M2.08203 12.7673L6.32902 8.56152"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M2.66797 11.4248L6.91496 7.21898C7.32158 6.90578 7.54749 6.36887 7.45712 5.83195L6.77941 2.16305C6.68905 1.62614 6.23725 1.2682 5.69508 1.22345L5.06255 1.17871"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="sidebar-menu__item__title">
                    <span>Asset Library</span>
                  </div>
                </li>
                <li
                  class="sidebar-menu__item"
                  data-menu="events"
                  @click=${() => this.navigateTo('/events')}
                >
                  <div class="sidebar-menu__item__icon">
                    <svg
                      width="20"
                      height="19"
                      viewBox="0 0 20 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.72471 5.07049L5.69141 0.015625"
                        stroke="#555555"
                      />
                      <path
                        d="M14.549 5.09852L14.541 0.0429688"
                        stroke="#555555"
                      />
                      <rect
                        width="17.6995"
                        height="16.8492"
                        rx="2"
                        transform="matrix(0.999995 0.00314416 -0.00345937 0.999994 1.05859 1.09668)"
                        stroke="#555555"
                      />
                      <path
                        d="M1.28324 5.05605L18.0977 5.10938"
                        stroke="#555555"
                        stroke-linecap="square"
                      />
                    </svg>
                  </div>
                  <div class="sidebar-menu__item__title">
                    <span>Planned Events</span>
                  </div>
                </li>
                <li class="sidebar-menu__item">
                  <div class="sidebar-menu__item__icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.49909 19.0029L3.49909 8.42724"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M3.49909 5.80957L3.49909 1.00243"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M1.13086 6.02319L5.86783 6.02319"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M10.1328 1.24274L10.1328 10.8838"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M10.1328 14.9435L10.1328 19.0029"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M12.5006 14.6765L7.76367 14.6765"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16.6309 1.24316L16.6309 9.49549"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16.6309 12.9141L16.6309 19.0031"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                      <path
                        d="M19.1315 9.8689L14.3945 9.8689"
                        stroke="#555555"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <div class="sidebar-menu__item__title">
                    <spna>Settings</spna>
                  </div>
                </li>
                <li class="sidebar-menu__item">
                  <div class="sidebar-menu__item__icon">
                    <svg
                      width="22"
                      height="16"
                      viewBox="0 0 22 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.4999 11.6464V15.0029H5.5V11.6464C5.5 9.68599 6.74425 8.02205 8.46637 7.51522C7.77212 6.81714 7.38441 5.85129 7.38441 4.80894C7.38441 2.71468 9.00736 1.00293 11.009 1.00293C12.0098 1.00293 12.9114 1.43326 13.5606 2.11222C14.2188 2.80074 14.6245 3.75703 14.6245 4.79938C14.6245 5.85129 14.2368 6.81714 13.5516 7.51522C14.2999 7.74473 14.9581 8.18462 15.4721 8.76796C16.1122 9.53298 16.4999 10.5466 16.4999 11.6464Z"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M15.8379 6.97855C16.1034 6.63 16.4852 6.37274 16.925 6.24826C16.5682 5.91631 16.369 5.45158 16.369 4.94536C16.369 3.94121 17.1906 3.12793 18.2113 3.12793C18.7175 3.12793 19.1823 3.3354 19.5059 3.65905C19.8462 3.991 20.0453 4.44743 20.0453 4.94536C20.0453 5.45158 19.8462 5.90801 19.4976 6.24826C19.8794 6.35615 20.2113 6.57191 20.4686 6.84577C20.8005 7.21092 20.9997 7.69225 20.9997 8.22337V9.83332H17.6636"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6.16179 6.97807C5.89624 6.62952 5.52279 6.37226 5.08296 6.25607C5.43981 5.92412 5.63898 5.45939 5.63898 4.95317C5.63898 3.94902 4.8174 3.13574 3.79666 3.13574C3.29044 3.13574 2.82571 3.34321 2.50207 3.66686C2.16182 3.99051 1.95435 4.45524 1.95435 4.95317C1.95435 5.45939 2.15352 5.91583 2.50207 6.25607C2.12032 6.36396 1.78838 6.57143 1.53112 6.85358C1.19917 7.21873 1 7.70006 1 8.23118V9.84114H4.33608"
                        stroke="#555555"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="sidebar-menu__item__title">
                    <span>Members</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        `;
      },
    })
  );
}
