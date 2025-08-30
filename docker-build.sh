docker buildx build --platform linux/amd64 -t thelisdeep/debuggo-ui:latest --load .
rm debuggo-ui.tar
docker save -o debuggo-ui.tar thelisdeep/debuggo-ui:latest