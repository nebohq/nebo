import Directory from './Directory';
import Component from './Component';
import Renderer from './Renderer';
import { ContentWindow, neboURL } from './Utils';

const window = ContentWindow;
const isNebo = () => window.location.origin === neboURL;

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
  Component.directory = directory;
  Renderer.directory = directory;

  if (isNebo()) window.ComponentDirectory = directory;

  return directory;
};

export default configure;
export { isNebo };
