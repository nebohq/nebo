// eslint-disable-next-line no-undef
const environment = typeof __ENV__ === 'undefined' ? 'development' : __ENV__;
const neboURL = environment === 'development' ? 'http://localhost:3000' : 'https://app.nebohq.com';
const componentURL = `${neboURL}/api/components`;

const fetchComponent = async ({ idOrSlug = '', accessToken }) => {
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
};

export default fetchComponent;
export { neboURL, componentURL };
