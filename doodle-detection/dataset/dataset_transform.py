#This will 'unpack' h5 files and save the images in their respective folders as .npy files (scaled from 96x96 to 64x64)

import numpy as np
import cv2
import h5py
import os

add = 0
def unpack_file(filename):
    global add
    print(f"Processing {filename}...")
    file = h5py.File(filename)
    images = np.array(file['images'])
    labels = np.array(file['targets']) - min(file['targets']) + add
    add+=10
    uniq_labels = set(labels)

    filenames = {x:0 for x in uniq_labels}

    for l in uniq_labels:
        os.mkdir(f"images/{l}")
    

    for i in range(100_000):
        path = f"images/{labels[i]}"
        img = images[i]
        resized = cv2.resize(img,(64,64))

        with open(os.path.join(path,f"{filenames[labels[i]]}.npy"),"+bw") as f:
            filenames[labels[i]] += 1
            np.save(f,np.expand_dims(resized,2))

    
#if os.path.exists("images"):os.remove("images")
os.mkdir("images")
for i in [2,4,6,8,10,15,16,22,24,33]:
    unpack_file(f"QuickDrawImages{i}.h5")