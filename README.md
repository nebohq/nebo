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

4. Use the Nebo plugin to set up your repository. Change the command below with your access token, static assets path, and global styles path.  

```shell
# with npm
npx nebo init --access-token=your-access-token --public-path=./path/to/static/assets --global-styles-path=./src/stylesheets/application.scss

# with yarn
yarn run nebo init --access-token=your-access-token --public-path=./path/to/static/assets --global-styles-path=./src/stylesheets/application.scss
```

5. This will generate two files: `nebo.config.js` and `nebo.js`. We'll use the first to import components and the latter output Nebo assets for use in settings.

6. You're ready to build pages!

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
import NeboComponent from './nebo.js'; // change this path to point to your Nebo directory configuration

const YourComponent = () => {
  return <NeboComponent slug="YOUR SLUG NAME HERE" />; 
}
```

### Adding your styles
1. Go to `nebo.js`.

2. Change the `globalStylesPath` option to point to your global styles.

```scss
module.exports = {
  // other options
  globalStylesPath: ["./src/stylesheets/application.scss", "./src/stylesheets/globals.css"],
};
```

3. Run the following command to compile your Nebo assets. This will build two files `nebo.css` and `nebo.js`. It will also keep track as you change files.
```shell
# with npm
npx nebo watch

# with yarn
yarn run nebo watch
```

4. On the Nebo website, navigate to "Developer" settings in the Nebo App. Add `[YOUR_DEVELOPMENT_URL]/nebo.css` (usually something like `localhost:3000/nebo.css`) to "CSS Source URL".

5. Your styles have now been imported! You should see them after refreshing the Nebo editor.

6. Before you commit your changes, please run the following commands. These will compile the Nebo assets for production.
```shell
# with npm
npx nebo

# with yarn
yarn run nebo
```

7. After you've deployed your changes, navigate to "Developer" settings in the Nebo App. Switch the "CSS Source URL" to the path of your production Nebo asset (usually `[YOUR_PRODUCTION_URL]/nebo.css`).


### Adding your component library
1. Run the following command to compile your Nebo assets. This will build two files `nebo.css` and `nebo.js`. It will also keep track as you change files.
```shell
# with npm
npx nebo watch

# with yarn
yarn run nebo watch
```

2. Navigate to `nebo.js`. Add one of your components to the Nebo directory in the indicated place.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Component, { configure, fetchComponent } from '@nebohq/nebo';

const accessToken = '[ACCESS_TOKEN]';
const directory = configure({
  directory: {
    // Add your components here
  },
  react: React,
  renderer: ReactDOM,
  accessToken,
});

const fetchSchema = async (idOrSlug) => fetchComponent({ idOrSlug, accessToken });

const NeboComponent = Component;
export default NeboComponent;
export { directory, fetchSchema };
``` 

3. On the Nebo website, navigate to "Developer" settings in the Nebo App. Add `[YOUR_DEVELOPMENT_URL]/nebo.js` (usually something like `localhost:3000/nebo.js`) to "Javascript Source URL".
   
4. Your component component has now been imported! You should see it in the library dropdown under "Imported Components".

5. Before you commit your changes, please run the following commands. These will compile the Nebo assets for production.
```shell
# with npm
npx nebo

# with yarn
yarn run nebo
```

6. After you've deployed your changes, navigate to "Developer" settings in the Nebo App. Switch the "JavaScript Source URL" to the path of your production Nebo asset (usually `[YOUR_PRODUCTION_URL]/nebo.js`).

## Questions and feedback
If you have questions about Nebo or want to provide us feedback, [join our discord](https://discord.gg/eYZZkJV992)!
