#!/bin/bash
apt-get update
apt-get install python-pip -y
apt-get install ruby -y
apt-get install wget -y
cd /home/ubuntu
wget https://aws-codedeploy-eu-west-1.s3.amazonaws.com/latest/install
chmod +x ./install
./install auto
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7
apt-get install -y apt-transport-https ca-certificates
sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger xenial main > /etc/apt/sources.list.d/passenger.list'
apt-get update
apt-get install -y nginx-extras passenger
PassengerDisabled="# include /etc/nginx/passenger.conf;"
PassengerEnabled="include /etc/nginx/passenger.conf;"
sed -i "s|$PassengerDisabled|$PassengerEnabled|g" /etc/nginx/nginx.conf
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs