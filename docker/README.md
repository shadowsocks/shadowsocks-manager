README
===

Recently I have spent quite a lot time on trying setup the shadowsocks-manager in docker, here I want to save the time for other developers and you can build your own image based on this example.

Since the manager should manage only one specific shadowsocks instance, I am going to put them into the same container and using `supervisor` to ensure the process running inside the container for the purpose of deploying it into docker swarm mode, or the architecture of shadowsocks-manager along with docker swarm mesh route will make it quite difficult to ensure shadowsocks-manager control the specific shadowsocks-libev instance. Here is the introduction from docker's website.

> https://docs.docker.com/config/containers/multi-service_container/

If you have any methods to deploy shadowsocks-manager in cluster using Kubernets, please let me know, my github is [damonYuam](https://github.com/damonYuan), and my email address is *yzmhit@gmail.com*.

Thanks

## Docker compose mode

1. Install docker

   You can use this [script](https://get.docker.com/) to get the autoated installation script.

2. Install docker compose

   > https://docs.docker.com/compose/install/

3. Edit the env file

   Change the .env.example to .env file and edit it based on your requirements. 

3. Run command

   ```
   $ docker-compose build && docker-compose up

   ```

## Docker swarm mode

Since the docker compose file version 3 do not support build command, I refer the image to the one I built on dockerhub, but you can build your own version based on sssocksmgr folder.

In order to run the docker stack after image is built and uploaded to registry correctly:

1. Start swarm mode

   `$ docker swarm init`
   
   You can `join` more host machines after the swarm created. 
   
2. Deploy to swarm
   
   `$ export $(cat .env) && docker stack deploy --compose-file docker-stack.yml ss`
   
3. Result with visualizer
   
   ![docker swarm](https://raw.githubusercontent.com/shadowsocks/shadowsocks-manager/master/wikiImage/docker-swarm.png "docker swarm")