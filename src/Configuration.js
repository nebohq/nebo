import Directory from './Directory';
import Component from './Component';
import Renderer from './Renderer';
import Head from './Head';
import Registry from './Registry';
import { ContentWindow } from './Utils';

const window = ContentWindow;
// eslint-disable-next-line no-unused-vars,no-undef
const environment = typeof __ENV__ === 'undefined' ? 'development' : __ENV__;
const isNebo = () => {
  if (environment === 'development') {
    return /http:\/\/(.*?\.)?localhost:3000/.test(window.location.origin || '');
  }
  return /https:\/\/(.*?\.)nebohq.com/.test(window.location.origin || '');
};

const configure = ({
  accessToken,
  directory: components = {},
  cacheTimeout = 0,
  react,
  renderer,
}) => {
  const directory = new Directory({
    components,
    react,
    renderer,
    accessToken,
    cacheForMillis: cacheTimeout,
    // eslint-disable-next-line no-undef
    version: __NEBO_VERSION__,
  });
  const reactComponents = [Component, Renderer, Head];
  reactComponents.forEach((registration) => {
    Object.assign(registration, { directory, React: react });
  });
  Object.assign(directory, {
    NeboComponent: Component,
    Component,
    NeboHead: Head,
    Registry,
    Renderer,
  });

  if (isNebo()) window.ComponentDirectory = directory;

  return directory;
};

export default configure;
export { isNebo };
