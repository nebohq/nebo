// eslint-disable-next-line no-undef
const environment = typeof __ENV__ === 'undefined' ? 'development' : __ENV__;
const neboURL = environment === 'development' ? 'http://localhost:3000' : 'https://app.nebohq.com';
const componentURL = `${neboURL}/api/components`;

class ComponentFetcher {
  constructor() {
    this.requests = {};
  }

  async fetch({ idOrSlug, accessToken }) {
    this.requests[idOrSlug] ||= this.load({ idOrSlug, accessToken });
    const schemaJSON = await this.requests[idOrSlug];
    delete this.requests[idOrSlug];
    return schemaJSON || null;
  }

  async load({ idOrSlug = '', accessToken }) {
    try {
      const url = `${componentURL}/${idOrSlug ? 'slugs/' : ''}${idOrSlug}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      if (!idOrSlug) return [];
      return null;
    }
  }
}

const singleton = new ComponentFetcher();
export default singleton.fetch.bind(singleton);
export { neboURL, componentURL };
