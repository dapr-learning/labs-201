################ CODEBLOCK 1 - START ##############
### IMPORTS

import json
import time
from dapr.clients import DaprClient
################ CODEBLOCK 1 - START ##############

################ CODEBLOCK 2 - START ##############
### Class definition, __init__ and __del__ methods
class MessageProducer:

    def __init__(self, pubsub_name, topic):
        self.pubsub_name = pubsub_name
        self.client = DaprClient()
        self.topic = topic

    def __del__(self):
        self.client.close()
################ CODEBLOCK 2 - END ##############


################ CODEBLOCK 3 - START ##############
### send_msg method

    def send_msg(self, msg):
        print(f"sending message... {msg}", flush=True)
        try:
            resp = self.client.publish_event(
                pubsub_name=self.pubsub_name,
                topic_name=self.topic,
                data=json.dumps(msg),
                publish_metadata={'rawPayload': 'true'})
            print("message sent successfully...", flush=True)
            return resp
        except Exception as ex:
            return ex
################ CODEBLOCK 3 - END ##############

################ CODEBLOCK 4 - START ##############
### global variables

pubsub_name = 'orderpubsub'
topic = 'test-topic'
message_producer = MessageProducer(pubsub_name,topic)

################ CODEBLOCK 4 - END ##############

################ CODEBLOCK 5 - START ##############
### main loop
i=0
while(True):
    data = {'orderId':i}
    resp = message_producer.send_msg(data)
    time.sleep(1)
    print(resp, flush=True)
    if(i == 100000):
        i = 0
    i+=1
################ CODEBLOCK 5 - END ##############
