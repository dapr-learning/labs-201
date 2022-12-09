from kafka import KafkaProducer
import json
import time

class MessageProducer:
    broker = ""
    topic = ""
    producer = None

    def __init__(self, broker, topic):
        self.broker = broker
        self.topic = topic
        self.producer = KafkaProducer(bootstrap_servers=self.broker,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        acks='all',
        retries = 3)

    def send_msg(self, msg):
        print("sending message...")
        try:
            future = self.producer.send(self.topic,msg)
            self.producer.flush()
            future.get(timeout=60)
            print("message sent successfully...")
            return {'status_code':200, 'error':None}
        except Exception as ex:
            return ex

broker = 'my-kafka:9092'
topic = 'test-topic'
message_producer = MessageProducer(broker,topic)

i=0
while(True):
    data = {'orderId':i}
    resp = message_producer.send_msg(data)
    time.sleep(1)
    print(resp)
    if(i == 100000):
        i = 0
    i+=1