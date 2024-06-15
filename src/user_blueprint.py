from flask import Blueprint, request, Response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.user_model import User
import json
import random
from src.gameusername_model import GameUsername
from mongoengine.errors import NotUniqueError
from werkzeug.security import check_password_hash

user = Blueprint("user", __name__)

# The Endpoints for the model user
@user.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        User(**data).save()  # unpacking the data and saving it to the database
        with open("data/random_data.txt", "r") as file:
            lines = file.readlines()
            random_data = [json.loads(line) for line in lines]
            random_choice = random.choice(random_data)
            print("Random data read from file:", random_choice)

        # Create a new GameUsername document with random data
        GameUsername(**random_choice).save()
        
        return Response(json.dumps({"msg": "User registered"}), status=201)
    except NotUniqueError:
        return Response(json.dumps({"msg": "Email already in use"}), status=400)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)


@user.route("/check_duplicate_email/<string:email>", methods=["GET"])
def check_duplicate_email(email):
    try:
        if User.objects(email=email):
            return Response(json.dumps({"msg": "Email already in use"}), status=400)
        return Response(json.dumps({"msg": "Email available"}), status=200)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)


@user.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = User.objects(email=data["email"]).first()
        if user:
            if check_password_hash(user.password, data["password"]):
                fullname = f"{user.givenName}  {user.surName}"
                identity = {"fullname": fullname, "email": user.email}
                access_token = create_access_token(identity=identity)
                return Response(
                    json.dumps(
                        {"msg": "Login successful", "access_token": access_token}
                    ),
                    status=200,
                )
        return Response(json.dumps({"msg": "Invalid credentials"}), status=400)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)


@user.route("/all", methods=["GET"])
def get_all_gameusernames():
    try:
        gameusernames = GameUsername.objects()
        return Response(gameusernames.to_json(), status=200, mimetype='application/json')
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)
    

@user.route("/get/<int:user_id>", methods=["GET"])
def get_gameusername_by_id(user_id):
    try:
        gameusername = GameUsername.objects(_id=user_id).first()
        if not gameusername:
            return Response(json.dumps({"msg": "User not found"}), status=404, mimetype='application/json')
        return Response(gameusername.to_json(), status=200, mimetype='application/json')
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400, mimetype='application/json')
    

@user.route("/delete/<int:_id>", methods=["DELETE"])
def delete_gameusername(_id):
    try:
        GameUsername.objects(_id=_id).delete()
        return Response(json.dumps({"msg": "Game username deleted successfully"}), status=200)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)
    
    
@user.route("/create", methods=["POST"])
def create_gameusername():
    try:
        data = request.get_json()
        GameUsername(**data).save()
        return Response(json.dumps({"msg": "Game username created successfully"}), status=201)
    except NotUniqueError:
        return Response(json.dumps({"msg": "Email or username already in use"}), status=400)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)
    

@user.route("/update/<int:_id>", methods=["PUT"])
def update_gameusername(_id):
    try:
        data = request.get_json()
        GameUsername.objects(_id=_id).update_one(**data)
        return Response(json.dumps({"msg": "User updated successfully"}), status=200, mimetype='application/json')
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)
