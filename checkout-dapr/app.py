import json
import time
import logging
import requests
import os

logging.basicConfig(level=logging.INFO)

base_url = os.getenv('BASE_URL', 'http://localhost') + ':' + os.getenv(
                    'DAPR_HTTP_PORT', '3500')
PUBSUB_NAME = 'orderpubsub'
TOPIC = 'test-topic'
logging.info('Publishing to baseURL: %s, Pubsub Name: %s, Topic: %s' % (
            base_url, PUBSUB_NAME, TOPIC))

i=0
while(True):
    data = {'orderId':i}
    parameters = {'metadata.rawPayload':'true',}
    # Publish an event/message using Dapr PubSub via HTTP Post
    result = requests.post(
        url='%s/v1.0/publish/%s/%s' % (base_url, PUBSUB_NAME, TOPIC),
        json=data, params=parameters
    )
    logging.info('Published data: ' + json.dumps(data))
    time.sleep(1)
    if(i == 100000):
        i = 0
    i+=1
