# CFI Data portal
## Setup

requires Node.js >= 0.18
To Run the server locally
```bash
npm install
```
initialize Database

```bash
DB_FILE=db.sqlite node database/db.js 
``` 


modify the .env variable
and get your own [maptiler api key](https://cloud.maptiler.com/account/keys/)

```bash
cp .env.example .env
``` 


```bash
npm start
```
## Run via PM2 node process manager 

### install pm2 if not yet install 

```bash
npm install pm2 -g
```

check [doc](https://pm2.io/docs/runtime/guide/installation/) to see more use

### run the web

```bash

sudo pm2 start npm --name myapp -- start
sudo pm2 save
sudo pm2 startup

```

## if GEOSERVER is not running 

Check if tomcat is running or not 

```bash
sudo systemctl status tomcat
```
if tomcat run then stop tomcat

```bash
sudo systemctl stop tomcat
```

And run use startup.sh at /opt/tomcat/bin

```bash
sudo sh /opt/tomcat/bin/startup.sh
```
## Quick info
- [Gist github Documents (NOT MINE IT'S FORKED)](https://gist.github.com/SakalSo/a1eb698d6709507c2d34ce287cc594b7) on XML template for WFS-T request when updating row in GEOSERVER layer.  
Ex: adding / deleting a document row
