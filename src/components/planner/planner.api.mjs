export class PlannerApi {
  async getEvent(id) {
    try {
      const eventObj = await fetch(
        `${window.SERVER_URL}/event/get-event/${id}`,
        {
          method: 'GET',
        }
      );

      const eventData = await eventObj.json();

      if (eventData.error) {
        return false;
      }
      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async getEventByShareId(id) {
    try {
      const eventObj = await fetch(
        `${window.SERVER_URL}/event/get-event-shared/${id}`,
        {
          method: 'GET',
        }
      );

      const eventData = await eventObj.json();

      if (eventData.error) {
        return false;
      }
      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async saveFurniture(id, furnitureObject) {
    try {
      const list = JSON.stringify(furnitureObject);

      const eventObj = await fetch(
        `${window.SERVER_URL}/event/save-furniture/${id}`,
        {
          method: 'POST',
          body: list,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      const eventData = await eventObj.json();
      return eventData;
    } catch (err) {
      console.log(err);
    }
  }

  async saveEvent(eventObject) {
    try {
      const eventId = await new Promise((resolve, reject) => {
        setTimeout(() => {
          localStorage.setItem('event', JSON.stringify(eventObject));
          const getEvent = localStorage.getItem('event');
          const parseEvent = JSON.parse(getEvent);
          resolve(parseEvent.id);
        }, 300);
      });
      return eventId;
    } catch (err) {
      console.log('err', err);
    }
  }

  async updateEvent(id, eventObject) {
    const getEvent = await this.getEvent(id);
    const updatedEvent = { ...getEvent, ...eventObject };
    localStorage.setItem('event', JSON.stringify(updatedEvent));
  }

  async checkHealth() {
    await fetch(`${window.SERVER_URL}/health-check`, {
      method: 'GET',
    });
  }

  async getChairs() {
    try {
      const eventObj = await fetch(`${window.SERVER_URL}/event/get-chairs/`, {
        method: 'GET',
      });

      const eventData = await eventObj.json();
      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }

  async getTables() {
    try {
      const eventObj = await fetch(`${window.SERVER_URL}/event/get-tables/`, {
        method: 'GET',
      });

      const eventData = await eventObj.json();

      eventData.sort(a => {
        if (a.type === 'round') {
          return -1;
        } else {
          return 1;
        }
      });
      return eventData;
    } catch (err) {
      console.log('err', err);
    }
  }
}
