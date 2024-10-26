from flask_restful import Resource, reqparse
import base64
from barcode_scanner import decode
from PIL import Image
import io
from retrieve_info import fetch_product_data, map_nutrition_facts, calculate_total_product_score

class Barcode(Resource):
    def post(self):
        print("Occured")
        parser = reqparse.RequestParser()
        parser.add_argument('image', type=str, required=True, help='Image data is required.')
        args = parser.parse_args()
        image_data = args['image'][21:]
        
        
        try:
            img = Image.open(io.BytesIO(base64.b64decode(image_data)))
        except Exception as e:
            print(e)
            return {'message': f'Failed to decode image data: {str(e)}'}, 400
        
        decoded_codes = decode(img)
        data = {}
        for code in decoded_codes:
            barcode = str(code.data)
            product = map_nutrition_facts(fetch_product_data(barcode))
            data[barcode] = [product, calculate_total_product_score(product)]
            return data[barcode], 200