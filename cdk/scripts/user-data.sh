#!/bin/bash
yum update -y
sudo su
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
export NVM_DIR="/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm install 16
yum -y install git
git clone https://github.com/jamesnoria/ses-express-app.git
cd ses-express-app/
pwd
node -v
npm install
npm start