docker stop auroqa-ui
docker rm auroqa-ui
docker run -d -p 8080:80 -v $(pwd)/.env:/app/.env  --name auroqa-ui thelisdeep/auroqa-ui 