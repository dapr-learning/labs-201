################ CODEBLOCK 1 - START ##############
### IMPORTS

import json
import time
from kafka import KafkaProducer
################ CODEBLOCK 1 - END ##############

################ CODEBLOCK 2 - START ##############
### Class definition, __init__ and __del__ methods
class MessageProducer:

    def __init__(self, broker, topic):
        self.broker = broker
        self.topic = topic
        self.producer = KafkaProducer(bootstrap_servers=self.broker,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all',
            retries = 3)

    def __del__(self):
        self.producer.close()
################ CODEBLOCK 2 - END ##############

################ CODEBLOCK 3 - START ##############
### send_msg method
    def send_msg(self, msg):
        print(f"sending message... {msg}", flush=True)
        try:
            future = self.producer.send(self.topic,msg)
            self.producer.flush()
            future.get(timeout=60)
            print("message sent successfully...", flush=True)
            return {'status_code':200, 'error':None}
        except Exception as ex:
            return ex
################ CODEBLOCK 3 - END ##############

################ CODEBLOCK 4 - START ##############
### global variables

broker = 'my-kafka:9092'
topic = 'test-topic'
message_producer = MessageProducer(broker,topic)

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
