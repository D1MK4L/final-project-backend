from flask import Blueprint, request, Response
from flask_jwt_extended import jwt_required
from src.gameusername_model import GameUsername
import json
from mongoengine.errors import NotUniqueError

gameusername = Blueprint("usernames", __name__)


# The endpoints for the model gameusername
@gameusername.route("/create", methods=["POST"])
@jwt_required()
def add_gameusername():
    try:
        data = request.get_json()
        print(data)
        
        # Automatically assigned by the GameUsername model
        GameUsername(**data).save()
        return Response(json.dumps({"msg": "User added"}), status=201)
    except NotUniqueError:
        return Response(json.dumps({"msg": "Email or username already in use"}), status=400)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)

@gameusername.route("/email/<string:email>", methods=["GET"])
@jwt_required()
def get_gameusername_by_email(email):
    try:
        customer = GameUsername.objects(email=email).first()
        if customer:
            return Response(json.dumps(customer.to_mongo()), status=200)
        return Response(json.dumps({"msg": "User not found"}), status=404)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)

@gameusername.route("/username/<string:username>", methods=["GET"])
@jwt_required()
def get_gameusername_by_username(username):
    try:
        customer = GameUsername.objects(username=username).exclude("id").first()
        if customer:
            return Response(json.dumps(customer.to_mongo()), status=200)
        return Response(json.dumps({"msg": "User not found"}), status=404)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)

@gameusername.route("/<int:_id>", methods=["PATCH"])
@jwt_required()
def update_gameusername(_id):
    try:
        data = request.get_json()
        GameUsername.objects(_id=_id).update_one(**data)
        return Response(json.dumps({"msg": "User updated"}), status=200)
    except Exception as e:
        print(e)
        return Response(json.dumps({"msg": str(e)}), status=400)



