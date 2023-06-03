import { eventBus } from '../main.mjs';
import routes from '../routes.mjs';

const ENUM_LAYOUTS = {
  LOGIN: 'login',
  PLANNER: 'planner',
  DASHBOARD: 'dashboard'
};
class SPArouter {
  zoneApp = '#ttp-app';
  zone = '#router';
  zoneHeader = 'main-header';
  zoneDashboard = '#dashboard';
  zoneDashboardSideNav = '#side-nav';

  constructor() {
    this.init();
  }

  async loadHtml(toHref, fromHref, back_, params) {
    //triggered, but function can be called directly also
    const tempUrl = `${toHref}/${params}`;

    if (!back_) {
      try {
        history.pushState({ url: tempUrl }, '', tempUrl);
      } catch (err) {
        console.info('no push state on file//');
      }
    }

    eventBus.publish('navigation-start', {
      toHref: toHref,
      fromHref: fromHref,
      back: back_,
    });

    const url = toHref;

    try {
      // credentials: 'same-origin'
      const fetchUrl = await fetch(toHref);
      const resp = await routes(url);

      if (fetchUrl.status !== 200 && resp === 'OK') {
        if (!fetchUrl.ok) throw new Error('Request failed.');
      } else {
        const str = await fetchUrl.text();

        const temp = document.createElement('div');
        temp.innerHTML = str;
        const $html = temp;

        const newContent = $html.querySelector(this.zone);

        const title = $html.getElementsByTagName('title')[0];
        document.title = title.text;

        eventBus.publish('navigation-done', {
          toHref: toHref,
          fromHref: fromHref,
          newContent: newContent,
          $html: $html,
          back: back_,
        });
      }
    } catch (err) {
      console.info('error', err);
      eventBus.publish('navigation-err', { err: err });
    }
  }

  createHeader() {
    const headerBarElement = document.querySelector('main-header');
    if (!headerBarElement) {
      // console.log(' header');
      const header = document.createElement('main-header');
      document.querySelector('.ttp-app').prepend(header);
    }
  }

  removeHeader() {
    const headerBarElement = document.querySelector('main-header');
    if (headerBarElement) {
      headerBarElement.remove();
    }
  }

  createDashboardLayout() {
    // console.log('createDashboardLayout');
    const ttpApp = document.querySelector(this.zoneApp);
    const dashboardWrapper = ttpApp.querySelector(this.zoneDashboard);

    // DashboardLayout
    if (!dashboardWrapper) {
      const dashboardW = document.createElement('div');
      dashboardW.id = 'dashboard';
      dashboardW.classList.add('dashboard-wrapper');

      const sidenavWrapper = document.createElement('div');
      sidenavWrapper.id = 'side-nav';

      const sidenav = document.createElement('ttp-dashboard-sidenav');

      const dashConent = document.createElement('section');
      dashConent.classList.add('dashboard-content');

      const dashboardLoader = document.createElement('ttp-loader');
      dashboardLoader.setAttribute('id', 'dashboard-loader');
      dashboardLoader.setAttribute('is-loading', true);
      dashboardLoader.setAttribute('is-full-screen', false);

      const newRouter = document.createElement('div');
      newRouter.id = 'router';

      const main = document.createElement('div');
      main.classList.add('layout-dash-wrapper');
      // const blockRouter = document.createElement()
      newRouter.appendChild(main);
      dashConent.appendChild(dashboardLoader);
      dashConent.appendChild(newRouter);

      sidenavWrapper.appendChild(sidenav);
      dashboardW.appendChild(sidenavWrapper);
      dashboardW.appendChild(dashConent);

      document.querySelector(this.zoneApp).appendChild(dashboardW);
    }
  }

  removeDashboardLayout() {
    const dashboardWrapper = document.querySelector(this.zoneDashboard);
    if (dashboardWrapper) {
      dashboardWrapper.remove();
    }
  }

