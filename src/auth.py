from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from src.configuration import config
from datetime import datetime, timedelta
import bcrypt

security = HTTPBearer()


def hash_password(password: str) -> str:
    """
    Hashes the given password using bcrypt.

    Args:
        password (str): The plain text password to hash.

    Returns:
        str: The hashed password.
    """
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt)
    return hashed.decode()  # Store as string in database


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password against its hash.

    Args:
        plain_password (str): The plain text password to verify.
        hashed_password (str): The stored hashed password.

    Returns:
        bool: True if password matches, False otherwise.
    """
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def generate_jwt_token(user_id: str, expires_in: int = config.JWT_EXPIRES_IN) -> str:
    """
    Generates a JWT token for the given user ID and expiration time.

    Args:
        user_id (int): The user ID to include in the token.
        expires_at (int): The expiration time as a Unix timestamp.

    Returns:
        str: The generated JWT token.
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.now() + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, config.JWT_SECRET_KEY, algorithm="HS256")
    return token


def decode_jwt_token(token: str) -> dict:
    """
    Decodes the given JWT token.

    Args:
        token (str): The JWT token to decode.

    Returns:
        dict: The decoded token payload.
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Extract and validate JWT token from Authorization header.
    Returns the decoded token payload.
    """
    token = credentials.credentials
    payload = decode_jwt_token(token)  # This will raise HTTPException if invalid
    return payload


async def get_current_user_id(payload: dict = Depends(get_current_user)) -> str:
    """
    Extract user_id from the validated token payload.
    """
    return payload.get("user_id")
