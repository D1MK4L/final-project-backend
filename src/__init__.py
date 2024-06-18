from flask import Flask, render_template, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from mongoengine import connect
from src.user_blueprint import user
from src.gameusername_blueprint import gameusername


app = Flask(__name__)
jwt = JWTManager(app)
app.config["JWT_SECRET_KEY"] = "super secret and difficult to guess key"

connect(
    host="mongodb+srv://cfuser:Ed7odjIvH8Av1kaS@gustafferdb.gt7ywkv.mongodb.net/",
    db="codingfactory",
    alias="codingfactory",
)

cors = CORS(
    app,
    resources={r"*": {"origins": ["http://localhost:4200", "https://d1mk4l.github.io/angular-frontend"]}},
)

@app.after_request
def after_request(response):
    print(f"CORS headers: {response.headers.get('Access-Control-Allow-Origin')}")
    return response

app.register_blueprint(user, url_prefix="/user")
app.register_blueprint(gameusername, url_prefix="/gameusername")







