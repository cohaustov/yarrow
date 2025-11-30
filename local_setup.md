# Setting up local environment for running Selenium tests in a cloud

## About

`yarrow` is a tool for running load tests based on UI testing scripts in the cloud. Using UI tests instead of API tests allows you to generate more realistic load and identify issues that are difficult to detect with API tests. The downside is higher cost of runs. But it can be kept under control with usage of Spot compute units with limited resources.

Currently, only Selenium with JavaScript and only Google Cloud Platform (GCP) are supported. But there are plans to support more options.

The tool is named `yarrow` after the plant (Achillea millefolium). The name was chosen because common names related to “test” and “cloud” were already taken.

This document focuses on configuring the local environment for a QA engineer. Instructions for provisioning cloud infrastructure are provided in a separate document.

Tests can be written and validated locally and then executed in the cloud.

## Tool components

**Local** — scripts that run on the QA engineer's local machine (the user of the tool).

**Controller** — a virtual machine instance that performs controlling tasks, communicates with the user, spawns runner instances, and stores test results.

**Runner** — a virtual machine that runs individual tests. Runners are created in large numbers when a test starts and deleted when the test ends.

---

## Local environment setup for scripts

Perform the following steps locally and in the cloud to configure the working environment.

1. On your local machine, get the latest version of the scripts from the Git repository. On Windows, do this from WSL.

```bash
git clone https://github.com/cohaustov/yarrow.git
```

Alternatively, you can use the original repository:

```bash
git clone git://git.haustov.com/yarrow
```

2. Set the Controller host address you will use. Edit the `yarrow_config` file and set the `HOST` parameter.

3. On the cloud (Controller machine), create a new user and use that username everywhere below instead of `<username>`:

```bash
sudo useradd -m -s /bin/bash <username>
```

4. On your local Unix machine (on Windows — in WSL; on macOS or Linux — in a terminal), generate an SSH key pair. Do not set a passphrase; press Enter when prompted.

```bash
ssh-keygen -t rsa -f ~/.ssh/<username>-ssh-key -C <username>
```

5. On your local machine, set the `SSH_KEY` parameter in `yarrow_config`:

```bash
SSH_KEY="~/.ssh/<username>-ssh-key"
```

6. On the cloud (Controller machine), add the contents of the public key file (`~/.ssh/<username>-ssh-key.pub`) to the Controller user's list of authorized SSH keys. The public key looks similar to this:

```text
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDf7IR9pF5noYHkUu8k77xZSwTUFK3PFgL6mfqytPPw3CMc+4t9N0uPhu3eSSDo9O/hS/1Hw/xdLwZWDz1Bz8AGEYZw+gJ1OwD4M8v4b1ZKp/4e4lYHztW3BC1LEhwDibe9pY9A4svwD7zrQD4jFWqj6CkBJMPb9GvzKKStMg/4WOCvRxprluCQioEgcP6Qr7bDMfPxTbyfaV7HHT1/MECZqx1zZJlTtjtHiX4enE32ux2XS2v4ydHKURH1iIkl7QoItT/3xFufhY12qfe8AiL6Ttdpe0wLCpqGvx3L1oxK0tJVMEl6e3b4ZdEMXe3HFONX2ZMYdeyXOsiXrCDLtOZMJAr5PoIgm6rnB6j5QdCOpzGflGinYSyBNIREPmvwqKde1yUhtQsrtXEXvwX1iwulGxwpYa1T7/5ZHbDKgPYauZ5NN/4Tj6+KR6tY6XjLirfpvvgz3Sm2yN35V/j9IByzQj2uhvj3zrHgffTYNEfjbOMx4Gy0h42TXPPOn4md22s= khaustov
```

7. Make sure the scripts are executable and available in your `PATH`.

Change permissions (on Unix):

```bash
chmod 777 yarrow/client/yarrow*
```

You can add the scripts directory to `PATH` for the current session:

```bash
export PATH=$PATH:<path to the directory>/yarrow/client/
```

Or add it permanently in `~/.bashrc`:

```bash
PATH=$PATH:<path to the directory>/yarrow/client/
```

---

## Environment setup for local test runs

1. Install Node.js and npm. Example on Ubuntu:

```bash
sudo apt install nodejs
sudo apt install npm
```

2. Create a directory for your Selenium tests. Keeping it next to the cloned `yarrow` repository results in the following convenient layout:

```
yarrow/
  client/
  controller/
  lib/
  runner/
  tests/
project_one_selenium_tests/
  test_one/
  test_two/
project_two_selenium_tests/
  test_one/
  test_two/
```

Reasons this layout is convenient:

- You keep `yarrow` code unchanged and can `git pull` new versions.
- The test project directories can be in their own git repositories.
- JavaScript code provided by `yarrow` can be uniformly accessed from those projects, for example:

```js
const args = require("../../yarrow/lib/args.js")
```

- On runner machines, the equivalent paths are:

```
/var/yarrow/lib
/var/yarrow/tests
```

3. Install the Selenium WebDriver package in the folder where you will edit and run scripts locally:

```bash
npm install selenium-webdriver
```

---

If you need any adjustments for Windows/PowerShell commands or a more compact quick-start, request it separately.
