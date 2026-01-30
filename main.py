
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import os
from pathlib import Path

app = FastAPI(title="J.A.R.V.I.S. Core Interface Server")

# Define paths
BASE_DIR = Path(__file__).parent
DIST_DIR = BASE_DIR / "dist"

RECOVERY_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>J.A.R.V.I.S. Recovery</title>
    <style>
        body { background: #020617; color: #22d3ee; font-family: 'Courier New', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .box { border: 1px solid #22d3ee; padding: 40px; border-radius: 10px; background: rgba(34, 211, 238, 0.05); box-shadow: 0 0 30px rgba(34, 211, 238, 0.2); }
        h1 { letter-spacing: 5px; margin-bottom: 10px; }
        p { opacity: 0.7; max-width: 500px; line-height: 1.6; }
        .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; border: 1px solid #22d3ee; color: #22d3ee; text-decoration: none; text-transform: uppercase; font-size: 12px; transition: all 0.3s; }
        .btn:hover { background: #22d3ee; color: #020617; }
        .loader { width: 40px; height: 40px; border: 3px solid rgba(34, 211, 238, 0.2); border-top-color: #22d3ee; border-radius: 50%; animation: spin 1s infinite linear; margin: 20px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="box">
        <h1>SYSTEM_INITIALIZING</h1>
        <div class="loader"></div>
        <p>The holographic interface (Frontend) has not been compiled yet. J.A.R.V.I.S. is currently attempting to build his own neural pathways.</p>
        <p>If you see this screen, please ensure you have <b>Node.js</b> installed and run <b>start.py</b> again.</p>
        <a href="javascript:location.reload()" class="btn">RETRY_CONNECTION</a>
    </div>
</body>
</html>
"""

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "system": "J.A.R.V.I.S.",
        "build_exists": DIST_DIR.exists()
    }

@app.get("/")
async def read_index():
    index_path = DIST_DIR / "index.html"
    if not index_path.exists():
        return HTMLResponse(content=RECOVERY_PAGE, status_code=200)
    return FileResponse(index_path)

# Serve assets if they exist
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")
else:
    # If dist doesn't exist, we don't mount static to avoid 404s on the root route
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
