#/bin/zsh

VERSION=14.0.0 # set version here

cd /tmp
git clone https://github.com/keycloak/keycloak-containers.git
cd keycloak-containers/server
git checkout $VERSION
docker build --platform 'linux/amd64' -t "jboss/keycloak:${VERSION}" .
docker build --platform 'linux/amd64' -t "quay.io/keycloak/keycloak:${VERSION}" .

docker tag keycloak:latest marvinirwin/keycloak2:latest
docker push marvinirwin/keycloak2:latest
