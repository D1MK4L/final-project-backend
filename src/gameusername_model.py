import mongoengine as me

# Define the GameUsername class with a custom _id field
class GameUsername(me.Document):
    _id = me.IntField(primary_key=True, required=True)  # Custom _id field
    givenName = me.StringField(required=True)
    surName = me.StringField(required=True)
    email = me.StringField(required=True, unique=True)
    username = me.StringField(required=True, unique=True)
    meta = {"collection": "usernames", "db_alias": "codingfactory"}

    @classmethod
    def get_next_id(cls):
        last_object = cls.objects().order_by("-_id").first()
        next_id = last_object._id + 1 if last_object else 1
        return next_id

    def save(self, *args, **kwargs):
        if not self._id:
            self._id = self.get_next_id()
        super(GameUsername, self).save(*args, **kwargs)
