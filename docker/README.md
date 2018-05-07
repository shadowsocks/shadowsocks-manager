README
===

Recently I have spent quite a lot time on trying setup the shadowsocks-manager in docker, here I want to save the time for other developers and you can build your own image based on this example.

Originally I want to build the system into docker swarm cluster, however the architecture of shadowsocks-manager along with docker swarm mesh route make it quite difficult to ensure shadowsocks-manager control the specific shadowsocks-libev instance. I have tried publish the port in host mode to bypass the mesh route, unfortunately it failed.

If you have any methods to deploy shadowsocks-manager in cluster, including Kubernets, docker swarm, etc., please let me know, my github is [damonYuam](https://github.com/damonYuan), and my email address is *yzmhit@gmail.com*.

Thanks

## How to start it?

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

## Updates for docker swarm mode

Recently I find the way to deploy it into docker swarm. Since the manager should manage only one specific shadowsocks instance, I am going to put them into one container and using `supervisor` to ensure the process running inside the container. Here is the introduction from docker's website.

> https://docs.docker.com/config/containers/multi-service_container/

Since the docker compose file version 3 do not support build command, I refer the image to the one I built on dockerhub, but you can build your own version based on sssocksmgr folder.

In order to run the docker stack after image is built to upload to registry correctly:

1. Start swarm mode

   `$ docker swarm init`
   
2. Deploy to swarm
   
   `$ export $(cat .env) && docker stack deploy --compose-file docker-stack.yml ss`