from flask_restful import Resource, reqparse
from openai import OpenAI
import os

with open('.env') as f:
    for line in f.readlines():
        key, value = line.split('=')
        os.environ[key] = value

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


class Chat(Resource):
    def post(self):
        print("occured")
        parser = reqparse.RequestParser()
        parser.add_argument('data', type=dict, required=True, help='Image data is required.')
        args = parser.parse_args()
        nutrition_data = args['data']

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": f"""
You are a health specialist.
Based on the following data, give a summary of the pros and cons of eating this food:

{nutrition_data}
""",
                }
            ],
            model="gpt-3.5-turbo",
        )

        response = chat_completion.choices[0].message.content
        print(response)
        return response, 200