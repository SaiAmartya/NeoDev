from flask import Flask
from flask_restful import Api, Resource, reqparse
import random
from barcode import Barcode
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
api = Api(app)

api.add_resource(Barcode, '/barcode/')

if __name__ == '__main__':
    app.run(debug=True)
