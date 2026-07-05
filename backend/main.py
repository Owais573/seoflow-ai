from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="SEOFlow AI API",
    description="Backend for SEOFlow AI automated content operations",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api import workflows, monitoring

app.include_router(workflows.router)
app.include_router(monitoring.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SEOFlow AI API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
