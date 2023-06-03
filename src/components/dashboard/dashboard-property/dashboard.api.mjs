import { utils } from '/assets/js/util/utils.mjs';

export class Api {
  async getProperties() {
    try {
      const response = await fetch(
        `${window.SERVER_URL}/event/get-properties/`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();

      return data.map(item => ({
        ...item,
        added: utils.formatDate(item.added),
      }));
    } catch (err) {
      console.log(err);
    }
  }
}
