FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

RUN pip install Flask

EXPOSE 10000

RUN echo 'from flask import Flask\napp = Flask(__name__)\n@app.route("/")\ndef hello():\n    return "Bot is running!"\nif __name__ == "__main__":\n    app.run(host="0.0.0.0", port=10000)' > server.py

CMD ["sh", "-c", "python bot.py & python server.py"]
