from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from services.db_service import save_or_update_user_profile, save_questionario
from services.ai_service import analisar_respostas
from services.questionario_questions import questions_list

app = Flask(__name__)
CORS(app)

@app.route('/')
def landing():
    return render_template('index.html')

@app.route('/questionario')
def questionario():
    return render_template('questionario.html')

@app.route("/save_questionario", methods=["POST"])
def save_questionario_route():
    data = request.get_json()

    user_id = data.get("user_id")
    personal = data.get("personal", {})
    answers = data.get("answers", {})

    if not user_id:
        return jsonify({"error": "Utilizador não autenticado"}), 400

    save_or_update_user_profile(user_id, personal)
    save_questionario(user_id, answers)

    resultado = analisar_respostas(answers, questions_list)

    return jsonify(resultado)

@app.route("/chat-ia")
def chat_ia():
    return render_template("chat_ia.html")

if __name__ == '__main__':
    app.run(debug=True)
