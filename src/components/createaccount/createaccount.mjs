import {
  createInputComponent,
  createInputSelectComponent,
} from '../elements/elements.mjs';

const ROLES_DATA = [
  {
    value: '0',
    label: 'Event Manager',
  },
  {
    value: '1',
    label: 'Property Admin',
  },
  {
    value: '2',
    label: 'Sales Representative',
  },
  {
    value: '3',
    label: 'Success Manager',
  },
];

export function createCreateAccountComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  // createaccountApi,
}) {
  createComponent(
    'ttp-create-account',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      state() {
        return {
          firstName: '',
          lastName: '',
          role: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
          isLoading: true,
        };
      },
      computed: {
        getRoles() {
          return ROLES_DATA.map(item => item.label);
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
        createInputComponent({ ...propsForComponents });
        createInputSelectComponent({ ...propsForComponents });
      },

      mounted() {
        loadStyles({
          component: this,
          src: ['/assets/css/components/createaccount.css'],
        });

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            eventBus.publish('ttp-hide-loader', {
              component: 'ttp-planner',
              resp: 'OK',
            });

            setTimeout(() => {
              this.setState(state => {
                return { ...state, isLoading: false };
              });
            }, 500);
          }
        );

        this.ttpInputUnsubscribe = eventBus.subscribe('ttp-input', data => {
          if (data.method === 'onChange') {
            this.setState(state => {
              return {
                ...state,
                [data.name]: data.value,
              };
            });
          }
        });

        this.ttpInputSelectUnsubscribe = eventBus.subscribe(
          'input-select',
          data => {
            this.setState(state => {
              return {
                ...state,
                [data.name]: data.value,
              };
            });
          }
        );
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
        this.ttpInputUnsubscribe();
        this.ttpInputSelectUnsubscribe();
      },

      async submitForm(event) {
        event.preventDefault();

        let { isLoading, ...res } = this.state;
        res.role = this.getRoleByName(res.role);
        //TODO: send data to backend
        console.log(res);
        eventBus.publish('navigation',
          {toHref: '/selectproperty', fromHref : window.location.pathname}
        )
      },

      getRoleByName(name) {
        return ROLES_DATA.find(item => item.label === name).value;
      },

      getErrorField() {},

      onSignIn(event) {
        event.preventDefault();
        const fromHref = window.location.pathname;
        eventBus.publish('navigation', { toHref: '', fromHref });
      },

      render() {
        return html`<div class="wrapper">
          <div class="logo-visiting-media">
            <ttp-svg-icon-loader
              src="/assets/img/logo-visiting-media.svg"
            ></ttp-svg-icon-loader>
          </div>
          <div class="register-container">
            <form class="register-form" @submit=${this.submitForm}>
              <div class="inputs-group">
                <ttp-input
                  name="firstName"
                  label="First Name"
                  value=${this.state.firstName}
                  input-id="firstName"
                  is-error=${this.getErrorField('firstName')}
                  autocomplete="off"
                  required="true"
                  autofocus
                  maxlength=${60}
                ></ttp-input>
                <ttp-input
                  name="lastName"
                  label="Last Name"
                  value=${this.state.lastName}
                  input-id="lastName"
                  is-error=${this.getErrorField('lastName')}
                  autocomplete="off"
                  required="true"
                  maxlength=${60}
                ></ttp-input>
                <ttp-input-select
                  name="role"
                  label="Role"
                  value=${this.state.role}
                  input-id="role-new"
                  required="true"
                  list=${this.getRoles.toString()}
                ></ttp-input-select>
                <ttp-input
                  type="number"
                  name="phone"
                  label="Phone"
                  value=${this.state.phone}
                  input-id="phone"
                  is-error=${this.getErrorField('phone')}
                  autocomplete="off"
                  required="true"
                ></ttp-input>
                <ttp-input
                  type="email"
                  name="email"
                  label="Email"
                  value=${this.state.email}
                  input-id="email"
                  is-error=${this.getErrorField('email')}
                  autocomplete="off"
                  required="true"
                ></ttp-input>
                <ttp-input
                  type="password"
                  name="password"
                  label="Create password"
                  value=${this.state.password}
                  input-id="firstName"
                  is-error=${this.getErrorField('password')}
                  autocomplete="off"
                  required="true"
                  maxlength=${128}
                ></ttp-input>
                <ttp-input
                  type="password"
                  name="confirmPassword"
                  label="Confirm Password"
                  value=${this.state.confirmPassword}
                  input-id="confirmPassword"
                  is-error=${this.getErrorField('confirmPassword')}
                  autocomplete="off"
                  required="true"
                  maxlength=${128}
                ></ttp-input>
              </div>
              <div>
                <button type="submit" class="submit-button">
                  Create Account
                </button>
              </div>
              <div class="sign-in">
                <span>Already have an account?</span>
                <button @click=${this.onSignIn} class="btn-sign-in">
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>`;
      },
    })
  );
}
