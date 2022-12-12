# Dapr 201 Labs

## Table of Contents
- [Pre-requisites](#pre-requisites)
- [Welcome to Dapr 201](#welcome-to-dapr-201)
  - [Deployment architecture](#deployment-architecture)
- [Container registry for labs](#container-registry-for-the-labs)
  - [Authenticating with GHCR](#authenticating-with-ghcr)
- [Dependencies for Apps](#dependencies-for-the-apps)
    - [State Store](#state-store)
    - [Pub/Sub](#pubsub)
- [Setup apps without Dapr](#setup-apps-without-dapr)
  - [Checkout App](#checkout-app)
  - [Order Processor App](#order-processor-app)
- [Setup apps with Dapr](#setup-apps-with-dapr)
- [Next steps](#next-steps)

## Pre-requisites

This set of pre-requisites is built with the assumption that participants are using Windows OS.

1. AKS cluster setup (Quickstart: Deploy an AKS cluster by using the Azure portal - Azure Kubernetes Service | Microsoft Learn (https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-portal?tabs=azure-cli)): Create New Cluster (You can use either any MS subscription or even Private subscription)
2. WSL2 (Install WSL | Microsoft Learn (https://learn.microsoft.com/en-us/windows/wsl/install)):  Setup following in WSL2:
**a.** Terminal for WSL2 (Windows Terminal Customization for WSL2 - The Complete Guide (ceos3c.com) (https://www.ceos3c.com/wsl-2/windows-terminal-customization-wsl2/))
**b.** VS Code: Should be able to open with code . . (Get started using VS Code with WSL | Microsoft Learn (https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-vscode))
     **c.** Helm 3 (Helm | Installing Helm (https://helm.sh/docs/intro/install/))
  **d.** [Git](https://learn.microsoft.com/en-us/devops/develop/git/install-and-set-up-git)
  **e.** Install `kubectl` the [k8s CLI](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli#connect-to-the-cluster).
  **f.** Connect to AKS on WSL2 (Ideally, it is done in Step 1 itself, just confirmation by running few basic kubectl commands)
  **g.** Install Dapr (Install the Dapr CLI | Dapr Docs (https://docs.dapr.io/getting-started/install-dapr-cli/)) and run dapr init -k
  **h.** Setup a virtual environment for Python (https://docs.python.org/3/tutorial/venv.html) (Atleast version 3.7)
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/): Once you setup Docker Desktop on Windows, you should be able to use docker in WSL2 by enabling “Use the WSL 2 based Engine” in Settings → General.

![Docker desktop settings](./static-reources/docker-desktop.png)

## Welcome to Dapr 201

**Quick Question**: What is the intent of this session?

**Answer**: To get a hang of Daprizing some simple Apps, while using kubernetes. And, try to realize a bit of power that we as service owners may get by using Dapr.

### Deployment architecture

We will create a simple deployment architecture with 2 microservices and a Dapr sidecar. The microservices will be deployed as Kubernetes pods. The Dapr sidecar will be deployed as a Kubernetes sidecar container. The Dapr sidecar will be responsible for publishing events, subscribing to events, and state management.

![Deployment architecture](./static-reources/service-arch.png)

We will generate few Order Ids in “Checkout” App itself.
These will be published to Kafka, from where Order Processor will fetch them and save them in Redis state store against “order” key.
In the state store, we should be able to see that order id value for Order is increasing gradually.

We will be using *Python for Checkout* App and *Javascript for Order-Processor* App.

### Container Registry for the Labs

#### Authenticating with GHCR

- Create a [personal token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following scopes:
    - `read:packages`
    - `write:packages`
    - `delete:packages`
- Follow the steps in [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry) to authenticate to GHCR using the token you created in step 1.
Run the following command to login to GHCR:
```bash
export CR_PAT=<your token>
echo $CR_PAT | docker login ghcr.io -u <your username> --password-stdin
```

##### Make GHCR Packages public
**Make sure** that any package that is published is marked as public so that it can later be read by the cluster without authentication.
  - Go to `Package settings` in the package, and check the `Make this package public` checkbox at the end.
![Package settings](./static-reources/package-settings.png)

> Note: Make sure to log back into your **work docker logins** after you are done with the labs.

### Dependencies for the Apps

#### State Store

For state store we will be using Redis.

To setup Redis on K8s, we will be using Helm Chart.

Run the following command to install Redis on K8s:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install redis bitnami/redis --set auth.enabled=false
```
> Please note that we have disabled auth for now, as want to keep it simple for setup here for lab.

Now when you run `kubectl get pods` you should be able to see the Redis pods running.

```
NAME                   READY   STATUS    RESTARTS        AGE
redis-master-0         1/1     Running   0               2d18h
redis-replicas-0       1/1     Running   0               2d18h
redis-replicas-1       1/1     Running   0               2d18h
redis-replicas-2       1/1     Running   0               2d18h
```

Now, you should be able to connect to your Redis instance with following commands:

##### Start a redis-client pod

```bash
kubectl run --namespace default redis-client --restart='Never'  --env REDIS_PASSWORD=  --image docker.io/bitnami/redis:7.0.4-debian-11-r11 --command -- sleep infinity

kubectl exec --tty -i redis-client \
   --namespace default -- bash
```

##### Connect to the redis-client pod
In the `exec` bash shell of the redis-client container, you should be able to connect to Redis with following command:

```bash
REDISCLI_AUTH="" redis-cli -h redis-master
```

You can check if Redis setup is fine with:

```bash
keys *
```
OR
```bash
ping
```

#### Pub/Sub

For publishing a message from Checkout app and subscribing to it in Order Processor app, we will be using Kafka as Pub/Sub.

To setup Kafka on K8s, we will be using Helm Chart.

Run the following command to install Kafka on K8s:

```bash
helm install my-kafka bitnami/kafka
```

Now when you run `kubectl get pods` you should be able to see the Kafka pods running.

```
NAME                   READY   STATUS    RESTARTS        AGE
my-kafka-0             1/1     Running   0
2d19h
my-kafka-zookeeper-0   1/1     Running   0               2d19h
redis-client           1/1     Running   0               80m
redis-master-0         1/1     Running   0               2d18h
redis-replicas-0       1/1     Running   0               2d18h
redis-replicas-1       1/1     Running   0               2d18h
redis-replicas-2       1/1     Running   0               2d18h
```

Now that both the dependencies are setup, we can move on to the Apps.

### Setup Apps without Dapr

- Clone the repo [labs-201](https://github.com/dapr-learning/labs-201)
With SSH:
```bash
git clone git@github.com:dapr-learning/labs-201.git
```
With HTTPS:
```bash
git clone https://github.com/dapr-learning/labs-201.git
```
With GitHub CLI:
```bash
gh repo clone dapr-learning/labs-201
```
- Once cloned, open it in vs-code using `code .`
- Observe `app.py` in the `checkout` folder, observe the definitions and usage of KafkaProducer from kafka-python library.
    - It is a small example to publish `orderId` to Kafka.
- In the `order-processor` folder, open `app.js` and observe the definitions and usage of KafkaConsumer from kafka-python library.
    - It is a small example to consume `orderId` from Kafka, and update the state store (Redis) with `orderId`.
> Note both the above apps do not use Dapr


#### Building and deploying the Apps without Dapr

> Note: Make sure you are logged into to your Container Registry through the docker command

- To build and push the `checkout` app, from a terminal in WSL2, run:
```bash
# pwd should root folder of labs
cd checkout
docker build -t ghcr.io/<your-username>/checkout:latest .
docker push ghcr.io/<your-username>/checkout:latest
```
- To build and push the `order-processor` app, from a terminal in WSL2, run:
```bash
# pwd should root folder of labs
cd order-processor
docker build -t ghcr.io/<your-username>/order-processor:latest .
docker push ghcr.io/<your-username>/order-processor:latest
```
- Make the above published images as `public` in your container registry. See [here](#make-ghcr-packages-public)
- In the deploy folder, you will find the `checkout.yaml` and `order-processor.yaml` files.
- Modify the lines in the yaml files to use the image that you just pushed to your container registry.
  - `image: ghcr.io/<your-username>/checkout:latest`
  - `image: ghcr.io/<your-username>/order-processor:latest`
- To deploy the apps, from a terminal in WSL2, run:
```bash
kubectl apply -f order-processor.yaml
kubectl apply -f checkout.yaml
```
- To check if the apps are running, run:
```bash
kubectl get pods
```
- To view and follow the logs for the `checkout` app, run:
```bash
kubectl logs -f checkout-<pod-id> python
```
- To view and follow the logs for the `order-processor` app, run:
```bash
kubectl logs -f order-processor-<pod-id> node
```
- Right now, we have just deployed apps without dapr. Use steps defined [here](#connect-to-the-redis-client-pod) to connect to the redis server.
- Once you have a terminal connected to Redis, follow these [steps](#How-to-verify-that-Apps-are-working-Fine) to verify everything is working as expected.

#### How to verify that Apps are working Fine?
Once you have a terminal connected to Redis, following command should show one of the keys as `order-processor||orders`:
```bash
keys *
```
-  Enquire back-to-back to check if order id and version are getting updated in state store:
```bash
hgetall order-processor||orders
```

#### Cleanup
We need to ensure that we have deleted un-required deployments/services now. For that, let's run following commands:
```bash
1. kubectl delete deployment order-processor
2. kubectl delete service order-processor
3. kubectl delete deployment checkout
```

### Setup Apps with Dapr

Now let's setup the same apps with Dapr.
Assuming that you have already opened the labs-201 codebase in vs-code, let's move on to the next steps.

First, we will Daprize *order-processor* App. We will do it in 3 parts:
- Part 1 - Daprize the App (Per app)
- Part 2- Adding K8s annotations for Dapr to work (Per app)
- Part 3 - Deploying the Apps and the required components

Please follow the steps below to Daprize the App. If you want to skip the steps and see the final code, you can check the [completed-solution](./completed-solution/) for the completed code and deployment files.

You will need to build the apps again for the Daprized version. You can see [here](#part-3---deploying-the-daprized-apps) for deploying the daprzied apps.

#### Part 1 - Daprize the App (Order-processor)

- Open `order-processor/package.json`, remove the following dependencies from the `dependencies` section:
    -  "express": "^4.16.4",
    - "ioredis": "^5.2.4",
    - "kafkajs": "^2.2.3"
- Add the following dependency
    - "@dapr/client": "^2.3.0"
- Open the `order-processor/app.js` and replace the **CODEBLOCK 1** with the following code:
```js
import { DaprClient, DaprServer } from '@dapr/dapr';
```
> Now we have just replaced all the dependencies with Dapr client alone
- Replace the **CODEBLOCK 2** with the following code:
```js
const SERVER_HOST = process.env.SERVER_HOST || "127.0.0.1";
const APP_PORT = process.env.APP_PORT ?? '3000';
const DAPR_HOST = process.env.DAPR_HOST || "http://localhost";
const DAPR_PORT = process.env.DAPR_HTTP_PORT ?? "3500";
```
> Now we have defined the Dapr host and port to be used by the Client
- Replace the **CODEBLOCK 3** with the following code:
```js
const server = new DaprServer(SERVER_HOST, APP_PORT, DAPR_HOST, DAPR_PORT);
const client = new DaprClient(DAPR_HOST, DAPR_PORT)
```
> Now we have created a Dapr Server and Client, server for subscribing to the topic and client for saving the state
- Replace the **CODEBLOCK 4** with the following code:
```js
    server.pubsub.subscribe("orderpubsub", "test-topic", async (order) => {
        console.log("Subscriber received: " + JSON.stringify(order))
        const state = [{
            key: "orders",
            value: order        }];
        // Save state into a state store
        await client.state.save(`statestore`, state)
        console.log("Saving Order: ", order)
    });

    await server.start();
```
> Now we have replaced the Kafka Consumer with Dapr PubSub Subscribe method and the Redis save with Dapr State Save method
- That's it, we have Daprized the `order-processor` app. Now let's move on to the next step.

#### Part 2 - Adding K8s annotations for Dapr to work (Order-processor)

- Open the `deploy/order-processor.yaml` file
- Add the following [annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) to the `order-processor` deployment, in the metadata section of the deployment:
```yaml
    annotations:
      dapr.io/enabled: "true"
      dapr.io/app-id: "order-processor"
      dapr.io/app-port: "3000"
      dapr.io/enable-api-logging: "true"
```
- Let's build and push the containers:
```bash
# pwd should root folder of labs
cd order-processor
docker build -t ghcr.io/<your-username>/order-processor:latest .
docker push ghcr.io/<your-username>/order-processor:latest
```


#### Part 1 - Daprize the App (Checkout)
- Open the `checkout/requirements.txt` file and remove the following dependencies:
    - kafka-python
- Add the following dependency:
    - dapr
- Open the `checkout/app.py` file and replace **CODEBLOCK 1** with the following code:
```python
import json
import time
from dapr.clients import DaprClient
```
> We have replaced the kafka-python dependency with Dapr client
- Replace **CODEBLOCK 2** with the following code:
```python
class MessageProducer:

    def __init__(self, pubsub_name, topic):
        self.pubsub_name = pubsub_name
        self.client = DaprClient()
        self.topic = topic

    def __del__(self):
        self.client.close()
```
> We have changed the broker member variable to pubsub_name and removed the producer member variable and replaced it with a Dapr client
- Replace **CODEBLOCK 3** with the following code:
```python
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
```
> Instead of `self.producer.send()`, we are using the Dapr client to publish the event to the topic.

> Note that we are using the `rawPayload` metadata to send the message as a string and to let Dapr know to not wrap the message in a CloudEvent envelope.
- Replace **CODEBLOCK 4** with the following code:
```python
pubsub_name = 'orderpubsub'
topic = 'test-topic'
message_producer = MessageProducer(pubsub_name,topic)
```
> The only variable that has changed is the pubsub_name, we have removed the broker variable and replaced it with pubsub_name. (Name of the Dapr component)
- That's it, we have Daprized the `checkout` app. Now let's move on to the next step.

#### Part 2 - Adding K8s annotations for Dapr to work (Checkout)

- Open the `deploy/checkout.yaml` file
- Add the following [annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) to the `checkout` deployment, in the metadata section of the deployment:
```yaml
    annotations:
      dapr.io/enabled: "true"
      dapr.io/app-id: "checkout"
      dapr.io/enable-api-logging: "true"
```
- Let's build and push the containers:
```bash
# pwd should root folder of labs
cd checkout
docker build -t ghcr.io/<your-username>/checkout:latest .
docker push ghcr.io/<your-username>/checkout:latest
```

#### Part 3 - Deploying the Daprized apps

> If not already installed, install Dapr on the cluster, running the following command:
> ```bash
> dapr init -k
> ```
> You should be able to see the status of the Dapr control plane pods using the command:
> ```bash
> dapr status -k
> ```
> Output should be like
> ```
> NAME                   NAMESPACE    HEALTHY  STATUS   REPLICAS  VERSION  AGE  CREATED
> dapr-operator          dapr-system  True     Running  1         1.9.5    2d   2022-12-09 13:35.02
 > dapr-dashboard         dapr-system  True     Running  1         0.11.0   2d   2022-12-09 13:35.02
  >dapr-sidecar-injector  dapr-system  True     Running  1         1.9.5    2d   2022-12-09 13:35.02
  >dapr-sentry            dapr-system  True     Running  1         1.9.5    2d   2022-12-09 13:35.02
  >dapr-placement-server  dapr-system  True     Running  1         1.9.5    2d   2022-12-09 13:35.02
> ```
- Let's create the Dapr components in K8s needed for this lab:
```bash
# pwd should root folder of labs or the root of the completed-solution folder
kubectl apply -f deploy/kafka-pubsub-dapr.yaml
kubectl apply -f deploy/redis-state-dapr.yaml
```
- You can view the applied components using the command
```
dapr components -k
```
> Output should be like
> ```
> NAMESPACE  NAME         TYPE          VERSION  SCOPES  CREATED              AGE
 > default    orderpubsub  pubsub.kafka  v1               2022-12-12 08:15.20  2h
> default    statestore   state.redis   v1               2022-12-12 08:15.30  2h
> ```
- Now let's deploy the apps:
```bash
# These are the modified yaml files order-processor and checkout with the Dapr annotations
kubectl apply -f deploy/order-processor.yaml
kubectl apply -f deploy/checkout.yaml
```
- You can view the deployed pods using the command
```bash
kubectl get pods
```
- To view and follow the logs for the `checkout` app, run:
```bash
kubectl logs -f checkout-<pod-id> python
```
- To view and follow the logs for the `order-processor` app, run:
```bash
kubectl logs -f order-processor-<pod-id> node
```
> Note: You can also view the daprd logs for the apps using the command `kubectl logs -f <pod-name> daprd`
- Now, we have deployed apps with Dapr. Use steps defined [here](#connect-to-the-redis-client-pod) to connect to the redis state store.
- Once you have a terminal connected to Redis, follow these [steps](#How-to-verify-that-Apps-are-working-Fine) to verify everything is working as expected.
```bash
hgetall order-processor||orders
```
#### Cleanup
Follow same [cleanup steps](#Cleanup) as above.

### Next Steps
- Please do look at the other quickstarts available [here](https://github.com/dapr/quickstarts)
- You can also look at the [Dapr docs](https://docs.dapr.io/) for more information on Dapr
- You can also look at the [Dapr Python SDK docs](https://dapr.github.io/python-sdk/) for more information on the Python SDK
- You can also look at the [Dapr JS SDK docs](https://dapr.github.io/js-sdk/) for more information on the JS SDK