# Wonderful Frontend Environment

## What it does allow you to do:

- Css
	- Sass preprocessor
	- Watchers
	- Concatenate files
	- Minify files
	- Source Maps
	- autoprefix
	- timestamping
- JavaScript
	- Work in ES6   
	- Watchers
	- Concatenate files
	- Minify files
	- Source Maps
	- timestamping
- SVG
	- Create SVG sprites
		- Css sprites
		- SVG sprites
- Images
	- Optimise images for production

	
## Install

- Clone this repo
- run npm install
- prepare your assets manifest

## Assets Manifest

This gulp setup works with an assets manifest called assets.json located at the root of your directory.

It looks somehow like this:

```json
{
  "site": {
    "title": "",
    "url": "",
    "assets_src": "\/src",
    "assets_dest": "\/web",
    "prefix": ".\/",
    "env": "development"
  },
  "css": {
    "app": [
      ".\/src\/js\/vendor\/slick-carousel\/slick\/slick.scss",
      ".\/src\/styleguide\/scss\/main.scss",
      ".\/src\/scss\/app.scss"
    ]
  },
  "js": {
    "critical": [
      ".\/src\/js\/modernizr-custom.js"
    ],
    "app": [
      ".\/src\/js\/vendor\/jquery\/dist\/jquery.js",
      ".\/src\/js\/vendor\/gsap\/src\/uncompressed\/TweenMax.js",
      ".\/src\/js\/vendor\/scrollmagic\/scrollmagic\/uncompressed\/ScrollMagic.js",
      ".\/src\/js\/app.js"
    ]
  }
}
```

In the `site` section, the really important information are assets_src, assets_dest, and env because they influence the output of the different gulp tasks.

- `assets_src` is the assets working directory, where you'd typically find sass files, the many JS files, uncompressed images, uncompressed svgs and so on. This directory ideally shouldn't be uploaded to your web server
- `assets_dest` is the directory that would be uploaded to your web server. It's where the computed JS and CSS files will go, along with the optimized images and SVG sprites.
- `env`is important because depending on the environment, the task output won't be the same. For example, if you say development, css files won't be compressed, js files won't be transpiled. It's quicker and easier. If you go for staging or production, more treatments will go in each tasks (minification, source maps or not, transpiling etc)

Then you've got the `CSS` and `JS` sections, and under this, groups of assets. 
Each group will combine all the files in its array under a timestamped file that has the group name. For example, if you have a groupe name app in the CSS section, all the files that are in the app array will be combined in a file called app1538483242.css

## Gulp Tasks

- `gulp build-img` Optimise images that are in the img src folder and puts them in the img dest folder.
- `gulp build-svg` Take all of the svg files that are in the svg src folder, then create sprites for them in the svg dest folder
- `gulp build-styleguide-sass` Specific to atomic docs, creates a styleguide.sass file
- `gulp build-styleguide-js` Specific to atomic docs, creates a styleguide.js file
- `gulp build-others` Build sass + JS
- `gulp build` Builds all of the above (but build-img)
- `gulp` gulb-build + watchers

Which means that you only really need one command to work with everything: `gulp`.
Note that `gulp`and `gulp build` do not include the `build-img` task as it was too heavy.

## Using computed files in your development

Files are timestamped. the `gulp`and `gulp build` tasks generate a version.php file in the `assets_dest` directory. You can include this file to get the version number, then use it to register your files in your HTML:

```
<?php $version = file_exists('version.php') ? include "version.php" : null; ?>
<script src="js/app<?php echo $version; ?>.js"></script>
```

