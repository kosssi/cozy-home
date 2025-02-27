# [Cozy](https://cozy.io) Home

Cozy Home is your dashboard to access and manage all your Cozy apps. It allows
you to install, update and remove any app.
It provides you too a tile page on which you can organize all your application
launchers and widgets.

## Install

We assume here that the Cozy platform is correctly [installed](https://raw.github.com/cozy/cozy-setup/gh-pages/assets/images/happycloud.png)
 on your server.

Type this command to install the home application:

    cozy-monitor install home

## Contribution

You can contribute to the Cozy Home in many ways:

* Pick up an [issue](https://github.com/cozy/cozy-home/issues?state=open) and solve it.
* Translate it in [a new language](https://www.transifex.com/cozy/cozy-home/)
  (ask us to be added to the contributors, we will also help you to make your
  first steps with transifex).
* Add the capability to backup the Cozy (replicate it to another Cozy instance
  from) from the User Interface.

## Hack

To be hacked, the Cozy Home dev environment requires that a CouchDB instance
and a Cozy Data System instance are running. Then you can start the Cozy Home
this way:

    git clone https://github.com/cozy/cozy-home.git
    node server.js

Each modification requires a new build, here is how to run a build:

    cake build

## Tests

![Build
Status](https://travis-ci.org/cozy/cozy-home.png?branch=master)

To run tests type the following command into the Cozy Home folder:

    cake tests

In order to run the tests, you must only have the Data System started:

    git clone https://github.com/cozy/cozy-data-system.git
    cd cozy-data-system/
    npm install
    TOKEN=token NODE_ENV=test DB_NAME=home_test npm start

## Backgrounds

Here are the source for the backgrounds:

* [Trianglify Background Generator](http://qrohlf.com/trianglify-generator/)
* [Unsplash](http://unsplash.com) (Jonathan Bean, Jeff Sheldon, Francesco Gallaroti, Brian Jimenez) - License CC-Zero

## Contribute with Transifex

Transifex can be used the same way as git. It can push or pull translations. The config file in the .tx repository configure the way Transifex is working : it will get the json files from the client/app/locales repository.
If you want to learn more about how to use this tool, I'll invite you to check [this](http://docs.transifex.com/introduction/) tutorial.

## License

Cozy Home is developed by Cozy Cloud and distributed under the AGPL v3 license.

## What is Cozy?

![Cozy Logo](https://raw.github.com/cozy/cozy-setup/gh-pages/assets/images/happycloud.png)

[Cozy](https://cozy.io) is a platform that brings all your web services in the
same private space.  With it, your web apps and your devices can share data
easily, providing you
with a new experience. You can install Cozy on your own hardware where no one
profiles you.

## Community

You can reach the Cozy Community by:

* Chatting with us on IRC #cozycloud on irc.freenode.net
* Posting on our [Forum](https://forum.cozy.io/)
* Posting issues on the [Github repos](https://github.com/cozy/)
* Mentioning us on [Twitter](https://twitter.com/mycozycloud)
