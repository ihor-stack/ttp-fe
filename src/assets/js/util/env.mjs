/**
 * @description setting some global env variables
 */
export function env() {
  const hostname = window.location.hostname;
  window.SERVER_URL = '';
  const time = new Date().toUTCString();
  const version = window.ttpVersion;

  let loginEnv = 'dev';

  const addMetrics = env => {
    const metricsScript = document.createElement('script');
    metricsScript.setAttribute(
      'src',
      'https://metrics1.visitingmedia.com/js/plausible.js'
    );
    metricsScript.setAttribute('defer', 'defer');
    metricsScript.setAttribute('data-domain', `plan-${env}-fe.vmeng.io`);

    const head = document.querySelector('head');
    head.append(metricsScript);
  };

  const serverUrl = env => {
    return `https://plan-${env}-be.vmeng.io`;
  };

  switch (hostname) {
    case 'localhost': {
      window.SERVER_URL = 'http://localhost:8081';
      loginEnv = 'localhost';

      break;
    }
    case 'plan-dev-fe.vmeng.io': {
      loginEnv = 'dev';
      window.SERVER_URL = serverUrl(loginEnv);

      addMetrics(loginEnv);
      break;
    }
    case 'plan-qa-fe.vmeng.io': {
      loginEnv = 'qa';
      window.SERVER_URL = serverUrl(loginEnv);

      addMetrics(loginEnv);
      break;
    }
    case 'plan-demo-fe.vmeng.io': {
      loginEnv = 'demo';
      window.SERVER_URL = serverUrl(loginEnv);

      addMetrics(loginEnv);
      break;
    }
    case 'plan-stage-fe.vmeng.io': {
      loginEnv = 'stage';
      window.SERVER_URL = serverUrl(loginEnv);
      break;
    }
    case 'plan-prod-fe.vmeng.io': {
      loginEnv = 'prod';
      window.SERVER_URL = serverUrl(loginEnv);

      addMetrics(loginEnv);

      break;
    }
    default: {
      window.SERVER_URL = 'http://localhost:8081';
      loginEnv = 'localhost';
      break;
    }
  }

  console.log(
    'at:',
    time,
    'env:',
    loginEnv,
    'server_url:',
    window.SERVER_URL,
    'host:',
    hostname,
    'tag:',
    version
  );
}
