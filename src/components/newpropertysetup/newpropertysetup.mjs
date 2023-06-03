import {
  createInputComponent,
  createInputSelectComponent,
  createStepperComponent,
} from '../elements/elements.mjs';

export function createNewPropertySetupComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  newpropertysetupApi
}) {
  createComponent(
    'ttp-new-property-setup',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      state() {
        return {
          managementBrand: '',
          propertyTitle: '',
          addressLine1: '',
          addressLine2: '',
          country: '',
          state: '',
          city: '',
          postalCode: '',
          timeZone: '--',
        }
      },
      created(){
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createInputComponent({...propsForComponents});
        createInputSelectComponent({...propsForComponents});
        createStepperComponent({...propsForComponents});
      },
      mounted() {
        this.getCountries();
        this.getStates();

        loadStyles({
          component: this,
          src: ['/assets/css/components/newpropertysetup.css']
        })
        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            eventBus.publish(('ttp-hide-loader'), {
              component: 'ttp-planer',
              resp: 'OK',
            });

            setTimeout(() => {
              this.setState(state => {
                return {...state, isLoading: false}
              })
            }, 500)
          }
        )

        this.ttpInputUnsubcribe = eventBus.subscribe('ttp-input', async data => {
          if (data.method === 'onChange') {
            this.setState(state => {
              return {
                ...state,
                [data.name]: data.value,
              };
            });
            this.checkAddressInput();
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

        this.ttpAutocompleteSelectUnsubscribe = eventBus.subscribe(
          'input-select-autocomplete',
          data => {
            if (data.name === 'country') {
              this.setState(state => ({
                ...state,
                filteredCountries: state.countries.filter(item =>
                  item.toLowerCase().includes(data.value.toLowerCase()))
              }))
            }
            if (data.name === 'state') {
              this.setState(state => ({
                ...state,
                filteredStates: state.states.filter(item =>
                  item.toLowerCase().includes(data.value.toLowerCase()))
              }))
            }
          }
        )
      },

      removed() {
        this.ttpStylesLoadedUnsubscribe();
        this.ttpInputUnsubcribe();
        this.ttpInputSelectUnsubscribe();
        this.ttpAutocompleteSelectUnsubscribe();
      },

      submitForm(event) {
        event.preventDefault();
      },

      async getStates() {
        const states = (await newpropertysetupApi.getStates())
          .map(item => item.name);
        this.setState(state => ({
          ...state,
          states,
          filteredStates: states,
        }))
      },

      async getCountries() {
        const countries = (await newpropertysetupApi.getCountries())
          .map(item => item.name);
        this.setState(state => ({
          ...state,
          countries,
          filteredCountries: countries,
        }))
      },

      async checkAddressInput() {
        const {addressLine1,addressLine2, country, state, city} = this.state;

        if (addressLine1.length && country.length &&
            state.length && city.length) {
          const addressData = await newpropertysetupApi.getTimeZone({
            addressLine1,
            addressLine2,
            country,
            state,
            city,
          });

          this.setState(state => {
            return {
              ...state,
              ...addressData,
            }
          })
        }
      },

      getErrorField() {},

      render() {
        return html`
          <div class="wrapper">
            <ttp-stepper
              step=${2}
            ></ttp-stepper>
            <div class="property-container">
              <form class="property-form" @submit=${this.submitForm}>
                <div class="inputs-group">
                  <ttp-input
                    name="managementBrand"
                    label="Management Brand"
                    value=${this.state.managementBrand}
                    input-id="managementBrand"
                    is-error=${this.getErrorField('managementBrand')}
                    autocomplete="off"
                    required="true"
                    autofocus
                    maxlength=${60}
                  ></ttp-input>
                  <ttp-input
                    name="propertyTitle"
                    label="Property Title"
                    value=${this.state.propertyTitle}
                    input-id="propertyTitle"
                    is-error=${this.getErrorField('propertyTitle')}
                    autocomplete="off"
                    required="true"
                    maxlength=${60}
                  ></ttp-input>
                  <ttp-input
                    name="addressLine1"
                    label="Address Line 1"
                    value=${this.state.addressLine1}
                    input-id="addressLine1"
                    is-error=${this.getErrorField('addressLine1')}
                    autocomplete="off"
                    required="true"
                    maxlength=${60}
                  ></ttp-input>
                  <ttp-input
                    name="addressLine2"
                    label="Address Line 2"
                    value=${this.state.addressLine2}
                    input-id="addressLine2"
                    is-error=${this.getErrorField('addressLine2')}
                    autocomplete="off"
                    maxlength=${60}
                  ></ttp-input>
                  <ttp-input-select
                    name="country"
                    label="Country"
                    value=${this.state.country}
                    input-id="country"
                    required="true"
                    list=${this.state.filteredCountries}
                    src=${'/assets/icons/arrow-down.svg'}
                    autocomplete-select="true"
                  ></ttp-input-select>
                  <ttp-input-select
                    name="state"
                    label="State / Province"
                    value=${this.state.state}
                    input-id="state"
                    required="true"
                    list=${this.state.filteredStates}
                    src=${'/assets/icons/arrow-down.svg'}
                    autocomplete-select="true"
                  ></ttp-input-select>
                  <ttp-input
                    name="city"
                    label="City / District"
                    value=${this.state.city}
                    input-id="city"
                    is-error=${this.getErrorField('city')}
                    autocomplete="off"
                    required="true"
                  ></ttp-input>
                  <ttp-input
                    type="number"
                    name="postalCode"
                    label="Postal Code"
                    value=${this.state.postalCode}
                    input-id="postalCode"
                    is-error=${this.getErrorField('postalCode')}
                    autocomplete="off"
                    required="true"
                    maxLength=${10}
                  ></ttp-input>
                  <div class="time-zone-container">
                    <label class="time-zone-container__label"
                    >Time Zone</label
                    >
                    <div class="time-zone-container__zone">
                      ${this.state.timeZone}
                    </div>
                  </div>
                </div>
                <button type="submit" class="submit-button">
                  Next
                </button>
              </form>
            </div>
          </div>
        `
      }
    })
  )
}
