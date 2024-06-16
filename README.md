# deployer

Upload static files and deploy it locally

```
cd test && tar -czvf ../test.tar.gz $(ls -A) && cd ..
curl \
  -v \
  -H "Authorization: api-key P@ssw0rd" \
  -F "file=@test.tar.gz" \
  http://localhost:8080/upload
```
