FROM python:3.7-alpine
WORKDIR /app
COPY . . 
RUN pip install requests
RUN pip install kafka-python
ENTRYPOINT ["python"]
CMD ["app.py"]
