from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def get_health_status():
    return {"status": "Teams ok"}
