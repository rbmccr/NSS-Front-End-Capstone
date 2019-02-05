<h1 style="font-weight: bold">Hotshot - Rocket League Positional Heatmapper</h1>

<h3></h3>

<h2 style="font-weight: bold;"> Technologies Used
<h3>Development Languages and Libraries</h3>

<p float="left">
  <img src="https://energyframeworks.com/wp-content/uploads/2013/12/html5-css-javascript-logos.png" height="75">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://www.patrick-wied.at/static/heatmapjs/assets/img/social.jpg" height="75"/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://bulma.io/images/bulma-logo.png" height="60"/>
</p>

<h1></h1>
<h3>Development Tools</h3>

<p float="left">
  <img src="https://nodejs.org/static/images/logos/nodejs-new-pantone-black.png" alt="node.js" height="75"/>&nbsp;&nbsp;&nbsp;
  <img src="https://i.pinimg.com/originals/52/c1/fb/52c1fbca3e9e8f6fbc84272a171ac815.png" alt="browserify" height="75"/>&nbsp;&nbsp;&nbsp;
  <img src="https://blog.toggl.com/wp-content/uploads/2018/08/grunt-logo.png" alt="grunt" height="75"/>&nbsp;&nbsp;&nbsp;
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ-pMrdOSqtIDw_HmY23jTaGp_iHxyz7wtXt7hMbg8fkaGrrgR" alt="eslint" height="75">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Babel_Logo.svg/1280px-Babel_Logo.svg.png" alt="Babel.js" height="75"/>
  <img src="http://www.softwaresamurai.org/wp-content/uploads/2017/12/RESTfil-API.png" alt="RESTful API" height="75"/>
</p>

<h2>Instructions for Installing</h2>

<h4> Command line tools and node package manager (npm) must be installed in order to successfully run this program. Google Chrome is also the preferred browser.</h4>

If you do not have Node.js installed on your machine, visit the [Node.js Download Page](https://nodejs.org/en/download/) and follow the installation instructions.

After cloning this repository from github, the npm modules and json-server (local RESTful API) must be installed and built. To complete this process, type the following commands in your terminal from the main directory.

```
cd src/lib/
npm i
sudo npm install -g json-server
```

Once complete, the program can be intialized from the lib folder by typing the following command.

```
grunt
```

It is likely that eslint will report warnings. These can be ignored.

The server is running once the terminal reports "Waiting...". 

#### Open an internet browser and access the application at:
```
http://localhost:8080/
```

The database can be accessed at:
```
http://localhost:8088/
```
Accessing the database is not required.

#### To see an active user profile, enter the following username and password in the login form:
```
username: tremulous
password: pass
```
This user has already entered gameplay data, and heatmaps can be easily viewed and manipulated when logged in.
