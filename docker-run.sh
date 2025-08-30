docker stop debuggo-ui
docker rm debuggo-ui
docker run -d -p 8080:80 -v $(pwd)/.env:/app/.env  --name debuggo-ui thelisdeep/debuggo-ui 