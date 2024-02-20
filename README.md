# This is an attempt at reproducing at least to some degree the functionality of [Google's Quick, Draw!](https://quickdraw.withgoogle.com/)

Currently the approach used is a fairly simple CNN trained on a limited dataset of 96x96 size final images, which might be expanded in the future.
### Network architecture so far:
- Input(shape=(96,96,1)),
- Conv2D(32,(3,3),activation="relu"),
- MaxPooling2D(pool_size=(2,2),padding='valid'),
- Conv2D(64,(3,3),activation="relu"),
- MaxPooling2D(pool_size=(2,2),padding='valid'),
- Conv2D(32,(3,3),activation="relu"),
- MaxPooling2D(pool_size=(2,2),padding='valid'),
- Flatten(),
- Dense(128,activation="relu"),
- Dropout(0.4),
- Dense(256,activation="relu"),
- Dropout(0.2),
- Dense(128,activation="relu"),
- Dense(20,activation="softmax")