  createLoginLayout() {
    const ttpApp = document.querySelector(this.zoneApp);
    const router = ttpApp.querySelector('#router');
    if (!router) {
      const newRouter = document.createElement('div');
      newRouter.id = 'router';
      ttpApp.appendChild(newRouter);
    }
  }

  removeLoginLayout() {
    const router = document.querySelector(`${this.zoneApp} > #router`);
    if (router) {
      router.remove();
    }
  }

  createPlannerLayout() {
    const ttpApp = document.querySelector(this.zoneApp);
    const plannerView = ttpApp.querySelector('#planner-view');
    if (!plannerView) {
      const plannerViewNew = document.createElement('div');
      plannerViewNew.id = 'planner-view';
      plannerViewNew.classList.add('planner-view');

      ttpApp.appendChild(plannerViewNew);

      const plannerLoader = document.createElement('ttp-loader');
      plannerLoader.setAttribute('id', 'planner-loader');
      plannerLoader.setAttribute('is-loading', true);
      plannerLoader.setAttribute('is-full-screen', false);

      plannerViewNew.appendChild(plannerLoader);

      const newRouter = document.createElement('div');
      newRouter.id = 'router';

      const mainLayout = document.createElement('main');
      mainLayout.classList.add('layout-base-wrapper');

      newRouter.appendChild(mainLayout);

      plannerViewNew.appendChild(newRouter);
    }
  }

  removePlannerLayout() {
    const plannerView = document.querySelector(
      `${this.zoneApp} > #planner-view`
    );
    if (plannerView) {
      plannerView.remove();
    }
  }

  cleanHref(href) {
    const urls = [
      '',
      '/',
      '/event',
      '/pre-planner',
      '/planner',
      '/events',
      '/plans',
      '/createaccount',
      '/myworkspace',
      '/dashboard',
      '/selectproperty',
      '/newpropertysetup'
    ];
    let hrefNew;
    urls.forEach(url => {
      const isUrl = href.includes(url);

      if (isUrl) {
        hrefNew = url;
      }
    });

    return hrefNew;
  }

  handleLayouts({ fromHref, toHref }) {
    fromHref =
      typeof fromHref !== 'undefined' ? this.cleanHref(fromHref) : fromHref;
    toHref = typeof toHref !== 'undefined' ? this.cleanHref(toHref) : toHref;

    // console.log('handleLayouts from, to', fromHref, toHref);
    const fromLayout = this.getRouteLayout(fromHref);
    const toLayout = this.getRouteLayout(toHref);

    // console.log('layouts', fromLayout, toLayout);

    switch (toLayout) {
      case ENUM_LAYOUTS.LOGIN: {
        this.removeHeader();
        this.removeDashboardLayout();
        this.removePlannerLayout();
        this.createLoginLayout();
        break;
      }
      case ENUM_LAYOUTS.PLANNER: {
        this.createHeader();
        this.removeLoginLayout();
        this.removeDashboardLayout();
        this.createPlannerLayout();
        break;
      }
      case ENUM_LAYOUTS.DASHBOARD: {
        this.createHeader();
        this.removeLoginLayout();
        this.removePlannerLayout();
        this.createDashboardLayout();
        break;
      }
    }

    const initialLoader = document.querySelector('#initial-loading');
    const plannerLoader = document.querySelector('#planner-loader');
    const dashboarLoader = document.querySelector('#dashboard-loader');
    // Loaders
    if (
      typeof fromLayout === 'undefined' ||
      fromLayout === ENUM_LAYOUTS.LOGIN ||
      toLayout === ENUM_LAYOUTS.LOGIN
    ) {
      initialLoader.isLoading = true;
      initialLoader.isTransparent = false;
      if (plannerLoader) {
        plannerLoader.isLoading = false;
        plannerLoader.isFullScreen = false;
      }
      if (dashboarLoader) {
        dashboarLoader.isLoading = false;
      }
    } else {
      // initialLoader.isLoading =false
      initialLoader.isTransparent = true;
    }

    if (fromLayout === ENUM_LAYOUTS.LOGIN) {
      initialLoader.isFullScreen = true;
    } else {
      initialLoader.isFullScreen = false;
      // initialLoader.isLoading =false
    }

    if (fromLayout === toLayout) {
      initialLoader.isLoading = false;
    }

    if (
      fromLayout === toLayout &&
      (fromLayout === ENUM_LAYOUTS.PLANNER || toLayout === ENUM_LAYOUTS.PLANNER)
    ) {
      plannerLoader.isLoading = true;
    }

    if (
      fromLayout === toLayout &&
      (fromLayout === ENUM_LAYOUTS.DASHBOARD ||
        toLayout === ENUM_LAYOUTS.DASHBOARD)
    ) {
      dashboarLoader.isLoading = true;
    }
  }

