# This is an attempt at reproducing at least to some degree the functionality of [Google's Quick, Draw!](https://quickdraw.withgoogle.com/)

Currently the approach used is a fairly simple CNN trained on a limited dataset of 96x96 size final images, which might be expanded in the future.
### Network architecture so far:
- Input(shape=input_shape)
- Conv2D(16,(3,3),activation="relu")
- MaxPooling2D(pool_size=(2,2),padding='valid')
- Conv2D(16,(3,3),activation="relu")
- MaxPooling2D(pool_size=(2,2),padding='valid')
- Flatten()
- Dense(512,activation="relu")
- Dropout(0.4)
- Dense(256,activation="relu")
- Dense(num_outputs,activation="softmax")