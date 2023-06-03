const luxon = window.luxon;
export class PrePlannerApi {
  async getEvent(id) {
    try {
      const eventObj = await fetch(
        `${window.SERVER_URL}/event/get-event/${id}`,
        {
          method: 'GET',
        }
      );
      const eventData = await eventObj.json();
      console.log('getEventData', eventData);

      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async saveEvent(eventObject) {
    try {
      const startDateLuxon = luxon.DateTime.fromFormat(
        `${eventObject.startDate} ${eventObject.startTime} ${eventObject.startTimeNotation} ${eventObject.timeZone}`,
        'LL/dd/yyyy h:mm a z',
        {
          setZone: true,
        }
      ).toString();

      const endDateLuxon = luxon.DateTime.fromFormat(
        `${eventObject.endDate} ${eventObject.endTime} ${eventObject.endTimeNotation} ${eventObject.timeZone}`,
        'LL/dd/yyyy h:mm a z',
        {
          setZone: true,
        }
      ).toString();
      const object = {
        title: eventObject.eventTitle,
        startDate: startDateLuxon,
        endDate: endDateLuxon,
        roomName: eventObject.roomName,
        roomWidth: eventObject.roomWidth,
        roomLength: eventObject.roomLength,
      };

      const saveEvent = await fetch(`${window.SERVER_URL}/event/save-event`, {
        method: 'POST',
        body: JSON.stringify(object),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const eventData = await saveEvent.json();

      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }

  async updateEvent(id, eventObject) {
    try {
      const object = {
        roomWidth: eventObject.roomWidth,
        roomLength: eventObject.roomLength,
      };

      const updateEventResp = await fetch(
        `${window.SERVER_URL}/event/update-room-dimensions/${id}`,
        {
          method: 'POST',
          body: JSON.stringify(object),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const eventData = await updateEventResp.json();

      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }
}
