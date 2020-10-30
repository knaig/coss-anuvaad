#!/bin/bash
#mvn compile
#mvn clean install
mvn clean install
gradle clean build
commit_id=${BUILD_ID}-$(git rev-parse --short HEAD)
#commit_id=$(git rev-parse --short HEAD)
echo $commit_id> commit_id.txt
docker build -t anuvaadio/$image_name:$commit_id .
docker login -u $dockerhub_user -p $dockerhub_pass
docker push anuvaadio/$image_name:$commit_id
