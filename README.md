[![Releases](https://img.shields.io/github/v/tag/tillkuhn/angkor?color=blue)](https://github.com/tillkuhn/angkor/releases)
[![License](https://img.shields.io/github/license/tillkuhn/angkor?color=blue)](https://github.com/tillkuhn/angkor/blob/master/LICENSE)
[![david-dm](https://david-dm.org/tillkuhn/angkor.svg?path=ui)](https://david-dm.org/tillkuhn/angkor?path=ui)

## AngKoR - Angular Kotlin RESTful Webapp Stack
![](docs/modules/ROOT/images/img_4075_angkor_sunrise_pano.jpg)

This (almost) purely educational application manages places I'd like to visit some day. 
Key technologies: [Angular](https://angular.io/) based single-page app with Mapbox GL, AWS Cognito for OAuth2, S3 and PostgreSQL DB for persistence and
a Spring Boot backend written in [Kotlin](https://kotlinlang.org/), 
all created on AWS Infrastructure with [Terraform](https://www.terraform.io/) and Confidence.

## tl;dr

```shell script
$ make angkor
Built Angkor 🌇
```

## Infrastructure

You should have [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) and most importantly [Terraform](https://www.terraform.io/intro/getting-started/install.html) installed.
In a nutshell the application's neighborhood looks as follows (credits to [cloudcraft.co](https://cloudcraft.co/) for their nice web based drawing tool):

![](./docs/images/infrastructure.png)

## Angkor wasn't built in a day ... 

We use good old [GNU Make](https://www.gnu.org/software/make/) utility to manage all tasks for terraform, gradle, yarn
and whatever else we have in our ecosystem centrally. Rund without args to see what's possible, open the [Makefile](./Makefile) to look beyond!

```shell script
$ make
apiclean                       cleans up build/ folder in api
apibuild                       assembles backend jar with gradle (alias: assemble)
apirun                         runs springBoot app using gradle bootRun (alias: bootrun)
apidockerize                   builds api docker images on top of recent opdenjdk
apipush                        build api docker image and deploys to dockerhub
apideploy                      deploy api with subsequent pull and restart on server

uiclean                        cleans up dist/ folder in ui
uibuild                        builds ui
uibuild-prod                   builds ui --prod
uirun                          runs ui with ng serve and opens browser (alias: serve)
uidockerize                    creates frontend docker image based on nginx
uipush                         creates docker frontend image and deploys to dockerhub
uideploy                       deploy ui with subsequent pull and restart on server
uimocks                        runs json-server to mock api services for ui (alias: mock)

tfinit                         runs terraform init
tfplan                         runs terraform plan with implicit init and fmt (alias: plan)
tfdeploy                       runs terraform apply with auto-approval (alias: apply)

ec2stop                        stops the ec2 instance (alias: stop)
ec2start                       launches the ec-2instamce (alias: start)
ec2status                      get ec2 instance status (alias: status)
ec2ps                          show docker compose status on instance
ec2login                       ssh logs into current instance (alias: ssh)
ec2pull                        pulls recent config and changes on server side, triggers docker-compose up (alias: pull)

docsbuild                      antora generate antora-playbook.yml
docsdeploy                     deploys antora built html pages to s3

allclean                       Clean up build artifact directories in backend and frontend (alias: clean)
allbuild                       Builds frontend and backend (alias: build)
alldeploy                      builds and deploys frontend and backend images (alias deploy)

angkor                          the ultimate target - builds and deploys everything 🦄
```

## Anybody listening?

```shell script
$ curl -sS http://localhost:8080/actuator/health
{"status":"UP"}
$ open http://localhost:4200
```

## I want more Documentation

Really? Coming soon: Dedicated documentation project built with [Antora](https://antora.org/). 
You can already check out the [sources](./docs/modules/ROOT/pages), It's asciidoc, so it's easy to read w/o transformation.

## Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md)
