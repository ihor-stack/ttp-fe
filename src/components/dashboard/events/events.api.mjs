const luxon = window.luxon;

export class EventsApi {
  async getEvents() {
    try {
      const eventObj = await fetch(`${window.SERVER_URL}/event/get-events/`, {
        method: 'GET',
      });
      const eventData = await eventObj.json();
      console.log('getEventsAPI', eventData);

      eventData.forEach(event => {
        // event.event_start_date = '2022-06-17T22:30:00.000Z';
        // event.event_end_date = '2022-06-19T22:30:00.000Z';

        this.setFormatting(event);
      });
      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async getFavoriteEvents() {
    try {
      const eventObj = await fetch(
        `${window.SERVER_URL}/event/favorite-events/`,
        {
          method: 'GET',
        }
      );
      const eventData = await eventObj.json();
      console.log('getFavoriteEventsAPI', eventData);

      eventData.forEach(event => {
        // event.event_start_date = '2022-06-17T22:30:00.000Z';
        // event.event_end_date = '2022-06-19T22:30:00.000Z';
        this.setFormatting(event);
      });
      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  setFormatting(event) {
    const startDateLuxon = luxon.DateTime.fromISO(event.startDate).toFormat(
      'LL/dd/yyyy'
    );
    const endDateLuxon = luxon.DateTime.fromISO(event.endDate).toFormat(
      'LL/dd/yyyy'
    );

    if (startDateLuxon === endDateLuxon) {
      event.date = startDateLuxon;
    } else {
      event.date = `${startDateLuxon} - ${endDateLuxon}`;
    }

    const startTimeLuxon = luxon.DateTime.fromISO(event.startDate).toFormat(
      'hh:mma'
    );
    const endTimeLuxon = luxon.DateTime.fromISO(event.endDate).toFormat(
      'hh:mma'
    );

    event.time = `${startTimeLuxon} - ${endTimeLuxon}`;
  }

  async setFavorite(id) {
    try {
      const eventObj = await fetch(
        `${window.SERVER_URL}/event/favorite-event/${id}`,
        {
          method: 'PUT',
        }
      );
      const eventData = await eventObj.json();

      this.setFormatting(eventData);
      console.log('setFavoriteAPI', eventData);

      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async unSetFavorite(id) {
    try {
      const eventObj = await fetch(
        `${window.SERVER_URL}/event/unfavorite-event/${id}`,
        {
          method: 'PUT',
        }
      );
      const eventData = await eventObj.json();

      this.setFormatting(eventData);
      console.log('unSetFavoriteAPI', eventData);

      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async updateEvent(id, title, startDate, endDate) {
    try {
      const object = {
        title: title,
        startDate: startDate,
        endDate: endDate,
      };

      const saveEvent = await fetch(
        `${window.SERVER_URL}/event/update-event/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(object),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const eventData = await saveEvent.json();
      this.setFormatting(eventData);

      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }

  async duplicateEvent(id, title, startDate, endDate) {
    try {
      const object = {
        title: title,
        startDate: startDate,
        endDate: endDate,
      };

      const saveEvent = await fetch(
        `${window.SERVER_URL}/event/duplicate-event/${id}`,
        {
          method: 'POST',
          body: JSON.stringify(object),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const eventData = await saveEvent.json();

      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }

  async deleteEvent(id) {
    try {
      const deleteEvent = await fetch(
        `${window.SERVER_URL}/event/delete-event/${id}`,
        {
          method: 'delete',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const eventData = await deleteEvent.json();

      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }
}
