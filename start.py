
import os
import subprocess
import sys
import shutil
import webbrowser
import time
from pathlib import Path
from threading import Timer

def print_hud(message, type="INFO"):
    colors = {"INFO": "\033[94m", "SUCCESS": "\033[92m", "WARN": "\033[93m", "ERR": "\033[91m"}
    color = colors.get(type, "\033[94m")
    print(f"{color}[J.A.R.V.I.S. {type}]\033[0m {message}")

def check_command(cmd):
    return shutil.which(cmd) is not None

def open_browser():
    print_hud("Neural link active. Opening interface...", "SUCCESS")
    webbrowser.open("http://localhost:8000")

def main():
    print_hud("Initializing system protocols...", "INFO")

    # 1. Sync Python Dependencies
    print_hud("Verifying neural link libraries (Python)...", "INFO")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    except Exception as e:
        print_hud(f"Critical failure in library sync: {e}", "ERR")
        return

    # 2. Check for Node/NPM
    has_npm = check_command("npm")
    
    if has_npm:
        if not os.path.exists("node_modules"):
            print_hud("Downloading architecture components (npm install)...", "INFO")
            subprocess.check_call(["npm", "install"])
        
        # 3. Force Build if missing
        if not os.path.exists("dist"):
            print_hud("Compiling holographic interface (npm run build)...", "INFO")
            try:
                subprocess.check_call(["npm", "run", "build"])
            except subprocess.CalledProcessError:
                print_hud("Build failed. Entering Dev-Stream mode...", "WARN")
    else:
        print_hud("NPM not detected. System will attempt to run in uncompiled mode.", "WARN")

    # 4. Check API Key
    if not os.getenv("API_KEY"):
        print_hud("API_KEY not found in environment. J.A.R.V.I.S. will operate with restricted capabilities.", "WARN")
    
    # 5. Launch Server and Browser
    Timer(2.5, open_browser).start()
    
    print_hud("Engaging Uvicorn uplink on http://localhost:8000", "SUCCESS")
    try:
        # We use a slight delay for the server to be ready
        subprocess.check_call(["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
    except KeyboardInterrupt:
        print_hud("System standby. Neural link severed.", "INFO")
    except Exception as e:
        print_hud(f"Uplink error: {e}", "ERR")

if __name__ == "__main__":
    main()
