docker buildx build --platform linux/amd64 -t thelisdeep/auroqa-ui:latest --load .
rm auroqa-ui.tar
docker save -o auroqa-ui.tar thelisdeep/auroqa-ui:latest