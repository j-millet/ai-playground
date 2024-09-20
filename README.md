# This is an attempt at reproducing at least to some degree the core functionality of [Google's Quick, Draw!](https://quickdraw.withgoogle.com/)

The approach used is a simple CNN trained on a limited dataset (100 classes) of 64x64 size final images, which might be expanded in the future.

![gif](https://raw.githubusercontent.com/j-millet/doodle-detection/master/images/show.gif)

### App
To run the app execute ```npm install && npm run dev``` in the ```/doodle-site``` directory. Alternatively you can use the ```run.sh``` script.