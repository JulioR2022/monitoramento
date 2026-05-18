import jwt
import datetime
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os

SECRET_KEY = os.getenv('SECRET_KEY', "Hm6v741qSccLfqAH5qXbmQKjOvTS/iObl0wyYkhl1aI=")
ALGORITHM =  os.getenv('ALGORITHM',"HS256")
ACCESS_TOKEN_EXPIRE = 120

pwd = CryptContext(schemes=['bcrypt'], deprecated= 'auto')
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')

def verify_hash_password(plain_password, hash_password):
    return pwd.verify(plain_password, hash_password)

def get_hash_password(password):
    return pwd.hash(password)

def create_access_token(data:dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes= ACCESS_TOKEN_EXPIRE)
    to_encode.update({'exp':expire})
    encoded = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded

def get_current_user(token = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get('sub')
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Credenciais inválidas"
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token expirado"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciais inválidas"
        )