  getRouteLayout(href) {
    let layout;
    const routesLayout = [
      {
        layout: 'login',
        routes: ['', '/', '/event', '/createaccount', '/selectproperty', ],
      },
      {
        layout: 'planner',
        routes: ['/pre-planner', '/planner', '/newpropertysetup', '/dashboard'],
      },
      {
        layout: 'dashboard',
        routes: ['/events', '/plans', '/myworkspace'],
      },
    ];
    routesLayout.forEach(item => {
      const findIndex = item.routes.indexOf(href);
      if (findIndex > -1) {
        layout = item.layout;
      }
    });

    return layout;
  }

  init() {
    const pathname = window.location.pathname;
    console.log('spa');
    let timeOut = 300; // 3000;
    console.log('init timeOut', timeOut);

    this.handleLayouts({ toHref: pathname, timeOut });

    // Listen to events
    eventBus.subscribe('ttp-hide-loader', data => {
      // When the page first loaded hide the loader
      const loader = document.querySelector('#initial-loading');
      const plannerLoader = document.querySelector('#planner-loader');
      const dashboarLoader = document.querySelector('#dashboard-loader');
      // loader.isLoading = true;
      if (data.resp === 'OK') {
        // console.log('hide the loader');

        setTimeout(() => {
          if (loader) {
            loader.isLoading = false;
            loader.isFullScreen = false;
          }
          if (plannerLoader) {
            plannerLoader.isLoading = false;
            plannerLoader.isFullScreen = false;
          }

          if (dashboarLoader) {
            dashboarLoader.isLoading = false;
            dashboarLoader.isFullScreen = false;
          }
        }, timeOut);
      }
    });

    eventBus.subscribe('navigation', data => {
      console.log('navigation', data);
      const href = data.toHref;
      const fromHref =
        typeof data.fromHref === 'undefined'
          ? window.location.pathname
          : data.fromHref;
      const params = typeof data.params !== 'undefined' ? data.params : '';
      sessionStorage.setItem('oldUrl', href);
      this.loadHtml(href, fromHref, null, params);
    });

    // Back/forward button in browser
    addEventListener('popstate', ev => {
      console.info(' popstate' + JSON.stringify(ev.state));
      const state = ev.state;

      if (state !== null && Object.keys(state).length) {
        const oldUrl = sessionStorage.getItem('oldUrl');
        sessionStorage.setItem('oldUrl', state.url);
        this.loadHtml(state.url, oldUrl, true, '');
      }
    });

    eventBus.subscribe('navigation-start', data => {
      const fromHref = data.fromHref;
      const toHref = data.toHref;

      this.handleLayouts({ fromHref, toHref, timeOut });
    });

    eventBus.subscribe('navigation-done', data => {
      console.log('navigation-done', data);

      setTimeout(() => {
        document.querySelector(this.zone).innerHTML = data.newContent.innerHTML;
      }, timeOut);
    });

    eventBus.subscribe('navigation-err', data => {
      console.log('navigation-err', data);
    });

    const pg = window.location.href;

    try {
      history.pushState({ url: pg }, '', pg);
    } catch (err) {
      console.info('no push state on file//', err);
    }
    sessionStorage.setItem('oldUrl', pg);
  } // init
} // class

export default SPArouter;
