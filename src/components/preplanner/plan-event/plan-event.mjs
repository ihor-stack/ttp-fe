const STEPS = {
  MODAL_PLAN_AN_EVENT: 1,
  MODAL_CREATE_FLOOR_PLAN: 2,
};
import {
  createInputComponent,
  createInputSelectComponent,
  createButtonSelectComponent,
} from '../../elements/elements.mjs';

import { utils } from '../../../util/utils.mjs';

const luxon = window.luxon;

export function createPlanEventComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  prePlannerApi,
}) {
  createComponent(
    'ttp-plan-event',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          eventTitle: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          startTimeNotation: 'AM',
          endTimeNotation: 'AM',
          step: STEPS.MODAL_PLAN_AN_EVENT,
          roomName: '',
          roomWidth: '',
          roomLength: '',
          formErrorMsg: '',
          formErrorFields: [],
          currentTimeZoneFormatted: '',
          timeZone: '',
          selectedStartDate: '',
          selectedEndDate: '',
        };
      },
      computed: {
        getTimes() {
          return utils.hoursList();
        },
        getModalTitle() {
          let title = 'Plan an Event';
          title =
            this.state.step === STEPS.MODAL_CREATE_FLOOR_PLAN
              ? 'Create a Floor Plan'
              : title;
          return title;
        },
        getTimeNotation() {
          const timeNotation = this.getArrayOfTimesNotations().map(notation => {
            return { value: notation, title: notation };
          });
          return JSON.stringify(timeNotation);
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
        createButtonSelectComponent({ ...propsForComponents });

        const shortDate = new Date().toLocaleTimeString('en-us', {
          timeZoneName: 'short',
        });

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const timezoneFormatted = timezone.replace(/\//g, ' ');

        const fullTime = shortDate.split(' ')[0].split(':');
        const timeHr = fullTime[0];
        const timeMin = fullTime[1];
        const timeNotation = shortDate.split(' ')[1];
        const shortTimeZ = shortDate.split(' ')[2];

        const combinedTimeZone = `${shortTimeZ} - ${timeHr}:${timeMin}${timeNotation} (${timezoneFormatted})`;

        const local = luxon.DateTime.local();

        local.zoneName; //=> 'America/New_York'

        this.setState(state => {
          return {
            ...state,
            currentTimeZoneFormatted: combinedTimeZone,
            timeZone: local.zoneName,
          };
        });
      },

      mounted() {
        this.createDatePickers();

        if (this.state.step === STEPS.MODAL_PLAN_AN_EVENT) {
          const input = this.querySelector('input#event-title');
          if (input) {
            input.focus();
          }
        }

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

        this.inputSelectUnsubscribe = eventBus.subscribe(
          'input-select',
          data => {
            this.setState(state => {
              return {
                ...state,
                [data.name]: data.value,
                formErrorMsg: '',
                formErrorFields: [],
              };
            });

            this.validation();

            if (data.name == 'startTime') {
              this.setState(state => {
                return {
                  ...state,
                  endTime: '',
                };
              });
            }
          }
        );

        this.ttpButtonSelectUnsubscribe = eventBus.subscribe(
          'ttp-button-select',
          data => {
            this.setState(state => {
              return { ...state, [data.name]: data.value };
            });

            this.validation();
          }
        );
      },

      updated() {
        //If the same day selected
        if (this.state.step === STEPS.MODAL_CREATE_FLOOR_PLAN) {
          const input = this.querySelector('input#room-name');
          if (input) {
            const value = input.value;
            if (!value.length) {
              input.focus();
            }
          }
        }
      },

      validation() {
        if (
          this.state.startDate === this.state.endDate ||
          this.state.endDate === ''
        ) {
          const listOfTimes = utils.hoursList();
          const findIndex = listOfTimes.findIndex(
            el => el === this.state.startTime
          );

          this.updateList(findIndex, listOfTimes);

          // Start time in PM, but endTime not, change endTime to PM if its the same day, and update the timelist
          if (this.state.startTimeNotation === 'PM') {
            const listOfNotations = this.getArrayOfTimesNotations();
            const findIndexNotation = listOfNotations.findIndex(
              el => el === this.state.startTimeNotation
            );

            this.setState(state => {
              return { ...state, endTimeNotation: 'PM' };
            });
            this.updateEndTimeNotation(findIndexNotation, listOfNotations);
          } else {
            this.resetNotationList();
          }
        } else {
          this.resetList();
          this.resetNotationList();
        }
      },

      removed() {
        this.clearDatePicker();
        this.ttpInputUnsubscribe();
        this.inputSelectUnsubscribe();
        this.ttpButtonSelectUnsubscribe();
      },

      clearDatePicker() {
        if (this.startDatePicker) {
          this.startDatePicker.remove();
        }
        if (this.endDatePicker) {
          this.endDatePicker.remove();
        }
      },

      createDatePickers() {
        this.clearDatePicker();

        const startSelector = this.querySelector('#start-date');

        const endSelector = this.querySelector('#end-date');

        if (startSelector && endSelector) {
          const dateFormatter = {
            formatter: (input, date, instance) => {
              const value = date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
              });
              input.value = value; // => '04/23/2022'
            },
          };
          // eslint-disable-next-line no-undef
          this.startDatePicker = datepicker(startSelector, {
            id: 1,
            ...dateFormatter,
            dateSelected: this.state.selectedStartDate,
            onSelect: (instance, date) => {
              if (typeof date !== 'undefined') {
                const dateObj = new Date(date);
                const formatted = dateObj.toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                });
                this.setState(state => {
                  return {
                    ...state,
                    startDate: formatted,
                    startTime: '',
                    endTime: '',
                    selectedStartDate: date,
                  };
                });
              } else {
                this.setState(state => {
                  return {
                    ...state,
                    startDate: '',
                    startTime: '',
                    endTime: '',
                    selectedStartDate: '',
                  };
                });
              }
              this.validation();
            },
          });

          this.startDatePicker.setMin(new Date());

          // eslint-disable-next-line no-undef
          this.endDatePicker = datepicker(endSelector, {
            id: 1,
            ...dateFormatter,
            position: 'tl',
            dateSelected: this.state.selectedEndDate,
            onSelect: (instance, date) => {
              if (typeof date !== 'undefined') {
                const dateObj = new Date(date);
                const formatted = dateObj.toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                });
                this.setState(state => {
                  return {
                    ...state,
                    endDate: formatted,
                    endTime: '',
                    endTimeNotation: 'AM',
                    selectedEndDate: date,
                  };
                });
              } else {
                this.setState(state => {
                  return {
                    ...state,
                    endDate: '',
                    endTime: '',
                    endTimeNotation: 'AM',
                    selectedEndDate: '',
                  };
                });
              }
              this.validation();
            },
          });
        }
      },

      getArrayOfTimesNotations() {
        return ['AM', 'PM'];
      },

      updateList(index, listOfTimes) {
        const newListOfEndTimes = listOfTimes.slice(index + 1);

        const getEndTimesComponent = this.querySelector('#endTime');
        if (getEndTimesComponent) {
          getEndTimesComponent.list = newListOfEndTimes.toString();
        }
      },

      resetList() {
        const listOfTimes = utils.hoursList();
        const getEndTimesComponent = this.querySelector('#endTime');
        if (getEndTimesComponent) {
          getEndTimesComponent.list = listOfTimes.toString();
        }
      },

      updateEndTimeNotation(index, listOfNotations) {
        const newListEndNotation = listOfNotations.slice(index);

        const newListEndNotationV = this.formatListNotation(newListEndNotation);

        const getEndTimesComponent = this.querySelector('#endTimeNotation');
        if (getEndTimesComponent) {
          getEndTimesComponent.list = JSON.stringify(newListEndNotationV);
        }
      },

      resetNotationList() {
        const listOfTimes = this.getArrayOfTimesNotations();
        const listOfNotation = this.formatListNotation(listOfTimes);

        const getEndTimesNotation = this.querySelector('#endTimeNotation');
        if (getEndTimesNotation) {
          getEndTimesNotation.list = JSON.stringify(listOfNotation);
        }
      },

      formatListNotation(list) {
        const newList = list.map(notation => {
          return { value: notation, title: notation };
        });

        return newList;
      },

      async onSubmit(event) {
        event.preventDefault();

        const endDate = this.state.endDate;
        if (endDate === '') {
          this.setState(state => {
            return {
              ...state,
              endDate: this.state.startDate,
              selectedEndDate: this.state.selectedStartDate,
            };
          });
        }
        this.setState(state => {
          return { ...state, step: STEPS.MODAL_CREATE_FLOOR_PLAN };
        });
      },

      async onSubmitFinal(event) {
        event.preventDefault();
        // Create event entry in db
        const eventObject = {
          ...this.state,
        };

        const eventData = await prePlannerApi.saveEvent(eventObject);

        const url = new URL(window.location);
        url.searchParams.set('id', eventData.id);
        window.history.pushState({}, '', url);

        eventBus.publish('ttp-show-component', {
          component: STEPS.MODAL_CREATE_FLOOR_PLAN,
        });
      },

      onPlanEventPrevious(event) {
        event.preventDefault();

        this.setState(state => {
          return { ...state, step: STEPS.MODAL_PLAN_AN_EVENT };
        });
        this.createDatePickers();
      },

      render() {
        return html`
          <div class="wrapper">
            <div class="plan-event-wrapper" id="plan-event-wrapper">
              <div class="plan-event-container">
                <div class="plan-title">${this.getModalTitle}</div>
                <div class="plan-event-form-container">
                  ${this.state.step === STEPS.MODAL_PLAN_AN_EVENT
                    ? html`<form
                        class="plan-event-form"
                        @submit=${this.onSubmit}
                      >
                        <div class="inputs-group">
                          <ttp-input
                            name="eventTitle"
                            label="Event Title"
                            value=${this.state.eventTitle}
                            input-id="event-title"
                            maxlength="60"
                            required="true"
                          ></ttp-input>
                        </div>

                        <div class="time-zone-container">
                          <label class="time-zone-container__label"
                            >Time Zone</label
                          >
                          <div class="time-zone-container__zone">
                            ${this.state.currentTimeZoneFormatted}
                          </div>
                        </div>

                        <div class="inputs-group inputs-group--row">
                          <ttp-input
                            name="startDate"
                            label="Start Date"
                            value=${this.state.startDate}
                            input-id="start-date"
                            required="true"
                            no-user-type-in="true"
                          ></ttp-input>

                          <ttp-input-select
                            name="startTime"
                            label="Start Time"
                            value=${this.state.startTime}
                            input-id="start-time"
                            list=${this.getTimes.toString()}
                            required="true"
                            id="startTime"
                          ></ttp-input-select>

                          <ttp-button-select
                            name="startTimeNotation"
                            value=${this.state.startTimeNotation}
                            list=${this.getTimeNotation}
                            id="startTimeNotation"
                          ></ttp-button-select>
                        </div>

                        <div class="inputs-group inputs-group--row">
                          <ttp-input
                            name="endDate"
                            label="End Date"
                            value=${this.state.endDate}
                            input-id="end-date"
                            no-user-type-in="true"
                          ></ttp-input>

                          <ttp-input-select
                            name="endTime"
                            label="End Time"
                            value=${this.state.endTime}
                            input-id="end-time"
                            list=${this.getTimes.toString()}
                            required="true"
                            id="endTime"
                          ></ttp-input-select>

                          <ttp-button-select
                            name="endTimeNotation"
                            value=${this.state.endTimeNotation}
                            list=${this.getTimeNotation}
                            id="endTimeNotation"
                          ></ttp-button-select>
                        </div>

                        <div class="form-button-group">
                          <button type="submit" class="btn-next">next</button>
                        </div>
                      </form>`
                    : html`<form
                        @submit=${this.onSubmitFinal}
                        class="plan-event-form"
                      >
                        <div class="inputs-group">
                          <ttp-input
                            name="roomName"
                            label="Room Name"
                            value=${this.state.roomName}
                            input-id="room-name"
                            maxlength="60"
                            required="true"
                          ></ttp-input>
                        </div>
                        <div
                          class="inputs-group inputs-group--row inputs-group--dimensions"
                        >
                          <ttp-input
                            name="roomWidth"
                            label="Width"
                            value=${this.state.roomWidth}
                            input-id="room-width"
                            type="text"
                            pattern="^[0-9]*$"
                            title="Numbers Only"
                            label-position="top"
                            post-fix="FT"
                            maxlength="4"
                            required="true"
                          ></ttp-input>
                          <ttp-input
                            name="roomLength"
                            label="Length"
                            value=${this.state.roomLength}
                            input-id="room-length"
                            type="text"
                            pattern="^[0-9]*$"
                            label-position="top"
                            post-fix="FT"
                            maxlength="4"
                            title="Numbers Only"
                            required="true"
                          ></ttp-input>
                        </div>
                        <div class="form-button-group">
                          <button
                            class="btn-previous"
                            @click=${this.onPlanEventPrevious}
                            type="button"
                          >
                            previous
                          </button>

                          <button type="submit" class="btn-next">next</button>
                        </div>
                        <div class="form-error-message">
                          ${this.state.formErrorMsg}
                        </div>
                      </form> `}
                </div>
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
