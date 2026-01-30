import bcrypt

def hash_password(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, password_hash: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), password_hash.encode('utf-8'))