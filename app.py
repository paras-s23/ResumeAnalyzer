from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)

API_KEY = "PUT_AI_KEY_HERE"

client = OpenAI(api_key=API_KEY)

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    data = request.json

    resume_text = data.get('resume', '')

    if not resume_text:
        return jsonify({"error": "No resume text provided"}), 400

    prompt = f"""
    Analyze this resume.

    Give:
    1. Strengths
    2. Weaknesses
    3. Missing skills
    4. Suggested improvements
    5. Overall hiring score out of 10

    Resume:

    {resume_text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a professional AI recruiter."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    result = response.choices[0].message.content

    return jsonify({"analysis": result})


if __name__ == '__main__':
    app.run(debug=True)


