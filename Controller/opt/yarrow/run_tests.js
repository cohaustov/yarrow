// Creates specified number of VM instances on GCP cloud
// Runs a shell-script on each instance that does some actions and initiates shutdown of the machine
// Tracks status of all created instances and deletes those that have stopped

const {exit} = require('node:process');
const {setTimeout} = require('node:timers/promises');
const {InstancesClient} = require('@google-cloud/compute').v1;
const args = require("./args.js");

const script_params = args.toString();

// mandatory arguments
const ARG_HOST = "host";
const ARG_SESSION = "session";
const ARG_SCRIPT = "script";
const mandatory_args = [ARG_HOST, ARG_SESSION, ARG_SCRIPT];

// optional arguments
const ARG_RUNNERS = "runners";
const config = new Map([
  [ARG_RUNNERS, 5] // number of parallel runners
]);

args.fillConfig(config);

for (const e of mandatory_args.values()) {
  if (!config.has(e)) {
    console.log("Missing mandatory argument: " + e);
    exit(1);
  }
}


// TODO: read current projectId and zone via GCP API
// GCP project where to run instances
const projectId = 'minidesk-446816';
// GCP zone where to run instances
const zone = 'europe-west1-d';

// VM template to use for creation of instances
const vm_template = "runner-vm-template";
// disk image to use for creation of instances
const vm_disk_image = "global/images/runner-master-disk";
// disk name to use for creation of instances
const vm_disk_name = "runner-disk";
// VMs will have names of format "prefix###"; the prefix is defined here, ### is number
const vm_base_name = "runner-";

// shell script to run on startup on each VM instance
const vm_startup_script = `cd /var/yarrow\nsudo -u yarrow bash -c "export Y_SESSION=${config.get(ARG_SESSION)} Y_SCRIPT=${config.get(ARG_SCRIPT)} Y_HOST=${config.get(ARG_HOST)}; ./run_test ${script_params}"\nsudo shutdown now\n`;

// milliseconds to wait between VM status updates
const wait_updates = 5000;

// GCP cloud compute API client
const computeClient = new InstancesClient();


// List all the VM instances currentlty existing in current project and zone
// This returns not only 'runners', but we will filter it
function listInstances() {
  return computeClient.list({
    project: projectId,
    zone,
  });
}


// Bulk creation of VM instances from the same template
// Each instance gets a unique name constructed by the template provided
// vm_name_template - 
// vm_count - number of instances to create
// vm_name_template - instance name template; must mark place for numbers with '#' chars. E.g. "vm##" => "vm01", "vm02"...
// startup_script
function createInstanceBulk(instance_template_name, disk_source_image, vm_count, vm_name_template, startup_script) {
  return computeClient.bulkInsert({
    project: projectId,
    zone: zone,
    bulkInsertInstanceResourceResource: {
      "count": vm_count,
      "minCount": 1,
      "namePattern": vm_name_template,
      "sourceInstanceTemplate": `projects/${projectId}/global/instanceTemplates/${instance_template_name}`,
      "instanceProperties": {
        "disks": [
          {
            "autoDelete": true,
            "boot": true,
            "deviceName": vm_disk_name,
            "initializeParams": {
              "diskSizeGb": "10",
              "diskType": "pd-standard",
              "labels": {},
              "sourceImage": vm_disk_image
            },
            "mode": "READ_WRITE",
            "type": "PERSISTENT"
          }
        ],
        "metadata": {
          "items": [
            {
              "key": "startup-script",
              "value": startup_script
            }
          ]
        }
      }
    }
  });
}

//createInstance("spore-vm5", "spore-master-image");

// Delete VM instance with specified name
// vm_name - name of the VM to delete
function deleteInstance(vm_name) {
  return computeClient.delete({
    instance: vm_name,
    project: projectId,
    zone,
  });
}

//deleteInstance("spore-vm5");

// for testing purposes
async function try_calls() {
  /*
  const [instanceList] = await listInstances();
  console.log(`Instances found in zone ${zone}:`);
  for (const instance of instanceList) {
    console.log(` - ${instance.name} (${instance.machineType}) - ${instance.status}`);
  };
  */

  console.log("Bulk instances creation:");
  const [vm_create] = await createInstanceBulk(vm_template, vm_disk_image, 3, `${vm_base_name}###`, "");
  console.log(`name = ${vm_create.name}`);
  console.log(`done = ${vm_create.done}`);
  console.log(`error = ${vm_create.error}`);
  console.log(`metadata = ${vm_create.metadata}`);
  console.log(`result = ${vm_create.result}`);


  //const vm_delete = await deleteInstance("spore-vm6");
  //console.log(`Deleting instance: \n${vm_delete}`);
}

