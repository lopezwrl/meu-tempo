import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Só escuta neste computador (127.0.0.1). O modo debug fica desligado, a não ser
    # que você peça: MEUTEMPO_DEBUG=1 python run.py
    app.run(debug=os.environ.get("MEUTEMPO_DEBUG") == "1", host="127.0.0.1", port=5000)
