export class FileLoaderApi {
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('chair', file);

      const upload = await fetch(
        'http://localhost:8081/preplanner/upload-file',
        {
          method: 'POST',
          body: formData,
        }
      );

      const resp = await upload.json();

      return resp;
    } catch (err) {
      return err;
    }
  }

  async getChair() {
    try {
      const resp = await fetch('http://localhost:8081/preplanner/', {
        method: 'GET',
      });
      const url = await resp.json();

      return url;
    } catch (err) {
      console.log('err', err);
    }
  }
}
