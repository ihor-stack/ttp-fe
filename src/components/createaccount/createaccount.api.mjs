export class CreateAccountApi {
  async register(data) {
    try {
      const upload = await fetch(`${window.SERVER_URL}/auth/register`, {
        method: 'POST',

        body: JSON.stringify(data),
      });

      const resp = await upload.json();

      return resp;
    } catch (err) {
      return err;
    }
  }
}
