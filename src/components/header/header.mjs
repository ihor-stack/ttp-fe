export function createHeaderComponent({
  createComponent,
  html,
  renderer,
  eventBus,
  withEventBus,
}) {
  createComponent(
    'main-header',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          isSubnavClicked: false,
        };
      },
      mounted() {
        const pathname = window.location.pathname;
        const cleanPath = pathname.replace(/\/\s*$/, '');
        this.setActiveMenuItem(cleanPath);

        this.ttpNavgigationUnsubscribe = eventBus.subscribe(
          'navigation',
          data => {
            const toHref = data.toHref;
            this.setActiveMenuItem(toHref);
          }
        );
      },

      navigateTo(path) {
        const fromHref = window.location.pathname;
        eventBus.publish('navigation', { toHref: path, fromHref: fromHref });
      },

      showSubNav() {
        this.setState(state => {
          return { ...state, isSubnavClicked: !this.state.isSubnavClicked };
        });
      },

      setActiveMenuItem(path) {
        const dashboardMenu = this.querySelector('[data-menu="dashboard"]');

        if (path === '/events') {
          dashboardMenu.classList.add('active');
        } else {
          dashboardMenu.classList.remove('active');
        }
      },

      render() {
        const home = window.location.origin;
        return html`
          <header class="header">
            <div class="header-content">
              <button class="btn-logo" @click=${() => this.navigateTo(home)}>
                <img
                  src="/assets/img/property-multi.svg"
                  alt="FicusJS"
                  width="20"
                  height="16"
                  class="property-multi"
                />
                <img
                  src="/assets/img/logo.svg"
                  alt="FicusJS"
                  width="127"
                  height="20"
                  class="logo"
                />
              </button>
              <nav>
                <ul class="ttp-nav-list">
                  <li class="ttp-nav-list__item active" data-menu="dashboard">
                    <button
                      type="button"
                      @click=${() => this.navigateTo('/events')}
                      class="btn-dash"
                    >
                      <svg
                        width="20"
                        height="16"
                        viewBox="0 0 20 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="1"
                          y="1"
                          width="4.5"
                          height="14"
                          stroke="#555555"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M7.75 1H19V15H7.75"
                          stroke="#555555"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </li>
                  <li class="has-subnav">
                    <button type="button" @click="${() => this.showSubNav()}">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 97 97"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="48.4999" cy="48" r="48" fill="white" />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M19.1041 85.9521V78.6909C19.1041 68.5652 25.7418 60.0074 34.9713 57.3944C31.2416 53.7948 29.1554 48.8365 29.1554 43.4144C29.1554 32.6355 37.816 23.8164 48.5058 23.8164C53.8728 23.8164 58.6772 26.031 62.1541 29.5586C65.6942 33.0928 67.8435 38.0576 67.8435 43.4144C67.8435 48.8365 65.7574 53.7948 62.0909 57.3944C66.0735 58.5702 69.6136 60.8567 72.3318 63.8552C75.8087 67.7813 77.8948 73.0074 77.8948 78.6909V85.9538C69.8654 92.1821 59.8062 95.9184 48.8775 96.0025H48.1236C37.1939 95.9184 27.1339 92.1814 19.1041 85.9521Z"
                          fill="#DDDDDD"
                        />
                      </svg>
                    </button>
                    <ul
                      class=${`ttp-submenu ${
                        this.state.isSubnavClicked && 'show'
                      } `}
                    >
                      <li class="btn-padding">Profile Settings</li>
                      <li>
                        <button
                          type="button"
                          @click=${() => this.navigateTo(home)}
                        >
                          Log Out
                        </button>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
        `;
      },
    })
  );
}
