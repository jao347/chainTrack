from flask import Flask, request, jsonify
from tasks import process_video

app = Flask(__name__)

@app.route('/chunk', methods=['POST'])
def chunk():
    video_url = request.json['url']
    job = process_video.delay(video_url)
    return jsonify({'job_id': job.id}), 202

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)