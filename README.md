# This is an attempt at reproducing at least to some degree the functionality of [Google's Quick, Draw!](https://quickdraw.withgoogle.com/)

Currently the approach used is a fairly simple CNN trained on a limited dataset (100 classes) of 64x64 size final images, which might be expanded in the future.
### Network architecture so far:
- Input(shape=(64,64,1)),
- Conv2D(16,(3,3),activation="relu"),
- MaxPooling2D(pool_size=(2,2),padding='same'),
- Conv2D(32,(3,3),activation="relu"),
- MaxPooling2D(pool_size=(2,2),padding='same'),
- Flatten(),
- Dense(512,activation="relu"),
- Dropout(0.2),
- Dense(256,activation="relu"),
- Dense(128,activation="relu"),
- Dense(100,activation="softmax")

### App
To run the app execute ```npm run dev``` in the ```/doodle-site``` directory