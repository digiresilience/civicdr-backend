// Used to generate keys.json

const { generateKey } = require('openpgp');
const fs = require('fs');
const path = require('path');
const NUM_KEYS = 20;

const looper = new Promise((resolve, reject) => {
  let curr = 0;
  let keys = [];
  const loop = async () => {
    if (curr < NUM_KEYS) {
      try {
        console.log(`${curr + 1}/${NUM_KEYS}`, 'generating key');
        let keypair = await generateKey({
          userIds: [{ email: 'test@test.com' }],
          numBits: 1024
        });
        keys.push(keypair.publicKeyArmored);
        curr++;
        loop();
      } catch (e) {
        reject(e);
      }
    } else {
      resolve(keys);
    }
  };

  process.nextTick(loop);
});

looper.then(keys => {
  fs.writeFileSync(path.join(__dirname, 'keys.json'), JSON.stringify(keys));
});
