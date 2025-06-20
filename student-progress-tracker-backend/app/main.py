from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, chat, courses, progress, users

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
def read_root():
    """
    Gyökér útvonal, amely visszaadja az alkalmazás állapotát.

    Returns:
        dict: Az alkalmazás állapotát jelző üzenet.
    """
    return {"message": "Welcome to the Hallgatói Előrehaladás-követő Webes Alkalmazás API!"}