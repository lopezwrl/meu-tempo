import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=os.environ.get("MEUTEMPO_DEBUG") == "1", host="127.0.0.1", port=port)