//try_calls();


// Runs [num] VMs with selenium tests
async function run_tests(num){
  const status_new = "NEW";
  const status_off = "TERMINATED";
  const status_deleted = "DELETED";
  const status_lost = "LOST";
  const statuses = [status_new, "PROVISIONING", "STAGING", "RUNNING", "STOPPING", "TERMINATED",
    status_deleted, status_lost];

  const num_len = (`${num}`).length;
  const num_pattern = "#".repeat(num_len);

  let machines = [];
  let not_spawned_yet = true;

  let vm_alive = num;
  while (vm_alive > 0) {
    vm_alive = 0;
    const idx_for_deletion = [];
    const idx_found = [];
    const [instanceList] = await listInstances();
    //console.log(`Instances found:`);
    for (const instance of instanceList) {
      if (instance.name.substr(0, vm_base_name.length) == vm_base_name) {
        //console.log(`${instance.name} - ${instance.status}`);
        const idx = Number(instance.name.substr(vm_base_name.length));
        //console.log(`idx = ${idx}`);
        if (idx>0) { //skipping instances with index 0, it's not our format
          idx_found.push(idx);
          vm_alive++;
          if (not_spawned_yet) {
            machines[idx] = {
              name: instance.name,
              status: instance.status
            }
          }
          if (machines[idx].status != status_deleted) {
            if (instance.status == status_off) {
              //console.log("for deletion:"+idx);
              idx_for_deletion.push(idx);
            }
            machines[idx].status = instance.status;
          }
        }
      }
    };

    //console.log("--1--");
    for (let k=1; k<=num; k++) {
      if (machines[k] == undefined) {
        machines[k] = {
          name: vm_base_name + `${k}`.padStart(num_len,"0"),
          status: status_lost,
        }
      }
      else if (
      machines[k].status != status_new &&
      machines[k].status != status_deleted &&
      idx_found.indexOf(k)<0) {
        machines[k].status = status_lost;
      }
    }

    //console.log("--2--");
    if (vm_alive==0 && not_spawned_yet) {
      not_spawned_yet = false;

      console.log(`Creating ${num} instances of ${vm_template}`);
      const [vm_create] = await createInstanceBulk(vm_template, vm_disk_image, num, vm_base_name+num_pattern, vm_startup_script);
      console.log(`name = ${vm_create.name}`);
      console.log(`done = ${vm_create.done}`);
      console.log(`error = ${vm_create.error}`);
      console.log(`metadata = ${vm_create.metadata}`);
      console.log(`result = ${vm_create.result}`);

      for (let i = 1; i <= num; i++) {
        machines[i] = {
          name: vm_base_name + `${i}`.padStart(num_len,"0"),
          status: status_new
        };
      }
    }

    //console.log("--3--");
    const status_map = new Map();
    for (let k=0; k < statuses.length; k++) {
      status_map.set(statuses[k], 0);
    }

    //console.log("--4--");
    for (let k=1; k <= num; k++) {
      const machine = machines[k];
      status_map.set(machine.status, status_map.get(machine.status)+1);
    }

    //console.log("--5--");
    let stat_str = "";
    for (let k=0; k < statuses.length; k++) {
      stat_str += statuses[k] + ": " + status_map.get(statuses[k]) + "; ";
    }
    vm_alive += status_map.get(status_new);
    console.log(`${stat_str}; alive: ${vm_alive}`);

    for (let k=0; k<idx_for_deletion.length; k++) {
      const machine = machines[idx_for_deletion[k]];
      machine.promise = deleteInstance(machine.name);
      machine.status = status_deleted;
      //console.log(`Deleting instance: ${machine.name}`);
    }

    if (vm_alive>0) {
      await setTimeout(wait_updates);
    }
  }

}

console.log(`Starting run_tests(${config.get(ARG_RUNNERS)})`);
console.log(`Startup script:\n${vm_startup_script}`);
run_tests(config.get(ARG_RUNNERS));
