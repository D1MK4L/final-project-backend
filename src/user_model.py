import mongoengine as me
from werkzeug.security import generate_password_hash


class User(me.Document):
    givenName = me.StringField(required=True)
    surName = me.StringField(required=True)
    email = me.StringField(required=True, unique=True)
    password = me.StringField(required=True)
    # game_username = me.ReferenceField('GameUsername', required=False)
    meta = {"collection": "users", "db_alias": "codingfactory"}

    def save(self, *args, **kwargs):
        self.password = generate_password_hash(self.password)
        super(User, self).save(*args, **kwargs)
