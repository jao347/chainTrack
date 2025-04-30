import tempfile
import ffmpeg
import numpy as np
import librosa
from celery import Celery
from PIL import Image
import imagehash
from elasticsearch import Elasticsearch

celery = Celery(__name__, broker='redis://redis:6379/0')
es = Elasticsearch(['http://elasticsearch:9200'])

@celery.task
def process_video(video_url):
    # Download to temp file
    tmp = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
    ffmpeg.input(video_url).output(tmp.name).run(overwrite_output=True)

    # Split into 10s segments with 5s overlap
    duration = float(ffmpeg.probe(tmp.name)['format']['duration'])
    step = 5.0
    segment_length = 10.0
    times = np.arange(0, duration, step)

    for start in times:
        out = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        (ffmpeg.input(tmp.name, ss=start, t=segment_length)
             .filter('select', 'gte(t,0)')
             .output(out.name, vframes=1)
             .run(quiet=True, overwrite_output=True))

        # Visual hash
        img = Image.open(out.name)
        vhash = str(imagehash.phash(img))

        # Audio hash
        y, sr = librosa.load(tmp.name, offset=start, duration=segment_length)
        ahash = str(librosa.feature.mfcc(y=y, sr=sr).mean(axis=1))

        # Index in Elasticsearch
        doc = {
            'video_url': video_url,
            'start': start,
            'vhash': vhash,
            'ahash': ahash
        }
        es.index(index='video_segments', document=doc)