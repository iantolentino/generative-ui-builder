from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "Backend is running ✅"}

@app.post("/generate-ui/")
def generate_ui(req: PromptRequest):
    """
    Mock response: we map some plain-English prompts -> simple components.
    Later we’ll replace this with a real AI model.
    """
    prompt = req.text.lower()

    if "login" in prompt:
        return {
            "components": [
                {"type": "form", "props": {
                    "title": "Login",
                    "fields": ["Email", "Password"],
                    "submit": "Login"
                }}
            ]
        }

    elif "todo" in prompt:
        return {
            "components": [
                {"type": "form", "props": {
                    "title": "Todo App",
                    "fields": ["Task"],
                    "submit": "Add"
                }},
                {"type": "list", "props": {
                    "items": ["Sample Task 1", "Sample Task 2"]
                }}
            ]
        }

    else:
        return {
            "components": [
                {"type": "card", "props": {
                    "text": f"⚡ Sorry, I don’t know how to build '{req.text}' yet."
                }}
            ]
        }
