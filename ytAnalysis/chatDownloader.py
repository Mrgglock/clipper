# The purpose of this file is that given a youtube link, return a list of timestamps of messages sent during the livestream.

# Import dependencies
from chat_downloader import ChatDownloader
import json
import sys
import os

# To be called by the command "python3 filename.py [youtube link]"
# If there is a youtube link to be processed,
if len(sys.argv) == 2 and sys.argv[1]:
    url = sys.argv[1]
    chat = ChatDownloader().get_chat(url)       # create a generator
    timestamps = []
    for message in chat:                        # iterate over messages
        timestamp = message["time_in_seconds"]
        timestamps.append(timestamp)
    # Write it to a file, data.json, of the list of timestamps of messages sent during the livestream.
    __dirname = sys.argv[0]+"/.."
    dataJSONPath = os.path.abspath(__dirname + "/data.json")

    with open(dataJSONPath, 'w') as f:
        json.dump(timestamps, f)