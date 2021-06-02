# @nebohq/nebo

Visually build embeddable React components for your marketing and production websites.

## Table of Contents
- [Install](#install)
- [How to use](#how-to-use)
    - [Adding pages](#adding-pages)
    - [Adding your styles](#adding-your-styles)
    - [Adding your component library](#adding-your-component-library)
- [Questions and feedback](#questions-and-feedback)

## Install
1. Install `@nebohq/nebo`:
```shell
# if you are using npm
npm install @nebohq/nebo
# if you are using yarn
yarn add @nebohq/nebo
```

2. Sign up for [Nebo](https://app.nebohq.com/users/sign_up). After you've signed in, navigate to "Settings" on the side bar.

3. Find and copy the access token. You can find it in the "Developers" section:

<img alt="Access Token" height="150px" src="https://res.cloudinary.com/hzimreaxl/image/upload/v1622158327/setup-developers.png"/>

4. Create a configuration file for nebo and name it `nebo-config.js`. It usually looks something like this:

```js
import { configure } from '@nebohq/nebo';
import React from 'react';
import ReactDOM from 'react-dom';
// Add your styles here

const directory = configure({
  directory: {
    // Add your components here
  },
  react: React,
  renderer: ReactDOM,
  // fill in your access token here
  accessToken: '[ACCESS_TOKEN]',
});

export default directory;
```

4. You're now ready to build components in Nebo!

## How to use
### Adding pages
1. Navigate to [Nebo pages](https://app.nebohq.com/pages).

2. Click "New Page".

<img alt="New Page" height="100px" src="https://res.cloudinary.com/hzimreaxl/image/upload/v1622250220/setup-new_page.png"/>

3. Once you're in the editor, click on the gear icon in the top right to go to page settings.

<img alt="Settings" height="200px" src="https://res.cloudinary.com/hzimreaxl/image/upload/v1622250448/setup-settings.png"/>

4. Here, you can change the name and slug of your page. 
5. Now, click on the top component on the right. If you named your page `Hello, world!`, it will be called `Hello, world!`.

<img alt="Settings" height="150px" src="https://res.cloudinary.com/hzimreaxl/image/upload/v1622251123/setup-editor.png"/>

6. Here you, can edit the page in any way you want. For the sake of this example, we added "This is a test page!" as the content of this page.
   You can find more information on [how to use the editor here](https://nebohq.com/docs/editor).

7. Save your work by clicking the cloud button on the top right.

8. Once you've saved your page, import it in an appropriate place for your app.

```js
import Component from '@nebo/nebohq';

const YourComponent = () => {
  return <Component slug="YOUR SLUG NAME HERE" />; 
}
```

### Adding your styles
1. Create a new `css`/`scss` file called `nebo-config.ccss`.

2. Include any relevant css files, like so:

```scss
@import "variables";
@import "~bootstrap/scss/bootstrap.scss";
@import "~prismjs/themes/prism";
```

3. Package this file into a single, static file:

- If you're using Webpack:

```js
// webpack.config.js
module.exports = {
  ...yourOtherOptions,
  module: {
    ...otherModuleConfigs,
    rules: [
      ...otherRules,
      // Modify your existing CSS/SCSS rules
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // Replace the paths with your CSS paths
              filename: ({ name }) => {
                if (name === 'nebo-config') return 'css/nebo-config.css';
                return 'css/[name]-[contenthash:8].css';
              }
            },
          },
          'css-loader',
        ],
      },
    ],
  },
}
```

- If you're using Ruby on Rails and Webpacker:

```js
// environment.js
const { environment } = require('@rails/webpacker');

// Replace the paths with your CSS paths
environment.plugins.get('MiniCssExtract').options.filename = ({ name }) => {
  if (name === 'nebo-config') return 'css/nebo-config.css';
  return 'css/[name]-[contenthash:8].css';
};
```

4. Restart your webpack server. Now, you should see a new `nebo-config.css` being compiled.

5. On the Nebo website, navigate to "Developer" settings in the Nebo App.
   Add `[YOUR_DEVELOPMENT_URL]/nebo-config.css` or `[YOUR_PRODUCTION_URL]/nebo-config.css`<sup>1</sup> to "Javascript Source URL".

6. Your styles have now been imported!

<sup>1</sup> This will be available after you've deployed.


### Adding your component library
1. In your code, navigate to the Nebo configuration file your created. Add your components in the indicated space.
   Pass your components to the directory key like so:

```js
import { configure } from '@nebohq/nebo';
import React from 'react';
import ReactDOM from 'react-dom';
import { Nav, Container, Row, Col } from 'react-bootstrap';
import { Linkedin } from 'react-bootstrap-icons';

const directory = configure({
  directory: {
    // ADD YOUR COMPONENTS HERE
    Nav,
    Icons: { LinkedIn },
    Bootstrap: { Layout: { Container, Row, Col } }
  },
  react: React,
  renderer: ReactDOM,
  accessToken: '[YOUR_ACCESS_TOKEN]'
});

export default directory;
```

2. Package this file into a single static file.  
- If you're using Webpack:

```js
// webpack.config.js
module.exports = {
  entry: {
    ...yourOtherEntries,
    'nebo-config': ['path/to/nebo-config.js'], // Replace this with your path
  },
  output: {
    filename: (pathData) => (
      pathData.chunk.name === 'nebo-config' ? 'nebo-config.js' : '[name].[hash].bundle.js'
    )
  },
  ...yourOtherOptions
}
```

- If you're using Ruby on Rails and Webpacker:

```js
// environment.js
const { environment } = require('@rails/webpacker');

environment.config.set('output.filename', (pathData) => (
  pathData.chunk.name === 'nebo-config' ? 'nebo-config.js' : '[name].[hash].bundle.js'
));
```

3. Restart your webpack server. Now, you should see a new `nebo-config.js` being compiled.

4. On the Nebo website, navigate to "Developer" settings in the Nebo App.
   Add `[YOUR_DEVELOPMENT_URL]/nebo-config.js` or `[YOUR_PRODUCTION_URL]/nebo-config.js`<sup>1</sup> to "Javascript Source URL".
   
5. Your component library has now been imported!

<sup>1</sup> This will be available after you've deployed.


## Questions and feedback
If you have questions about Nebo or want to provide us feedback, [join our discord](https://discord.gg/eYZZkJV992)!
