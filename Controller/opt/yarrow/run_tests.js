const projectId = 'minidesk-446816';
const zone = 'europe-west1-d';
const region = 'europe-west1';
const zones_allowed = {
  "zones/europe-west1-b": {"preference": "ALLOW"},
  "zones/europe-west1-c": {"preference": "ALLOW"},
  "zones/europe-west1-d": {"preference": "ALLOW"}
}
//const zone = 'us-central1-a';
//const region = 'us-central1';
const number = '779975313204';

const provisioning = "STANDARD";
//const provisioning = "SPOT";
const vm_image = "spore-master-std-image";
const vm_template = "spore-vm-template";

const vm_base_name = "spore-vm-";
const vm_startup_script = "cd /home/konstantin_haustov/Test\nsudo -u konstantin_haustov ./run_test\nsudo shutdown now\n";

const wait_spawns = 500;
const wait_updates = 5000;

const {InstancesClient} = require('@google-cloud/compute').v1;
const {setTimeout} = require('node:timers/promises');

const computeClient = new InstancesClient();



function getInstance(vm_name) {
  // Construct request
  const request = {
    instance: vm_name,
    project: projectId,
    zone,
  };

  // Run request
  return computeClient.get(request);
}


function listInstances() {
  return computeClient.list({
    project: projectId,
    zone,
  });
}

function createInstance(vm_name, image_name) {
  return computeClient.insert({
    project: projectId,
    zone: zone,
    instanceResource: {
      "name": vm_name,
      "zone": `projects/${projectId}/zones/${zone}`,
      "machineType": `projects/${projectId}/zones/${zone}/machineTypes/e2-micro`,
      "disks": [
        {
          "autoDelete": true,
          "boot": true,
          "deviceName": `${vm_name}-disk`,
          "initializeParams": {
            "diskSizeGb": "10",
            "diskType": `projects/${projectId}/zones/${zone}/diskTypes/pd-ssd`,
            "labels": {}
          },
        }
      ],
      "networkInterfaces": [
        {
          //"accessConfigs": [
          //  {
          //    "name": "External NAT",
          //    "networkTier": "PREMIUM"
          //  }
          //],
          "stackType": "IPV4_ONLY",
          "subnetwork": `projects/${projectId}/regions/${region}/subnetworks/default`
        }
      ],
      "metadata": {
        "items": [
          {
            "key": "startup-script",
            "value": "cd /home/konstantin_haustov/Test\nsudo -u konstantin_haustov ./run_test\nsudo shutdown now\n"
          },
          {
            "key": "ssh-keys",
            "value": "konstantin_haustov:ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBAp9rq19/YXhOYegn1nwv/f+sUSGjErBOgji9khrGpJd/dBlTLnU/p+rPxP6z108o1sPMSRn9pOttanRe1pq59c= google-ssh {\"userName\":\"konstantin.haustov@gmail.com\",\"expireOn\":\"2025-01-23T21:27:56+0000\"}\nkonstantin_haustov:ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCr6+D93oJJ7OwjQRQCVMZGLp3FY3dZDzwbbewIYzIOUwy+8NujuV35ZzjadvIedrt3oO1gWCR7fu4MoBqkiCYaynTG9YOcb3MAb459v9EyVxKibUXzy0XGb/VnzhRxnZsgU08SS9w3qfsOFzCVgC2EQfdNTlkubCT2wSEwmm6q8b6hLn4UkeLKCAX8WbsjKCEsE723JR6rVaPhYmlVDxydBlwtZK6Ud5b3vp3w5cjiQ+qZE8bpZgtfjpf2/2eQRUm4bUSmo3WH/rZWyDsdvfJAM54JEIxaa7UIpcaWpuD56nFWQDzCsv0xJphkWK8BeFU4/f4aOmuq2T8y3FFwwjtV google-ssh {\"userName\":\"konstantin.haustov@gmail.com\",\"expireOn\":\"2025-01-28T21:27:59+0000\"}"
          }
        ]
      },
      "scheduling": {
        "automaticRestart": false,
        "instanceTerminationAction": "STOP",
        "maxRunDuration": {
          "seconds": "3600"
        },
//        "onHostMaintenance": "TERMINATE",
        "provisioningModel": provisioning
      },
      "serviceAccounts": [
        {
          "email": `${number}-compute@developer.gserviceaccount.com`,
          "scopes": [
            "https://www.googleapis.com/auth/devstorage.full_control",
            "https://www.googleapis.com/auth/logging.write",
            "https://www.googleapis.com/auth/monitoring.write",
            "https://www.googleapis.com/auth/service.management.readonly",
            "https://www.googleapis.com/auth/servicecontrol",
            "https://www.googleapis.com/auth/trace.append"
          ]
        }
      ],
      "sourceMachineImage": `projects/${projectId}/global/machineImages/${image_name}`,
      "labels": {
        "goog-ec-src": "vm_add-rest"
      }
    }
  });
}

// vm_name-template must mark place for numbers with '#' chars. E.g. "vm##" => "vm01", "vm02"...
function createInstanceBulk(vm_name_template, vm_count, instance_template_name, startup_script) {
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
            "deviceName": "spore-vm-spot-template",
            "initializeParams": {
              "diskSizeGb": "10",
              "diskType": "pd-standard",
              "labels": {},
              "sourceImage": `global/images/spore-master-disk`
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

// locationPolicy is for regions only, but looks like regions are not supported by NodeJS SDK
//,
//      "locationPolicy": {
//        "locations": zones_allowed
//      },
//      "targetShape": "ANY"
    }
  });
}

//createInstance("spore-vm5", "spore-master-image");

function deleteInstance(vm_name) {
  return computeClient.delete({
    instance: vm_name,
    project: projectId,
    zone,
  });
}

//deleteInstance("spore-vm5");

async function try_calls() {
  /*
  const vminfo = await getInstance("spore-master");
  console.log(vminfo);


  const [instanceList] = await listInstances();
  console.log(`Instances found in zone ${zone}:`);
  for (const instance of instanceList) {
    console.log(` - ${instance.name} (${instance.machineType}) - ${instance.status}`);
  };
  */

  /*
  const [vm_create] = await createInstance("spore-vm1", vm_image);
  console.log("Creating instance:");
  console.log(`name = ${vm_create.name}`);
  console.log(`done = ${vm_create.done}`);
  console.log(`error = ${vm_create.error}`);
  console.log(`metadata = ${vm_create.metadata}`);
  console.log(`result = ${vm_create.result}`);
  */

  console.log("Bulk instances creation:");
  const [vm_create] = await createInstanceBulk(`${vm_base_name}###`, 3, vm_template, "");
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
      const [vm_create] = await createInstanceBulk(vm_base_name+num_pattern, num, vm_template, vm_startup_script);
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

run_tests(5);

