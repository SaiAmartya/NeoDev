# https://thepythoncode.com/code/making-a-barcode-scanner-in-python

from pyzbar import pyzbar
from retrieve_info import fetch_product_data, map_nutrition_facts
import cv2


def draw_barcode(decoded, image):
    # n_points = len(decoded.polygon)
    # for i in range(n_points):
    #     image = cv2.line(image, decoded.polygon[i], decoded.polygon[(i+1) % n_points], color=(0, 255, 0), thickness=5)
    image = cv2.rectangle(image, (decoded.rect.left, decoded.rect.top), 
                            (decoded.rect.left + decoded.rect.width, decoded.rect.top + decoded.rect.height),
                            color=(0, 255, 0),
                            thickness=5)
    return image

def decode(image):
    # decodes all barcodes from an image
    decoded_objects = pyzbar.decode(image)
    for obj in decoded_objects:
        # draw the barcode
        # print barcode type & data
        print("Type:", obj.type)
        print("Data:", obj.data)
        print()

    return decoded_objects


if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    while True:
        # read the frame from the camera
        _, frame = cap.read()
        # decode detected barcodes & get the image
        # that is drawn
        frame, decoded_objects = decode(frame)
        # Sample usage
        # barcode = "737628064502"  # Replace this with a barcode of your choice
        for code in decoded_objects:
            barcode = code.data    
            product = fetch_product_data(barcode)
        # show the image in the window
        cv2.imshow("frame", frame)
        if cv2.waitKey(1) == ord("q"):
            break