import cv2
import numpy as np

image = cv2.imread("Data/correct.png")

height, width = image.shape[:2]

crop_height = height // 3
crop_width = width // 4

for i in range(3):
    for j in range(4):
        cropped_image = image[i*crop_height:(i+1)*crop_height, j*crop_width:(j+1)*crop_width]
        cv2.imwrite(f"Data/correct_cropped/{i}_{j}.png", cropped_image)

blank_image = np.zeros((crop_height, crop_width, 3), np.uint8)
blank_image[:] = (0, 255, 0)
cv2.rectangle(blank_image, (0, 0), (crop_width-1, crop_height-1), (0, 0, 0), 2)
cv2.imwrite("Data/unrevealed.png", blank_image)

blank_image = np.zeros((crop_height, crop_width, 3), np.uint8)
blank_image[:] = (255, 0, 0)
cv2.rectangle(blank_image, (0, 0), (crop_width-1, crop_height-1), (0, 0, 0), 2)
cv2.imwrite("Data/pending.png", blank_image)

blank_image = np.zeros((crop_height, crop_width, 3), np.uint8)
blank_image[:] = (0, 0, 255)
cv2.rectangle(blank_image, (0, 0), (crop_width-1, crop_height-1), (0, 0, 0), 2)
cv2.imwrite("Data/wrong.png", blank_image)

print("Cropped images saved successfully!")