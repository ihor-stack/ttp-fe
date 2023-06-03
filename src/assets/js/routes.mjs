//When injecting pug, it loads the components
import {
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
} from './main.mjs';

import { loadScript } from 'https://cdn.jsdelivr.net/npm/@ficusjs/script@2.1.0/dist/script.min.js';

/**
 * @description handling routes, spa
 * @param  {string} href to load the assets/components for
 */
async function routes(href) {
  //remove last "/" from the pathname

  const pathname = href.replace(/\/\s*$/, '');
  let resp = '';

  //Load common scripts
  if (
    pathname === '/planner' ||
    pathname === '/pre-planner' ||
    pathname === '/event' ||
    pathname === '/dashboard'
  ) {
    try {
      const pathToLoad = [
        // 'https://cdn.jsdelivr.net/npm/@svgdotjs/svg.draggable.js@3.0.2/dist/svg.draggable.min.js',
        'https://cdn.jsdelivr.net/npm/@svgdotjs/svg.panzoom.js@2.1.2/dist/svg.panzoom.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.3/gsap.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.3/Draggable.min.js',
        'https://cdn.jsdelivr.net/npm/luxon@2.3.2/build/global/luxon.min.js',
      ];

      await loadScript(
        'https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.1.2/dist/svg.min.js'
      );

      await loadScript(...pathToLoad);
    } catch (err) {
      console.log('err', err);
    }
  }

  if (
    pathname === '/events' ||
    pathname === '/plans' ||
    pathname === '/myworkspace'
  ) {
    const pathToLoad = [
      'https://cdn.jsdelivr.net/npm/luxon@2.3.2/build/global/luxon.min.js',
    ];
    await loadScript(...pathToLoad);
    const module = await import(
      '/assets/js/components/dashboard/sidenav/sidenav.mjs'
    );
    // Dashboard sidenavigation
    module.createDashboardSidenavComponent({
      createComponent,
      html,
      renderer,
      eventBus,
      withEventBus,
      loadStyles,
    });
  }

  //Load components based on path
  switch (pathname) {
    case '/planner':
      try {
        const api = await import(
          '/assets/js/components/planner/planner.api.mjs'
        );
        const plannerApi = new api.PlannerApi();
        const module = await import(
          '/assets/js/components/planner/planner.mjs'
        );

        module.createPlannerComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          plannerApi,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;
    case '/event':
      try {
        const api = await import(
          '/assets/js/components/planner/planner.api.mjs'
        );
        const plannerApi = new api.PlannerApi();
        const module = await import(
          '/assets/js/components/planner/planner.mjs'
        );

        module.createPlannerComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          plannerApi,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;
    case '/pre-planner': {
      try {
        const api = await import(
          '/assets/js/components/preplanner/preplanner.api.mjs'
        );
        const prePlannerApi = new api.PrePlannerApi();

        const module = await import(
          '/assets/js/components/preplanner/preplanner.mjs'
        );
        await loadScript('https://cdn.jsdelivr.net/npm/js-datepicker@5.18.0');

        module.createPrePlannerComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          prePlannerApi,
          loadStyles,
        });

        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;
    }
    case '/events':
      try {
        await loadScript('https://code.jquery.com/jquery-1.11.3.min.js');
        const pathToLoad = [
          'https://code.jquery.com/ui/1.12.1/jquery-ui.js',
          'https://cdn.jsdelivr.net/npm/js-datepicker@5.18.0',
        ];

        await loadScript(...pathToLoad);

        await loadScript(
          'https://cdn.datatables.net/v/dt/dt-1.12.1/sc-2.0.7/datatables.min.js'
        );
        const api = await import(
          '/assets/js/components/dashboard/events/events.api.mjs'
        );
        const eventsApi = new api.EventsApi();
        const module = await import(
          '/assets/js/components/dashboard/events/events.mjs'
        );

        module.createEventsComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          eventsApi,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;
    case '/myworkspace':
      try {
        const apiModule = await import(
          '/assets/js/components/myworkspace/myworkspace.api.mjs'
        );
        const api = new apiModule.Api();
        const module = await import(
          '/assets/js/components/myworkspace/myworkspace.mjs'
        );

        module.createMyWorkspaceComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          api,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;
    case '/dashboard':
      try {
        await loadScript('https://code.jquery.com/jquery-1.11.3.min.js');
        const pathToLoad = [
          'https://code.jquery.com/ui/1.12.1/jquery-ui.js',
          'https://cdn.jsdelivr.net/npm/js-datepicker@5.18.0',
        ];

        await loadScript(...pathToLoad);

        await loadScript(
          'https://cdn.datatables.net/v/dt/dt-1.12.1/sc-2.0.7/datatables.min.js'
        );

        const apiModule = await import(
          '/assets/js/components/dashboard/dashboard-property/dashboard.api.mjs'
        );
        const api = new apiModule.Api();
        const module = await import(
          '/assets/js/components/dashboard/dashboard-property/dashboard.mjs'
        );

        module.createDashboardComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          api,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;
    case '/plans':
      try {
        const api = await import(
          '/assets/js/components/dashboard/events/events.api.mjs'
        );
        const eventsApi = new api.EventsApi();
        const module = await import(
          '/assets/js/components/dashboard/events/events.mjs'
        );

        module.createEventsComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          eventsApi,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;

    case '/createaccount':
      try {
        const api = await import(
          '/assets/js/components/createaccount/createaccount.api.mjs'
        );
        const createaccountApi = new api.CreateAccountApi();

        const module = await import(
          '/assets/js/components/createaccount/createaccount.mjs'
        );

        module.createCreateAccountComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          createaccountApi,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;

    case '/selectproperty':
      try {
        const api = await import(
          '/assets/js/components/selectproperty/selectproperty.api.mjs'
        );

        const selectpropertyApi = new api.SelectPropertyApi();

        const module = await import(
          '/assets/js/components/selectproperty/selectproperty.mjs'
        );

        module.createSelectPropertyComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          selectpropertyApi,
        });
        resp = 'OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;

    case '/newpropertysetup':
      try{
        const api = await import(
          '/assets/js/components/newpropertysetup/newpropertysetup.api.mjs'
          )

        const newpropertysetupApi = new api.NewPropertySetupApi();

        const module = await import('/assets/js/components/newpropertysetup/newpropertysetup.mjs');

        module.createNewPropertySetupComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
          newpropertysetupApi
        });
        resp='OK';
      } catch (err) {
        console.log('err', err);
        resp = err;
      }
      break;

    default: {
      try {
        const module = await import('/assets/js/components/login/login.mjs');
        module.createLoginComponent({
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
          loadStyles,
        });

        resp = 'OK';
      } catch (err) {
        resp = err;
      }

      break;
    }
  }

  return resp;
}

export default routes;
