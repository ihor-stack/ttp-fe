  export class NewPropertySetupApi {
    async getTimeZone(address) {
      try {
        const upload = await fetch (`${window.SERVER_URL}/create-property/timezone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(address),
        });

        if (upload.status === 200) {
          const resp = await upload.json();

          return resp;
        }
      } catch (err) {
        console.error(err);
      }
    };

    async getCountries() {
      try {
        const upload = await fetch(`${window.SERVER_URL}/create-property/countries`,{
          method: 'GET'
        });

        const resp = await upload.json();

        return resp;
      } catch (err) {
        console.error(err);
      }
    };

    async getStates() {
      try {
        const upload = await fetch(`${window.SERVER_URL}/create-property/states`,{
          method: 'GET'
        });

        const resp = await upload.json();

        return resp;
      } catch (err) {
        console.error(err);
      }
    }
  }
