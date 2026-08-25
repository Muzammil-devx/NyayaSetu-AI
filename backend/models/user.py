from pydantic import BaseModel, EmailStr

class UserProfile(BaseModel):
    uid: str
    email: EmailStr
    name: str | None = None  