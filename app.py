from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# -------------------------
# Landing / Auth page
# -------------------------
@app.route("/")
def index():
    return render_template("index.html")

# -------------------------
# React build (Vite) output
# -------------------------
REACT_DIST_DIR = os.path.join(app.root_path, "static", "react")

def serve_react():
    # serve o index.html do build
    return send_from_directory(REACT_DIST_DIR, "index.html")

# rotas que devem abrir o React SPA
@app.route("/perfil")
def perfil():
    return serve_react()

@app.route("/perfil_cadastro")
def perfil_cadastro():
    return serve_react()

@app.route("/chat")
def chat():
    return serve_react()

# (Opcional, mas recomendado)
# Se tiveres rotas internas do React tipo /perfil/editar ou /chat/123,
# isto garante que não dá 404 no refresh.
@app.route("/<path:path>")
def spa_fallback(path):
    # deixa o Flask servir ficheiros reais do /static
    static_path = os.path.join(app.root_path, "static", path)
    if os.path.isfile(static_path):
        return send_from_directory(app.static_folder, path)

    # fallback para o React
    return serve_react()

if __name__ == "__main__":
    app.run(debug=True)