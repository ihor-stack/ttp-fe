import {
  createInputComponent,
  createCheckboxComponent,
} from '../elements/elements.mjs';

export function createLoginComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
}) {
  createComponent(
    'ttp-login',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          email: '',
          password: '',
          isRememberMe: false,
        };
      },

      created() {
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createInputComponent({ ...propsForComponents });
        createCheckboxComponent({ ...propsForComponents });
      },

      mounted() {
        loadStyles({
          component: this,
          src: ['/assets/css/components/login.css'],
        });

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            console.log('login screen mounted');
            eventBus.publish('ttp-hide-loader', {
              component: this.tagName.toLowerCase(),
              resp: 'OK',
            });
          }
        );

        this.ttpEvCheckboxUnsubscribe = eventBus.subscribe(
          'ttp-ev-checkbox',
          data => {
            this.setState(state => {
              return { ...state, [data.name]: data.checked };
            });
          }
        );

        this.ttpInputUnsubscribe = eventBus.subscribe('ttp-input', data => {
          if (data.method === 'onChange') {
            this.setState(state => {
              return {
                ...state,
                [data.name]: data.value,
                formErrorMsg: '',
                formErrorFields: [],
              };
            });
          }
        });
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
        this.ttpEvCheckboxUnsubscribe();
        this.ttpInputUnsubscribe();
      },

      submitLoginForm(event) {
        event.preventDefault();

        // 1. Validation, and loading status while this happening
        // 2. After the validation show the loading screen
        // 3. Navigate to event planning /pre-planner
        if (
          this.state.email === 'admin@visitingmedia.com' &&
          this.state.password === '123456'
        ) {
          const fromHref = window.location.pathname;
          eventBus.publish('navigation', {
            toHref: '/events',
            fromHref: fromHref,
          });
        }
      },
      onCreateAccount(event) {
        event.preventDefault();
        const fromHref = window.location.pathname;
        eventBus.publish('navigation', { toHref: '/createaccount', fromHref });
      },
      getErrorField() {},
      render() {
        return html`
          <div class="wrapper">
            <div class="login-wrapper" id="login-wrapper">
              <div class="logo-visiting-media">
                <ttp-svg-icon-loader
                  src="/assets/img/logo-visiting-media.svg"
                ></ttp-svg-icon-loader>
              </div>

              <div class="logo-truetour">
                <ttp-svg-icon-loader
                  src="/assets/img/logo-truetour-login.svg"
                ></ttp-svg-icon-loader>
              </div>
              <div class="login-container">
                <div class="login-form-container">
                  <form class="login-form" @submit=${this.submitLoginForm}>
                    <div class="inputs-group">
                      <ttp-input
                        type="email"
                        name="email"
                        label="Email"
                        value=${this.state.email}
                        input-id="email"
                        is-error=${this.getErrorField('email')}
                        autocomplete="off"
                        post-fix-icon="/assets/icons/email.svg"
                        required
                        autofocus
                      ></ttp-input>

                      <ttp-input
                        type="password"
                        name="password"
                        label="Password"
                        value=${this.state.password}
                        input-id="password"
                        is-error=${this.getErrorField('password')}
                        autocomplete="off"
                        post-fix="forgot?"
                        post-fix-icon="/assets/icons/lock.svg"
                        post-fix-font-size="12px"
                        required
                      ></ttp-input>

                      <ttp-checkbox
                        label="Remember Me"
                        name="isRememberMe"
                        checkbox-id="remember-me"
                        checked=${this.state.isRememberMe}
                      ></ttp-checkbox>
                    </div>
                    <div>
                      <button type="submit" class="submit-button">
                        Log In
                      </button>
                    </div>
                    <div class="coming-soon">
                      <span class="first-line"
                        >Log In with TrueTour&trade;</span
                      >
                      <span class="second-line">Coming Soon</span>
                    </div>
                    <div class="create-account">
                      <span>First time here?</span>
                      <button
                        @click=${this.onCreateAccount}
                        class="btn-create-account"
                      >
                        Create an Account
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
